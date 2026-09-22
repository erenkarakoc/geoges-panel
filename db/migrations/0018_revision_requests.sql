-- 0018 — revision requests (TASK-0109, REQ-AUD-007…010, D-141, D-265).
--
-- An approved record is locked by the module that owns it; the only way to change it is a
-- request: which field, from what, to what, and why. The request goes to an approver, who sees
-- the old and the new value side by side and either approves it or refuses it with a reason
-- (AUD-K4). AUD never writes another module's tables: an approved request is applied by the
-- owning module, which writes the correction as its own movement and links it here (AUD-K3).
--
-- Who approves is a flow setting from Phase 08 (REQ-AUD-007/008); until then the register's
-- default decides: the requester's manager in the record's place, otherwise the owner layer.

-- ---------------------------------------------------------------------------------------------
-- Register: which record types may be revised at all
-- ---------------------------------------------------------------------------------------------

create table aud.revisable_record (
  id uuid not null default core.uuid_v7(),
  module text not null,
  record_schema text not null,
  record_table text not null,
  label text not null,
  revisable_fields text[] not null default '{}',
  approver text not null default 'manager',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_revisable_record primary key (id),
  constraint uq_revisable_record__record_schema_record_table unique (record_schema, record_table),
  constraint ck_revisable_record__module check (module ~ '^[a-z]{2,3}$'),
  constraint ck_revisable_record__record check (
    record_schema ~ '^[a-z]{2,3}$' and record_table ~ '^[a-z][a-z0-9_]*$'),
  constraint ck_revisable_record__label check (length(btrim(label)) > 0),
  constraint ck_revisable_record__fields check (
    cardinality(revisable_fields) > 0 and array_position(revisable_fields, null) is null),
  constraint ck_revisable_record__approver check (approver in ('manager', 'owner'))
);

comment on table aud.revisable_record is
  'Record types whose approved rows may be changed through a request, and who decides (D-265).';

-- ---------------------------------------------------------------------------------------------
-- The request and what an approved one produced
-- ---------------------------------------------------------------------------------------------

create table aud.revision_request (
  id uuid not null default core.uuid_v7(),
  record_schema text not null,
  record_table text not null,
  record_id uuid not null,
  module text not null,
  site_id uuid,
  project_id uuid,
  data_class text not null default 'internal',
  changes jsonb not null,
  reason text not null,
  status text not null default 'pending',
  requested_by_user_id uuid not null default core.current_user_id(),
  requested_in_role_id uuid default core.current_role_id(),
  decided_by_user_id uuid,
  decided_at timestamptz,
  decision_reason text,
  applied_at timestamptz,
  apply_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_revision_request primary key (id),
  constraint fk_revision_request__requested_by_user foreign key (requested_by_user_id)
    references iam.user (id),
  constraint fk_revision_request__decided_by_user foreign key (decided_by_user_id)
    references iam.user (id),
  constraint ck_revision_request__record check (
    record_schema ~ '^[a-z]{2,3}$' and record_table ~ '^[a-z][a-z0-9_]*$'),
  constraint ck_revision_request__data_class
    check (data_class in ('general', 'internal', 'commercial', 'sensitive')),
  constraint ck_revision_request__changes check (
    jsonb_typeof(changes) = 'array' and jsonb_array_length(changes) > 0),
  constraint ck_revision_request__reason check (length(btrim(reason)) > 0),
  constraint ck_revision_request__status
    check (status in ('pending', 'approved', 'rejected', 'stale')),
  constraint ck_revision_request__decision check (
    (status = 'pending') = (decided_at is null)
    and (decided_at is null) = (decided_by_user_id is null)
    -- A refusal always says why (AUD-K4, REQ-WFL-015).
    and (status <> 'rejected' or length(btrim(coalesce(decision_reason, ''))) > 0)),
  constraint ck_revision_request__applied check (status = 'approved' or applied_at is null)
);
create index ix_revision_request__record on aud.revision_request
  (record_schema, record_table, record_id);
create index ix_revision_request__requested_by_user_id on aud.revision_request
  (requested_by_user_id);
create index ix_revision_request__pending on aud.revision_request (created_at)
  where status = 'pending';
-- One open request per record: two people must not change the same row in two directions.
create unique index uq_revision_request__open_record on aud.revision_request
  (record_schema, record_table, record_id) where status = 'pending';

comment on table aud.revision_request is
  'A change asked for on a locked record: fields with their old and new value, and a reason.';

-- What the owning module wrote to carry an approved revision out (REQ-AUD-009).
create table aud.revision_effect (
  id uuid not null default core.uuid_v7(),
  revision_request_id uuid not null,
  effect_schema text not null,
  effect_table text not null,
  effect_id uuid,
  note text,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  constraint pk_revision_effect primary key (id),
  constraint fk_revision_effect__revision_request foreign key (revision_request_id)
    references aud.revision_request (id),
  constraint ck_revision_effect__effect check (
    effect_schema ~ '^[a-z]{2,3}$' and effect_table ~ '^[a-z][a-z0-9_]*$')
);
create index ix_revision_effect__revision_request_id on aud.revision_effect (revision_request_id);

comment on table aud.revision_effect is
  'The correction an approved revision produced, linked to it; earlier values stay (AUD-K3).';

insert into core.table_layer (schema_name, table_name, layer, portable, history) values
  ('aud', 'revisable_record', 'config', true, 'tracked'),
  ('aud', 'revision_request', 'business', false, 'tracked'),
  ('aud', 'revision_effect', 'business', false, 'none');

-- ---------------------------------------------------------------------------------------------
-- Who may ask, who decides, who sees
-- ---------------------------------------------------------------------------------------------

-- Whether this record type may be revised today, and with which fields.
create function aud.revisable(p_schema text, p_table text)
returns table (module text, label text, revisable_fields text[], approver text)
language sql stable security definer
set search_path = ''
as $$
  select r.module, r.label, r.revisable_fields, r.approver
    from aud.revisable_record r
   where r.record_schema = p_schema and r.record_table = p_table and r.is_active
$$;

-- Whether the signed-in person may ask for a change on a record of this module, place, owner and
-- data class: the same rule as attaching a document (DOC-K2) — the module's manage right over the
-- place, or its `own` right for their own record, plus the right to see the data class.
create function aud.may_request(p_module text, p_site_id uuid, p_project_id uuid,
                                p_owner uuid, p_data_class text) returns boolean
language sql stable security definer
set search_path = ''
as $$
  with place as (
    select case when p_site_id is not null then 'site'
                when p_project_id is not null then 'project' else 'company' end as q_type,
           coalesce(p_site_id, p_project_id) as q_id
  )
  select exists (
      select from iam.my_grants() g, place p
       where (g.permission_code = p_module || '.module.manage'
              or (g.permission_code = p_module || '.module.own'
                  and p_owner = core.current_user_id()))
         and iam.covers(g.scope_type, g.scope_ids, p.q_type, p.q_id))
     and (p_data_class in ('general', 'internal')
          or (select iam.can_see(p_module, p_data_class, p.q_type, p.q_id) from place p))
$$;

-- Who decides a request (D-265): the requester's manager in the record's place, otherwise the
-- owner layer; never the requester. A register row may send a record type to the owner layer
-- directly. Phase 08's escalation flow replaces this.
create function aud.revision_approvers(p_request aud.revision_request) returns setof uuid
language plpgsql stable security definer
set search_path = ''
as $$
declare
  wants text;
  found uuid[];
begin
  select r.approver into wants from aud.revisable_record r
   where r.record_schema = p_request.record_schema and r.record_table = p_request.record_table;
  if coalesce(wants, 'manager') = 'manager' then
    select pg_catalog.array_agg(distinct m) into found
      from iam.manager_of(p_request.requested_by_user_id,
             case when p_request.site_id is not null then 'site'
                  when p_request.project_id is not null then 'project' else 'company' end,
             coalesce(p_request.site_id, p_request.project_id)) as m
     where m <> p_request.requested_by_user_id;
  end if;
  if found is null then
    select pg_catalog.array_agg(distinct o) into found
      from iam.owner_users() as o where o <> p_request.requested_by_user_id;
  end if;
  return query select pg_catalog.unnest(coalesce(found, '{}'::uuid[]));
end
$$;

create function aud.can_decide_revision(p_request aud.revision_request) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select core.current_user_id() is not null
     and core.current_user_id() <> p_request.requested_by_user_id
     and core.current_user_id() in (select aud.revision_approvers(p_request))
$$;

-- The requester, the approvers and the owner layer see a request; a commercial or sensitive
-- record is shown only to those who may see that class (AUD-K2).
create function aud.can_see_revision(p_request aud.revision_request) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select (p_request.requested_by_user_id = core.current_user_id()
          or iam.is_owner_layer()
          or aud.can_decide_revision(p_request))
     and (p_request.data_class in ('general', 'internal')
          or iam.can_see(p_request.module, p_request.data_class,
                case when p_request.site_id is not null then 'site'
                     when p_request.project_id is not null then 'project' else 'company' end,
                coalesce(p_request.site_id, p_request.project_id)))
$$;

-- ---------------------------------------------------------------------------------------------
-- Guards
-- ---------------------------------------------------------------------------------------------

-- Nothing is deleted, and a decided request never changes its record, fields or decision.
create function aud.guard_revision_request() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if pg_catalog.current_setting('aud.reset_purge', true) = 'on'
       and session_user::text <> 'geoges_app' then
      return old;
    end if;
    raise exception 'a revision request is never deleted' using errcode = 'P0001',
      hint = 'aud.no_delete';
  end if;
  if (new.record_schema, new.record_table, new.record_id, new.changes, new.reason,
      new.requested_by_user_id)
     is distinct from
     (old.record_schema, old.record_table, old.record_id, old.changes, old.reason,
      old.requested_by_user_id) then
    raise exception 'a revision request keeps its record, its changes and its reason'
      using errcode = 'P0001', hint = 'aud.revision_fixed';
  end if;
  if old.status <> 'pending' and new.status = 'pending' then
    raise exception 'a decided revision request does not go back to pending'
      using errcode = 'P0001', hint = 'aud.revision_decided';
  end if;
  return new;
end
$$;

create trigger revision_request_guard before update or delete on aud.revision_request
  for each row execute function aud.guard_revision_request();
-- The request keeps its own words for who opened it (`requested_by_*`), so it carries no
-- `created_by_user_id` and stamps its updates itself instead of using IAM's shared trigger.
create function aud.stamp_revision_update() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := old.created_at;
  new.requested_by_user_id := old.requested_by_user_id;
  new.requested_in_role_id := old.requested_in_role_id;
  new.updated_at := pg_catalog.now();
  new.updated_by_user_id := core.current_user_id();
  return new;
end
$$;

create trigger revision_request_stamp before update on aud.revision_request
  for each row execute function aud.stamp_revision_update();
create trigger record_history after insert or update on aud.revision_request
  for each row execute function aud.capture_history();
create trigger revisable_record_stamp before update on aud.revisable_record
  for each row execute function iam.stamp_update();
create trigger record_history after insert or update on aud.revisable_record
  for each row execute function aud.capture_history();

-- ---------------------------------------------------------------------------------------------
-- Asking, deciding, applying
-- ---------------------------------------------------------------------------------------------

-- Asks for a change on a locked record. The caller's module says where the record lives and what
-- it holds today; the fields must be ones the register opened. Returns the new request.
create function aud.submit_revision(p_schema text, p_table text, p_record_id uuid,
                                    p_changes jsonb, p_reason text,
                                    p_site_id uuid default null, p_project_id uuid default null,
                                    p_owner_user_id uuid default null,
                                    p_data_class text default 'internal') returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  reg record;
  new_id uuid;
  field text;
  approvers uuid[];
  request aud.revision_request;
begin
  select * into reg from aud.revisable(p_schema, p_table);
  if reg.module is null then
    raise exception 'this record type is not open to revision requests' using errcode = 'P0001',
      hint = 'aud.not_revisable';
  end if;
  if not aud.may_request(reg.module, p_site_id, p_project_id, p_owner_user_id, p_data_class) then
    raise exception 'not allowed to ask for a change on this record' using errcode = '42501',
      hint = 'aud.may_not_request';
  end if;
  if jsonb_typeof(p_changes) <> 'array' or jsonb_array_length(p_changes) = 0 then
    raise exception 'a request names at least one field' using errcode = 'P0001',
      hint = 'aud.no_changes';
  end if;
  for field in select c ->> 'field' from jsonb_array_elements(p_changes) as c loop
    if field is null or not (field = any (reg.revisable_fields)) then
      raise exception 'this field is not open to revision: %', coalesce(field, '(boş)')
        using errcode = 'P0001', hint = 'aud.field_not_revisable';
    end if;
  end loop;
  if exists (select from aud.revision_request r
              where r.record_schema = p_schema and r.record_table = p_table
                and r.record_id = p_record_id and r.status = 'pending') then
    raise exception 'this record already waits for a decision' using errcode = 'P0001',
      hint = 'aud.revision_open';
  end if;

  insert into aud.revision_request (record_schema, record_table, record_id, module, site_id,
                                    project_id, data_class, changes, reason)
  values (p_schema, p_table, p_record_id, reg.module, p_site_id, p_project_id, p_data_class,
          p_changes, pg_catalog.btrim(p_reason))
  returning * into request;
  new_id := request.id;

  select pg_catalog.array_agg(a) into approvers from aud.revision_approvers(request) as a;
  perform core.publish_event('revision_request.submitted', 'aud', 'aud', 'revision_request',
    new_id, pg_catalog.jsonb_build_object(
      'revision_request_id', new_id, 'record_schema', p_schema, 'record_table', p_table,
      'record_id', p_record_id, 'label', reg.label,
      'requested_by_user_id', request.requested_by_user_id,
      'approver_user_ids', pg_catalog.to_jsonb(coalesce(approvers, '{}'::uuid[]))));
  perform aud.record_event('revision_request.submitted', p_schema, p_table, p_record_id,
    pg_catalog.jsonb_build_object('revision_request_id', new_id));
  return new_id;
end
$$;

-- Approves or refuses a request. A refusal without a reason is refused itself (AUD-K4). An
-- approval only says "yes": the owning module applies it and reports back below.
create function aud.decide_revision(p_id uuid, p_approve boolean, p_reason text default null)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  request aud.revision_request;
  -- Not called `reason`: the request itself has a column of that name (ambiguous reference).
  given_reason text := nullif(pg_catalog.btrim(coalesce(p_reason, '')), '');
begin
  select * into request from aud.revision_request where id = p_id for update;
  if request.id is null or not aud.can_see_revision(request) then
    raise exception 'no such revision request' using errcode = '42501', hint = 'aud.not_found';
  end if;
  if not aud.can_decide_revision(request) then
    raise exception 'this request is not yours to decide' using errcode = '42501',
      hint = 'aud.not_approver';
  end if;
  if request.status <> 'pending' then
    return request.status;
  end if;
  if not p_approve and given_reason is null then
    raise exception 'a refusal says why' using errcode = 'P0001', hint = 'aud.reason_required';
  end if;
  perform pg_catalog.set_config('app.change_reason',
                                coalesce(given_reason, 'revizyon onaylandı'), true);
  update aud.revision_request
     set status = case when p_approve then 'approved' else 'rejected' end,
         decided_by_user_id = core.current_user_id(), decided_at = pg_catalog.now(),
         decision_reason = given_reason
   where id = p_id;
  perform core.publish_event(
    case when p_approve then 'revision_request.approved' else 'revision_request.rejected' end,
    'aud', 'aud', 'revision_request', p_id,
    pg_catalog.jsonb_build_object('revision_request_id', p_id,
      'record_schema', request.record_schema, 'record_table', request.record_table,
      'record_id', request.record_id, 'requested_by_user_id', request.requested_by_user_id,
      'decided_by_user_id', core.current_user_id()));
  perform aud.record_event(
    case when p_approve then 'revision_request.approved' else 'revision_request.rejected' end,
    request.record_schema, request.record_table, request.record_id,
    pg_catalog.jsonb_build_object('revision_request_id', p_id));
  return case when p_approve then 'approved' else 'rejected' end;
end
$$;

-- The owning module reports that it carried the change out, or that the record had moved on in
-- the meantime, in which case the request is stale and has to be made again (D-265).
create function aud.mark_revision_applied(p_id uuid, p_note text default null,
                                          p_done boolean default true) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  -- `p_done = false` keeps the decision but records why the change could not be written yet, so
  -- the screen says "onaylandı, uygulanamadı" instead of claiming it was done.
  update aud.revision_request
     set applied_at = case when p_done then pg_catalog.now() end,
         apply_note = pg_catalog.left(p_note, 500)
   where id = p_id and status = 'approved' and applied_at is null;
end
$$;

create function aud.mark_revision_stale(p_id uuid, p_note text) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update aud.revision_request
     set status = 'stale', apply_note = pg_catalog.left(p_note, 500)
   where id = p_id and status = 'approved' and applied_at is null;
  perform core.publish_event('revision_request.rejected', 'aud', 'aud', 'revision_request', p_id,
    pg_catalog.jsonb_build_object('revision_request_id', p_id, 'stale', true));
end
$$;

-- The correction the module wrote for an approved revision (REQ-AUD-009).
create function aud.record_revision_effect(p_id uuid, p_schema text, p_table text,
                                           p_effect_id uuid default null,
                                           p_note text default null) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if not exists (select from aud.revision_request r where r.id = p_id and r.status = 'approved') then
    raise exception 'effects belong to an approved revision' using errcode = 'P0001',
      hint = 'aud.revision_not_approved';
  end if;
  insert into aud.revision_effect (revision_request_id, effect_schema, effect_table, effect_id,
                                   note)
  values (p_id, p_schema, p_table, p_effect_id, pg_catalog.left(p_note, 500))
  returning id into new_id;
  return new_id;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Reading (SCR-192 and the record's own screen)
-- ---------------------------------------------------------------------------------------------

-- Requests the signed-in person may see: `pending` for the approval screen, `mine` for their own,
-- `record` for one record's history, `all` for everything they may see.
create function aud.revision_page(p_view text default 'pending', p_schema text default null,
                                  p_table text default null, p_record_id uuid default null,
                                  p_limit integer default 100, p_request_id uuid default null)
returns table (id uuid, record_schema text, record_table text, record_id uuid, module text,
               label text, changes jsonb, reason text, status text,
               requested_by_user_id uuid, requested_by_name text, created_at timestamptz,
               decided_by_user_id uuid, decided_by_name text, decided_at timestamptz,
               decision_reason text, applied_at timestamptz, apply_note text, can_decide boolean)
language sql stable security definer
set search_path = ''
as $$
  select r.id, r.record_schema, r.record_table, r.record_id, r.module,
         coalesce(reg.label, r.record_table), r.changes, r.reason, r.status,
         r.requested_by_user_id, u.display_name, r.created_at,
         r.decided_by_user_id, d.display_name, r.decided_at, r.decision_reason,
         r.applied_at, r.apply_note, aud.can_decide_revision(r)
    from aud.revision_request r
    join iam.user u on u.id = r.requested_by_user_id
    left join iam.user d on d.id = r.decided_by_user_id
    left join aud.revisable_record reg on reg.record_schema = r.record_schema
                                      and reg.record_table = r.record_table
   where aud.can_see_revision(r)
     and case p_view
           when 'pending' then r.status = 'pending'
           when 'mine' then r.requested_by_user_id = core.current_user_id()
           when 'record' then r.record_schema = p_schema and r.record_table = p_table
                              and r.record_id = p_record_id
           when 'all' then true
           when 'one' then r.id = p_request_id
           else false end
   order by case when r.status = 'pending' then 0 else 1 end, r.created_at desc
   limit least(coalesce(p_limit, 100), 500)
$$;

-- ---------------------------------------------------------------------------------------------
-- Policies and privileges
-- ---------------------------------------------------------------------------------------------

alter table aud.revisable_record enable row level security;
alter table aud.revision_request enable row level security;
alter table aud.revision_effect enable row level security;

-- The register is read by everyone signed in (a screen must know whether to show the button) and
-- changed only with `adm.module.manage`, like every other definition.
create policy revisable_record_read on aud.revisable_record for select to geoges_app
  using ((select core.current_user_id()) is not null);
create policy revisable_record_add on aud.revisable_record for insert to geoges_app
  with check ((select iam.has_permission('adm.module.manage')));
create policy revisable_record_change on aud.revisable_record for update to geoges_app
  using ((select iam.has_permission('adm.module.manage')));

create policy revision_request_read on aud.revision_request for select to geoges_app
  using (aud.can_see_revision(revision_request));
create policy revision_effect_read on aud.revision_effect for select to geoges_app
  using (exists (select from aud.revision_request r where r.id = revision_request_id));

revoke all on aud.revisable_record, aud.revision_request, aud.revision_effect from public;
grant select, insert, update on aud.revisable_record to geoges_app;
grant select on aud.revision_request, aud.revision_effect to geoges_app;
grant select on aud.revision_request, aud.revision_effect to geoges_worker;

revoke all on function aud.revisable(text, text), aud.may_request(text, uuid, uuid, uuid, text),
  aud.revision_approvers(aud.revision_request), aud.can_decide_revision(aud.revision_request),
  aud.can_see_revision(aud.revision_request), aud.guard_revision_request(),
  aud.submit_revision(text, text, uuid, jsonb, text, uuid, uuid, uuid, text),
  aud.decide_revision(uuid, boolean, text), aud.mark_revision_applied(uuid, text, boolean),
  aud.mark_revision_stale(uuid, text), aud.record_revision_effect(uuid, text, text, uuid, text),
  aud.revision_page(text, text, text, uuid, integer, uuid) from public;
grant execute on function aud.revisable(text, text),
  aud.can_decide_revision(aud.revision_request), aud.can_see_revision(aud.revision_request),
  aud.submit_revision(text, text, uuid, jsonb, text, uuid, uuid, uuid, text),
  aud.decide_revision(uuid, boolean, text), aud.mark_revision_applied(uuid, text, boolean),
  aud.mark_revision_stale(uuid, text), aud.record_revision_effect(uuid, text, text, uuid, text),
  aud.revision_page(text, text, text, uuid, integer, uuid) to geoges_app;
