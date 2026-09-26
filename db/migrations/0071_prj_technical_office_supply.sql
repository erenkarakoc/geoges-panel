-- 0071 — technical office items and the supply matrix (TASK-0123 step 4, REQ-PRJ-004, REQ-PRJ-005,
-- D-292 rule 5, D-298).
--
-- A technical office item is a piece of the office's work on a project — a drawing, a static
-- calculation, an authority's approval — with its kind (a catalog), the person responsible, a due
-- day, a state and how many times it came back for revision. An item past its due day and not
-- delivered is announced once for that due day (`technical_office_item.overdue`); a flow decides
-- whom it falls to (REQ-PRJ-005: "Akışla ayarlanan"), by default its responsible person. A new due
-- day is a new promise, so it can be announced again.
--
-- The supply matrix says, per project and item (a catalog), who provides it: the client, GEOGES,
-- or the client, deducting it from GEOGES's progress claim. Rows are dated and never changed; a
-- change is a new row valid from its own day, so the cost of a past period is never rewritten
-- (REQ-PRJ-004). Only an item's first row may be dated in the past — the matrix of a project that
-- started before the panel did; after that a row is dated today or later and after the last one.

-- ---------------------------------------------------------------------------------------------
-- Technical office items
-- ---------------------------------------------------------------------------------------------

create table prj.technical_office_item (
  id uuid not null default core.uuid_v7(),
  project_id uuid not null,
  /** Its kind, from the `technical_office_type` catalog. */
  type_item_id uuid not null,
  title text not null,
  assignee_user_id uuid,
  due_on date,
  status text not null default 'open',
  /** How many times it came back to be done again (REQ-PRJ-005, performance: REQ-PRF). */
  revision_count integer not null default 0,
  /** The day it was delivered; set by the database when the state becomes "delivered". */
  delivered_on date,
  /** The due day an overdue announcement was made for; a new due day may be announced again. */
  overdue_announced_for date,
  note text,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_technical_office_item primary key (id),
  constraint fk_technical_office_item__project foreign key (project_id) references prj.project (id),
  constraint fk_technical_office_item__type foreign key (type_item_id)
    references adm.catalog_item (id),
  constraint fk_technical_office_item__assignee foreign key (assignee_user_id)
    references iam.user (id),
  constraint ck_technical_office_item__title check (length(btrim(title)) between 2 and 200),
  constraint ck_technical_office_item__status
    check (status in ('open', 'in_progress', 'delivered', 'cancelled')),
  constraint ck_technical_office_item__revisions check (revision_count >= 0),
  constraint ck_technical_office_item__delivered check ((status = 'delivered') = (delivered_on is not null))
);

create index ix_technical_office_item__project on prj.technical_office_item (project_id);
create index ix_technical_office_item__due on prj.technical_office_item (due_on)
  where status in ('open', 'in_progress');

comment on table prj.technical_office_item is
  'Technical office item (REQ-PRJ-005): kind, responsible person, due day, state, revisions.';

-- The delivery day is the database's: set when the item is delivered, cleared when it is taken
-- back. A project never changes under an item.
create function prj.stamp_technical_office_item() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.project_id is distinct from old.project_id then
    raise exception 'an item keeps its project' using errcode = '23514', hint = 'prj.item_project_fixed';
  end if;
  if new.status = 'delivered' and (tg_op = 'INSERT' or old.status is distinct from 'delivered') then
    new.delivered_on := iam.today();
  elsif new.status <> 'delivered' then
    new.delivered_on := null;
  end if;
  return new;
end
$$;

create trigger stamp_delivery before insert or update on prj.technical_office_item
  for each row execute function prj.stamp_technical_office_item();

-- The daily look (the worker, `prj.technical-office-overdue`): every item past its due day and not
-- delivered or cancelled, not yet announced for that due day, is announced once.
create function prj.announce_overdue_technical_items() returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_item record;
  v_count integer := 0;
begin
  for v_item in
    select t.id, t.project_id, t.title, t.assignee_user_id, t.due_on
      from prj.technical_office_item t
     where t.status in ('open', 'in_progress') and t.due_on < iam.today()
       and t.overdue_announced_for is distinct from t.due_on
     order by t.due_on, t.id
     for update skip locked
  loop
    perform core.publish_event('technical_office_item.overdue', 'prj', 'prj',
      'technical_office_item', v_item.id,
      pg_catalog.jsonb_build_object('id', v_item.id, 'project_id', v_item.project_id,
                                    'title', v_item.title,
                                    'assignee_user_id', v_item.assignee_user_id,
                                    'due_on', v_item.due_on));
    update prj.technical_office_item set overdue_announced_for = v_item.due_on
     where id = v_item.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end
$$;

-- What the "Kurum onayı takibi" flow walks (`prj.authority_approvals`): a project's items of the
-- authority-approval kind that are not delivered or cancelled.
create function prj.authority_approvals(p_project_id uuid)
returns table (id uuid, title text, assignee_user_id uuid, due_on date)
language sql stable security definer
set search_path = ''
as $$
  select t.id, t.title, t.assignee_user_id, t.due_on
    from prj.technical_office_item t
    join adm.catalog_item c on c.id = t.type_item_id
   where t.project_id = p_project_id and c.code = 'authority_approval'
     and t.status in ('open', 'in_progress')
   order by t.due_on nulls last, t.id
$$;

-- ---------------------------------------------------------------------------------------------
-- Supply matrix
-- ---------------------------------------------------------------------------------------------

create table prj.supply_responsibility (
  id uuid not null default core.uuid_v7(),
  project_id uuid not null,
  /** The item, from the `supply_item` catalog. */
  item_id uuid not null,
  responsibility text not null,
  valid_from date not null,
  note text,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  constraint pk_supply_responsibility primary key (id),
  constraint fk_supply_responsibility__project foreign key (project_id) references prj.project (id),
  constraint fk_supply_responsibility__item foreign key (item_id) references adm.catalog_item (id),
  constraint uq_supply_responsibility__day unique (project_id, item_id, valid_from),
  -- The three answers of REQ-PRJ-004: the client provides it, GEOGES provides it, or the client
  -- provides it and deducts it from GEOGES's progress claim.
  constraint ck_supply_responsibility__responsibility
    check (responsibility in ('client', 'geoges', 'client_deducts'))
);

comment on table prj.supply_responsibility is
  'Supply matrix row (REQ-PRJ-004): who provides an item from a day on; dated, never changed.';

create trigger append_only_guard before update or delete on prj.supply_responsibility
  for each row execute function aud.guard_append_only();

-- A new row comes after the item's last one and, unless it is the item's first, is not dated in
-- the past: a past period's cost is never rewritten.
create function prj.guard_supply_responsibility() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_last date;
begin
  select max(s.valid_from) into v_last from prj.supply_responsibility s
   where s.project_id = new.project_id and s.item_id = new.item_id;
  if v_last is not null and (new.valid_from <= v_last or new.valid_from < iam.today()) then
    raise exception 'a change of the matrix is dated today or later, after the last one'
      using errcode = '23514', hint = 'prj.supply_backdated';
  end if;
  return new;
end
$$;

create trigger guard_dates before insert on prj.supply_responsibility
  for each row execute function prj.guard_supply_responsibility();

-- The matrix on a day: for each item, the row valid then (REQ-PRJ-004, REQ-FIN reads it).
create function prj.supply_matrix_on(p_project_id uuid, p_on date)
returns table (item_id uuid, responsibility text, valid_from date, row_id uuid)
language sql stable
set search_path = ''
as $$
  select distinct on (s.item_id) s.item_id, s.responsibility, s.valid_from, s.id
    from prj.supply_responsibility s
   where s.project_id = p_project_id and s.valid_from <= p_on
   order by s.item_id, s.valid_from desc
$$;

-- ---------------------------------------------------------------------------------------------
-- Layers, history, security
-- ---------------------------------------------------------------------------------------------

insert into core.table_layer (schema_name, table_name, layer, history, portable, scope_source)
values
  ('prj', 'technical_office_item', 'business', 'tracked', false, 'own'),
  ('prj', 'supply_responsibility', 'business', 'append_only', false, 'own');

create trigger record_history after insert or update on prj.technical_office_item
  for each row execute function aud.capture_history();

alter table prj.technical_office_item enable row level security;
alter table prj.supply_responsibility enable row level security;

create policy technical_office_item_read on prj.technical_office_item for select to geoges_app
  using (prj.may_see_project(project_id, null) or assignee_user_id = core.current_user_id());
create policy technical_office_item_add on prj.technical_office_item for insert to geoges_app
  with check (prj.may_manage_project(project_id));
-- The office manages its items; the person responsible may move their own item on.
create policy technical_office_item_change on prj.technical_office_item for update to geoges_app
  using (prj.may_manage_project(project_id) or assignee_user_id = core.current_user_id())
  with check (prj.may_manage_project(project_id) or assignee_user_id = core.current_user_id());

create policy supply_responsibility_read on prj.supply_responsibility for select to geoges_app
  using (prj.may_see_project(project_id, null));
create policy supply_responsibility_add on prj.supply_responsibility for insert to geoges_app
  with check (prj.may_manage_project(project_id));

revoke all on prj.technical_office_item, prj.supply_responsibility from public;
grant select, insert, update on prj.technical_office_item to geoges_app;
grant select, insert on prj.supply_responsibility to geoges_app;
grant select on prj.technical_office_item, prj.supply_responsibility to geoges_worker;

revoke all on function prj.stamp_technical_office_item(), prj.announce_overdue_technical_items(),
  prj.authority_approvals(uuid), prj.guard_supply_responsibility(),
  prj.supply_matrix_on(uuid, date) from public;
grant execute on function prj.announce_overdue_technical_items(), prj.authority_approvals(uuid)
  to geoges_worker;
grant execute on function prj.supply_matrix_on(uuid, date) to geoges_app, geoges_worker;
