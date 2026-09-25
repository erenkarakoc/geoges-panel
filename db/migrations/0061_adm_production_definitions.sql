-- 0061 — production definitions: panel types, strip types, consumption recipes
-- (TASK-0121, REQ-ADM-002…007, REQ-SIT-010, REQ-SIT-019, D-291).
--
-- The daily site log's casting, installation, strip and consumption rows are built from these.
-- Three rules are the database's, not a screen's:
--
-- A panel type's area is its width times its height (ADM-K2). Nobody types it.
--
-- A type's code and dimensions never change once it exists. Castings keep the area they were entered
-- with, but a panel type whose width moved under them would make every report that joins back to it
-- disagree with the day it was cast (REQ-ADM-007). A different size is a different type; the old one
-- turns passive.
--
-- A consumption recipe is dated and never updated. A change is a new row from a date, so the
-- suggestion a past day was given is the suggestion it still gets (REQ-ADM-004, REQ-ADM-007).

-- ---------------------------------------------------------------------------------------------
-- Panel types
-- ---------------------------------------------------------------------------------------------

create table adm.panel_type (
  id uuid not null default core.uuid_v7(),
  code text not null,
  name text not null,
  width_m numeric(6, 3) not null,
  height_m numeric(6, 3) not null,
  area_m2 numeric(9, 4) generated always as (round(width_m * height_m, 4)) stored,
  /**
   * The neighbour suggestion of REQ-SIT-019 walks one step down or up, then two, within a series.
   * A single "neighbour" pointer could not say "one below and one above"; a series and a step can.
   */
  series text,
  step integer,
  -- Project-only definition (REQ-ADM-005). Not a foreign key: projects are business data (D-260).
  project_id uuid,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_panel_type primary key (id),
  constraint ck_panel_type__code check (length(btrim(code)) between 1 and 40),
  constraint ck_panel_type__name check (length(btrim(name)) > 0),
  constraint ck_panel_type__size check (width_m > 0 and height_m > 0),
  constraint ck_panel_type__status check (status in ('active', 'passive')),
  constraint ck_panel_type__series check ((series is null) = (step is null))
);

-- One code per project, or company-wide; a passive type keeps its code so history still reads.
create unique index uq_panel_type__code on adm.panel_type
  (coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid), code);
-- Two active types cannot stand on the same step of the same series.
create unique index uq_panel_type__series_step on adm.panel_type
  (coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid), series, step)
  where status = 'active' and series is not null;

comment on table adm.panel_type is
  'Panel type (REQ-ADM-002); area from width and height, code and size fixed once created.';

-- ---------------------------------------------------------------------------------------------
-- Strip types
-- ---------------------------------------------------------------------------------------------

create table adm.strip_type (
  id uuid not null default core.uuid_v7(),
  code text not null,
  name text not null,
  width_mm numeric(6, 1) not null,
  thickness_mm numeric(5, 2) not null,
  hole_count integer not null default 0,
  /** The lengths a strip comes in; installation offers only these (REQ-ADM-003). */
  standard_lengths_m numeric(6, 3)[] not null default '{}',
  project_id uuid,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_strip_type primary key (id),
  constraint ck_strip_type__code check (length(btrim(code)) between 1 and 40),
  constraint ck_strip_type__name check (length(btrim(name)) > 0),
  constraint ck_strip_type__section check (width_mm > 0 and thickness_mm > 0 and hole_count >= 0),
  constraint ck_strip_type__lengths check (
    cardinality(standard_lengths_m) = 0 or 0 < all (standard_lengths_m)),
  constraint ck_strip_type__status check (status in ('active', 'passive'))
);

create unique index uq_strip_type__code on adm.strip_type
  (coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid), code);

comment on table adm.strip_type is
  'Steel strip type (REQ-ADM-003); code and section fixed once created.';

-- ---------------------------------------------------------------------------------------------
-- The fixed parts of a type
-- ---------------------------------------------------------------------------------------------

/**
 * Refuses a change to what a type *is*; its name and status may still move. One function per table:
 * PL/pgSQL resolves a row's fields per table, so a shared function naming both tables' columns fails
 * on whichever table it is not looking at.
 */
create function adm.guard_panel_type_identity() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.code is distinct from old.code
     or new.width_m is distinct from old.width_m
     or new.height_m is distinct from old.height_m
     or new.project_id is distinct from old.project_id then
    raise exception 'a panel type''s code and size do not change; add a new type instead'
      using errcode = 'P0001', hint = 'adm.type_identity_fixed';
  end if;
  new.updated_at := pg_catalog.now();
  new.updated_by_user_id := core.current_user_id();
  return new;
end
$$;

create function adm.guard_strip_type_identity() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.code is distinct from old.code
     or new.width_mm is distinct from old.width_mm
     or new.thickness_mm is distinct from old.thickness_mm
     or new.hole_count is distinct from old.hole_count
     or new.project_id is distinct from old.project_id then
    raise exception 'a strip type''s code and section do not change; add a new type instead'
      using errcode = 'P0001', hint = 'adm.type_identity_fixed';
  end if;
  new.updated_at := pg_catalog.now();
  new.updated_by_user_id := core.current_user_id();
  return new;
end
$$;

create trigger guard_identity before update on adm.panel_type
  for each row execute function adm.guard_panel_type_identity();
create trigger guard_identity before update on adm.strip_type
  for each row execute function adm.guard_strip_type_identity();

-- ---------------------------------------------------------------------------------------------
-- Consumption recipes
-- ---------------------------------------------------------------------------------------------

create table adm.consumption_recipe (
  id uuid not null default core.uuid_v7(),
  /** What is being produced: casting, installation or strip installation. */
  output_kind text not null,
  /** The type the line is for; empty means every type of that kind. */
  panel_type_id uuid references adm.panel_type (id),
  strip_type_id uuid references adm.strip_type (id),
  /** What one unit of output is: a piece, a square metre or a metre. */
  per_unit text not null,
  /** The consumable, from the consumables catalog (REQ-ADM-004). */
  material_item_id uuid not null references adm.catalog_item (id),
  qty_per_unit numeric(12, 4) not null,
  valid_from date not null,
  project_id uuid,
  reason text not null,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  constraint pk_consumption_recipe primary key (id),
  constraint ck_consumption_recipe__output
    check (output_kind in ('casting', 'installation', 'strip_installation')),
  constraint ck_consumption_recipe__target check (
    case output_kind
      when 'strip_installation' then panel_type_id is null
      else strip_type_id is null
    end),
  constraint ck_consumption_recipe__per_unit check (
    case output_kind
      when 'strip_installation' then per_unit in ('m', 'piece')
      else per_unit in ('piece', 'm2')
    end),
  -- Zero is a real answer: from this date the material is no longer used for this output.
  constraint ck_consumption_recipe__qty check (qty_per_unit >= 0),
  constraint ck_consumption_recipe__reason check (length(btrim(reason)) > 0)
);

create index ix_consumption_recipe__lookup on adm.consumption_recipe
  (output_kind, material_item_id, valid_from desc);

comment on table adm.consumption_recipe is
  'Dated consumption recipe line (REQ-ADM-004); never updated, a change is a new row.';

/** A recipe line is never changed or removed; a change is a new row from a date (ADM-K1). */
create function adm.guard_recipe_append_only() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'a recipe line is not changed; add a new line from a date instead'
    using errcode = 'P0001', hint = 'adm.recipe_append_only';
end
$$;

create trigger append_only before update or delete on adm.consumption_recipe
  for each row execute function adm.guard_recipe_append_only();

/**
 * The recipe a day's production is suggested from (REQ-SIT-029): for each material, the most specific
 * line valid on that day. A project's own line comes before the company's, a type's own line before
 * "every type", and among equals the latest valid date wins.
 */
create function adm.recipe_lines(p_output_kind text, p_panel_type_id uuid, p_strip_type_id uuid,
                                 p_project_id uuid, p_on date)
returns table (material_item_id uuid, per_unit text, qty_per_unit numeric, recipe_id uuid)
language sql stable
set search_path = ''
as $$
  select distinct on (r.material_item_id)
         r.material_item_id, r.per_unit, r.qty_per_unit, r.id
    from adm.consumption_recipe r
   where r.output_kind = p_output_kind
     and r.valid_from <= p_on
     and (r.project_id is null or r.project_id = p_project_id)
     and (r.panel_type_id is null or r.panel_type_id = p_panel_type_id)
     and (r.strip_type_id is null or r.strip_type_id = p_strip_type_id)
   order by r.material_item_id,
            (r.project_id is not null) desc,
            (r.panel_type_id is not null or r.strip_type_id is not null) desc,
            r.valid_from desc,
            r.created_at desc
$$;

comment on function adm.recipe_lines(text, uuid, uuid, uuid, date) is
  'The recipe lines that apply to one output on one day (REQ-ADM-004, REQ-SIT-029).';

/**
 * The neighbours of a panel type for the over-casting suggestion (REQ-SIT-019): the same series,
 * one step away first, then two. Only a suggestion; a technical person decides.
 */
create function adm.panel_neighbours(p_panel_type_id uuid)
returns table (panel_type_id uuid, distance integer)
language sql stable
set search_path = ''
as $$
  select n.id, abs(n.step - p.step)
    from adm.panel_type p
    join adm.panel_type n
      on n.series = p.series
     and n.id <> p.id
     and n.status = 'active'
     and n.project_id is not distinct from p.project_id
   where p.id = p_panel_type_id
     and abs(n.step - p.step) between 1 and 2
   order by abs(n.step - p.step), n.step
$$;

comment on function adm.panel_neighbours(uuid) is
  'Panel types one or two steps away in the same series (REQ-SIT-019).';

-- ---------------------------------------------------------------------------------------------
-- Layers, history, security
-- ---------------------------------------------------------------------------------------------

insert into core.table_layer (schema_name, table_name, layer, history, portable, scope_source)
values
  ('adm', 'panel_type', 'config', 'tracked', true, 'company'),
  ('adm', 'strip_type', 'config', 'tracked', true, 'company'),
  ('adm', 'consumption_recipe', 'config', 'tracked', true, 'company');

create trigger record_history after insert or update on adm.panel_type
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on adm.strip_type
  for each row execute function aud.capture_history();
create trigger record_history after insert on adm.consumption_recipe
  for each row execute function aud.capture_history();

alter table adm.panel_type enable row level security;
alter table adm.strip_type enable row level security;
alter table adm.consumption_recipe enable row level security;

-- Definitions are read by everyone signed in; changed by holders of adm.module.manage (as 0007).
create policy panel_type_read on adm.panel_type for select to geoges_app
  using ((select core.current_user_id()) is not null);
create policy panel_type_add on adm.panel_type for insert to geoges_app
  with check ((select iam.has_permission('adm.module.manage')));
create policy panel_type_change on adm.panel_type for update to geoges_app
  using ((select iam.has_permission('adm.module.manage')))
  with check ((select iam.has_permission('adm.module.manage')));

create policy strip_type_read on adm.strip_type for select to geoges_app
  using ((select core.current_user_id()) is not null);
create policy strip_type_add on adm.strip_type for insert to geoges_app
  with check ((select iam.has_permission('adm.module.manage')));
create policy strip_type_change on adm.strip_type for update to geoges_app
  using ((select iam.has_permission('adm.module.manage')))
  with check ((select iam.has_permission('adm.module.manage')));

create policy consumption_recipe_read on adm.consumption_recipe for select to geoges_app
  using ((select core.current_user_id()) is not null);
create policy consumption_recipe_add on adm.consumption_recipe for insert to geoges_app
  with check ((select iam.has_permission('adm.module.manage')));

revoke all on adm.panel_type, adm.strip_type, adm.consumption_recipe from public;
grant select, insert, update on adm.panel_type, adm.strip_type to geoges_app;
grant select, insert on adm.consumption_recipe to geoges_app;
grant select on adm.panel_type, adm.strip_type, adm.consumption_recipe to geoges_worker;

revoke all on function adm.recipe_lines(text, uuid, uuid, uuid, date),
  adm.panel_neighbours(uuid) from public;
grant execute on function adm.recipe_lines(text, uuid, uuid, uuid, date),
  adm.panel_neighbours(uuid) to geoges_app, geoges_worker;
