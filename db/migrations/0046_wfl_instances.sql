-- 0046 — instances, their steps and the run log (TASK-0117, REQ-WFL-007, 024, 033, 034).
--
-- An instance is a running flow. Two things about it are decided here and never again:
--
-- It holds the **version** it started on, not the flow, so publishing a new definition cannot
-- change what a half-finished job is doing (REQ-WFL-024). That is a foreign key, not a rule
-- somebody has to remember.
--
-- And a flow marked single-instance opens one instance per record: a second trigger returns the
-- one that is already running rather than starting another (WORKFLOW_ENGINE section 3). That is a
-- partial unique index, so two events arriving at the same moment cannot both win.
--
-- The run log is what "why is this mine" and the instance history are built from (D-087, D-223).
-- It is append-only and it is never deleted, because an instance's history is part of the audit
-- record (D-231).

create table wfl.instance (
  id uuid not null default core.uuid_v7(),
  flow_version_id uuid not null references wfl.flow_version,
  flow_id uuid not null references wfl.flow,
  -- Carried on the row so that reading a run never needs the definition tables, which only a flow
  -- designer may see; it is also the triple every produced task and lock carries (D-087).
  flow_key text not null,
  version integer not null,
  status text not null default 'running',
  -- How it began (REQ-WFL-007). The event's own id is kept so the same event never starts the
  -- same flow twice, whatever the delivery does.
  trigger_kind text not null,
  trigger_event_id uuid,
  -- The record the flow is about; the modules that own records fill this in when they trigger.
  record_schema text,
  record_table text,
  record_id uuid,
  -- Set only for a single-instance flow: the record it may have one run for at a time.
  single_key text,
  -- What the flow is carrying: the trigger's payload and whatever the steps have decided.
  context jsonb not null default '{}',
  -- How many steps this instance has been through, against the engine's own limit (500).
  steps_taken integer not null default 0,
  failure text,
  failed_step_id text,
  started_at timestamptz not null default now(),
  started_by_user_id uuid,
  ended_at timestamptz,
  constraint pk_instance primary key (id),
  constraint ck_instance__status check (status in ('running', 'done', 'failed', 'stopped')),
  constraint ck_instance__trigger check (trigger_kind in ('event', 'clock', 'threshold', 'manual')),
  constraint ck_instance__ended check ((status = 'running') = (ended_at is null)),
  constraint ck_instance__record check (
    (record_schema is null) = (record_table is null)
    and (record_schema is null or record_id is not null)),
  constraint ck_instance__failure check (status = 'failed' or failure is null)
);

-- One running instance per record for a single-instance flow (WORKFLOW_ENGINE section 3). A flow
-- that allows many writes no key at all, so the index simply does not see it.
create unique index uq_instance__single on wfl.instance (flow_id, single_key)
  where status = 'running' and single_key is not null;
-- The same event never starts the same flow twice, however often it is delivered.
create unique index uq_instance__event on wfl.instance (flow_id, trigger_event_id)
  where trigger_event_id is not null;
create index ix_instance__running on wfl.instance (flow_id, started_at desc) where status = 'running';

comment on table wfl.instance is
  'A running or finished flow, bound to the definition version it started on (REQ-WFL-024).';

create table wfl.step_state (
  id uuid not null default core.uuid_v7(),
  instance_id uuid not null references wfl.instance on delete cascade,
  -- The step's id inside the definition, which never changes between versions.
  step_id text not null,
  step_type text not null,
  status text not null default 'running',
  -- Who the step is waiting on, once the engine has worked it out (D-097).
  owner_user_id uuid,
  outcome text,
  detail jsonb not null default '{}',
  entered_at timestamptz not null default now(),
  left_at timestamptz,
  constraint pk_step_state primary key (id),
  constraint ck_step_state__status check (status in ('running', 'done', 'skipped', 'failed')),
  constraint ck_step_state__left check ((status = 'running') = (left_at is null))
);

create index ix_step_state__instance on wfl.step_state (instance_id, entered_at);
-- A back edge may bring a flow to the same step again (D-099), so a step can be entered more than
-- once; what cannot happen is being inside it twice at the same time.
create unique index uq_step_state__running on wfl.step_state (instance_id, step_id)
  where status = 'running';

comment on table wfl.step_state is
  'Each visit to a step. A back edge may enter one again; being inside it twice at once cannot.';

create table wfl.run_log (
  id uuid not null default core.uuid_v7(),
  instance_id uuid not null references wfl.instance on delete cascade,
  at timestamptz not null default now(),
  step_id text,
  kind text not null,
  detail jsonb not null default '{}',
  constraint pk_run_log primary key (id),
  constraint ck_run_log__kind check (kind in ('started', 'entered', 'left', 'waiting', 'failed',
                                              'limit', 'ended'))
);

create index ix_run_log__instance on wfl.run_log (instance_id, at, id);

comment on table wfl.run_log is
  'What the instance did, in order; the run screen and "why is this mine" are built from it.';

create function wfl.guard_run_log_append_only() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'the run log is not changed'
    using errcode = 'P0001', hint = 'wfl.run_log_append_only';
end
$$;

create trigger append_only_guard before update on wfl.run_log
  for each row execute function wfl.guard_run_log_append_only();

insert into core.table_layer (schema_name, table_name, layer, history, portable, scope_source)
values
  ('wfl', 'instance', 'business', 'none', false, 'parent'),
  ('wfl', 'step_state', 'business', 'none', false, 'parent'),
  ('wfl', 'run_log', 'business', 'none', false, 'parent');

-- ---------------------------------------------------------------------------------------------
-- Who sees a run
-- ---------------------------------------------------------------------------------------------

alter table wfl.instance enable row level security;
alter table wfl.step_state enable row level security;
alter table wfl.run_log enable row level security;

-- For now a run is visible to whoever may design flows, and to the person a step is waiting on.
-- Seeing a run because you may see the record it is about needs the owning module to answer for
-- the record, which no module does before the first slice; that is added with them, not guessed
-- at here.
-- `instance.id` is spelled out: the step states have an `id` of their own, and an unqualified one
-- inside the subquery would be theirs, which is never the instance's.
create policy instance_read on wfl.instance for select to geoges_app
  using ((select iam.has_permission('wfl.workflow.design'))
         or exists (select from wfl.step_state s
                     where s.instance_id = instance.id
                       and s.owner_user_id = (select core.current_user_id())));
create policy step_state_read on wfl.step_state for select to geoges_app
  using ((select iam.has_permission('wfl.workflow.design'))
         or owner_user_id = (select core.current_user_id()));
create policy run_log_read on wfl.run_log for select to geoges_app
  using ((select iam.has_permission('wfl.workflow.design'))
         or exists (select from wfl.step_state s
                     where s.instance_id = run_log.instance_id
                       and s.owner_user_id = (select core.current_user_id())));

revoke all on wfl.instance, wfl.step_state, wfl.run_log from public;
grant select on wfl.instance, wfl.step_state, wfl.run_log to geoges_app;
grant select, insert, update on wfl.instance, wfl.step_state, wfl.run_log to geoges_worker;

-- ---------------------------------------------------------------------------------------------
-- Starting, stepping and ending
-- ---------------------------------------------------------------------------------------------

/** The record a single-instance flow may have one run for; null when there is no record. */
create function wfl.single_key(p_schema text, p_table text, p_id uuid) returns text
language sql immutable
set search_path = ''
as $$
  select case when p_id is null then null
              else p_schema || '.' || p_table || ':' || p_id::text end
$$;

/**
 * Starts the flow's published version, or returns the instance already running for this record
 * when the flow is single-instance (REQ-WFL-007). A disabled flow starts nothing, and a flow with
 * no published version starts nothing: both answer null rather than raising, because a trigger
 * arriving for a flow the company has turned off is ordinary, not an error.
 */
create function wfl.start_instance(p_flow_key text, p_trigger_kind text,
                                   p_record_schema text default null,
                                   p_record_table text default null,
                                   p_record_id uuid default null,
                                   p_context jsonb default '{}',
                                   p_trigger_event_id uuid default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v record;
  existing uuid;
  new_id uuid;
begin
  select ver.id as version_id, ver.flow_id, ver.version, f.single_instance
    into v
    from wfl.flow_version ver
    join wfl.flow f on f.id = ver.flow_id
   where f.key = p_flow_key and ver.status = 'published' and f.disabled_at is null;
  if v is null then
    return null;
  end if;

  if p_trigger_event_id is not null then
    select i.id into existing from wfl.instance i
     where i.flow_id = v.flow_id and i.trigger_event_id = p_trigger_event_id;
    if existing is not null then
      return existing;
    end if;
  end if;

  if v.single_instance and p_record_id is not null then
    select i.id into existing from wfl.instance i
     where i.flow_id = v.flow_id and i.status = 'running'
       and i.single_key = wfl.single_key(p_record_schema, p_record_table, p_record_id);
    if existing is not null then
      return existing;
    end if;
  end if;

  insert into wfl.instance (flow_version_id, flow_id, flow_key, version, trigger_kind,
                            trigger_event_id, record_schema, record_table, record_id, single_key,
                            context, started_by_user_id)
  values (v.version_id, v.flow_id, p_flow_key, v.version, p_trigger_kind,
          p_trigger_event_id, p_record_schema, p_record_table, p_record_id,
          case when v.single_instance
               then wfl.single_key(p_record_schema, p_record_table, p_record_id) end,
          coalesce(p_context, '{}'::jsonb), core.current_user_id())
  returning id into new_id;

  insert into wfl.run_log (instance_id, kind, detail)
  values (new_id, 'started', pg_catalog.jsonb_build_object('trigger', p_trigger_kind));

  perform core.publish_event('workflow_instance.started', 'wfl', 'wfl', 'instance', new_id,
                             pg_catalog.jsonb_build_object('flow', p_flow_key,
                                                           'trigger', p_trigger_kind));
  return new_id;
end
$$;

revoke all on function wfl.start_instance(text, text, text, text, uuid, jsonb, uuid) from public;
grant execute on function wfl.start_instance(text, text, text, text, uuid, jsonb, uuid)
  to geoges_worker;

/**
 * Starting a flow by hand (REQ-WFL-007). A separate door from the engine's, because this one asks
 * who is knocking: the engine is the system and needs no permission, while a person needs the one
 * that lets them design flows at all.
 */
create function wfl.start_instance_by_hand(p_flow_key text, p_record_schema text default null,
                                           p_record_table text default null,
                                           p_record_id uuid default null,
                                           p_context jsonb default '{}')
returns uuid
language plpgsql security definer
set search_path = ''
as $$
begin
  if not iam.has_permission('wfl.workflow.design') then
    raise exception 'starting a flow by hand needs wfl.workflow.design'
      using errcode = 'P0001', hint = 'wfl.design_permission';
  end if;
  return wfl.start_instance(p_flow_key, 'manual', p_record_schema, p_record_table, p_record_id,
                            p_context, null);
end
$$;

revoke all on function wfl.start_instance_by_hand(text, text, text, uuid, jsonb) from public;
grant execute on function wfl.start_instance_by_hand(text, text, text, uuid, jsonb) to geoges_app;

/**
 * Ends the instance. A failure says which step and why, and both the log and the owner layer are
 * told: an instance that stops silently is the thing REQ-WFL-034 exists to prevent.
 */
create function wfl.end_instance(p_instance_id uuid, p_status text, p_failure text default null,
                                 p_failed_step_id text default null)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  i record;
begin
  if p_status not in ('done', 'failed', 'stopped') then
    raise exception 'an instance ends done, failed or stopped'
      using errcode = 'P0001', hint = 'wfl.bad_end';
  end if;
  update wfl.instance
     set status = p_status, ended_at = pg_catalog.now(),
         failure = case when p_status = 'failed' then p_failure end,
         failed_step_id = case when p_status = 'failed' then p_failed_step_id end
   where id = p_instance_id and status = 'running'
  returning flow_id, id into i;
  if i is null then
    return false;
  end if;

  update wfl.step_state set status = 'skipped', left_at = pg_catalog.now()
   where instance_id = p_instance_id and status = 'running';

  insert into wfl.run_log (instance_id, step_id, kind, detail)
  values (p_instance_id, p_failed_step_id, 'ended',
          pg_catalog.jsonb_build_object('status', p_status, 'failure', p_failure));

  -- Each branch names its own event. A `case` would say the same thing to the database and
  -- nothing at all to the contract test, which reads these calls to check that an event a module
  -- declares is really published (REQ-WFL-004).
  if p_status = 'failed' then
    perform core.publish_event('workflow_instance.failed', 'wfl', 'wfl', 'instance', p_instance_id,
                               pg_catalog.jsonb_build_object('status', p_status,
                                                             'failure', p_failure,
                                                             'step', p_failed_step_id));
  else
    perform core.publish_event('workflow_instance.completed', 'wfl', 'wfl', 'instance',
                               p_instance_id,
                               pg_catalog.jsonb_build_object('status', p_status));
  end if;
  return true;
end
$$;

revoke all on function wfl.end_instance(uuid, text, text, text) from public;
grant execute on function wfl.end_instance(uuid, text, text, text) to geoges_worker;

/**
 * Enters a step and counts it against the engine's limit. Answers null when the instance has
 * already taken more steps than one may (WORKFLOW_ENGINE section 7) — a back edge is allowed to
 * loop, and this is what stops a loop that never ends.
 *
 * Null rather than an exception, and the difference matters: an exception would roll back the very
 * log line that says why the flow stopped. The instance is ended as failed in the same breath, so
 * a run that hits the limit always leaves both a reason and a finished instance.
 */
create function wfl.enter_step(p_instance_id uuid, p_step_id text, p_step_type text,
                               p_owner_user_id uuid default null,
                               p_limit integer default 500)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  taken integer;
  state_id uuid;
begin
  update wfl.instance set steps_taken = steps_taken + 1
   where id = p_instance_id and status = 'running'
  returning steps_taken into taken;
  if taken is null then
    raise exception 'this instance is not running'
      using errcode = 'P0001', hint = 'wfl.not_running';
  end if;
  if taken > p_limit then
    insert into wfl.run_log (instance_id, step_id, kind, detail)
    values (p_instance_id, p_step_id, 'limit',
            pg_catalog.jsonb_build_object('steps', taken, 'limit', p_limit));
    perform wfl.end_instance(p_instance_id, 'failed',
                             'adim siniri asildi: ' || p_limit::text, p_step_id);
    return null;
  end if;

  insert into wfl.step_state (instance_id, step_id, step_type, owner_user_id)
  values (p_instance_id, p_step_id, p_step_type, p_owner_user_id)
  returning id into state_id;

  insert into wfl.run_log (instance_id, step_id, kind, detail)
  values (p_instance_id, p_step_id, 'entered',
          pg_catalog.jsonb_build_object('type', p_step_type));
  return state_id;
end
$$;

revoke all on function wfl.enter_step(uuid, text, text, uuid, integer) from public;
grant execute on function wfl.enter_step(uuid, text, text, uuid, integer) to geoges_worker;

/** Leaves the step with what it decided; the engine reads the outcome to find the next one. */
create function wfl.leave_step(p_state_id uuid, p_status text, p_outcome text default null,
                               p_detail jsonb default '{}')
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  s record;
begin
  update wfl.step_state
     set status = p_status, outcome = p_outcome, left_at = pg_catalog.now(),
         detail = coalesce(p_detail, '{}'::jsonb)
   where id = p_state_id and status = 'running'
  returning instance_id, step_id into s;
  if s is null then
    return false;
  end if;
  insert into wfl.run_log (instance_id, step_id, kind, detail)
  values (s.instance_id, s.step_id, 'left',
          pg_catalog.jsonb_build_object('status', p_status, 'outcome', p_outcome));
  return true;
end
$$;

revoke all on function wfl.leave_step(uuid, text, text, jsonb) from public;
grant execute on function wfl.leave_step(uuid, text, text, jsonb) to geoges_worker;


/** The instance is waiting on something outside itself; the log says so for the run screen. */
create function wfl.note_waiting(p_instance_id uuid, p_step_id text, p_detail jsonb)
returns boolean
language sql security definer
set search_path = ''
as $$
  insert into wfl.run_log (instance_id, step_id, kind, detail)
  values (p_instance_id, p_step_id, 'waiting', coalesce(p_detail, '{}'::jsonb))
  returning true
$$;

revoke all on function wfl.note_waiting(uuid, text, jsonb) from public;
grant execute on function wfl.note_waiting(uuid, text, jsonb) to geoges_worker;
