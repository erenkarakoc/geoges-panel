-- 0068 — daily targets (TASK-0123 step 3, REQ-PRJ-011, D-137, D-292 rule 4).
--
-- A site's daily target is the work left divided by the working days left until the end date the
-- targets run to. The end date is the one chosen for the site; with none chosen (or the chosen one
-- not typed) the management target end, else the theoretical end, else the contract end. A day the
-- site's calendar says is not a working day (weekend, full-day holiday) has no target, and the days
-- left count only working days, the day asked about included.
--
-- In this slice the work left is the whole target of the revision valid on the day, for the site's
-- walls; the daily site log (TASK-0127) subtracts approved production in `prj.daily_targets` and
-- the targets of the remaining days follow by themselves, because nothing is stored but the
-- corrections.
--
-- A person who manages the site may correct a line of a day. A correction keeps the calculated
-- value next to the corrected one, with who and why; the calculated value is worked out by the
-- database, never taken from the person. Corrections are never changed: the latest one of a line
-- wins, and one without a value returns the line to its calculation. A past day is not corrected,
-- so a target cannot be lowered after the day it judged (the rule D-292 set for revisions).

-- ---------------------------------------------------------------------------------------------
-- Which end date a site's targets run to
-- ---------------------------------------------------------------------------------------------

alter table sit.site add column target_end_basis text;
alter table sit.site add constraint ck_site__target_end_basis
  check (target_end_basis in ('management', 'theoretical', 'contract'));

comment on column sit.site.target_end_basis is
  'Which of the project''s three ends the daily targets run to (REQ-PRJ-011); null: the default order.';

-- ---------------------------------------------------------------------------------------------
-- Corrections
-- ---------------------------------------------------------------------------------------------

create table prj.daily_target_correction (
  id uuid not null default core.uuid_v7(),
  project_id uuid not null,
  site_id uuid not null,
  target_on date not null,
  measure text not null,
  panel_type_id uuid,
  strip_type_id uuid,
  strip_length_m numeric(6, 3),
  work_item_id uuid,
  /** What the calculation said when the correction was made; written by the database. */
  calculated numeric(14, 3),
  /** The corrected target; null returns the line to its calculation. */
  corrected numeric(14, 3),
  reason text not null,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  constraint pk_daily_target_correction primary key (id),
  constraint fk_daily_target_correction__site foreign key (site_id, project_id)
    references sit.site (id, project_id),
  constraint fk_daily_target_correction__panel_type foreign key (panel_type_id)
    references adm.panel_type (id),
  constraint fk_daily_target_correction__strip_type foreign key (strip_type_id)
    references adm.strip_type (id),
  constraint fk_daily_target_correction__work_item foreign key (work_item_id)
    references adm.catalog_item (id),
  constraint ck_daily_target_correction__measure check (
    (measure in ('panel_cast', 'panel_install') and panel_type_id is not null
       and strip_type_id is null and strip_length_m is null and work_item_id is null)
    or (measure = 'strip_install' and strip_type_id is not null and strip_length_m > 0
       and panel_type_id is null and work_item_id is null)
    or (measure = 'work_item' and work_item_id is not null and panel_type_id is null
       and strip_type_id is null and strip_length_m is null)),
  constraint ck_daily_target_correction__corrected check (corrected is null or corrected >= 0),
  constraint ck_daily_target_correction__reason check (length(btrim(reason)) >= 3)
);

create index ix_daily_target_correction__day on prj.daily_target_correction
  (site_id, target_on, created_at desc);

comment on table prj.daily_target_correction is
  'A corrected daily target (REQ-PRJ-011): the calculated and the corrected value, who and why.';

create trigger append_only_guard before update or delete on prj.daily_target_correction
  for each row execute function aud.guard_append_only();

-- ---------------------------------------------------------------------------------------------
-- The calculation
-- ---------------------------------------------------------------------------------------------

-- What a site's day is measured against: the end date and where it came from, whether the day is
-- a working day, the working days left (the day included) and the revision valid on the day.
-- Runs as the person asking: a site they may not see answers nothing.
create function prj.daily_target_frame(p_site_id uuid, p_on date)
returns table (project_id uuid, chosen_basis text, basis text, end_on date, business_day boolean,
               days_left integer, revision_id uuid)
language sql stable
set search_path = ''
as $$
  select s.project_id, s.target_end_basis, e.basis, e.end_on,
         adm.is_business_day(p_on, s.id),
         case when e.end_on is null or e.end_on < p_on then 0
              else (select count(*)::integer
                      from pg_catalog.generate_series(p_on, e.end_on, interval '1 day') as d
                     where adm.is_business_day(d::date, s.id)) end,
         prj.revision_on(s.project_id, p_on)
    from sit.site s
    join prj.project p on p.id = s.project_id
    left join lateral (
      select b.basis, b.end_on
        from (values
               (0, s.target_end_basis,
                case s.target_end_basis
                  when 'management' then p.management_target_end_on
                  when 'theoretical' then p.theoretical_end_on
                  when 'contract' then p.contract_end_on end),
               (1, 'management', p.management_target_end_on),
               (2, 'theoretical', p.theoretical_end_on),
               (3, 'contract', p.contract_end_on)) as b (rank, basis, end_on)
       where b.end_on is not null
       order by b.rank
       limit 1) e on true
   where s.id = p_site_id
$$;

-- A site's targets of a day, line by line: panels by type (cast and installation), strip metres by
-- type and cut length, other work items. `calculated` is null on a day with no target (not a
-- working day, or the end date passed or missing). Pieces are rounded up so the work finishes by
-- the end date; an area follows its pieces; metres go up to the next ten centimetres.
create function prj.daily_targets(p_site_id uuid, p_on date)
returns table (measure text, panel_type_id uuid, strip_type_id uuid, strip_length_m numeric,
               work_item_id uuid, unit_area_m2 numeric, remaining numeric, calculated numeric,
               corrected numeric, is_corrected boolean, correction_reason text,
               corrected_by_user_id uuid, corrected_at timestamptz)
language sql stable
set search_path = ''
as $$
  with frame as (select * from prj.daily_target_frame(p_site_id, p_on)),
  lines as (
    -- The work left. TASK-0127 subtracts the approved production of the site here.
    select m.measure, t.panel_type_id, null::uuid as strip_type_id, null::numeric as strip_length_m,
           null::uuid as work_item_id, p.area_m2 as unit_area_m2, sum(t.qty) as remaining
      from frame f
      join prj.wall_target t on t.revision_id = f.revision_id and t.kind = 'panel'
      join prj.wall w on w.id = t.wall_id and w.site_id = p_site_id
      join adm.panel_type p on p.id = t.panel_type_id
      cross join (values ('panel_cast'), ('panel_install')) as m (measure)
     group by m.measure, t.panel_type_id, p.area_m2
    union all
    select 'strip_install', null, t.strip_type_id, t.strip_length_m, null, null, sum(t.length_m)
      from frame f
      join prj.wall_target t on t.revision_id = f.revision_id and t.kind = 'strip'
      join prj.wall w on w.id = t.wall_id and w.site_id = p_site_id
     group by t.strip_type_id, t.strip_length_m
    union all
    select 'work_item', null, null, null, t.work_item_id, null, sum(t.qty)
      from frame f
      join prj.wall_target t on t.revision_id = f.revision_id and t.kind = 'work_item'
      join prj.wall w on w.id = t.wall_id and w.site_id = p_site_id
     group by t.work_item_id),
  worked as (
    select l.*,
           case when not f.business_day or f.days_left = 0 then null
                when l.measure in ('panel_cast', 'panel_install')
                  then pg_catalog.ceil(l.remaining / f.days_left)
                when l.measure = 'strip_install'
                  then pg_catalog.ceil(l.remaining * 10 / f.days_left) / 10
                else pg_catalog.round(l.remaining / f.days_left, 2) end as calculated
      from lines l cross join frame f)
  select w.measure, w.panel_type_id, w.strip_type_id, w.strip_length_m, w.work_item_id,
         w.unit_area_m2, w.remaining, w.calculated,
         c.corrected, c.corrected is not null, c.reason, c.created_by_user_id, c.created_at
    from worked w
    left join lateral (
      select c.corrected, c.reason, c.created_by_user_id, c.created_at
        from prj.daily_target_correction c
       where c.site_id = p_site_id and c.target_on = p_on and c.measure = w.measure
         and c.panel_type_id is not distinct from w.panel_type_id
         and c.strip_type_id is not distinct from w.strip_type_id
         and c.strip_length_m is not distinct from w.strip_length_m
         and c.work_item_id is not distinct from w.work_item_id
       order by c.created_at desc, c.id desc
       limit 1) c on true
$$;

-- A correction names a line of the day, on a working day, today or later; the calculated value is
-- the database's, whatever the insert carried.
create function prj.guard_daily_target_correction() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_frame record;
  v_line record;
begin
  if new.target_on < iam.today() then
    raise exception 'a past day''s target is not corrected' using errcode = '23514',
      hint = 'prj.past_day_target';
  end if;
  select * into v_frame from prj.daily_target_frame(new.site_id, new.target_on);
  if not found or v_frame.project_id is distinct from new.project_id then
    raise exception 'no such site' using errcode = '42501', hint = 'prj.site_not_visible';
  end if;
  if not v_frame.business_day then
    raise exception 'a day off has no target' using errcode = '23514',
      hint = 'prj.not_a_business_day';
  end if;
  select t.calculated into v_line
    from prj.daily_targets(new.site_id, new.target_on) t
   where t.measure = new.measure
     and t.panel_type_id is not distinct from new.panel_type_id
     and t.strip_type_id is not distinct from new.strip_type_id
     and t.strip_length_m is not distinct from new.strip_length_m
     and t.work_item_id is not distinct from new.work_item_id;
  if not found then
    raise exception 'the day has no such target' using errcode = '23514',
      hint = 'prj.no_such_target';
  end if;
  new.calculated := v_line.calculated;
  new.created_at := now();
  new.created_by_user_id := core.current_user_id();
  new.created_in_role_id := core.current_role_id();
  return new;
end
$$;

create trigger guard_correction before insert on prj.daily_target_correction
  for each row execute function prj.guard_daily_target_correction();

-- ---------------------------------------------------------------------------------------------
-- Layers, history, security
-- ---------------------------------------------------------------------------------------------

insert into core.table_layer (schema_name, table_name, layer, history, portable, scope_source)
values ('prj', 'daily_target_correction', 'business', 'append_only', false, 'parent');

alter table prj.daily_target_correction enable row level security;

create policy daily_target_correction_read on prj.daily_target_correction for select
  to geoges_app
  using (exists (select from sit.site s where s.id = site_id));
create policy daily_target_correction_add on prj.daily_target_correction for insert
  to geoges_app
  with check (sit.may_manage_site(site_id, project_id));

revoke all on prj.daily_target_correction from public;
grant select, insert on prj.daily_target_correction to geoges_app;
grant select on prj.daily_target_correction to geoges_worker;

revoke all on function prj.daily_target_frame(uuid, date), prj.daily_targets(uuid, date),
  prj.guard_daily_target_correction() from public;
grant execute on function prj.daily_target_frame(uuid, date), prj.daily_targets(uuid, date)
  to geoges_app, geoges_worker;
