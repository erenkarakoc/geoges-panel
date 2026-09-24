-- Back to the caller supplying the numbers (0038's shape). Revert the application code first.
drop function iam.use_session(uuid);
create function iam.use_session(p_session_id uuid, p_idle_days integer)
returns table (user_id uuid, second_factor_at timestamptz, expires_at timestamptz)
language plpgsql security definer
set search_path = ''
as $$
declare
  idle interval := (greatest(coalesce(p_idle_days, 3), 1) || ' days')::interval;
begin
  return query
  update iam.session s
     set last_seen_at = case when s.last_seen_at < pg_catalog.now() - interval '5 minutes'
                             then pg_catalog.now() else s.last_seen_at end
   where s.id = p_session_id
     and s.revoked_at is null
     and s.expires_at > pg_catalog.now()
     and s.last_seen_at > pg_catalog.now() - idle
  returning s.user_id, s.second_factor_at, s.expires_at;
end
$$;
revoke all on function iam.use_session(uuid, integer) from public;
grant execute on function iam.use_session(uuid, integer) to geoges_app;

drop function iam.start_session(uuid, text, boolean);
create function iam.start_session(p_user_id uuid, p_device_label text, p_days integer,
                                  p_second_factor boolean default false)
returns uuid
language sql security definer
set search_path = ''
as $$
  insert into iam.session (user_id, device_label, expires_at, second_factor_at)
  values (p_user_id, pg_catalog.left(p_device_label, 200),
          pg_catalog.now() + (greatest(coalesce(p_days, 30), 1) || ' days')::interval,
          case when p_second_factor then pg_catalog.now() end)
  returning id
$$;
revoke all on function iam.start_session(uuid, text, integer, boolean) from public;
grant execute on function iam.start_session(uuid, text, integer, boolean) to geoges_app;

drop function iam.note_login_attempt(text, boolean, text, text);
create function iam.note_login_attempt(p_email text, p_succeeded boolean, p_ip text,
                                       p_user_agent text, p_limit integer,
                                       p_lock_minutes integer)
returns timestamptz
language plpgsql security definer
set search_path = ''
as $$
declare
  address text := lower(p_email);
  since timestamptz;
  failures integer;
  lock_until timestamptz;
begin
  lock_until := iam.login_lock(address);
  if lock_until is not null then
    insert into iam.login_attempt (email, succeeded, ip, user_agent)
    values (address, false, p_ip, p_user_agent);
    return lock_until;
  end if;

  insert into iam.login_attempt (email, succeeded, ip, user_agent)
  values (address, coalesce(p_succeeded, false), p_ip, p_user_agent);
  if p_succeeded then
    return null;
  end if;

  select max(a.created_at) into since from iam.login_attempt a
   where a.email = address and (a.succeeded or a.locked_until is not null);
  select count(*) into failures from iam.login_attempt a
   where a.email = address and not a.succeeded
     and (since is null or a.created_at > since);

  if failures >= greatest(coalesce(p_limit, 5), 1) then
    lock_until := pg_catalog.now()
      + (greatest(coalesce(p_lock_minutes, 15), 1) || ' minutes')::interval;
    update iam.login_attempt set locked_until = lock_until
     where id = (select a.id from iam.login_attempt a
                  where a.email = address order by a.created_at desc limit 1);
    insert into aud.audit_log (event_type, target_schema, target_table, payload)
    values ('sign_in.locked', 'iam', 'login_attempt',
            jsonb_build_object('email', address, 'failures', failures,
                               'locked_until', lock_until));
    return lock_until;
  end if;
  return null;
end
$$;
revoke all on function iam.note_login_attempt(text, boolean, text, text, integer, integer) from public;
grant execute on function iam.note_login_attempt(text, boolean, text, text, integer, integer) to geoges_app;

drop function iam.security_number(text, integer);
