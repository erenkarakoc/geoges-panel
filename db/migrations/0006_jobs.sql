-- 0006 — event backbone: outbox, deliveries, dead letters, scheduled jobs, read models
-- (TASK-0104, ADR-014, EVENT_BACKBONE.md, D-233, D-234, D-259).
--
-- An event is written in the transaction of the change that caused it, through
-- core.publish_event(), together with one delivery row per subscription to its code; the runtime
-- role cannot touch the outbox otherwise. The worker (a Next.js server background loop, D-259)
-- keeps the subscriptions in step with its code registry and delivers at least once and in order
-- per subscriber and record: a delivery waits while an older delivery of the same subscriber and
-- sequence key is not done (SPIKE-03). Effects and
-- the "done" mark are written in one transaction. Failures retry after 1, 5, 15, 60 and 360
-- minutes, then the delivery is dead and parks its record for that subscriber until retried by
-- hand. Nothing here is ever deleted (D-231).

-- ---------------------------------------------------------------------------------------------
-- The worker's database role (PORTS_AND_SERVICES section 2: the RLS-bypassing connection is for
-- migrations and the outbox worker only). It logs in and bypasses RLS, because subscribers and
-- scheduled jobs act with system authority (D-082); it cannot create roles, databases or tables,
-- delete or truncate. Its password is set by `npm run db:app-role` (DATABASE_WORKER_URL).
-- ---------------------------------------------------------------------------------------------
do $$
begin
  if not exists (select from pg_catalog.pg_roles where rolname = 'geoges_worker') then
    create role geoges_worker login nosuperuser nocreatedb nocreaterole noinherit noreplication
      bypassrls connection limit 5;
  end if;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------

create table core.outbox (
  id bigint generated always as identity,
  event_id uuid not null default core.uuid_v7(),
  event_code text not null,
  event_version integer not null default 1,
  publisher_module text not null,
  record_schema text,
  record_table text,
  record_id uuid,
  sequence_key text not null,
  payload jsonb not null default '{}',
  actor_user_id uuid,
  actor_role_id uuid,
  occurred_at timestamptz not null default now(),
  constraint pk_outbox primary key (id),
  constraint uq_outbox__event_id unique (event_id),
  constraint ck_outbox__event_code check (event_code ~ '^[a-z][a-z_]*\.[a-z][a-z_]*(\.v[0-9]+)?$'),
  constraint ck_outbox__event_version check (event_version >= 1),
  constraint ck_outbox__publisher_module check (publisher_module ~ '^[a-z]{2,3}$'),
  constraint ck_outbox__payload check (jsonb_typeof(payload) = 'object')
);
create index ix_outbox__record on core.outbox (record_schema, record_table, record_id, event_code);
create index ix_outbox__event_code on core.outbox (event_code, id);

comment on table core.outbox is
  'Published events (ADR-014); written with the change that caused them, never deleted (D-231).';

-- Which subscriber listens to which event code; written by the worker from its code registry.
-- A subscription is never removed automatically: deliveries to a subscriber no worker knows stay
-- pending and show in `npm run jobs:status` and in the delay alarm.
create table core.event_subscription (
  subscriber text not null,
  event_code text not null,
  replayable boolean not null,
  registered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint pk_event_subscription primary key (subscriber, event_code),
  constraint ck_event_subscription__subscriber check (subscriber ~ '^[a-z]{2,3}\.[a-z0-9_.-]+$')
);
create index ix_event_subscription__event_code on core.event_subscription (event_code);

comment on table core.event_subscription is
  'Subscriber per event code (D-259); core.publish_event creates one delivery per row.';

create table core.outbox_delivery (
  id bigint generated always as identity,
  outbox_id bigint not null,
  subscriber text not null,
  sequence_key text not null,
  status text not null default 'pending',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint pk_outbox_delivery primary key (id),
  constraint fk_outbox_delivery__outbox foreign key (outbox_id) references core.outbox (id),
  constraint uq_outbox_delivery__outbox_id_subscriber unique (outbox_id, subscriber),
  constraint ck_outbox_delivery__status check (status in ('pending', 'done', 'dead')),
  constraint ck_outbox_delivery__subscriber check (subscriber ~ '^[a-z]{2,3}\.[a-z0-9_.-]+$')
);
-- Head-of-line check: the oldest open delivery of a subscriber and sequence key.
create index ix_outbox_delivery__open_key on core.outbox_delivery
  (subscriber, sequence_key, outbox_id) where status <> 'done';
create index ix_outbox_delivery__due on core.outbox_delivery (available_at, outbox_id)
  where status = 'pending';

comment on table core.outbox_delivery is
  'One delivery per event and subscriber; (outbox_id, subscriber) makes a repeat harmless.';

create table core.scheduled_job (
  id uuid not null default core.uuid_v7(),
  job_type text not null,
  run_at timestamptz not null,
  idempotency_key text not null,
  payload jsonb not null default '{}',
  status text not null default 'pending',
  attempts integer not null default 0,
  available_at timestamptz not null,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint pk_scheduled_job primary key (id),
  constraint uq_scheduled_job__idempotency_key unique (idempotency_key),
  -- A module's job (`iam.…`) or the platform's own (`core.read-model-rebuild`).
  constraint ck_scheduled_job__job_type check (job_type ~ '^([a-z]{2,3}|core)\.[a-z0-9_.-]+$'),
  constraint ck_scheduled_job__status check (status in ('pending', 'done', 'dead')),
  constraint ck_scheduled_job__payload check (jsonb_typeof(payload) = 'object')
);
create index ix_scheduled_job__due on core.scheduled_job (available_at) where status = 'pending';

comment on table core.scheduled_job is
  'Timed work and workflow wake-ups (EVENT_BACKBONE section 7); one run per idempotency key.';

create table core.dead_letter (
  id uuid not null default core.uuid_v7(),
  delivery_id bigint,
  scheduled_job_id uuid,
  handler text not null,
  error text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text,
  constraint pk_dead_letter primary key (id),
  constraint fk_dead_letter__delivery foreign key (delivery_id)
    references core.outbox_delivery (id),
  constraint fk_dead_letter__scheduled_job foreign key (scheduled_job_id)
    references core.scheduled_job (id),
  constraint ck_dead_letter__source check ((delivery_id is null) <> (scheduled_job_id is null))
);
create index ix_dead_letter__open on core.dead_letter (created_at) where resolved_at is null;
create index ix_dead_letter__delivery_id on core.dead_letter (delivery_id);
create index ix_dead_letter__scheduled_job_id on core.dead_letter (scheduled_job_id);

comment on table core.dead_letter is
  'Deliveries and jobs that failed five times; retried by hand (EVENT_BACKBONE section 4).';

-- Which physical table serves each read model; a rebuild swaps it in one transaction (SPIKE-14).
create table core.read_model (
  name text not null,
  active_table text not null,
  version integer not null default 1,
  rebuilt_at timestamptz,
  last_difference integer,
  constraint pk_read_model primary key (name),
  constraint ck_read_model__name check (name ~ '^[a-z]{2,3}\.[a-z0-9_]+$')
);

comment on table core.read_model is
  'Active physical table of each read model (D-233); swapped by a rebuild in one transaction.';

alter table core.outbox enable row level security;
alter table core.event_subscription enable row level security;
alter table core.outbox_delivery enable row level security;
alter table core.scheduled_job enable row level security;
alter table core.dead_letter enable row level security;
alter table core.read_model enable row level security;
revoke all on core.outbox, core.event_subscription, core.outbox_delivery, core.scheduled_job,
  core.dead_letter, core.read_model from public;

insert into core.table_layer (schema_name, table_name, layer, history) values
  ('core', 'outbox', 'system', 'none'),
  ('core', 'event_subscription', 'system', 'none'),
  ('core', 'outbox_delivery', 'system', 'none'),
  ('core', 'scheduled_job', 'system', 'none'),
  ('core', 'dead_letter', 'system', 'none'),
  ('core', 'read_model', 'system', 'none');

-- ---------------------------------------------------------------------------------------------
-- Publishing and scheduling (the only doors for request code)
-- ---------------------------------------------------------------------------------------------

-- Publishes an event in the caller's transaction, with a delivery for each subscription. The
-- sequence key defaults to the record, so the events of one record reach each subscriber in the
-- order they were published.
create function core.publish_event(p_event_code text, p_publisher_module text,
                                   p_record_schema text default null,
                                   p_record_table text default null,
                                   p_record_id uuid default null,
                                   p_payload jsonb default '{}',
                                   p_event_version integer default 1,
                                   p_sequence_key text default null) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  new_id bigint;
  new_event uuid;
  key text := coalesce(p_sequence_key, p_publisher_module || ':' ||
                       coalesce(p_record_schema || '.' || p_record_table || ':' || p_record_id,
                                p_event_code));
begin
  insert into core.outbox (event_code, event_version, publisher_module, record_schema,
                           record_table, record_id, sequence_key, payload, actor_user_id,
                           actor_role_id)
  values (p_event_code, p_event_version, p_publisher_module, p_record_schema, p_record_table,
          p_record_id, key, coalesce(p_payload, '{}'), core.current_user_id(),
          core.current_role_id())
  returning id, event_id into new_id, new_event;
  insert into core.outbox_delivery (outbox_id, subscriber, sequence_key)
  select new_id, s.subscriber, key from core.event_subscription s where s.event_code = p_event_code;
  return new_event;
end
$$;

-- Schedules one run of a job; a second call with the same key does nothing and returns false.
create function core.schedule_job(p_job_type text, p_run_at timestamptz, p_idempotency_key text,
                                  p_payload jsonb default '{}') returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  added integer;
begin
  insert into core.scheduled_job (job_type, run_at, idempotency_key, payload, available_at)
  values (p_job_type, p_run_at, p_idempotency_key, coalesce(p_payload, '{}'), p_run_at)
  on conflict (idempotency_key) do nothing;
  get diagnostics added = row_count;
  return added = 1;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- IAM scheduled work (REQ-IAM-007, REQ-IAM-008, IAM capability catalog)
-- ---------------------------------------------------------------------------------------------

-- Accounts whose leaving date has come lose access without anyone acting (REQ-IAM-007). The
-- status change fires the account triggers: history, audit event, `user.deactivated` event.
-- Owners cannot be given a leaving date (iam.guard_user), so they never appear here.
create function iam.deactivate_departed() returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  changed integer;
begin
  update iam.user set status = 'disabled'
   where status = 'active' and left_on is not null and left_on <= iam.today();
  get diagnostics changed = row_count;
  return changed;
end
$$;

-- Assignments and delegations whose last day has passed: publishes `role_assignment.ended` /
-- `role_delegation.ended` once per assignment, and writes the delegation end to the audit log.
-- An end date entered in the past is caught the same way on the next run.
create function iam.publish_ended_assignments() returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  a record;
  code text;
  payload jsonb;
  done integer := 0;
begin
  for a in
    select x.* from iam.role_assignment x
     where x.ends_on is not null and x.ends_on < iam.today()
       and not exists (
         select from core.outbox o
          where o.record_schema = 'iam' and o.record_table = 'role_assignment'
            and o.record_id = x.id
            and o.event_code in ('role_assignment.ended', 'role_delegation.ended'))
     order by x.ends_on, x.id
  loop
    code := case when a.is_delegation then 'role_delegation.ended' else 'role_assignment.ended' end;
    payload := pg_catalog.jsonb_build_object('user_id', a.user_id, 'role_id', a.role_id,
      'scope_type', a.scope_type, 'scope_ids', a.scope_ids, 'ends_on', a.ends_on,
      'delegated_by_user_id', a.delegated_by_user_id);
    perform core.publish_event(code, 'iam', 'iam', 'role_assignment', a.id, payload);
    if a.is_delegation then
      perform aud.record_event(code, 'iam', 'role_assignment', a.id, payload);
    end if;
    done := done + 1;
  end loop;
  return done;
end
$$;

-- IAM events also reach the outbox (the catalog events above); otherwise as in 0004.
create or replace function iam.emit_audit_event() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  n jsonb := pg_catalog.to_jsonb(new);
  o jsonb := case when tg_op = 'UPDATE' then pg_catalog.to_jsonb(old) end;
  kind text;
  payload jsonb := '{}';
begin
  case tg_table_name
    when 'role_assignment' then
      payload := pg_catalog.jsonb_build_object('user_id', n -> 'user_id', 'role_id', n -> 'role_id',
        'scope_type', n -> 'scope_type', 'scope_ids', n -> 'scope_ids',
        'starts_on', n -> 'starts_on', 'ends_on', n -> 'ends_on',
        'delegated_by_user_id', n -> 'delegated_by_user_id');
      if tg_op = 'INSERT' then
        kind := case when new.is_delegation then 'role_delegation.started'
                     else 'role_assignment.created' end;
      elsif new.ends_on is distinct from old.ends_on then
        kind := case when new.is_delegation then 'role_delegation.changed'
                     else 'role_assignment.ended' end;
      elsif (n - 'updated_at' - 'updated_by_user_id' - 'reason')
            is distinct from (o - 'updated_at' - 'updated_by_user_id' - 'reason') then
        kind := 'role_assignment.changed';
      end if;
    when 'user_exception' then
      payload := pg_catalog.jsonb_build_object('user_id', n -> 'user_id', 'target', n -> 'target',
        'effect', n -> 'effect', 'scope_type', n -> 'scope_type', 'scope_ids', n -> 'scope_ids');
      if tg_op = 'INSERT' then kind := 'user_exception.created';
      elsif new.revoked_at is not null and old.revoked_at is null then
        kind := 'user_exception.revoked';
      end if;
    when 'user_manager' then
      payload := pg_catalog.jsonb_build_object('user_id', n -> 'user_id',
        'manager_user_id', n -> 'manager_user_id', 'scope_type', n -> 'scope_type',
        'scope_ids', n -> 'scope_ids');
      if tg_op = 'INSERT' then kind := 'user_manager.assigned';
      elsif new.revoked_at is not null and old.revoked_at is null then
        kind := 'user_manager.revoked';
      end if;
    when 'role_permission' then
      payload := pg_catalog.jsonb_build_object('role_id', n -> 'role_id',
        'permission_id', n -> 'permission_id');
      if tg_op = 'INSERT' then kind := 'role_permission.granted';
      elsif new.revoked_at is not null and old.revoked_at is null then
        kind := 'role_permission.revoked';
      end if;
    when 'user' then
      payload := pg_catalog.jsonb_build_object('status', n -> 'status', 'left_on', n -> 'left_on');
      if tg_op = 'INSERT' then kind := 'user.created';
      elsif new.status = 'disabled' and old.status <> 'disabled' then kind := 'user.deactivated';
      elsif new.status = 'active' and old.status <> 'active' then kind := 'user.reactivated';
      elsif new.left_on is distinct from old.left_on then kind := 'user.leaving_date_set';
      end if;
  end case;
  if kind is not null then
    perform aud.record_event(kind, tg_table_schema, tg_table_name, (n ->> 'id')::uuid, payload);
    -- Catalog events that workflows can listen to (REQ-IAM capability catalog). Ends of
    -- assignments and delegations are published by iam.publish_ended_assignments on the day
    -- after their last day, whether the end date was reached or entered in the past.
    if kind in ('role_assignment.created', 'role_delegation.started', 'user.deactivated') then
      perform core.publish_event(kind, 'iam', tg_table_schema, tg_table_name,
                                 (n ->> 'id')::uuid, payload);
    end if;
  end if;
  return null;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------------------------

revoke all on function core.publish_event(text, text, text, text, uuid, jsonb, integer, text), core.schedule_job(text, timestamptz, text, jsonb), iam.deactivate_departed(), iam.publish_ended_assignments()
  from public;
grant execute on function core.publish_event(text, text, text, text, uuid, jsonb, integer, text), core.schedule_job(text, timestamptz, text, jsonb) to geoges_app, geoges_worker;
grant execute on function iam.deactivate_departed(), iam.publish_ended_assignments()
  to geoges_worker;

-- The worker reads and writes every application table without deleting; later migrations'
-- tables and sequences reach it through default privileges, their schemas by an explicit grant
-- in the migration that creates them (the migration runner checks it).
grant usage on schema core, iam, aud to geoges_worker;
grant select, insert, update on all tables in schema core, iam, aud to geoges_worker;
grant usage, select on all sequences in schema core, iam, aud to geoges_worker;
grant execute on all functions in schema core, iam, aud to geoges_worker;
alter default privileges grant select, insert, update on tables to geoges_worker;
alter default privileges grant usage, select on sequences to geoges_worker;
alter default privileges grant execute on functions to geoges_worker;
