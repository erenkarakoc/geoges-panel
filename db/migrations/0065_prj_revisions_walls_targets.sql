-- 0065 — project revisions, walls and their targets (TASK-0123 step 2, REQ-PRJ-006…009, D-136,
-- D-292 rules 1 and 2).
--
-- Targets change only through a revision (PRJ-K3). The technical office opens a draft, which starts
-- as a copy of the last approved revision's walls and targets; it edits the draft and sends it for
-- approval; a flow approves it (REQ-PRJ-009 — the approver is the flow's). An approved revision is
-- valid from the day it was approved, never earlier, so raising a target cannot hide a day's
-- over-casting (D-292 rule 1), and it is never edited again: the next change is the next revision.
--
-- A wall is one thing across revisions — its code, its site and how far it has got — while what a
-- revision says about it (its size, what it should take) belongs to that revision. So `prj.wall` is
-- the wall and `prj.revision_wall` and `prj.wall_target` are a revision's statement about it.
--
-- A wall stands on one of its own project's sites (PRJ-K4): the key that says so is the site's
-- (id, project) pair. The project target is the sum of the walls (PRJ-K2); there is no column to
-- type it into.

-- ---------------------------------------------------------------------------------------------
-- Revisions
-- ---------------------------------------------------------------------------------------------

create table prj.project_revision (
  id uuid not null default core.uuid_v7(),
  project_id uuid not null,
  /** Rev.0 is the first issue of the targets. */
  revision_no integer not null,
  status text not null default 'draft',
  reason text not null,
  based_on_revision_id uuid,
  /** The day it became valid: its approval day in Istanbul (D-292 rule 1). */
  valid_from date,
  submitted_at timestamptz,
  submitted_by_user_id uuid,
  approved_at timestamptz,
  /** Null when the approval came from a flow step (the approval itself names its decider). */
  approved_by_user_id uuid,
  /** Why it came back to draft, when it did. */
  returned_note text,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_project_revision primary key (id),
  constraint fk_project_revision__project foreign key (project_id) references prj.project (id),
  constraint fk_project_revision__based_on foreign key (based_on_revision_id)
    references prj.project_revision (id),
  constraint uq_project_revision__project_no unique (project_id, revision_no),
  constraint uq_project_revision__project unique (id, project_id),
  constraint ck_project_revision__no check (revision_no >= 0),
  constraint ck_project_revision__status check (status in ('draft', 'submitted', 'approved')),
  constraint ck_project_revision__reason check (length(btrim(reason)) >= 3),
  constraint ck_project_revision__approved check ((status = 'approved') = (valid_from is not null))
);

-- One revision is open at a time: a second draft would be a second truth about the targets.
create unique index uq_project_revision__open on prj.project_revision (project_id)
  where status in ('draft', 'submitted');

comment on table prj.project_revision is
  'Project revision (REQ-PRJ-009): carries the targets; valid from its approval day, then frozen.';

-- The revision's life: draft → submitted → approved, or submitted → draft when it is returned or
-- recalled. Only the flow approves (the worker's system authority, D-082); an approved revision is
-- never changed again.
create function prj.guard_revision_status() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'approved' then
    raise exception 'an approved revision is never changed' using errcode = '23514',
      hint = 'prj.revision_frozen';
  end if;
  if new.project_id is distinct from old.project_id or new.revision_no is distinct from old.revision_no
     or new.based_on_revision_id is distinct from old.based_on_revision_id then
    raise exception 'a revision keeps its project and number' using errcode = '23514',
      hint = 'prj.revision_frozen';
  end if;
  if new.status is distinct from old.status then
    if (old.status, new.status) not in (('draft', 'submitted'), ('submitted', 'draft'),
                                        ('submitted', 'approved')) then
      raise exception 'a revision cannot go from % to %', old.status, new.status
        using errcode = '23514', hint = 'prj.revision_transition';
    end if;
    if new.status = 'approved' and current_user = 'geoges_app' then
      raise exception 'a revision is approved by its flow' using errcode = '42501',
        hint = 'prj.revision_approved_by_flow';
    end if;
    if new.status = 'submitted' then
      new.submitted_at := now();
      new.submitted_by_user_id := core.current_user_id();
      new.returned_note := null;
    elsif new.status = 'approved' then
      new.approved_at := now();
      new.valid_from := iam.today();
      new.approved_by_user_id := core.current_user_id();
    else
      new.submitted_at := null;
      new.submitted_by_user_id := null;
    end if;
  end if;
  return new;
end
$$;

create trigger guard_status before update on prj.project_revision
  for each row execute function prj.guard_revision_status();

-- ---------------------------------------------------------------------------------------------
-- Walls
-- ---------------------------------------------------------------------------------------------

create table prj.wall (
  id uuid not null default core.uuid_v7(),
  project_id uuid not null,
  site_id uuid not null,
  code text not null,
  name text not null,
  status text not null default 'not_started',
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_wall primary key (id),
  constraint fk_wall__project foreign key (project_id) references prj.project (id),
  -- PRJ-K4: the site is one of this project's sites.
  constraint fk_wall__site foreign key (site_id, project_id) references sit.site (id, project_id),
  constraint uq_wall__project unique (id, project_id),
  constraint ck_wall__code check (length(btrim(code)) between 1 and 40),
  constraint ck_wall__name check (length(btrim(name)) between 2 and 120),
  constraint ck_wall__status check (status in ('not_started', 'in_progress', 'completed'))
);

create unique index uq_wall__code on prj.wall (project_id, upper(code));
create index ix_wall__site on prj.wall (site_id);

comment on table prj.wall is
  'Wall (REQ-PRJ-006): stands on one of its project''s sites; revisions say its size and targets.';

create function prj.publish_wall_event() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    perform core.publish_event('wall.completed', 'prj', 'prj', 'wall', new.id,
      pg_catalog.jsonb_build_object('id', new.id, 'project_id', new.project_id,
                                    'site_id', new.site_id, 'name', new.name));
  end if;
  return null;
end
$$;

create trigger publish_event after update of status on prj.wall
  for each row execute function prj.publish_wall_event();

-- ---------------------------------------------------------------------------------------------
-- What a revision says about a wall
-- ---------------------------------------------------------------------------------------------

create table prj.revision_wall (
  id uuid not null default core.uuid_v7(),
  revision_id uuid not null,
  project_id uuid not null,
  wall_id uuid not null,
  length_m numeric(9, 2),
  height_m numeric(7, 2),
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_revision_wall primary key (id),
  constraint fk_revision_wall__revision foreign key (revision_id, project_id)
    references prj.project_revision (id, project_id),
  constraint fk_revision_wall__wall foreign key (wall_id, project_id)
    references prj.wall (id, project_id),
  constraint uq_revision_wall__wall unique (revision_id, wall_id),
  constraint ck_revision_wall__size check (
    (length_m is null or length_m > 0) and (height_m is null or height_m > 0))
);

comment on table prj.revision_wall is
  'A wall as one revision describes it (REQ-PRJ-006): its size in that revision.';

create table prj.wall_target (
  id uuid not null default core.uuid_v7(),
  revision_id uuid not null,
  wall_id uuid not null,
  kind text not null,
  panel_type_id uuid,
  strip_type_id uuid,
  /** The cut length a strip target is for (REQ-PRJ-006: "şerit tipi ve boyuna göre"). */
  strip_length_m numeric(6, 3),
  work_item_id uuid,
  /** Pieces for a panel type; the work item's own unit for a work item. */
  qty numeric(12, 3),
  /** Metres for a strip. */
  length_m numeric(12, 3),
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_wall_target primary key (id),
  constraint fk_wall_target__revision_wall foreign key (revision_id, wall_id)
    references prj.revision_wall (revision_id, wall_id) on delete cascade,
  constraint fk_wall_target__panel_type foreign key (panel_type_id) references adm.panel_type (id),
  constraint fk_wall_target__strip_type foreign key (strip_type_id) references adm.strip_type (id),
  constraint fk_wall_target__work_item foreign key (work_item_id) references adm.catalog_item (id),
  constraint ck_wall_target__kind check (
    (kind = 'panel' and panel_type_id is not null and strip_type_id is null
       and work_item_id is null and qty is not null and qty >= 0 and length_m is null)
    or (kind = 'strip' and strip_type_id is not null and strip_length_m > 0
       and panel_type_id is null and work_item_id is null and length_m is not null
       and length_m >= 0 and qty is null)
    or (kind = 'work_item' and work_item_id is not null and panel_type_id is null
       and strip_type_id is null and qty is not null and qty >= 0 and length_m is null))
);

create unique index uq_wall_target__line on prj.wall_target (
  revision_id, wall_id, kind,
  coalesce(panel_type_id, strip_type_id, work_item_id),
  coalesce(strip_length_m, 0));

comment on table prj.wall_target is
  'A revision''s target for a wall (REQ-PRJ-006): panels by type, strip metres by type and length.';

-- Nothing of a revision changes once it has left the draft (D-136). A panel or strip type made
-- for one project is not a target of another (REQ-ADM-005).
create function prj.guard_revision_content() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_revision uuid := case when tg_op = 'DELETE' then old.revision_id else new.revision_id end;
  v_project uuid;
  v_status text;
begin
  select r.status, r.project_id into v_status, v_project
    from prj.project_revision r where r.id = v_revision;
  if v_status is distinct from 'draft' then
    raise exception 'only a draft revision is edited' using errcode = '23514',
      hint = 'prj.revision_frozen';
  end if;
  if tg_op = 'UPDATE' and new.revision_id is distinct from old.revision_id then
    raise exception 'a line keeps its revision' using errcode = '23514', hint = 'prj.revision_frozen';
  end if;
  if tg_table_name = 'wall_target' and tg_op <> 'DELETE' then
    if exists (select from adm.panel_type p where p.id = new.panel_type_id
                and p.project_id is not null and p.project_id <> v_project)
       or exists (select from adm.strip_type s where s.id = new.strip_type_id
                   and s.project_id is not null and s.project_id <> v_project) then
      raise exception 'a type made for another project' using errcode = '23514',
        hint = 'prj.type_of_other_project';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end
$$;

create trigger guard_draft before insert or update or delete on prj.revision_wall
  for each row execute function prj.guard_revision_content();
create trigger guard_draft before insert or update or delete on prj.wall_target
  for each row execute function prj.guard_revision_content();

-- ---------------------------------------------------------------------------------------------
-- Opening a revision, and its events
-- ---------------------------------------------------------------------------------------------

-- A new draft: the next number, based on the last approved revision, carrying its walls and
-- targets. Runs as the person asking, so row level security decides whether they may.
create function prj.start_revision(p_project_id uuid, p_reason text) returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_base uuid;
  v_no integer;
  v_id uuid;
begin
  select r.id into v_base from prj.project_revision r
   where r.project_id = p_project_id and r.status = 'approved'
   order by r.valid_from desc, r.revision_no desc limit 1;
  select coalesce(max(r.revision_no) + 1, 0) into v_no
    from prj.project_revision r where r.project_id = p_project_id;
  insert into prj.project_revision (project_id, revision_no, reason, based_on_revision_id)
  values (p_project_id, v_no, p_reason, v_base)
  returning id into v_id;
  if v_base is not null then
    insert into prj.revision_wall (revision_id, project_id, wall_id, length_m, height_m)
    select v_id, w.project_id, w.wall_id, w.length_m, w.height_m
      from prj.revision_wall w where w.revision_id = v_base;
    insert into prj.wall_target (revision_id, wall_id, kind, panel_type_id, strip_type_id,
                                 strip_length_m, work_item_id, qty, length_m)
    select v_id, t.wall_id, t.kind, t.panel_type_id, t.strip_type_id, t.strip_length_m,
           t.work_item_id, t.qty, t.length_m
      from prj.wall_target t where t.revision_id = v_base;
  end if;
  return v_id;
end
$$;

-- The difference between two revisions, line by line: what a target was and what it becomes.
-- `p_from` null compares with nothing (the first revision).
create function prj.revision_diff(p_from uuid, p_to uuid)
returns table (wall_id uuid, kind text, panel_type_id uuid, strip_type_id uuid,
               strip_length_m numeric, work_item_id uuid, before_amount numeric,
               after_amount numeric)
language sql stable
set search_path = ''
as $$
  with a as (select * from prj.wall_target where revision_id = p_from),
       b as (select * from prj.wall_target where revision_id = p_to)
  select coalesce(b.wall_id, a.wall_id), coalesce(b.kind, a.kind),
         coalesce(b.panel_type_id, a.panel_type_id), coalesce(b.strip_type_id, a.strip_type_id),
         coalesce(b.strip_length_m, a.strip_length_m), coalesce(b.work_item_id, a.work_item_id),
         coalesce(a.qty, a.length_m), coalesce(b.qty, b.length_m)
    from a full join b
      on a.wall_id = b.wall_id and a.kind = b.kind
     and coalesce(a.panel_type_id, a.strip_type_id, a.work_item_id)
         = coalesce(b.panel_type_id, b.strip_type_id, b.work_item_id)
     and coalesce(a.strip_length_m, 0) = coalesce(b.strip_length_m, 0)
   where coalesce(a.qty, a.length_m) is distinct from coalesce(b.qty, b.length_m)
$$;

create function prj.publish_revision_event() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_changes integer;
begin
  if new.status = 'submitted' and old.status = 'draft' then
    perform core.publish_event('project_revision.submitted', 'prj', 'prj', 'project_revision',
      new.id, pg_catalog.jsonb_build_object('id', new.id, 'project_id', new.project_id,
                                            'revision_no', new.revision_no, 'reason', new.reason));
  elsif new.status = 'approved' and old.status = 'submitted' then
    select count(*) into v_changes from prj.revision_diff(new.based_on_revision_id, new.id);
    perform core.publish_event('project_revision.approved', 'prj', 'prj', 'project_revision',
      new.id, pg_catalog.jsonb_build_object('id', new.id, 'project_id', new.project_id,
                                            'revision_no', new.revision_no,
                                            'valid_from', new.valid_from,
                                            'changed_lines', v_changes));
  end if;
  return null;
end
$$;

create trigger publish_event after update of status on prj.project_revision
  for each row execute function prj.publish_revision_event();

-- ---------------------------------------------------------------------------------------------
-- Reading the targets of a day
-- ---------------------------------------------------------------------------------------------

-- The revision valid on a day: approved, valid from that day or earlier, the latest of those.
-- Over-casting and progress are always judged against it (REQ-PRJ-009, D-136).
create function prj.revision_on(p_project_id uuid, p_on date) returns uuid
language sql stable
set search_path = ''
as $$
  select r.id from prj.project_revision r
   where r.project_id = p_project_id and r.status = 'approved' and r.valid_from <= p_on
   order by r.valid_from desc, r.revision_no desc
   limit 1
$$;

-- Panel targets of a project on a day, by panel type, optionally one site's walls only. The
-- project's target is the sum of its walls (PRJ-K2); area comes from the panel type.
create function prj.panel_targets(p_project_id uuid, p_on date, p_site_id uuid default null)
returns table (panel_type_id uuid, qty numeric, area_m2 numeric)
language sql stable
set search_path = ''
as $$
  select t.panel_type_id, sum(t.qty), sum(t.qty * p.area_m2)
    from prj.wall_target t
    join prj.wall w on w.id = t.wall_id
    join adm.panel_type p on p.id = t.panel_type_id
   where t.revision_id = prj.revision_on(p_project_id, p_on) and t.kind = 'panel'
     and (p_site_id is null or w.site_id = p_site_id)
   group by t.panel_type_id
$$;

-- ---------------------------------------------------------------------------------------------
-- Layers, history, security
-- ---------------------------------------------------------------------------------------------

insert into core.table_layer (schema_name, table_name, layer, history, portable, scope_source)
values
  ('prj', 'project_revision', 'business', 'tracked', false, 'own'),
  ('prj', 'wall', 'business', 'tracked', false, 'own'),
  ('prj', 'revision_wall', 'business', 'tracked', false, 'own'),
  ('prj', 'wall_target', 'business', 'tracked', false, 'parent');

create trigger record_history after insert or update on prj.project_revision
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on prj.wall
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on prj.revision_wall
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on prj.wall_target
  for each row execute function aud.capture_history();

alter table prj.project_revision enable row level security;
alter table prj.wall enable row level security;
alter table prj.revision_wall enable row level security;
alter table prj.wall_target enable row level security;

create policy project_revision_read on prj.project_revision for select to geoges_app
  using (prj.may_see_project(project_id, null));
create policy project_revision_add on prj.project_revision for insert to geoges_app
  with check (prj.may_manage_project(project_id));
create policy project_revision_change on prj.project_revision for update to geoges_app
  using (prj.may_manage_project(project_id))
  with check (prj.may_manage_project(project_id));

create policy wall_read on prj.wall for select to geoges_app
  using (prj.may_see_project(project_id, null));
create policy wall_add on prj.wall for insert to geoges_app
  with check (prj.may_manage_project(project_id));
create policy wall_change on prj.wall for update to geoges_app
  using (prj.may_manage_project(project_id)
         or prj.grant_covers(array['sit.module.manage'], project_id, site_id))
  with check (prj.may_manage_project(project_id)
              or prj.grant_covers(array['sit.module.manage'], project_id, site_id));

create policy revision_wall_read on prj.revision_wall for select to geoges_app
  using (prj.may_see_project(project_id, null));
create policy revision_wall_write on prj.revision_wall for all to geoges_app
  using (prj.may_manage_project(project_id))
  with check (prj.may_manage_project(project_id));

create policy wall_target_read on prj.wall_target for select to geoges_app
  using (exists (select from prj.project_revision r where r.id = revision_id));
create policy wall_target_write on prj.wall_target for all to geoges_app
  using (exists (select from prj.project_revision r
                  where r.id = revision_id and prj.may_manage_project(r.project_id)))
  with check (exists (select from prj.project_revision r
                       where r.id = revision_id and prj.may_manage_project(r.project_id)));

revoke all on prj.project_revision, prj.wall, prj.revision_wall, prj.wall_target from public;
grant select, insert, update on prj.project_revision, prj.wall to geoges_app;
grant select, insert, update, delete on prj.revision_wall, prj.wall_target to geoges_app;
grant select on prj.project_revision, prj.wall, prj.revision_wall, prj.wall_target
  to geoges_worker;
-- The flow approves or returns a revision with system authority (D-082).
grant update on prj.project_revision to geoges_worker;

revoke all on function prj.guard_revision_status(), prj.publish_wall_event(),
  prj.guard_revision_content(), prj.start_revision(uuid, text), prj.revision_diff(uuid, uuid),
  prj.publish_revision_event(), prj.revision_on(uuid, date), prj.panel_targets(uuid, date, uuid)
  from public;
grant execute on function prj.start_revision(uuid, text), prj.revision_diff(uuid, uuid),
  prj.revision_on(uuid, date), prj.panel_targets(uuid, date, uuid)
  to geoges_app, geoges_worker;
