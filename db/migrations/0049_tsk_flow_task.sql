-- 0049 — a task a flow opens, and an event that says which step it belongs to (TASK-0117,
-- REQ-TSK-001, REQ-WFL-005, D-087).
--
-- `tsk.task` has had `source_type = 'workflow'` and `source_step_run_id` since 0011, because the
-- model knew this was coming: a task without a source cannot exist, and a flow's task is sourced by
-- the step run that opened it. What was missing is a door the engine can use — the manual opener
-- belongs to a person and runs as one — and a way for the flow to hear that the task is done.
--
-- Both are here. The opener is the worker's alone, and it is idempotent on the step run: a retried
-- delivery finds the task it already opened instead of opening a second one. And `task.completed`
-- now carries the step run in its payload, so the flow that was waiting can recognise its own task
-- without reading TSK's tables (MODULE_MAP: modules meet through events, not through each other's
-- rows).

-- One task per step visit; the step is entered again for a second one (D-099).
create unique index uq_task__step_run on tsk.task (source_step_run_id)
  where source_type = 'workflow';

/**
 * Opens the task a flow's step is waiting on. The engine's door: it runs with the flow's own
 * authority (REQ-WFL-020), which is why only the worker may call it.
 */
create function tsk.open_flow_task(p_step_run_id uuid, p_title text, p_assignee uuid,
                                   p_priority text default 'normal',
                                   p_due_at timestamptz default null,
                                   p_link_path text default null,
                                   p_record_schema text default null,
                                   p_record_table text default null,
                                   p_record_id uuid default null,
                                   p_site_id uuid default null,
                                   p_project_id uuid default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  existing uuid;
  new_id uuid := core.uuid_v7();
begin
  select id into existing from tsk.task
   where source_step_run_id = p_step_run_id and source_type = 'workflow';
  if existing is not null then
    return existing;
  end if;

  insert into tsk.task (id, title, assignee_user_id, source_type, source_step_run_id, priority,
                        due_at, link_path, record_schema, record_table, record_id, site_id,
                        project_id)
  values (new_id, p_title, p_assignee, 'workflow', p_step_run_id,
          coalesce(p_priority, 'normal'), p_due_at, p_link_path, p_record_schema, p_record_table,
          p_record_id, p_site_id, p_project_id);

  perform core.publish_event('task.created', 'tsk', 'tsk', 'task', new_id,
    pg_catalog.jsonb_build_object('task_id', new_id, 'assignee_user_id', p_assignee,
                                  'source_type', 'workflow', 'step_run_id', p_step_run_id));

  perform tsk.notify(p_assignee, 'task.assigned', p_title, tsk.task_path(new_id),
                     'task:' || new_id::text, new_id);
  return new_id;
end
$$;

revoke all on function tsk.open_flow_task(uuid, text, uuid, text, timestamptz, text, text, text,
                                          uuid, uuid, uuid) from public;
grant execute on function tsk.open_flow_task(uuid, text, uuid, text, timestamptz, text, text, text,
                                             uuid, uuid, uuid) to geoges_worker;

/** The closing event now says which flow step the task belonged to, when it belonged to one. */
create or replace function tsk.close_task(p_task tsk.task, p_kind text, p_note text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_note is not null then
    perform pg_catalog.set_config('app.change_reason', p_note, true);
  end if;
  update tsk.task
     set status = 'closed', closing_kind = p_kind, closed_at = pg_catalog.now(),
         closed_by_user_id = core.current_user_id(), reported_done_at = null,
         reported_done_by_user_id = null
   where id = p_task.id;
  perform core.publish_event('task.completed', 'tsk', 'tsk', 'task', p_task.id,
    pg_catalog.jsonb_build_object('task_id', p_task.id, 'closed_by_user_id',
      core.current_user_id(), 'closing_kind', p_kind,
      'step_run_id', p_task.source_step_run_id));
end
$$;

-- The engine listens for the tasks its own steps opened.
insert into core.event_subscription (subscriber, event_code, replayable)
values ('wfl.engine', 'task.completed', false)
on conflict (subscriber, event_code) do nothing;
