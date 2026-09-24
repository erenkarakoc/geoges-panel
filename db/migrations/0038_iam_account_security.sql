-- 0038 — the three tables account security needs (TASK-0112, D-230, D-236, D-257, D-272).
--
-- Every one of them is written at a moment when nobody is signed in yet, or about somebody who
-- must not be able to read it, so none of them is reached directly by the application: row level
-- security denies everything except a person's own sessions, and the work happens in the definer
-- functions below. The settings — how many failed attempts, how long the lock lasts — are not
-- here: they are dated rules read by the application (D-257) and passed in, so the panel keeps
-- one settings store, not two.
--
--   iam.login_attempt   every sign-in try, and the lock it may cause (REQ-IAM-005)
--   iam.session         the panel's own session, for the 30-day and 3-day rules (D-230)
--   iam.recovery_code   ten one-time codes, only their hashes (D-236)

create table iam.login_attempt (
  id uuid not null default core.uuid_v7(),
  email text not null,
  succeeded boolean not null,
  ip text,
  user_agent text,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  constraint pk_login_attempt primary key (id),
  -- The e-mail tried, not a user id: a try may name an address that has no account at all.
  constraint ck_login_attempt__email check (email = lower(email) and length(email) between 3 and 320),
  constraint ck_login_attempt__lock check (locked_until is null or succeeded = false)
);
create index ix_login_attempt__email on iam.login_attempt (email, created_at desc);

create table iam.session (
  id uuid not null default core.uuid_v7(),
  user_id uuid not null,
  device_label text,
  -- Set when the second step is passed with a recovery code: the panel's own record of it,
  -- because the provider's assurance level cannot know about our codes (D-236).
  second_factor_at timestamptz,
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz not null default now(),
  constraint pk_session primary key (id),
  constraint fk_session__user foreign key (user_id) references iam.user (id),
  -- A deactivated person's rows are never deleted, only revoked with a reason (SCHEMA-PLATFORM).
  constraint ck_session__revoked check ((revoked_at is null) = (revoked_reason is null)),
  constraint ck_session__expires check (expires_at > created_at)
);
create index ix_session__live on iam.session (user_id) where revoked_at is null;

create table iam.recovery_code (
  id uuid not null default core.uuid_v7(),
  user_id uuid not null,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint pk_recovery_code primary key (id),
  constraint fk_recovery_code__user foreign key (user_id) references iam.user (id),
  constraint uq_recovery_code__hash unique (user_id, code_hash),
  constraint ck_recovery_code__hash check (code_hash ~ '^[0-9a-f]{64}$')
);
create index ix_recovery_code__unused on iam.recovery_code (user_id) where used_at is null;

insert into core.table_layer (schema_name, table_name, layer, portable) values
  ('iam', 'login_attempt', 'system', false),
  ('iam', 'session', 'system', false),
  ('iam', 'recovery_code', 'system', false);

alter table iam.login_attempt enable row level security;
alter table iam.session enable row level security;
alter table iam.recovery_code enable row level security;

-- The attempts and the code hashes are not merely policy-denied: the application role is given no
-- privilege on those two tables at all, so they cannot be read even by a signed-in person with
-- every permission the panel has. Sessions are different: a person may see their own, which is
-- what a device list would show if one is ever built, so that one table is granted and its policy
-- decides. Writing is nobody's: every change goes through the definer functions below.
grant select on iam.session to geoges_app;
create policy session_read_own on iam.session for select to geoges_app
  using (user_id = (select core.current_user_id()));

-- ---------------------------------------------------------------------------------------------
-- The lock (REQ-IAM-005, REQ-IAM-008)
-- ---------------------------------------------------------------------------------------------

/** The moment an e-mail's lock ends, or null when it is not locked. */
create function iam.login_lock(p_email text) returns timestamptz
language sql stable security definer
set search_path = ''
as $$
  select max(a.locked_until) from iam.login_attempt a
   where a.email = lower(p_email) and a.locked_until > pg_catalog.now()
$$;

/**
 * Records one try and returns the lock it caused, or the lock already in force. The threshold and
 * the length come from the caller because they are the administrator's dated rules (D-257).
 * Consecutive failures are counted from the last success or the last lock, whichever is later, so
 * a lock that has expired does not count twice.
 */
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

-- ---------------------------------------------------------------------------------------------
-- The panel's own session (D-230, REQ-IAM-006)
-- ---------------------------------------------------------------------------------------------

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

/**
 * The session as the request path needs it: a row comes back only while it is still good — not
 * revoked, not past its day, and seen within the idle window (D-230). `last_seen_at` is written
 * at most every five minutes, so reading a page is not a write.
 */
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

create function iam.mark_session_second_factor(p_session_id uuid) returns boolean
language sql security definer
set search_path = ''
as $$
  update iam.session set second_factor_at = pg_catalog.now()
   where id = p_session_id and revoked_at is null and second_factor_at is null
  returning true
$$;

create function iam.revoke_session(p_session_id uuid, p_reason text) returns boolean
language sql security definer
set search_path = ''
as $$
  update iam.session set revoked_at = pg_catalog.now(),
                         revoked_reason = coalesce(p_reason, 'signed_out')
   where id = p_session_id and revoked_at is null
  returning true
$$;

/** Every live session of one person, at once: a deactivated account is out immediately. */
create function iam.revoke_sessions(p_user_id uuid, p_reason text) returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  closed integer;
begin
  update iam.session set revoked_at = pg_catalog.now(),
                         revoked_reason = coalesce(p_reason, 'revoked')
   where user_id = p_user_id and revoked_at is null;
  get diagnostics closed = row_count;
  return closed;
end
$$;

-- Deactivation closes the door in the same transaction that closes the account (REQ-IAM-006), so
-- no request can slip through between the two. The leave-date job deactivates through this same
-- column, which covers REQ-IAM-007 without a second path.
create function iam.revoke_sessions_on_disable() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  perform iam.revoke_sessions(new.id, 'account_disabled');
  return null;
end
$$;
create trigger user_disabled_revokes_sessions after update of status on iam.user
  for each row when (new.status = 'disabled' and old.status <> 'disabled')
  execute function iam.revoke_sessions_on_disable();

-- ---------------------------------------------------------------------------------------------
-- Recovery codes (D-236)
-- ---------------------------------------------------------------------------------------------

/** Ten new codes replace whatever was left: the old ones stop working the moment new ones exist. */
create function iam.issue_recovery_codes(p_user_id uuid, p_hashes text[]) returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  written integer;
begin
  delete from iam.recovery_code where user_id = p_user_id;
  insert into iam.recovery_code (user_id, code_hash)
  select p_user_id, h from pg_catalog.unnest(p_hashes) h;
  get diagnostics written = row_count;
  return written;
end
$$;

/** Uses one code, once. False when the code is unknown to this person or already spent. */
create function iam.use_recovery_code(p_user_id uuid, p_hash text) returns boolean
language sql security definer
set search_path = ''
as $$
  update iam.recovery_code set used_at = pg_catalog.now()
   where user_id = p_user_id and code_hash = p_hash and used_at is null
  returning true
$$;

create function iam.recovery_codes_left(p_user_id uuid) returns integer
language sql stable security definer
set search_path = ''
as $$
  select count(*)::int from iam.recovery_code
   where user_id = p_user_id and used_at is null
$$;

-- The application asks; nobody else. The worker also closes sessions, because the leave-date job
-- runs there (REQ-IAM-007).
revoke all on function iam.login_lock(text) from public;
revoke all on function iam.note_login_attempt(text, boolean, text, text, integer, integer) from public;
revoke all on function iam.start_session(uuid, text, integer, boolean) from public;
revoke all on function iam.use_session(uuid, integer) from public;
revoke all on function iam.mark_session_second_factor(uuid) from public;
revoke all on function iam.revoke_session(uuid, text) from public;
revoke all on function iam.revoke_sessions(uuid, text) from public;
revoke all on function iam.issue_recovery_codes(uuid, text[]) from public;
revoke all on function iam.use_recovery_code(uuid, text) from public;
revoke all on function iam.recovery_codes_left(uuid) from public;
grant execute on function iam.login_lock(text) to geoges_app;
grant execute on function iam.note_login_attempt(text, boolean, text, text, integer, integer) to geoges_app;
grant execute on function iam.start_session(uuid, text, integer, boolean) to geoges_app;
grant execute on function iam.use_session(uuid, integer) to geoges_app;
grant execute on function iam.mark_session_second_factor(uuid) to geoges_app;
grant execute on function iam.revoke_session(uuid, text) to geoges_app;
grant execute on function iam.revoke_sessions(uuid, text) to geoges_app, geoges_worker;
grant execute on function iam.issue_recovery_codes(uuid, text[]) to geoges_app;
grant execute on function iam.use_recovery_code(uuid, text) to geoges_app;
grant execute on function iam.recovery_codes_left(uuid) to geoges_app;
