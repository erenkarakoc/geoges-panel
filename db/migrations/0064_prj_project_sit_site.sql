-- 0064 — the project card and its sites (TASK-0123 step 1, REQ-PRJ-001…003, REQ-PRJ-010,
-- REQ-SIT-001, D-138, D-292).
--
-- A project is the contract; a site is where it is built. The rules that are the database's:
--
-- A site belongs to exactly one project and never moves (PRJ-K1, D-292 rule 3). Cost, progress and
-- progress payments are written to one project, and a site that could change project would carry
-- its history into the wrong one. A wrongly opened site turns passive.
--
-- The three durations are three columns, typed separately (PRJ-K5). None is derived from another.
--
-- The contract value is commercial (REQ-PRJ-002, D-292 rule 6) and lives in a table of its own, so
-- a person without the commercial right is not handed an empty field: the row never reaches them.
--
-- A stage change is a row in the project's own stage history and an event; which transitions need
-- an approval, and which are locked, is the flows' (REQ-PRJ-003).
--
-- Who sees what follows the role assignment's scope. A project-scoped grant covers the project's
-- sites; a site-scoped grant lets its holder read the project the site belongs to — a site
-- engineer sees whose project they are building, not the other projects of the company.

create schema prj;
grant usage on schema prj to geoges_app, geoges_worker;
comment on schema prj is 'Projects, walls, revisions, targets, technical office, supply matrix (REQ-PRJ).';

create schema sit;
grant usage on schema sit to geoges_app, geoges_worker;
comment on schema sit is 'Sites and the daily site log (REQ-SIT).';

-- ---------------------------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------------------------

create table prj.project (
  id uuid not null default core.uuid_v7(),
  code text not null,
  name text not null,
  /** The client (a firm holding the client role, D-027). */
  client_party_id uuid,
  /** The public authority that approves the project, as it is called (Glossary: Authority). */
  authority text,
  city text,
  location text,
  contract_no text,
  contract_signed_on date,
  -- The three durations (REQ-PRJ-010): each typed on its own.
  contract_start_on date,
  contract_end_on date,
  theoretical_end_on date,
  management_target_end_on date,
  coordinator_user_id uuid,
  /** A code of the `project_stage` catalog (REQ-PRJ-003). */
  stage text not null default 'contract',
  custom_fields jsonb not null default '{}',
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_project primary key (id),
  constraint fk_project__client foreign key (client_party_id) references crm.party (id),
  constraint fk_project__coordinator foreign key (coordinator_user_id) references iam.user (id),
  constraint ck_project__code check (length(btrim(code)) between 1 and 40),
  constraint ck_project__name check (length(btrim(name)) between 2 and 200),
  constraint ck_project__contract_dates check (
    contract_end_on is null or contract_start_on is null or contract_end_on >= contract_start_on)
);

create unique index uq_project__code on prj.project (upper(code));

comment on table prj.project is
  'Project card (REQ-PRJ-002): client, authority, contract, three durations, stage.';

create trigger check_custom_fields before insert or update on prj.project
  for each row execute function adm.check_custom_fields();

-- The stage must be a code of the stage catalog; the catalog is management's to extend.
create function prj.guard_project_stage() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.stage is not distinct from old.stage then
    return new;
  end if;
  if not exists (
    select from adm.catalog_item i join adm.catalog c on c.id = i.catalog_id
     where c.key = 'project_stage' and i.code = new.stage and i.status = 'active') then
    raise exception 'unknown project stage %', new.stage using errcode = '23514',
      hint = 'prj.unknown_stage';
  end if;
  return new;
end
$$;

create trigger guard_stage before insert or update of stage on prj.project
  for each row execute function prj.guard_project_stage();

-- ---------------------------------------------------------------------------------------------
-- The contract value: commercial, a table of its own
-- ---------------------------------------------------------------------------------------------

create table prj.project_contract (
  id uuid not null default core.uuid_v7(),
  project_id uuid not null,
  contract_value numeric(18, 2),
  currency text not null default 'TRY',
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_project_contract primary key (id),
  constraint uq_project_contract__project unique (project_id),
  constraint fk_project_contract__project foreign key (project_id) references prj.project (id),
  constraint ck_project_contract__value check (contract_value is null or contract_value >= 0),
  constraint ck_project_contract__currency check (currency ~ '^[A-Z]{3}$')
);

comment on table prj.project_contract is
  'Contract value of a project (REQ-PRJ-002): commercial data, returned only with the right.';

-- ---------------------------------------------------------------------------------------------
-- Stage history
-- ---------------------------------------------------------------------------------------------

create table prj.project_stage_change (
  id uuid not null default core.uuid_v7(),
  project_id uuid not null,
  from_stage text,
  to_stage text not null,
  changed_at timestamptz not null default now(),
  changed_by_user_id uuid default core.current_user_id(),
  changed_in_role_id uuid default core.current_role_id(),
  constraint pk_project_stage_change primary key (id),
  constraint fk_project_stage_change__project foreign key (project_id) references prj.project (id)
);

create index ix_project_stage_change__project on prj.project_stage_change (project_id, changed_at);

create trigger append_only_guard before update or delete on prj.project_stage_change
  for each row execute function aud.guard_append_only();

comment on table prj.project_stage_change is
  'Every stage a project entered, when and by whom (REQ-PRJ-003); written by a trigger only.';

create function prj.record_project_stage() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into prj.project_stage_change (project_id, from_stage, to_stage)
    values (new.id, null, new.stage);
    perform core.publish_event('project.created', 'prj', 'prj', 'project', new.id,
      pg_catalog.jsonb_build_object('id', new.id, 'name', new.name,
                                    'client_party_id', new.client_party_id,
                                    'coordinator_user_id', new.coordinator_user_id,
                                    'stage', new.stage));
  elsif new.stage is distinct from old.stage then
    insert into prj.project_stage_change (project_id, from_stage, to_stage)
    values (new.id, old.stage, new.stage);
    perform core.publish_event('project.stage_changed', 'prj', 'prj', 'project', new.id,
      pg_catalog.jsonb_build_object('id', new.id, 'name', new.name,
                                    'from_stage', old.stage, 'stage', new.stage));
  elsif (pg_catalog.to_jsonb(new) - array['updated_at', 'updated_by_user_id'])
        is distinct from (pg_catalog.to_jsonb(old) - array['updated_at', 'updated_by_user_id'])
  then
    perform core.publish_event('project.changed', 'prj', 'prj', 'project', new.id,
      pg_catalog.jsonb_build_object('id', new.id, 'name', new.name));
  end if;
  return null;
end
$$;

create trigger record_stage after insert or update on prj.project
  for each row execute function prj.record_project_stage();

-- ---------------------------------------------------------------------------------------------
-- Sites
-- ---------------------------------------------------------------------------------------------

create table sit.site (
  id uuid not null default core.uuid_v7(),
  project_id uuid not null,
  code text,
  name text not null,
  /** Our own crew, or a subcontractor's (Glossary: Labor Model). */
  work_model text not null default 'in_house',
  subcontractor_party_id uuid,
  coordinator_user_id uuid,
  /** The site engineer: the person who submits the day's log (D-119). */
  entry_owner_user_id uuid,
  city text,
  -- Where the site is, for the day's weather (D-288, Open-Meteo answers by coordinates).
  latitude numeric(8, 5),
  longitude numeric(8, 5),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_site primary key (id),
  constraint fk_site__project foreign key (project_id) references prj.project (id),
  constraint fk_site__subcontractor foreign key (subcontractor_party_id) references crm.party (id),
  constraint fk_site__coordinator foreign key (coordinator_user_id) references iam.user (id),
  constraint fk_site__entry_owner foreign key (entry_owner_user_id) references iam.user (id),
  constraint uq_site__project unique (id, project_id),
  constraint ck_site__name check (length(btrim(name)) between 2 and 120),
  constraint ck_site__work_model check (work_model in ('in_house', 'subcontracted')),
  -- A subcontracted site names its subcontractor; our own crew names none.
  constraint ck_site__subcontractor check (
    (work_model = 'subcontracted') = (subcontractor_party_id is not null)),
  constraint ck_site__latitude check (latitude is null or latitude between -90 and 90),
  constraint ck_site__longitude check (longitude is null or longitude between -180 and 180),
  constraint ck_site__status check (status in ('active', 'passive'))
);

create index ix_site__project on sit.site (project_id);
create unique index uq_site__project_name on sit.site (project_id, core.fold_tr(name));

comment on table sit.site is
  'Site (REQ-SIT-001): belongs to exactly one project and never moves (D-138, D-292).';

create function sit.guard_site_project() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.project_id is distinct from old.project_id then
    raise exception 'a site never moves to another project' using errcode = '23514',
      hint = 'sit.site_project_fixed';
  end if;
  return new;
end
$$;

create trigger guard_project before update of project_id on sit.site
  for each row execute function sit.guard_site_project();

create function sit.publish_site_event() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform core.publish_event('site.created', 'sit', 'sit', 'site', new.id,
      pg_catalog.jsonb_build_object('id', new.id, 'name', new.name,
                                    'project_id', new.project_id));
  elsif (pg_catalog.to_jsonb(new) - array['updated_at', 'updated_by_user_id'])
        is distinct from (pg_catalog.to_jsonb(old) - array['updated_at', 'updated_by_user_id'])
  then
    perform core.publish_event('site.changed', 'sit', 'sit', 'site', new.id,
      pg_catalog.jsonb_build_object('id', new.id, 'name', new.name,
                                    'project_id', new.project_id, 'status', new.status));
  end if;
  return null;
end
$$;

create trigger publish_event after insert or update on sit.site
  for each row execute function sit.publish_site_event();

-- ---------------------------------------------------------------------------------------------
-- Who may do what
-- ---------------------------------------------------------------------------------------------

-- Whether one of the person's grants, of one of the given permissions, covers the place: the
-- project itself, or (for a site) the site or its project.
create function prj.grant_covers(p_permissions text[], p_project_id uuid,
                                 p_site_id uuid default null) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select from iam.my_grants() g
     where g.permission_code = any (p_permissions)
       and (iam.covers(g.scope_type, g.scope_ids, 'project', p_project_id)
            or (p_site_id is not null
                and iam.covers(g.scope_type, g.scope_ids, 'site', p_site_id))))
$$;

-- Reading a project: a grant on the project, or on one of its sites, or being its coordinator
-- with the "own" right.
create function prj.may_see_project(p_project_id uuid, p_coordinator uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select prj.grant_covers(array['prj.module.view', 'prj.module.manage', 'sit.module.view',
                                'sit.module.manage'], p_project_id)
      or (p_coordinator = core.current_user_id()
          and exists (select from iam.my_grants() g
                       where g.permission_code in ('prj.module.own', 'sit.module.own')))
      or exists (
           select from iam.my_grants() g
             join sit.site s on g.scope_type = 'site' and s.id = any (g.scope_ids)
            where s.project_id = p_project_id
              and g.permission_code in ('prj.module.view', 'prj.module.manage',
                                        'sit.module.view', 'sit.module.manage', 'sit.module.own'))
$$;

create function prj.may_manage_project(p_project_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select prj.grant_covers(array['prj.module.manage'], p_project_id)
$$;

create function prj.may_see_contract_value(p_project_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select iam.can_see('prj', 'commercial', 'project', p_project_id)
$$;

create function sit.may_see_site(p_site_id uuid, p_project_id uuid, p_coordinator uuid,
                                 p_entry_owner uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select prj.grant_covers(array['prj.module.view', 'prj.module.manage', 'sit.module.view',
                                'sit.module.manage'], p_project_id, p_site_id)
      or (core.current_user_id() in (p_coordinator, p_entry_owner)
          and exists (select from iam.my_grants() g
                       where g.permission_code in ('sit.module.own', 'prj.module.own')))
$$;

-- Opening a site is the project's business (projects) or the coordinator's (sites, at project
-- scope); changing one also belongs to whoever manages that site.
create function sit.may_manage_site(p_site_id uuid, p_project_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select prj.grant_covers(array['prj.module.manage', 'sit.module.manage'], p_project_id, p_site_id)
$$;

-- ---------------------------------------------------------------------------------------------
-- Layers, history, security
-- ---------------------------------------------------------------------------------------------

insert into core.table_layer (schema_name, table_name, layer, history, portable, scope_source)
values
  ('prj', 'project', 'business', 'tracked', false, 'own'),
  ('prj', 'project_contract', 'business', 'tracked', false, 'parent'),
  ('prj', 'project_stage_change', 'business', 'append_only', false, 'parent'),
  ('sit', 'site', 'business', 'tracked', false, 'own');

create trigger record_history after insert or update on prj.project
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on prj.project_contract
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on sit.site
  for each row execute function aud.capture_history();

alter table prj.project enable row level security;
alter table prj.project_contract enable row level security;
alter table prj.project_stage_change enable row level security;
alter table sit.site enable row level security;

create policy project_read on prj.project for select to geoges_app
  using (prj.may_see_project(id, coordinator_user_id));
-- A new project has no scope yet: only a company-wide right opens one.
create policy project_add on prj.project for insert to geoges_app
  with check (prj.grant_covers(array['prj.module.manage'], null));
create policy project_change on prj.project for update to geoges_app
  using (prj.may_manage_project(id))
  with check (prj.may_manage_project(id));

create policy project_contract_read on prj.project_contract for select to geoges_app
  using (prj.may_see_contract_value(project_id)
         and exists (select from prj.project p where p.id = project_id));
create policy project_contract_add on prj.project_contract for insert to geoges_app
  with check (prj.may_manage_project(project_id) and prj.may_see_contract_value(project_id));
create policy project_contract_change on prj.project_contract for update to geoges_app
  using (prj.may_manage_project(project_id) and prj.may_see_contract_value(project_id))
  with check (prj.may_manage_project(project_id) and prj.may_see_contract_value(project_id));

create policy project_stage_change_read on prj.project_stage_change for select to geoges_app
  using (exists (select from prj.project p where p.id = project_id));

create policy site_read on sit.site for select to geoges_app
  using (sit.may_see_site(id, project_id, coordinator_user_id, entry_owner_user_id));
create policy site_add on sit.site for insert to geoges_app
  with check (prj.grant_covers(array['prj.module.manage', 'sit.module.manage'], project_id));
create policy site_change on sit.site for update to geoges_app
  using (sit.may_manage_site(id, project_id))
  with check (sit.may_manage_site(id, project_id));

revoke all on prj.project, prj.project_contract, prj.project_stage_change, sit.site from public;
grant select, insert, update on prj.project, prj.project_contract, sit.site to geoges_app;
grant select on prj.project_stage_change to geoges_app;
grant select on prj.project, prj.project_contract, prj.project_stage_change, sit.site
  to geoges_worker;
-- The flow engine moves a project's stage with system authority (D-082).
grant update on prj.project to geoges_worker;

revoke all on function prj.guard_project_stage(), prj.record_project_stage(),
  prj.grant_covers(text[], uuid, uuid), prj.may_see_project(uuid, uuid),
  prj.may_manage_project(uuid), prj.may_see_contract_value(uuid), sit.guard_site_project(),
  sit.publish_site_event(), sit.may_see_site(uuid, uuid, uuid, uuid),
  sit.may_manage_site(uuid, uuid) from public;
grant execute on function prj.grant_covers(text[], uuid, uuid), prj.may_see_project(uuid, uuid),
  prj.may_manage_project(uuid), prj.may_see_contract_value(uuid),
  sit.may_see_site(uuid, uuid, uuid, uuid), sit.may_manage_site(uuid, uuid)
  to geoges_app, geoges_worker;
