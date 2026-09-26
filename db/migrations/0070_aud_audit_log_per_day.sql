-- 0070 — how many audit events each of the last days had (D-297), for the audit log's chart.
-- Same guard and same filters as `aud.audit_log_page`: only the owner layer, by person, event
-- group and record type; days are Istanbul days, the last `p_days` of them including today.

create function aud.audit_log_per_day(p_actor uuid default null, p_event_prefix text default null,
                                      p_target_table text default null, p_days integer default 14)
returns table (day date, events bigint)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not iam.has_permission('aud.audit-log.view') then
    raise exception 'the audit log is for the owner layer' using errcode = '42501';
  end if;
  return query
    select (l.occurred_at at time zone 'Europe/Istanbul')::date, count(*)
      from aud.audit_log l
     where (p_actor is null or l.actor_user_id = p_actor)
       and (p_event_prefix is null or pg_catalog.starts_with(l.event_type, p_event_prefix))
       and (p_target_table is null
            or l.target_schema || '.' || l.target_table = p_target_table)
       and l.occurred_at >= (iam.today() - (least(greatest(p_days, 1), 92) - 1))::timestamp
                            at time zone 'Europe/Istanbul'
     group by 1;
end
$$;

revoke all on function aud.audit_log_per_day(uuid, text, text, integer) from public;
grant execute on function aud.audit_log_per_day(uuid, text, text, integer) to geoges_app;
