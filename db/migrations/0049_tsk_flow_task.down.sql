-- Reverses 0049_tsk_flow_task.sql.

delete from core.event_subscription
 where subscriber = 'wfl.engine' and event_code = 'task.completed';
drop function tsk.open_flow_task(uuid, text, uuid, text, timestamptz, text, text, text,
                                 uuid, uuid, uuid);
drop index tsk.uq_task__step_run;

-- Closes a task and tells whoever should know. Shared by the paths below.
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
      core.current_user_id(), 'closing_kind', p_kind));
end
$$;
