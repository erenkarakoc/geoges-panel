-- Reverses 0012_notification_events.sql: notify and mark_read as 0011 wrote them, no events.
drop function tsk.task_audience(uuid);

create or replace function tsk.notify(p_user uuid, p_type text, p_subject text, p_link_path text,
                           p_source_key text, p_task_id uuid default null,
                           p_record_schema text default null, p_record_table text default null,
                           p_record_id uuid default null, p_is_critical boolean default false)
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
  return new_id;
end
$$;

-- Marks the signed-in person's notifications read: the given ones, or all when null.
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
  return changed;
end
$$;
