-- 0003 — dynamic IAM (TASK-0102, PERMISSIONS.md, SCHEMA-PLATFORM "iam", D-256).
--
-- People, dynamic roles and permission types, scoped and dated role assignments (a delegation is
-- a dated assignment), personal exceptions, manual managers and the remembered acting-role
-- choice; the functions that compute a user's effective permission from them. The server reads
-- the same functions once per request (`modules/iam`), and every row level security policy in
-- later modules is written with them, so there is one permission world (PERMISSIONS section 3).
--
-- Layers (D-256): `iam.user` is `system` — no reset deletes an account. Roles, permission types
-- and what a role holds are portable `config`. Assignments, exceptions, manual managers and role
-- choices are `config` that is not portable: they name people, whose ids differ per environment.
--
-- Audit columns (`created_by_user_id`, `updated_by_user_id`, `created_in_role_id`) are plain
-- ids, not foreign keys: they record provenance, a portable table must not point at a person, and
-- the field history of every change goes to AUD (TASK-0103).

-- The layer register learns which configuration may move to another environment.
alter table core.table_layer add column portable boolean not null default false;
alter table core.table_layer add constraint ck_table_layer__portable_config
  check (not portable or layer = 'config');
comment on column core.table_layer.portable is
  'config:export writes only portable configuration (D-256); rows naming people are not portable.';

create schema iam;
grant usage on schema iam to geoges_app;

-- Calendar day in the company's time zone; assignment dates are calendar days (CONVENTIONS 5).
create function iam.today() returns date
language sql stable parallel safe
as $$ select (pg_catalog.now() at time zone 'Europe/Istanbul')::pg_catalog.date $$;

-- Keeps the created_* columns and stamps updated_* on every update.
create function iam.stamp_update() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := old.created_at;
  new.created_by_user_id := old.created_by_user_id;
  new.created_in_role_id := old.created_in_role_id;
  new.updated_at := pg_catalog.now();
  new.updated_by_user_id := core.current_user_id();
  return new;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------

-- A person who signs in. `id` is the Supabase Auth user id (D-256), so the verified session
-- names the row directly; `auth_provider_id` keeps the provider's id separately (ADR-002) for
-- the day the provider changes. Accounts are never deleted; they are disabled (D-134).
create table iam.user (
  id uuid not null,
  email text not null,
  display_name text not null,
  status text not null default 'active',
  auth_provider_id uuid not null,
  employee_id uuid,
  must_setup_2fa boolean not null default true,
  left_on date,
  is_bootstrap_owner boolean not null default false,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_user primary key (id),
  constraint ck_user__status check (status in ('active', 'disabled')),
  constraint ck_user__sample_not_owner check (not (is_sample and is_bootstrap_owner)),
  constraint ck_user__email check (email = lower(email) and email like '%_@_%'),
  constraint ck_user__display_name check (length(btrim(display_name)) > 0)
);
create unique index uq_user__email on iam.user (email);
create unique index uq_user__auth_provider_id on iam.user (auth_provider_id);

comment on table iam.user is 'Person who signs in; id is the Supabase Auth user id (D-256).';
comment on column iam.user.left_on is
  'Leaving date; from that day on the account holds no permission (REQ-IAM-007).';
comment on column iam.user.is_bootstrap_owner is
  'Seed data re-assigns the owner role to these users, so no reset locks the owner out (D-256).';
comment on column iam.user.is_sample is
  'Sample person loaded by db:sample; both resets remove it with the rows that name it (D-256).';

create table iam.role (
  id uuid not null default core.uuid_v7(),
  code text not null,
  name text not null,
  description text,
  level integer not null,
  parent_role_id uuid,
  is_owner_layer boolean not null default false,
  has_full_visibility boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_role primary key (id),
  constraint fk_role__parent_role foreign key (parent_role_id) references iam.role (id),
  constraint ck_role__code check (code ~ '^[A-Z][A-Z0-9_]{1,19}$'),
  constraint ck_role__name check (length(btrim(name)) > 0),
  constraint ck_role__level check (level between 0 and 1000),
  constraint ck_role__not_own_parent check (parent_role_id <> id),
  -- The owner layer always has full visibility (REQ-IAM-017, REQ-IAM-023).
  constraint ck_role__owner_full_visibility check (not is_owner_layer or has_full_visibility)
);
create unique index uq_role__code on iam.role (code);
create index ix_role__parent_role_id on iam.role (parent_role_id);

comment on table iam.role is 'Dynamic role (REQ-IAM-009); parent_role_id is the hierarchy.';
comment on column iam.role.has_full_visibility is
  'Every module, every data class, company scope; required for flow design (D-083).';

create table iam.permission (
  id uuid not null default core.uuid_v7(),
  code text not null,
  module text not null,
  name text not null,
  description text,
  created_from text not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_permission primary key (id),
  constraint ck_permission__code check (code ~ '^[a-z]{2,3}\.[a-z0-9-]+\.[a-z0-9-]+$'),
  constraint ck_permission__module check (module = split_part(code, '.', 1)),
  constraint ck_permission__name check (length(btrim(name)) > 0),
  constraint ck_permission__created_from check (created_from in ('seed', 'admin', 'designer'))
);
create unique index uq_permission__code on iam.permission (code);

comment on table iam.permission is
  'Permission type; the admin screen and the flow designer write the same table (REQ-IAM-016).';

-- What a role holds. A permission is taken back by stamping revoked_at; rows are not deleted.
create table iam.role_permission (
  id uuid not null default core.uuid_v7(),
  role_id uuid not null,
  permission_id uuid not null,
  revoked_at timestamptz,
  revoked_by_user_id uuid,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_role_permission primary key (id),
  constraint fk_role_permission__role foreign key (role_id) references iam.role (id),
  constraint fk_role_permission__permission foreign key (permission_id)
    references iam.permission (id)
);
create unique index uq_role_permission__role_id_permission_id on iam.role_permission
  (role_id, permission_id) where revoked_at is null;
create index ix_role_permission__permission_id on iam.role_permission (permission_id);

-- Commercial and sensitive personal data, module by module (REQ-IAM-011); the t/h marks of
-- PERMISSION_MATRIX. A module without a row shows neither class.
create table iam.role_data_class (
  id uuid not null default core.uuid_v7(),
  role_id uuid not null,
  module text not null,
  can_see_commercial boolean not null default false,
  can_see_sensitive boolean not null default false,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_role_data_class primary key (id),
  constraint fk_role_data_class__role foreign key (role_id) references iam.role (id),
  constraint ck_role_data_class__module check (module ~ '^[a-z]{2,3}$')
);
create unique index uq_role_data_class__role_id_module on iam.role_data_class (role_id, module);

-- A role given to a person with a scope and dates (REQ-IAM-012). A delegation is a dated
-- assignment of a role the delegating person holds (REQ-IAM-018, REQ-IAM-019); it ends by
-- itself on ends_on. An assignment is ended by setting ends_on, never deleted.
create table iam.role_assignment (
  id uuid not null default core.uuid_v7(),
  user_id uuid not null,
  role_id uuid not null,
  scope_type text not null,
  scope_ids uuid[] not null default '{}',
  starts_on date not null default iam.today(),
  ends_on date,
  is_delegation boolean not null default false,
  delegated_by_user_id uuid,
  reason text,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_role_assignment primary key (id),
  constraint fk_role_assignment__user foreign key (user_id) references iam.user (id),
  constraint fk_role_assignment__role foreign key (role_id) references iam.role (id),
  constraint fk_role_assignment__delegated_by_user foreign key (delegated_by_user_id)
    references iam.user (id),
  constraint ck_role_assignment__scope_type check (scope_type in ('company', 'site', 'project')),
  constraint ck_role_assignment__scope_ids check (
    (scope_type = 'company') = (cardinality(scope_ids) = 0)
    and array_position(scope_ids, null) is null),
  constraint ck_role_assignment__dates check (ends_on is null or ends_on >= starts_on),
  constraint ck_role_assignment__delegation check (
    case when is_delegation
      then ends_on is not null and delegated_by_user_id is not null
           and delegated_by_user_id <> user_id
      else delegated_by_user_id is null end)
);
create index ix_role_assignment__user_id on iam.role_assignment (user_id);
create index ix_role_assignment__role_id on iam.role_assignment (role_id);
create index ix_role_assignment__delegated_by_user_id on iam.role_assignment
  (delegated_by_user_id) where delegated_by_user_id is not null;

-- Owner-only personal exceptions (REQ-IAM-015). `target` is a permission code, or a module code
-- for the whole module: a module grant opens its `view` permissions, a module deny closes all of
-- its permissions. Taken back by stamping revoked_at.
create table iam.user_exception (
  id uuid not null default core.uuid_v7(),
  user_id uuid not null,
  target text not null,
  effect text not null,
  scope_type text not null default 'company',
  scope_ids uuid[] not null default '{}',
  reason text not null,
  revoked_at timestamptz,
  revoked_by_user_id uuid,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_user_exception primary key (id),
  constraint fk_user_exception__user foreign key (user_id) references iam.user (id),
  constraint ck_user_exception__target check (
    target ~ '^[a-z]{2,3}$' or target ~ '^[a-z]{2,3}\.[a-z0-9-]+\.[a-z0-9-]+$'),
  constraint ck_user_exception__effect check (effect in ('grant', 'deny')),
  constraint ck_user_exception__scope_type check (scope_type in ('company', 'site', 'project')),
  constraint ck_user_exception__scope_ids check (
    (scope_type = 'company') = (cardinality(scope_ids) = 0)
    and array_position(scope_ids, null) is null),
  constraint ck_user_exception__reason check (length(btrim(reason)) > 0),
  -- A deny closes the permission everywhere; only a grant can be limited to some scope items.
  constraint ck_user_exception__deny_company check (effect = 'grant' or scope_type = 'company')
);
create index ix_user_exception__user_id on iam.user_exception (user_id);

-- Manual manager (REQ-IAM-014); comes before the role hierarchy within its scope.
create table iam.user_manager (
  id uuid not null default core.uuid_v7(),
  user_id uuid not null,
  manager_user_id uuid not null,
  scope_type text not null default 'company',
  scope_ids uuid[] not null default '{}',
  revoked_at timestamptz,
  revoked_by_user_id uuid,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_user_manager primary key (id),
  constraint fk_user_manager__user foreign key (user_id) references iam.user (id),
  constraint fk_user_manager__manager_user foreign key (manager_user_id) references iam.user (id),
  constraint ck_user_manager__not_self check (manager_user_id <> user_id),
  constraint ck_user_manager__scope_type check (scope_type in ('company', 'site', 'project')),
  constraint ck_user_manager__scope_ids check (
    (scope_type = 'company') = (cardinality(scope_ids) = 0)
    and array_position(scope_ids, null) is null)
);
create index ix_user_manager__user_id on iam.user_manager (user_id);
create index ix_user_manager__manager_user_id on iam.user_manager (manager_user_id);

-- The role a person chose when two of their roles allow the same action (REQ-IAM-013).
create table iam.user_action_role_choice (
  user_id uuid not null,
  permission_code text not null,
  role_id uuid not null,
  chosen_at timestamptz not null default now(),
  constraint pk_user_action_role_choice primary key (user_id, permission_code),
  constraint fk_user_action_role_choice__user foreign key (user_id) references iam.user (id),
  constraint fk_user_action_role_choice__role foreign key (role_id) references iam.role (id)
);
create index ix_user_action_role_choice__role_id on iam.user_action_role_choice (role_id);

insert into core.table_layer (schema_name, table_name, layer, portable) values
  ('iam', 'user', 'system', false),
  ('iam', 'role', 'config', true),
  ('iam', 'permission', 'config', true),
  ('iam', 'role_permission', 'config', true),
  ('iam', 'role_data_class', 'config', true),
  ('iam', 'role_assignment', 'config', false),
  ('iam', 'user_exception', 'config', false),
  ('iam', 'user_manager', 'config', false),
  ('iam', 'user_action_role_choice', 'config', false);

-- ---------------------------------------------------------------------------------------------
-- Effective permission (PERMISSIONS section 2). All functions read the transaction-local user
-- (core.current_user_id); they run as the table owner so that computing a permission does not
-- depend on being allowed to read the permission tables. Search path is empty; every name is
-- qualified.
-- ---------------------------------------------------------------------------------------------

-- Whether a scope (type + ids) covers one scope item. Company covers everything.
create function iam.covers(p_type text, p_ids uuid[], q_type text, q_id uuid) returns boolean
language sql immutable parallel safe
as $$
  select p_type = 'company' or (p_type = q_type and q_id = any (p_ids))
$$;

-- Assignments in force today for a user who may sign in (active, not past the leaving date).
create function iam.active_assignments(p_user uuid)
returns table (role_id uuid, scope_type text, scope_ids uuid[], is_owner_layer boolean,
               has_full_visibility boolean, is_delegation boolean, delegated_by_user_id uuid)
language sql stable security definer
set search_path = ''
as $$
  select a.role_id, a.scope_type, a.scope_ids, r.is_owner_layer, r.has_full_visibility,
         a.is_delegation, a.delegated_by_user_id
    from iam.role_assignment a
    join iam.role r on r.id = a.role_id and r.is_active
    join iam.user u on u.id = a.user_id and u.status = 'active'
                   and (u.left_on is null or u.left_on > iam.today())
   where a.user_id = p_user
     and a.starts_on <= iam.today() and (a.ends_on is null or a.ends_on >= iam.today())
$$;

-- Every permission the signed-in user holds, with the role and scope it comes from: the union of
-- the roles' permissions with the assignments' scopes (REQ-IAM-013); a full-visibility role
-- (owner layer included) adds every `view` permission company-wide (REQ-IAM-017); granted
-- exceptions add (role_id NULL) and denied ones remove (REQ-IAM-015), except that nothing
-- removes anything from the owner layer (REQ-IAM-023).
create function iam.my_grants()
returns table (permission_code text, role_id uuid, scope_type text, scope_ids uuid[])
language sql stable security definer
set search_path = ''
as $$
  with a as (select * from iam.active_assignments(core.current_user_id())),
  from_roles as (
    select p.code, a.role_id, a.scope_type, a.scope_ids
      from a
      join iam.role_permission rp on rp.role_id = a.role_id and rp.revoked_at is null
      join iam.permission p on p.id = rp.permission_id and p.is_active
  ),
  full_view as (
    select p.code, a.role_id, 'company'::text, '{}'::uuid[]
      from a join iam.permission p on p.is_active and p.code like '%.view'
     where a.has_full_visibility
  ),
  exceptions as (
    select e.target, e.effect, e.scope_type, e.scope_ids
      from iam.user_exception e
     where e.user_id = core.current_user_id() and e.revoked_at is null
       and exists (select from a)
  ),
  granted as (
    select p.code, null::uuid, e.scope_type, e.scope_ids
      from exceptions e
      join iam.permission p on p.is_active
        and (p.code = e.target or (p.module = e.target and p.code like '%.view'))
     where e.effect = 'grant'
  ),
  denied as (
    select p.code
      from exceptions e
      join iam.permission p on p.code = e.target or p.module = e.target
     where e.effect = 'deny' and not exists (select from a where a.is_owner_layer)
  )
  select g.* from (select * from from_roles
                   union all select * from full_view
                   union all select * from granted) g
   where g.code not in (select d.code from denied d)
$$;

-- Commercial and sensitive visibility per module and scope. A full-visibility role (owner layer
-- included) sees both classes in every module company-wide: module '*'.
create function iam.my_data_classes()
returns table (module text, scope_type text, scope_ids uuid[], can_see_commercial boolean,
               can_see_sensitive boolean)
language sql stable security definer
set search_path = ''
as $$
  with a as (select * from iam.active_assignments(core.current_user_id()))
  select '*', 'company', '{}'::uuid[], true, true
    from a where a.has_full_visibility
  union
  select d.module, a.scope_type, a.scope_ids, d.can_see_commercial, d.can_see_sensitive
    from a join iam.role_data_class d on d.role_id = a.role_id
   where not a.has_full_visibility and (d.can_see_commercial or d.can_see_sensitive)
$$;

create function iam.is_owner_layer() returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select from iam.active_assignments(core.current_user_id()) a where a.is_owner_layer)
$$;

create function iam.has_permission(p_code text) returns boolean
language sql stable security definer
set search_path = ''
as $$ select exists (select from iam.my_grants() g where g.permission_code = p_code) $$;

create function iam.has_company_scope(p_code text) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select from iam.my_grants() g
                  where g.permission_code = p_code and g.scope_type = 'company')
$$;

-- Ids of one scope type (site or project) where the user holds a permission. RLS policies use
-- it together with has_company_scope, each wrapped in a sub-select so it runs once per query:
--   (select iam.has_company_scope('sit.module.view'))
--   or site_id = any ((select iam.scope_ids('sit.module.view', 'site'))::uuid[])
create function iam.scope_ids(p_code text, p_scope_type text) returns uuid[]
language sql stable security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct s.id), '{}')
    from iam.my_grants() g cross join lateral unnest(g.scope_ids) as s(id)
   where g.permission_code = p_code and g.scope_type = p_scope_type
$$;

-- Whether the user sees a data class ('commercial' or 'sensitive') of a module for one scope item;
-- without a scope item, only a company-wide right counts.
create function iam.can_see(p_module text, p_class text, p_scope_type text default 'company',
                            p_scope_id uuid default null) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select from iam.my_data_classes() d
     where d.module in (p_module, '*')
       and case p_class when 'commercial' then d.can_see_commercial
                        when 'sensitive' then d.can_see_sensitive else false end
       and iam.covers(d.scope_type, d.scope_ids, p_scope_type, p_scope_id))
$$;

-- Whether the acting role of this transaction is one the user holds today; write policies use
-- it so a request cannot record a role the person does not have (REQ-IAM-013).
create function iam.holds_role(p_role uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select from iam.active_assignments(core.current_user_id()) a
                  where a.role_id = p_role)
$$;

create function iam.acting_role_valid() returns boolean
language sql stable security definer
set search_path = ''
as $$ select core.current_role_id() is null or iam.holds_role(core.current_role_id()) $$;

-- The signed-in account when it may use the panel; no row for an unknown, disabled or departed
-- account (REQ-IAM-006, REQ-IAM-007).
create function iam.my_account()
returns table (id uuid, email text, display_name text, must_setup_2fa boolean)
language sql stable security definer
set search_path = ''
as $$
  select u.id, u.email, u.display_name, u.must_setup_2fa
    from iam.user u
   where u.id = core.current_user_id() and u.auth_provider_id = core.current_user_id()
     and u.status = 'active' and (u.left_on is null or u.left_on > iam.today())
$$;

-- ---------------------------------------------------------------------------------------------
-- Hierarchy and approval fallback (PERMISSIONS section 4). The workflow engine only asks "who
-- owns this step"; the answer is computed here (D-097).
-- ---------------------------------------------------------------------------------------------

-- Manager of a person for one scope item (REQ-IAM-014): the manual manager covering the scope
-- first; otherwise the people holding the parent role of the person's roles in that scope; when
-- nobody holds it there, the next level up.
create function iam.manager_of(p_user uuid, p_scope_type text, p_scope_id uuid)
returns setof uuid
language plpgsql stable security definer
set search_path = ''
as $$
declare
  level_roles uuid[];
  found uuid[];
  depth integer := 0;
begin
  select array_agg(distinct m.manager_user_id) into found
    from iam.user_manager m
   where m.user_id = p_user and m.revoked_at is null
     and iam.covers(m.scope_type, m.scope_ids, p_scope_type, p_scope_id)
     and exists (select from iam.active_assignments(m.manager_user_id));
  if found is not null then
    return query select unnest(found);
    return;
  end if;

  select array_agg(distinct r.parent_role_id) into level_roles
    from iam.active_assignments(p_user) a
    join iam.role r on r.id = a.role_id
   where r.parent_role_id is not null and not a.is_owner_layer
     and iam.covers(a.scope_type, a.scope_ids, p_scope_type, p_scope_id);

  while level_roles is not null and depth < 50 loop
    select array_agg(distinct x.user_id) into found
      from iam.role_assignment x
      join iam.role r on r.id = x.role_id and r.is_active
     where x.role_id = any (level_roles) and x.user_id <> p_user
       and x.starts_on <= iam.today() and (x.ends_on is null or x.ends_on >= iam.today())
       and iam.covers(x.scope_type, x.scope_ids, p_scope_type, p_scope_id)
       and exists (select from iam.active_assignments(x.user_id));
    if found is not null then
      return query select unnest(found);
      return;
    end if;
    select array_agg(distinct r.parent_role_id) into level_roles
      from iam.role r where r.id = any (level_roles) and r.parent_role_id is not null;
    depth := depth + 1;
  end loop;
end
$$;

-- People standing in for a person today through a delegation that covers the scope item.
create function iam.active_delegates(p_user uuid, p_scope_type text, p_scope_id uuid)
returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select distinct x.user_id
    from iam.role_assignment x
   where x.is_delegation and x.delegated_by_user_id = p_user
     and x.starts_on <= iam.today() and x.ends_on >= iam.today()
     and iam.covers(x.scope_type, x.scope_ids, p_scope_type, p_scope_id)
     and exists (select from iam.active_assignments(x.user_id))
$$;

-- Everyone in the owner layer today; "owner approval" is done by any of them (REQ-IAM-025).
create function iam.owner_users() returns setof uuid
language sql stable security definer
set search_path = ''
as $$
  select distinct x.user_id
    from iam.role_assignment x join iam.role r on r.id = x.role_id and r.is_owner_layer
   where exists (select from iam.active_assignments(x.user_id) a where a.is_owner_layer)
$$;

-- Whether a person may use the panel today (active and not departed).
create function iam.is_active_user(p_user uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select from iam.user u where u.id = p_user and u.status = 'active'
                  and (u.left_on is null or u.left_on > iam.today()))
$$;

-- ---------------------------------------------------------------------------------------------
-- Guards (SCHEMA-PLATFORM "iam" constraints). They run as the table owner, so a check sees rows
-- the caller's own policies hide (another person's overlapping assignment, for one).
-- ---------------------------------------------------------------------------------------------

-- The flow-design permission goes only to a full-visibility role (D-083, REQ-IAM-017), and the
-- owner layer keeps what it holds.
create function iam.guard_role_permission() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  -- What the owner layer holds is never taken back (REQ-IAM-024).
  if tg_op = 'UPDATE' and old.revoked_at is null and new.revoked_at is not null and exists (
       select from iam.role r where r.id = old.role_id and r.is_owner_layer) then
    raise exception 'the owner layer cannot be narrowed'
      using errcode = 'P0001', hint = 'iam.owner_layer_unrestricted';
  end if;
  if new.revoked_at is null and exists (
       select from iam.permission p join iam.role r on r.id = new.role_id
        where p.id = new.permission_id and p.code = 'wfl.workflow.design'
          and not r.has_full_visibility) then
    raise exception 'flow design may only be granted to a full-visibility role'
      using errcode = 'P0001', hint = 'iam.flow_design_needs_full_visibility';
  end if;
  return new;
end
$$;

create trigger role_permission_guard before insert or update on iam.role_permission
  for each row execute function iam.guard_role_permission();

-- Role changes: the owner layer cannot be switched off or narrowed (REQ-IAM-023), full visibility
-- cannot be dropped while the role holds flow design (D-083), and the hierarchy has no cycle.
create function iam.guard_role() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  cursor_id uuid := new.parent_role_id;
  depth integer := 0;
begin
  if tg_op = 'UPDATE' and old.is_owner_layer
     and (not new.is_owner_layer or not new.is_active or not new.has_full_visibility) then
    raise exception 'the owner layer cannot be narrowed'
      using errcode = 'P0001', hint = 'iam.owner_layer_unrestricted';
  end if;
  if tg_op = 'UPDATE' and old.has_full_visibility and not new.has_full_visibility and exists (
       select from iam.role_permission rp join iam.permission p on p.id = rp.permission_id
        where rp.role_id = new.id and rp.revoked_at is null and p.code = 'wfl.workflow.design') then
    raise exception 'a role holding flow design must keep full visibility'
      using errcode = 'P0001', hint = 'iam.flow_design_needs_full_visibility';
  end if;
  while cursor_id is not null loop
    if cursor_id = new.id or depth > 100 then
      raise exception 'role hierarchy would form a cycle'
        using errcode = 'P0001', hint = 'iam.role_hierarchy_cycle';
    end if;
    select r.parent_role_id into cursor_id from iam.role r where r.id = cursor_id;
    depth := depth + 1;
  end loop;
  return new;
end
$$;

create trigger role_guard before insert or update on iam.role
  for each row execute function iam.guard_role();

-- The owner layer's data classes cannot be closed (IAM-K1).
create function iam.guard_role_data_class() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if (not new.can_see_commercial or not new.can_see_sensitive) and exists (
       select from iam.role r where r.id = new.role_id and r.is_owner_layer) then
    raise exception 'the owner layer data classes cannot be closed'
      using errcode = 'P0001', hint = 'iam.owner_layer_unrestricted';
  end if;
  return new;
end
$$;

create trigger role_data_class_guard before insert or update on iam.role_data_class
  for each row execute function iam.guard_role_data_class();

-- Assignments: no overlapping dates for the same person, role and scope (any shared scope item);
-- a full-visibility role only company-wide; a delegation only of a role the delegating person
-- holds over the whole delegated scope (REQ-IAM-019); an owner-layer assignment that is not a
-- delegation cannot be shortened or changed (REQ-IAM-023).
create function iam.guard_role_assignment() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  role_row iam.role;
begin
  select * into role_row from iam.role r where r.id = new.role_id;

  if tg_op = 'UPDATE' and not old.is_delegation
     and exists (select from iam.role r where r.id = old.role_id and r.is_owner_layer)
     and (new.user_id, new.role_id, new.scope_type, new.scope_ids, new.starts_on, new.ends_on,
          new.is_delegation) is distinct from
         (old.user_id, old.role_id, old.scope_type, old.scope_ids, old.starts_on, old.ends_on,
          old.is_delegation) then
    raise exception 'an owner-layer assignment cannot be narrowed'
      using errcode = 'P0001', hint = 'iam.owner_layer_unrestricted';
  end if;

  if role_row.has_full_visibility and new.scope_type <> 'company' then
    raise exception 'a full-visibility role is assigned company-wide only'
      using errcode = 'P0001', hint = 'iam.full_visibility_company_scope';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('iam.role_assignment'),
                                           pg_catalog.hashtext(new.user_id::text));
  if exists (
       select from iam.role_assignment x
        where x.id <> new.id and x.user_id = new.user_id and x.role_id = new.role_id
          and x.scope_type = new.scope_type
          and (new.scope_type = 'company' or x.scope_ids && new.scope_ids)
          and daterange(x.starts_on, x.ends_on, '[]')
              && daterange(new.starts_on, new.ends_on, '[]')) then
    raise exception 'the person already holds this role in this scope for these dates'
      using errcode = '23P01', hint = 'iam.assignment_overlap';
  end if;

  if new.is_delegation and (tg_op = 'INSERT' or new.* is distinct from old.*) then
    if not exists (
         select from iam.role_assignment h
          where h.user_id = new.delegated_by_user_id and h.role_id = new.role_id
            and not h.is_delegation
            and h.starts_on <= new.starts_on and (h.ends_on is null or h.ends_on >= new.ends_on)
            and (h.scope_type = 'company'
                 or (h.scope_type = new.scope_type and new.scope_ids <@ h.scope_ids))) then
      raise exception 'a person can only delegate a role they hold over the whole scope and period'
        using errcode = 'P0001', hint = 'iam.delegation_not_held';
    end if;
  end if;
  return new;
end
$$;

create trigger role_assignment_guard before insert or update on iam.role_assignment
  for each row execute function iam.guard_role_assignment();

-- Exceptions never narrow the owner layer (REQ-IAM-023), and only the owner layer writes them
-- (REQ-IAM-015; also enforced by the policy below).
create function iam.guard_user_exception() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.effect = 'deny' and new.revoked_at is null and exists (
       select from iam.role_assignment x join iam.role r on r.id = x.role_id and r.is_owner_layer
        where x.user_id = new.user_id and not x.is_delegation
          and (x.ends_on is null or x.ends_on >= iam.today())) then
    raise exception 'the owner layer cannot be narrowed'
      using errcode = 'P0001', hint = 'iam.owner_layer_unrestricted';
  end if;
  return new;
end
$$;

create trigger user_exception_guard before insert or update on iam.user_exception
  for each row execute function iam.guard_user_exception();

-- An owner cannot be disabled or given a leaving date from the panel (REQ-IAM-022, REQ-IAM-023).
create function iam.guard_user() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if (new.status <> 'active' or new.left_on is not null)
     and (old.status = 'active' and old.left_on is null)
     and exists (
       select from iam.role_assignment x join iam.role r on r.id = x.role_id and r.is_owner_layer
        where x.user_id = new.id and not x.is_delegation
          and (x.ends_on is null or x.ends_on >= iam.today())) then
    raise exception 'an owner account cannot be disabled from the panel'
      using errcode = 'P0001', hint = 'iam.owner_layer_unrestricted';
  end if;
  if new.id <> old.id or new.auth_provider_id <> old.auth_provider_id then
    raise exception 'an account id cannot change' using errcode = 'P0001';
  end if;
  return new;
end
$$;

create trigger user_guard before update on iam.user
  for each row execute function iam.guard_user();

create trigger user_stamp before update on iam.user
  for each row execute function iam.stamp_update();
create trigger role_stamp before update on iam.role
  for each row execute function iam.stamp_update();
create trigger permission_stamp before update on iam.permission
  for each row execute function iam.stamp_update();
create trigger role_permission_stamp before update on iam.role_permission
  for each row execute function iam.stamp_update();
create trigger role_data_class_stamp before update on iam.role_data_class
  for each row execute function iam.stamp_update();
create trigger role_assignment_stamp before update on iam.role_assignment
  for each row execute function iam.stamp_update();
create trigger user_exception_stamp before update on iam.user_exception
  for each row execute function iam.stamp_update();
create trigger user_manager_stamp before update on iam.user_manager
  for each row execute function iam.stamp_update();

-- ---------------------------------------------------------------------------------------------
-- Row level security. Reading: everyone signed in sees roles and permission types (names only);
-- people, assignments, exceptions and managers are visible to the person they concern and to
-- holders of `iam.module.view`. Writing needs `iam.module.manage`; exceptions need the owner
-- layer. No application role may delete (CONVENTIONS section 2).
-- ---------------------------------------------------------------------------------------------

alter table iam.user enable row level security;
alter table iam.role enable row level security;
alter table iam.permission enable row level security;
alter table iam.role_permission enable row level security;
alter table iam.role_data_class enable row level security;
alter table iam.role_assignment enable row level security;
alter table iam.user_exception enable row level security;
alter table iam.user_manager enable row level security;
alter table iam.user_action_role_choice enable row level security;

create policy user_read on iam.user for select to geoges_app
  using (id = (select core.current_user_id()) or (select iam.has_permission('iam.module.view')));
create policy user_add on iam.user for insert to geoges_app
  with check ((select iam.has_permission('iam.module.manage')));
create policy user_change on iam.user for update to geoges_app
  using ((select iam.has_permission('iam.module.manage')))
  with check ((select iam.has_permission('iam.module.manage')));

create policy role_read on iam.role for select to geoges_app
  using ((select core.current_user_id()) is not null);
create policy role_add on iam.role for insert to geoges_app
  with check ((select iam.has_permission('iam.module.manage')));
create policy role_change on iam.role for update to geoges_app
  using ((select iam.has_permission('iam.module.manage')))
  with check ((select iam.has_permission('iam.module.manage')));

create policy permission_read on iam.permission for select to geoges_app
  using ((select core.current_user_id()) is not null);
create policy permission_add on iam.permission for insert to geoges_app
  with check ((select iam.has_permission('iam.module.manage'))
              or (select iam.has_permission('wfl.workflow.design')));
create policy permission_change on iam.permission for update to geoges_app
  using ((select iam.has_permission('iam.module.manage')))
  with check ((select iam.has_permission('iam.module.manage')));

create policy role_permission_read on iam.role_permission for select to geoges_app
  using ((select core.current_user_id()) is not null);
create policy role_permission_add on iam.role_permission for insert to geoges_app
  with check ((select iam.has_permission('iam.module.manage'))
              or (select iam.has_permission('wfl.workflow.design')));
create policy role_permission_change on iam.role_permission for update to geoges_app
  using ((select iam.has_permission('iam.module.manage')))
  with check ((select iam.has_permission('iam.module.manage')));

create policy role_data_class_read on iam.role_data_class for select to geoges_app
  using ((select core.current_user_id()) is not null);
create policy role_data_class_add on iam.role_data_class for insert to geoges_app
  with check ((select iam.has_permission('iam.module.manage')));
create policy role_data_class_change on iam.role_data_class for update to geoges_app
  using ((select iam.has_permission('iam.module.manage')))
  with check ((select iam.has_permission('iam.module.manage')));

-- A person may enter a delegation of their own role (REQ-IAM-019); the guard checks they hold it.
create policy role_assignment_read on iam.role_assignment for select to geoges_app
  using (user_id = (select core.current_user_id())
         or delegated_by_user_id = (select core.current_user_id())
         or (select iam.has_permission('iam.module.view')));
create policy role_assignment_add on iam.role_assignment for insert to geoges_app
  with check ((select iam.has_permission('iam.module.manage'))
              or (select iam.has_permission('wfl.workflow.design'))
              or (is_delegation and delegated_by_user_id = (select core.current_user_id())));
create policy role_assignment_change on iam.role_assignment for update to geoges_app
  using ((select iam.has_permission('iam.module.manage'))
         or (is_delegation and delegated_by_user_id = (select core.current_user_id())))
  with check ((select iam.has_permission('iam.module.manage'))
              or (is_delegation and delegated_by_user_id = (select core.current_user_id())));

create policy user_exception_read on iam.user_exception for select to geoges_app
  using (user_id = (select core.current_user_id()) or (select iam.has_permission('iam.module.view')));
create policy user_exception_add on iam.user_exception for insert to geoges_app
  with check ((select iam.is_owner_layer()));
create policy user_exception_change on iam.user_exception for update to geoges_app
  using ((select iam.is_owner_layer())) with check ((select iam.is_owner_layer()));

create policy user_manager_read on iam.user_manager for select to geoges_app
  using (user_id = (select core.current_user_id())
         or manager_user_id = (select core.current_user_id())
         or (select iam.has_permission('iam.module.view')));
create policy user_manager_add on iam.user_manager for insert to geoges_app
  with check ((select iam.has_permission('iam.module.manage')));
create policy user_manager_change on iam.user_manager for update to geoges_app
  using ((select iam.has_permission('iam.module.manage')))
  with check ((select iam.has_permission('iam.module.manage')));

-- A person's own remembered choices; the choice must be one of their roles today.
create policy user_action_role_choice_read on iam.user_action_role_choice for select
  to geoges_app using (user_id = (select core.current_user_id()));
create policy user_action_role_choice_add on iam.user_action_role_choice for insert
  to geoges_app with check (
    user_id = (select core.current_user_id())
    and iam.holds_role(role_id));
create policy user_action_role_choice_change on iam.user_action_role_choice for update
  to geoges_app using (user_id = (select core.current_user_id()))
  with check (
    user_id = (select core.current_user_id())
    and iam.holds_role(role_id));

revoke all on all tables in schema iam from public;
grant select, insert, update on all tables in schema iam to geoges_app;

revoke all on all functions in schema iam from public;
grant execute on function
  iam.today(), iam.covers(text, uuid[], text, uuid), iam.my_grants(), iam.my_data_classes(),
  iam.is_owner_layer(), iam.has_permission(text), iam.has_company_scope(text),
  iam.scope_ids(text, text), iam.can_see(text, text, text, uuid), iam.holds_role(uuid),
  iam.acting_role_valid(), iam.my_account(), iam.manager_of(uuid, text, uuid),
  iam.active_delegates(uuid, text, uuid), iam.owner_users(), iam.is_active_user(uuid)
  to geoges_app;
