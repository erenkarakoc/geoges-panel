-- 0005 — the audit screen names the person a record belongs to (TASK-0103, REQ-AUD-006, D-258).
--
-- SCR-193 showed only the record type ("Kullanıcı"), not whose record changed. The page now also
-- returns `target_name`: the account the event is about — the target row itself for an account
-- event, or the `user_id` in the payload for assignments, exceptions and managers.

drop function aud.audit_log_page(uuid, text, text, timestamptz, timestamptz, integer, integer);

create function aud.audit_log_page(p_actor uuid default null, p_event_prefix text default null,
                                   p_target_table text default null,
                                   p_from timestamptz default null, p_to timestamptz default null,
                                   p_offset integer default 0, p_limit integer default 50)
returns table (id uuid, event_type text, actor_user_id uuid, actor_name text,
               actor_role_id uuid, actor_role_name text, target_schema text, target_table text,
               target_id uuid, target_name text, payload jsonb, occurred_at timestamptz,
               total bigint)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not iam.has_permission('aud.audit-log.view') then
    raise exception 'the audit log is for the owner layer' using errcode = '42501';
  end if;
  return query
    select l.id, l.event_type, l.actor_user_id, u.display_name, l.actor_role_id, r.name,
           l.target_schema, l.target_table, l.target_id,
           coalesce(tu.display_name, pu.display_name), l.payload, l.occurred_at,
           count(*) over ()
      from aud.audit_log l
      left join iam.user u on u.id = l.actor_user_id
      left join iam.role r on r.id = l.actor_role_id
      left join iam.user tu
        on l.target_schema = 'iam' and l.target_table = 'user' and tu.id = l.target_id
      left join iam.user pu on pu.id = (case when l.payload ->> 'user_id' ~ '^[0-9a-f-]{36}$'
                                         then (l.payload ->> 'user_id')::uuid end)
     where (p_actor is null or l.actor_user_id = p_actor)
       and (p_event_prefix is null or pg_catalog.starts_with(l.event_type, p_event_prefix))
       and (p_target_table is null
            or l.target_schema || '.' || l.target_table = p_target_table)
       and (p_from is null or l.occurred_at >= p_from)
       and (p_to is null or l.occurred_at < p_to)
     order by l.occurred_at desc, l.id desc
     offset greatest(coalesce(p_offset, 0), 0)
     limit least(greatest(coalesce(p_limit, 50), 1), 200);
end
$$;

revoke all on function aud.audit_log_page(uuid, text, text, timestamptz, timestamptz, integer, integer) from public;
grant execute on function aud.audit_log_page(uuid, text, text, timestamptz, timestamptz, integer, integer) to geoges_app;
