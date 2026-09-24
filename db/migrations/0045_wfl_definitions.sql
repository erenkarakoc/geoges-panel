-- 0045 — flow definitions, their versions and the evidence a publish needs (TASK-0117, D-281).
--
-- A definition is versioned and a running instance stays on the version it started with
-- (REQ-WFL-024); instances arrive with the engine's execution step. What this migration builds is
-- the part everything else stands on: a flow, its versions, and the two rules that keep a
-- published definition trustworthy.
--
-- Rule one: a published version is immutable. Not "the screens do not offer it" — the table
-- refuses it, so a definition cannot be edited out from under the instances running on it.
--
-- Rule two: publishing needs a dry run of exactly this definition (REQ-WFL-025). The evidence
-- carries the content hash of what was run; changing the definition afterwards invalidates it and
-- the publish is refused. SPIKE-04 measured both rules before this existed.

create schema wfl;
grant usage on schema wfl to geoges_app, geoges_worker;
comment on schema wfl is 'Workflow definitions and, from the next migration, their instances.';

-- ---------------------------------------------------------------------------------------------
-- The flow and its versions
-- ---------------------------------------------------------------------------------------------

create table wfl.flow (
  id uuid not null default core.uuid_v7(),
  key text not null,
  name text not null,
  -- Default single instance (WORKFLOW_ENGINE section 3): a second trigger for the same record
  -- returns the instance that is already running instead of opening another.
  single_instance boolean not null default true,
  disabled_at timestamptz,
  -- Portable configuration carries no key into a person's row (D-246): the stamp is the id.
  disabled_by_user_id uuid,
  disabled_reason text,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_flow primary key (id),
  constraint uq_flow__key unique (key),
  constraint ck_flow__key check (key ~ '^[a-z][a-z0-9-]{2,60}$'),
  constraint ck_flow__disabled check ((disabled_at is null) = (disabled_by_user_id is null))
);

comment on table wfl.flow is
  'One process the company runs; its versions hold what it actually does (REQ-WFL-024).';

create table wfl.flow_version (
  id uuid not null default core.uuid_v7(),
  flow_id uuid not null references wfl.flow on delete cascade,
  version integer not null,
  status text not null default 'draft',
  definition jsonb not null,
  -- The fingerprint a dry run is tied to. jsonb normalises key order, so the same definition
  -- written differently hashes the same.
  content_hash text not null,
  published_at timestamptz,
  published_by_user_id uuid,
  superseded_at timestamptz,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  constraint pk_flow_version primary key (id),
  constraint uq_flow_version__version unique (flow_id, version),
  constraint uq_flow_version__hash unique (id, content_hash),
  constraint ck_flow_version__status check (status in ('draft', 'published', 'superseded')),
  constraint ck_flow_version__version check (version > 0),
  -- A superseded version keeps the day it was published; only a draft has never been one.
  constraint ck_flow_version__published check ((status = 'draft') = (published_at is null)),
  constraint ck_flow_version__superseded check ((status = 'superseded') = (superseded_at is not null))
);

-- One published version at a time; the rest are drafts or history (REQ-WFL-023).
create unique index uq_flow_version__one_published on wfl.flow_version (flow_id)
  where status = 'published';

comment on table wfl.flow_version is
  'A versioned definition. Immutable once published; an instance stays on the version it started.';

create table wfl.dry_run (
  id uuid not null default core.uuid_v7(),
  flow_version_id uuid not null references wfl.flow_version on delete cascade,
  -- What was actually run. A definition edited after the run no longer matches (REQ-WFL-025).
  content_hash text not null,
  passed boolean not null,
  summary jsonb not null default '{}',
  ran_at timestamptz not null default now(),
  ran_by_user_id uuid default core.current_user_id(),
  constraint pk_dry_run primary key (id)
);

comment on table wfl.dry_run is
  'Evidence that a definition was run in dry mode; a publish needs a passed one of the same hash.';

insert into core.table_layer (schema_name, table_name, layer, history, portable, scope_source)
values
  ('wfl', 'flow', 'config', 'tracked', true, 'company'),
  -- Not append-only: publishing moves a version's status. What never changes is the definition
  -- itself, and the trigger below is what refuses that.
  ('wfl', 'flow_version', 'config', 'none', true, 'parent'),
  ('wfl', 'dry_run', 'config', 'append_only', false, 'parent');

-- ---------------------------------------------------------------------------------------------
-- What the tables refuse
-- ---------------------------------------------------------------------------------------------

/**
 * A published or superseded version keeps the definition it was published with, for ever.
 *
 * Only the content is guarded. Whether a version may be *removed* is a question of who still
 * needs it, and that is a foreign key's job: an instance holds the version it started on, so a
 * version with instances cannot be deleted, and one with none is a flow the company gave up on.
 * Guarding the delete here as well would only mean a configuration reset could never remove a
 * flow.
 */
create function wfl.guard_version_immutable() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'draft'
     and (new.definition is distinct from old.definition
          or new.content_hash is distinct from old.content_hash
          or new.version is distinct from old.version) then
    raise exception 'a published flow version is not changed'
      using errcode = 'P0001', hint = 'wfl.version_immutable';
  end if;
  return new;
end
$$;

create trigger version_immutable before update on wfl.flow_version
  for each row execute function wfl.guard_version_immutable();

/**
 * Evidence is never rewritten. Deleting is left alone on purpose: a version's delete cascades
 * through it, a configuration reset takes it with the rest, and removing a run enables nothing —
 * a publish needs a passed run that exists, so the only thing a deletion costs is the history.
 */
create function wfl.guard_dry_run_append_only() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'a dry run is evidence and is not changed'
    using errcode = 'P0001', hint = 'wfl.dry_run_append_only';
end
$$;

create trigger append_only_guard before update on wfl.dry_run
  for each row execute function wfl.guard_dry_run_append_only();

create trigger flow_stamp before update on wfl.flow
  for each row execute function iam.stamp_update();
create trigger record_history after insert or update on wfl.flow
  for each row execute function aud.capture_history();

-- ---------------------------------------------------------------------------------------------
-- Who sees a definition
-- ---------------------------------------------------------------------------------------------

alter table wfl.flow enable row level security;
alter table wfl.flow_version enable row level security;
alter table wfl.dry_run enable row level security;

-- Designing a flow is a full-visibility permission already (D-083, migration 0003), so reading
-- the definitions is the same right: a definition names records, roles and thresholds.
create policy flow_read on wfl.flow for select to geoges_app
  using ((select iam.has_permission('wfl.workflow.design')));
create policy flow_version_read on wfl.flow_version for select to geoges_app
  using ((select iam.has_permission('wfl.workflow.design')));
create policy dry_run_read on wfl.dry_run for select to geoges_app
  using ((select iam.has_permission('wfl.workflow.design')));

revoke all on wfl.flow, wfl.flow_version, wfl.dry_run from public;
grant select on wfl.flow, wfl.flow_version, wfl.dry_run to geoges_app;
-- The engine reads definitions as the worker; it never writes one.
grant select on wfl.flow, wfl.flow_version, wfl.dry_run to geoges_worker;

-- ---------------------------------------------------------------------------------------------
-- Writing a draft, running it dry, publishing it
-- ---------------------------------------------------------------------------------------------

/** The fingerprint of a definition; jsonb already sorts its keys, so the text is canonical. */
create function wfl.content_hash(p_definition jsonb) returns text
language sql immutable
set search_path = ''
as $$
  select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p_definition::text, 'UTF8')),
                           'hex')
$$;

/**
 * Writes the flow's draft: creates the flow the first time, replaces the draft that is open, or
 * starts a new version after the last publish. Returns the draft version's id.
 */
create function wfl.save_draft(p_key text, p_name text, p_definition jsonb,
                               p_single_instance boolean default true)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_flow_id uuid;
  draft_id uuid;
  next_version integer;
begin
  if not iam.has_permission('wfl.workflow.design') then
    raise exception 'flow design needs wfl.workflow.design'
      using errcode = 'P0001', hint = 'wfl.design_permission';
  end if;

  insert into wfl.flow (key, name, single_instance) values (p_key, p_name, p_single_instance)
  on conflict (key) do update set name = excluded.name,
                                  single_instance = excluded.single_instance,
                                  updated_at = pg_catalog.now()
  returning id into v_flow_id;

  select v.id into draft_id from wfl.flow_version v
   where v.flow_id = v_flow_id and v.status = 'draft';

  if draft_id is not null then
    update wfl.flow_version
       set definition = p_definition, content_hash = wfl.content_hash(p_definition)
     where id = draft_id;
    return draft_id;
  end if;

  select coalesce(pg_catalog.max(v.version), 0) + 1 into next_version
    from wfl.flow_version v where v.flow_id = v_flow_id;

  insert into wfl.flow_version (flow_id, version, definition, content_hash)
  values (v_flow_id, next_version, p_definition, wfl.content_hash(p_definition))
  returning id into draft_id;
  return draft_id;
end
$$;

revoke all on function wfl.save_draft(text, text, jsonb, boolean) from public;
grant execute on function wfl.save_draft(text, text, jsonb, boolean) to geoges_app;

/** Records what a dry run found, tied to the definition as it stands right now. */
create function wfl.record_dry_run(p_version_id uuid, p_passed boolean, p_summary jsonb)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  hash text;
  run_id uuid;
begin
  if not iam.has_permission('wfl.workflow.design') then
    raise exception 'flow design needs wfl.workflow.design'
      using errcode = 'P0001', hint = 'wfl.design_permission';
  end if;
  select v.content_hash into hash from wfl.flow_version v where v.id = p_version_id;
  if hash is null then
    raise exception 'no such flow version' using errcode = 'P0001', hint = 'wfl.no_version';
  end if;
  insert into wfl.dry_run (flow_version_id, content_hash, passed, summary)
  values (p_version_id, hash, p_passed, coalesce(p_summary, '{}'::jsonb))
  returning id into run_id;
  return run_id;
end
$$;

revoke all on function wfl.record_dry_run(uuid, boolean, jsonb) from public;
grant execute on function wfl.record_dry_run(uuid, boolean, jsonb) to geoges_app;

/**
 * Publishes a draft (REQ-WFL-023): the previous published version becomes history, the draft
 * becomes the one that runs, and it is refused without a passed dry run of exactly this
 * definition. The publish is audited and announced, because a flow changing is everybody's
 * business (D-081).
 */
create function wfl.publish_version(p_version_id uuid) returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v record;
  flow record;
begin
  if not iam.has_permission('wfl.workflow.design') then
    raise exception 'flow design needs wfl.workflow.design'
      using errcode = 'P0001', hint = 'wfl.design_permission';
  end if;

  select * into v from wfl.flow_version where id = p_version_id;
  if v is null then
    raise exception 'no such flow version' using errcode = 'P0001', hint = 'wfl.no_version';
  end if;
  if v.status <> 'draft' then
    raise exception 'only a draft is published'
      using errcode = 'P0001', hint = 'wfl.not_a_draft';
  end if;
  if not exists (select from wfl.dry_run r
                  where r.flow_version_id = v.id and r.passed and r.content_hash = v.content_hash)
  then
    raise exception 'this definition has not passed a dry run'
      using errcode = 'P0001', hint = 'wfl.dry_run_required';
  end if;

  select * into flow from wfl.flow where id = v.flow_id;

  update wfl.flow_version
     set status = 'superseded', superseded_at = pg_catalog.now()
   where flow_id = v.flow_id and status = 'published';

  update wfl.flow_version
     set status = 'published',
         published_at = pg_catalog.now(),
         published_by_user_id = core.current_user_id()
   where id = v.id;

  insert into aud.audit_log (event_type, actor_user_id, target_schema, target_table, target_id,
                             payload)
  values ('workflow.published', core.current_user_id(), 'wfl', 'flow_version', v.id,
          pg_catalog.jsonb_build_object('key', flow.key, 'version', v.version));

  perform core.publish_event('workflow.published', 'wfl', 'wfl', 'flow_version', v.id,
                             pg_catalog.jsonb_build_object('key', flow.key,
                                                           'version', v.version));
  return true;
end
$$;

revoke all on function wfl.publish_version(uuid) from public;
grant execute on function wfl.publish_version(uuid) to geoges_app;

/** Stops a flow from starting anything new; what is running finishes (WORKFLOW_ENGINE §6). */
create function wfl.disable_flow(p_flow_id uuid, p_reason text) returns boolean
language plpgsql security definer
set search_path = ''
as $$
begin
  if not iam.has_permission('wfl.workflow.design') then
    raise exception 'flow design needs wfl.workflow.design'
      using errcode = 'P0001', hint = 'wfl.design_permission';
  end if;
  update wfl.flow
     set disabled_at = pg_catalog.now(),
         disabled_by_user_id = core.current_user_id(),
         disabled_reason = p_reason
   where id = p_flow_id and disabled_at is null;
  return found;
end
$$;

revoke all on function wfl.disable_flow(uuid, text) from public;
grant execute on function wfl.disable_flow(uuid, text) to geoges_app;
