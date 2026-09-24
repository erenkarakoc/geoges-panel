-- 0039 — the lock and the session read their own settings (TASK-0112, D-257, D-272).
--
-- 0038 took the threshold, the lock length and the session days as parameters, so the caller
-- supplied them. Two things were wrong with that. The numbers are a security rule, and a rule
-- that arrives with the call can be argued with: whoever calls the function decides how many
-- tries are allowed. And reading them in the application would mean IAM asking ADM for its
-- settings, which the module map forbids — ADM already reads IAM, and a second arrow the other
-- way is a cycle.
--
-- Both problems have the same answer, and it is the one the module map already sanctions for
-- IAM's audit events: IAM reaches the other platform schema in SQL, not in code. These functions
-- now read the dated rules themselves (`adm.rule_value`, TASK-0105), so the numbers have one
-- source, cannot be passed in, and no module depends on another in code.
--
-- The plan of TASK-0112 and D-272 describe the caller passing them in; this is that detail
-- changed, recorded here and in D-272 rather than left as a difference between the record and
-- the code.

/** A company-wide security number from the dated rules, with the shipped default behind it. */
create function iam.security_number(p_key text, p_default integer) returns integer
language sql stable security definer
set search_path = ''
as $$
  select greatest(coalesce(
    (select (r.value #>> '{}')::integer
       from adm.rule_value(p_key, iam.today(), null, null, null) r),
    p_default), 1)
$$;
revoke all on function iam.security_number(text, integer) from public;

drop function iam.note_login_attempt(text, boolean, text, text, integer, integer);
create function iam.note_login_attempt(p_email text, p_succeeded boolean, p_ip text,
                                       p_user_agent text)
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
    -- Already locked: the try is recorded and the same lock is reported back, never extended by
    -- knocking on the door again.
    insert into iam.login_attempt (email, succeeded, ip, user_agent)
    values (address, false, p_ip, p_user_agent);
    return lock_until;
  end if;

  insert into iam.login_attempt (email, succeeded, ip, user_agent)
  values (address, coalesce(p_succeeded, false), p_ip, p_user_agent);
  if p_succeeded then
    return null;
  end if;

  -- Consecutive failures, counted from the last success or the last lock, whichever is later, so
  -- a lock that has expired is not served twice for the same tries.
  select max(a.created_at) into since from iam.login_attempt a
   where a.email = address and (a.succeeded or a.locked_until is not null);
  select count(*) into failures from iam.login_attempt a
   where a.email = address and not a.succeeded
     and (since is null or a.created_at > since);

  if failures >= iam.security_number('iam.login-attempt-limit', 5) then
    lock_until := pg_catalog.now()
      + (iam.security_number('iam.login-lock-minutes', 15) || ' minutes')::interval;
    update iam.login_attempt set locked_until = lock_until
     where id = (select a.id from iam.login_attempt a
                  where a.email = address order by a.created_at desc limit 1);
    -- The audit log wants an actor and there is none by definition: a lock happens before anyone
    -- is signed in, and the address tried is the only identity in the event (REQ-IAM-008).
    insert into aud.audit_log (event_type, target_schema, target_table, payload)
    values ('sign_in.locked', 'iam', 'login_attempt',
            jsonb_build_object('email', address, 'failures', failures,
                               'locked_until', lock_until));
    return lock_until;
  end if;
  return null;
end
$$;
revoke all on function iam.note_login_attempt(text, boolean, text, text) from public;
grant execute on function iam.note_login_attempt(text, boolean, text, text) to geoges_app;

drop function iam.start_session(uuid, text, integer, boolean);
create function iam.start_session(p_user_id uuid, p_device_label text,
                                  p_second_factor boolean default false)
returns uuid
language sql security definer
set search_path = ''
as $$
  insert into iam.session (user_id, device_label, expires_at, second_factor_at)
  values (p_user_id, pg_catalog.left(p_device_label, 200),
          pg_catalog.now()
            + (iam.security_number('iam.session-days', 30) || ' days')::interval,
          case when p_second_factor then pg_catalog.now() end)
  returning id
$$;
revoke all on function iam.start_session(uuid, text, boolean) from public;
grant execute on function iam.start_session(uuid, text, boolean) to geoges_app;

drop function iam.use_session(uuid, integer);
create function iam.use_session(p_session_id uuid)
returns table (user_id uuid, second_factor_at timestamptz, expires_at timestamptz)
language plpgsql security definer
set search_path = ''
as $$
declare
  idle interval := (iam.security_number('iam.session-idle-days', 3) || ' days')::interval;
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
revoke all on function iam.use_session(uuid) from public;
grant execute on function iam.use_session(uuid) to geoges_app;
