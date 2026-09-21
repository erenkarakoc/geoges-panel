-- 0004 — record history and the audit log (TASK-0103, REQ-AUD-001…006, REQ-IAM-008, D-258).
--
-- One channel writes field-level history: the trigger `aud.capture_history()`, attached to every
-- table the layer register marks `tracked`, so no code path can change a record without leaving
-- a trace. The audit log is append-only for everyone, owners included (AUD-K1). The runtime role
-- neither reads nor writes either table directly: it writes events through `aud.record_event()`
-- and reads through `aud.history_of()` and `aud.audit_log_page()`, which filter by permission and
-- hide commercial and sensitive values from those who may not see them (REQ-AUD-004).

-- ---------------------------------------------------------------------------------------------
-- Register: history kind per table, data class per column
-- ---------------------------------------------------------------------------------------------

alter table core.table_layer add column history text not null default 'none';
alter table core.table_layer add constraint ck_table_layer__history
  check (history in ('tracked', 'append_only', 'none'));
comment on column core.table_layer.history is
  'tracked: field history by aud.capture_history (trigger record_history required); append_only: '
  'ledgers and audit tables, never updated; none: tooling and preference tables (D-258).';

update core.table_layer set history = 'tracked'
 where schema_name = 'iam' and table_name <> 'user_action_role_choice';

-- Columns holding commercial or sensitive personal data (REQ-IAM-011), written by the migration
-- that creates the column. A column without a row is internal data.
create table core.column_data_class (
  schema_name text not null,
  table_name text not null,
  column_name text not null,
  data_class text not null,
  constraint pk_column_data_class primary key (schema_name, table_name, column_name),
  constraint ck_column_data_class__data_class check (data_class in ('commercial', 'sensitive'))
);
alter table core.column_data_class enable row level security;
revoke all on core.column_data_class from public;
comment on table core.column_data_class is
  'Data class of commercial and sensitive columns; history carries it so values can be hidden.';

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------

create schema aud;
grant usage on schema aud to geoges_app;

create table aud.record_history (
  id uuid not null default core.uuid_v7(),
  record_schema text not null,
  record_table text not null,
  record_id uuid not null,
  operation text not null,
  field text,
  old_value jsonb,
  new_value jsonb,
  data_class text not null default 'internal',
  reason text,
  site_id uuid,
  project_id uuid,
  record_created_by_user_id uuid,
  changed_by_user_id uuid,
  changed_in_role_id uuid,
  changed_at timestamptz not null default now(),
  constraint pk_record_history primary key (id),
  constraint ck_record_history__operation check (operation in ('insert', 'update')),
  constraint ck_record_history__field check ((operation = 'insert') = (field is null)),
  constraint ck_record_history__data_class
    check (data_class in ('general', 'internal', 'commercial', 'sensitive'))
);
create index ix_record_history__record on aud.record_history
  (record_schema, record_table, record_id, changed_at);

comment on table aud.record_history is
  'Field-level history of tracked tables (REQ-AUD-001); written only by aud.capture_history.';

create table aud.audit_log (
  id uuid not null default core.uuid_v7(),
  event_type text not null,
  actor_user_id uuid,
  actor_role_id uuid,
  target_schema text,
  target_table text,
  target_id uuid,
  payload jsonb not null default '{}',
  occurred_at timestamptz not null default now(),
  constraint pk_audit_log primary key (id),
  constraint ck_audit_log__event_type check (event_type ~ '^[a-z][a-z_]*\.[a-z][a-z_]*$'),
  constraint ck_audit_log__payload check (jsonb_typeof(payload) = 'object')
);
create index ix_audit_log__occurred_at on aud.audit_log (occurred_at desc, id desc);
create index ix_audit_log__actor_user_id on aud.audit_log (actor_user_id, occurred_at desc);
create index ix_audit_log__event_type on aud.audit_log (event_type, occurred_at desc);

comment on table aud.audit_log is
  'Company-wide operations and sign-in events (REQ-AUD-006, REQ-IAM-008); append-only (AUD-K1).';

alter table aud.record_history enable row level security;
alter table aud.audit_log enable row level security;
revoke all on aud.record_history, aud.audit_log from public;

insert into core.table_layer (schema_name, table_name, layer, history) values
  ('aud', 'record_history', 'system', 'append_only'),
  ('aud', 'audit_log', 'system', 'append_only'),
  ('core', 'column_data_class', 'system', 'none');

-- ---------------------------------------------------------------------------------------------
-- Append-only guard (AUD-K1, REQ-AUD-005). Nobody updates either table. Only the configuration
-- and data resets may delete history — of sample data, before real data exists — and only from
-- the admin connection, inside aud.purge_history_for_reset. The audit log is never deleted.
-- ---------------------------------------------------------------------------------------------

create function aud.guard_append_only() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and tg_table_name = 'record_history'
     and pg_catalog.current_setting('aud.reset_purge', true) = 'on'
     and session_user::text <> 'geoges_app' then
    return old;
  end if;
  raise exception 'aud.% is append-only', tg_table_name
    using errcode = 'P0001', hint = 'aud.append_only';
end
$$;

create trigger append_only_guard before update or delete on aud.record_history
  for each row execute function aud.guard_append_only();
create trigger append_only_guard before update or delete on aud.audit_log
  for each row execute function aud.guard_append_only();

create function aud.guard_truncate() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'aud.% is append-only', tg_table_name
    using errcode = 'P0001', hint = 'aud.append_only';
end
$$;

create trigger append_only_truncate before truncate on aud.record_history
  for each statement execute function aud.guard_truncate();
create trigger append_only_truncate before truncate on aud.audit_log
  for each statement execute function aud.guard_truncate();

-- ---------------------------------------------------------------------------------------------
-- Writing
-- ---------------------------------------------------------------------------------------------

-- History channel. Insert: one row. Update: one row per changed column (update stamps skipped),
-- with the column's data class, the reason given for the transaction (app.change_reason), the
-- person and acting role, and the record's scope and creator, which decide who reads it later.
create function aud.capture_history() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  n jsonb := pg_catalog.to_jsonb(new);
  o jsonb;
  k text;
  reason text := nullif(pg_catalog.current_setting('app.change_reason', true), '');
begin
  if tg_op = 'INSERT' then
    insert into aud.record_history (record_schema, record_table, record_id, operation, reason,
      site_id, project_id, record_created_by_user_id, changed_by_user_id, changed_in_role_id)
    values (tg_table_schema, tg_table_name, (n ->> 'id')::uuid, 'insert', reason,
      (n ->> 'site_id')::uuid, (n ->> 'project_id')::uuid, (n ->> 'created_by_user_id')::uuid,
      core.current_user_id(), core.current_role_id());
    return null;
  end if;

  o := pg_catalog.to_jsonb(old);
  for k in select pg_catalog.jsonb_object_keys(n) loop
    continue when k in ('updated_at', 'updated_by_user_id');
    continue when (o -> k) is not distinct from (n -> k);
    insert into aud.record_history (record_schema, record_table, record_id, operation, field,
      old_value, new_value, data_class, reason, site_id, project_id, record_created_by_user_id,
      changed_by_user_id, changed_in_role_id)
    values (tg_table_schema, tg_table_name, (n ->> 'id')::uuid, 'update', k, o -> k, n -> k,
      coalesce((select c.data_class from core.column_data_class c
                 where c.schema_name = tg_table_schema and c.table_name = tg_table_name
                   and c.column_name = k), 'internal'),
      reason, (n ->> 'site_id')::uuid, (n ->> 'project_id')::uuid,
      (n ->> 'created_by_user_id')::uuid, core.current_user_id(), core.current_role_id());
  end loop;
  return null;
end
$$;

-- One audit event. The actor is always the transaction's identity, never a parameter; the
-- runtime role must have one. Payloads carry ids and codes, never commercial or sensitive values.
create function aud.record_event(p_event_type text, p_target_schema text default null,
                                 p_target_table text default null, p_target_id uuid default null,
                                 p_payload jsonb default '{}') returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if session_user::text = 'geoges_app' and core.current_user_id() is null then
    raise exception 'an audit event needs a signed-in person' using errcode = '42501';
  end if;
  insert into aud.audit_log (event_type, actor_user_id, actor_role_id, target_schema,
                             target_table, target_id, payload)
  values (p_event_type, core.current_user_id(), core.current_role_id(), p_target_schema,
          p_target_table, p_target_id, coalesce(p_payload, '{}'))
  returning id into new_id;
  return new_id;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Reading
-- ---------------------------------------------------------------------------------------------

-- The history of one record, as the signed-in person may see it (REQ-AUD-004): a row shows when
-- the person holds `<module>.module.view` over the record's scope, or `<module>.module.own` and
-- created the record. Commercial and sensitive values the person may not see come back empty
-- with is_masked = true ("changed").
create function aud.history_of(p_schema text, p_table text, p_id uuid)
returns table (operation text, field text, old_value jsonb, new_value jsonb, data_class text,
               is_masked boolean, reason text, changed_by_user_id uuid,
               changed_by_name text, changed_in_role_id uuid, changed_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  with g as (select * from iam.my_grants()),
  h as (
    select r.*,
           case when r.site_id is not null then 'site'
                when r.project_id is not null then 'project' else 'company' end as q_type,
           coalesce(r.site_id, r.project_id) as q_id
      from aud.record_history r
     where r.record_schema = p_schema and r.record_table = p_table and r.record_id = p_id
  ),
  visible as (
    select h.*,
           h.data_class in ('commercial', 'sensitive')
             and not iam.can_see(p_schema, h.data_class, h.q_type, h.q_id) as masked
      from h
     where exists (
       select from g
        where (g.permission_code = p_schema || '.module.view'
               or (g.permission_code = p_schema || '.module.own'
                   and h.record_created_by_user_id = core.current_user_id()))
          and iam.covers(g.scope_type, g.scope_ids, h.q_type, h.q_id))
  )
  select v.operation, v.field,
         case when v.masked then null else v.old_value end,
         case when v.masked then null else v.new_value end,
         v.data_class, v.masked, v.reason, v.changed_by_user_id, u.display_name,
         v.changed_in_role_id, v.changed_at
    from visible v left join iam.user u on u.id = v.changed_by_user_id
   order by v.changed_at, v.id
$$;

-- One page of the company-wide audit log for SCR-193 (REQ-AUD-006), newest first, with the
-- total of the filtered list on every row (D-219: the total is always shown). Filters: person,
-- event type prefix (e.g. 'role_assignment.'), target table, time range. Refused without
-- `aud.audit-log.view`.
create function aud.audit_log_page(p_actor uuid default null, p_event_prefix text default null,
                                   p_target_table text default null,
                                   p_from timestamptz default null, p_to timestamptz default null,
                                   p_offset integer default 0, p_limit integer default 50)
returns table (id uuid, event_type text, actor_user_id uuid, actor_name text,
               actor_role_id uuid, actor_role_name text, target_schema text, target_table text,
               target_id uuid, payload jsonb, occurred_at timestamptz, total bigint)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not iam.has_permission('aud.audit-log.view') then
    raise exception 'the audit log is for the owner layer' using errcode = '42501';
  end if;
  return query
    select l.id, l.event_type, l.actor_user_id, u.display_name, l.actor_role_id, r.name,
           l.target_schema, l.target_table, l.target_id, l.payload, l.occurred_at,
           count(*) over ()
      from aud.audit_log l
      left join iam.user u on u.id = l.actor_user_id
      left join iam.role r on r.id = l.actor_role_id
     where (p_actor is null or l.actor_user_id = p_actor)
       and (p_event_prefix is null or pg_catalog.starts_with(l.event_type, p_event_prefix))
       and (p_target_table is null
            or l.target_schema || '.' || l.target_table = p_target_table)
       and (p_from is null or l.occurred_at >= p_from)
       and (p_to is null or l.occurred_at < p_to)
     order by l.occurred_at desc, l.id desc
     offset greatest(coalesce(p_offset, 0), 0)
     limit least(greatest(coalesce(p_limit, 50), 1), 200);
end
$$;

-- Removes the history of tables a reset has just emptied (sample data only; the resets refuse to
-- run once real data is marked). Admin connection only: the runtime role cannot execute it.
create function aud.purge_history_for_reset(p_tables text[]) returns bigint
language plpgsql
set search_path = ''
as $$
declare
  removed bigint;
begin
  perform pg_catalog.set_config('aud.reset_purge', 'on', true);
  delete from aud.record_history h
   where h.record_schema || '.' || h.record_table = any (p_tables);
  get diagnostics removed = row_count;
  perform pg_catalog.set_config('aud.reset_purge', 'off', true);
  return removed;
end
$$;

-- History of individual sample rows a reset removed from tables it does not empty (sample people
-- and the rows naming them, D-256). Same rules as above.
create function aud.purge_record_history_for_reset(p_table text, p_ids uuid[]) returns bigint
language plpgsql
set search_path = ''
as $$
declare
  removed bigint;
begin
  perform pg_catalog.set_config('aud.reset_purge', 'on', true);
  delete from aud.record_history h
   where h.record_schema || '.' || h.record_table = p_table and h.record_id = any (p_ids);
  get diagnostics removed = row_count;
  perform pg_catalog.set_config('aud.reset_purge', 'off', true);
  return removed;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- IAM: history, events and the owner-only audit permission
-- ---------------------------------------------------------------------------------------------

create trigger record_history after insert or update on iam.user
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on iam.role
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on iam.permission
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on iam.role_permission
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on iam.role_data_class
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on iam.role_assignment
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on iam.user_exception
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on iam.user_manager
  for each row execute function aud.capture_history();

-- Account and permission events (REQ-IAM-008). Delegations are dated assignments; they are
-- reported under their own names (the IAM capability catalog).
create function iam.emit_audit_event() returns trigger
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
  end if;
  return null;
end
$$;

create trigger audit_event after insert or update on iam.role_assignment
  for each row execute function iam.emit_audit_event();
create trigger audit_event after insert or update on iam.user_exception
  for each row execute function iam.emit_audit_event();
create trigger audit_event after insert or update on iam.user_manager
  for each row execute function iam.emit_audit_event();
create trigger audit_event after insert or update on iam.role_permission
  for each row execute function iam.emit_audit_event();
create trigger audit_event after insert or update on iam.user
  for each row execute function iam.emit_audit_event();

-- Sign-in and sign-out of the signed-in person (REQ-IAM-008). Failed attempts have no identity
-- and are written with the sign-in lock (TASK-0112).
create function iam.note_session(p_kind text) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_kind not in ('signed_in', 'signed_out') then
    raise exception 'unknown session event %', p_kind using errcode = '22023';
  end if;
  if core.current_user_id() is null then
    raise exception 'a session event needs a signed-in person' using errcode = '42501';
  end if;
  perform aud.record_event('user.' || p_kind, 'iam', 'user', core.current_user_id());
end
$$;

-- The audit screen belongs to the owner layer alone (REQ-AUD-006): its permission cannot be
-- bound to another role nor opened by a personal exception.
create function iam.guard_owner_only_permission() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'role_permission' then
    if new.revoked_at is null and exists (
         select from iam.permission p join iam.role r on r.id = new.role_id
          where p.id = new.permission_id and pg_catalog.starts_with(p.code, 'aud.audit-log.')
            and not r.is_owner_layer) then
      raise exception 'the audit log permission belongs to the owner layer'
        using errcode = 'P0001', hint = 'aud.audit_owner_only';
    end if;
  elsif new.effect = 'grant' and new.revoked_at is null
        and (new.target = 'aud' or pg_catalog.starts_with(new.target, 'aud.audit-log.')) then
    raise exception 'the audit log permission belongs to the owner layer'
      using errcode = 'P0001', hint = 'aud.audit_owner_only';
  end if;
  return new;
end
$$;

create trigger owner_only_permission_guard before insert or update on iam.role_permission
  for each row execute function iam.guard_owner_only_permission();
create trigger owner_only_permission_guard before insert or update on iam.user_exception
  for each row execute function iam.guard_owner_only_permission();

-- my_grants from 0003, with one change: owner-only permissions (the audit log) reach nobody but
-- the owner layer, not even a full-visibility role or a module-wide exception.
create or replace function iam.my_grants()
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
     where a.is_owner_layer or not pg_catalog.starts_with(p.code, 'aud.audit-log.')
  ),
  full_view as (
    select p.code, a.role_id, 'company'::text, '{}'::uuid[]
      from a join iam.permission p on p.is_active and p.code like '%.view'
     where a.has_full_visibility
       and (a.is_owner_layer or not pg_catalog.starts_with(p.code, 'aud.audit-log.'))
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
     where e.effect = 'grant' and not pg_catalog.starts_with(p.code, 'aud.audit-log.')
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

revoke all on all functions in schema aud from public;
revoke all on function iam.emit_audit_event(), iam.note_session(text),
  iam.guard_owner_only_permission() from public;
grant execute on function
  aud.record_event(text, text, text, uuid, jsonb), aud.history_of(text, text, uuid),
  aud.audit_log_page(uuid, text, text, timestamptz, timestamptz, integer, integer),
  iam.note_session(text)
  to geoges_app;
