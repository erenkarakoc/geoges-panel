-- 0012 — notification events for live signals (TASK-0108 step 2, ADR-018, D-240, SPIKE-13).
--
-- A written or read notification publishes an event; the worker's TSK subscriber turns it into a
-- "bildirimler değişti" signal for that one person after the event is processed (ADR-018: "olay
-- gerçekten işlendikten sonra"). The event carries the recipient only, never the text.

create or replace function tsk.notify(p_user uuid, p_type text, p_subject text,
                                      p_link_path text, p_source_key text,
                                      p_task_id uuid default null,
                                      p_record_schema text default null,
                                      p_record_table text default null,
                                      p_record_id uuid default null,
                                      p_is_critical boolean default false)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if not iam.is_active_user(p_user) then
    return null;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('tsk.notify:' || p_user || ':' || p_type || ':' || coalesce(p_source_key, '')));
  if p_source_key is not null and exists (
       select from tsk.notification n
        where n.user_id = p_user and n.type = p_type and n.source_key = p_source_key
          and n.created_at > pg_catalog.now() - interval '10 minutes') then
    return null;
  end if;
  insert into tsk.notification (user_id, type, subject, link_path, record_schema, record_table,
                                record_id, task_id, source_key, is_critical, channels)
  values (p_user, p_type, pg_catalog.left(p_subject, 200), p_link_path, p_record_schema,
          p_record_table, p_record_id, p_task_id, p_source_key, p_is_critical,
          case when p_is_critical or p_type in ('task.assigned', 'approval.requested')
               then array['panel', 'push'] else array['panel'] end)
  returning id into new_id;
  perform core.publish_event('notification.created', 'tsk', 'tsk', 'notification', new_id,
    pg_catalog.jsonb_build_object('user_id', p_user, 'notification_id', new_id,
                                  'is_critical', p_is_critical));
  return new_id;
end
$$;

-- Marks the signed-in person's notifications read: the given ones, or all when null. Their other
-- open tabs learn it through the signal.
create or replace function tsk.mark_read(p_ids uuid[] default null) returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  changed integer;
begin
  update tsk.notification set read_at = pg_catalog.now()
   where user_id = core.current_user_id() and read_at is null
     and (p_ids is null or id = any (p_ids));
  get diagnostics changed = row_count;
  if changed > 0 then
    perform core.publish_event('notification.read', 'tsk', p_payload =>
      pg_catalog.jsonb_build_object('user_id', core.current_user_id()),
      p_sequence_key => 'tsk:notification.read:' || core.current_user_id());
  end if;
  return changed;
end
$$;

-- Who a task concerns, for the "görevler değişti" signal: assignee, giver, escalation targets and
-- the assignee's active delegates. Read by the worker only.
create function tsk.task_audience(p_task_id uuid) returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select t.assignee_user_id from tsk.task t where t.id = p_task_id
  union select t.given_by_user_id from tsk.task t
         where t.id = p_task_id and t.given_by_user_id is not null
  union select e.to_user_id from tsk.escalation e where e.task_id = p_task_id
  union select x.user_id
          from tsk.task t join iam.role_assignment x
            on x.is_delegation and x.delegated_by_user_id = t.assignee_user_id
         where t.id = p_task_id and x.starts_on <= iam.today() and x.ends_on >= iam.today()
$$;

revoke all on function tsk.task_audience(uuid) from public;
grant execute on function tsk.task_audience(uuid) to geoges_worker;
