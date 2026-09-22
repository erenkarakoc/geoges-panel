-- 0007 — configuration: catalogs, dated rules, typed custom fields (TASK-0105, CONFIGURATION.md,
-- REQ-ADM-001, 005…009, D-237, D-260).
--
-- Catalog items are never deleted: they turn passive, and a merge leaves a redirect. Rule rows are
-- never updated or deleted: a change is a new validity row, and a calculation picks the row valid
-- on its own date (adm.rule_value). Custom fields exist only on the nine reference record types of
-- D-237; their values live in each record's `custom_fields` column and are checked on write by
-- adm.check_custom_fields(). The history channel records custom field changes field by field.

-- Turkish-insensitive text for matching: lower case with Turkish rules, diacritics removed
-- ("Söğüt" → "sogut", "IŞIK" → "isik"). Search (TASK-0110) uses the same folding.
create function core.fold_tr(p_text text) returns text
language sql immutable parallel safe
as $$
  select pg_catalog.translate(
    pg_catalog.lower(pg_catalog.replace(pg_catalog.replace(p_text, 'I', 'ı'), 'İ', 'i')),
    'çğıöşüâîû' || pg_catalog.chr(775), 'cgiosuaiu')
$$;

comment on function core.fold_tr(text) is
  'Turkish case and diacritic folding for matching (REQ-ADM-006, REQ-NFR-012).';

grant execute on function core.fold_tr(text) to geoges_app, geoges_worker;

create schema adm;
grant usage on schema adm to geoges_app, geoges_worker;

-- ---------------------------------------------------------------------------------------------
-- Catalogs
-- ---------------------------------------------------------------------------------------------

create table adm.catalog (
  id uuid not null default core.uuid_v7(),
  key text not null,
  name text not null,
  description text,
  allows_project_scope boolean not null default false,
  allows_user_additions boolean not null default false,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_catalog primary key (id),
  constraint ck_catalog__key check (key ~ '^[a-z][a-z0-9_]{1,39}$'),
  constraint ck_catalog__name check (length(btrim(name)) > 0)
);
create unique index uq_catalog__key on adm.catalog (key);

comment on table adm.catalog is 'Kind of shared list (REQ-ADM-001): units, expense categories…';

create table adm.catalog_item (
  id uuid not null default core.uuid_v7(),
  catalog_id uuid not null,
  code text,
  name text not null,
  name_folded text generated always as (core.fold_tr(name)) stored,
  status text not null default 'active',
  project_id uuid,
  merged_into_item_id uuid,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_catalog_item primary key (id),
  constraint fk_catalog_item__catalog foreign key (catalog_id) references adm.catalog (id),
  constraint fk_catalog_item__merged_into_item foreign key (merged_into_item_id)
    references adm.catalog_item (id),
  constraint ck_catalog_item__name check (length(btrim(name)) > 0),
  constraint ck_catalog_item__status check (status in ('active', 'passive')),
  constraint ck_catalog_item__merged_passive check (merged_into_item_id is null or status = 'passive'),
  constraint ck_catalog_item__not_merged_into_self check (merged_into_item_id <> id)
);
create unique index uq_catalog_item__catalog_id_code on adm.catalog_item (catalog_id, code)
  where code is not null;
-- One active item per name (Turkish-insensitive) in a catalog, per project or company-wide.
create unique index uq_catalog_item__active_name on adm.catalog_item
  (catalog_id, coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid), name_folded)
  where status = 'active';
create index ix_catalog_item__merged_into_item_id on adm.catalog_item (merged_into_item_id)
  where merged_into_item_id is not null;

comment on column adm.catalog_item.project_id is
  'Project-only item (REQ-ADM-005). Not a foreign key: projects are business data (D-246, D-260).';

-- ---------------------------------------------------------------------------------------------
-- Dated rules
-- ---------------------------------------------------------------------------------------------

create table adm.rule_key (
  id uuid not null default core.uuid_v7(),
  key text not null,
  module text not null,
  name text not null,
  description text,
  value_type text not null,
  unit text,
  allowed_scopes text[] not null default '{company}',
  data_class text not null default 'internal',
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_rule_key primary key (id),
  constraint ck_rule_key__key check (key ~ '^[a-z]{2,3}\.[a-z0-9_.-]+$'),
  constraint ck_rule_key__module check (module = split_part(key, '.', 1)),
  constraint ck_rule_key__value_type
    check (value_type in ('number', 'money', 'percent', 'time', 'text', 'boolean', 'json')),
  constraint ck_rule_key__allowed_scopes check (
    cardinality(allowed_scopes) > 0
    and allowed_scopes <@ array['company', 'unit', 'project', 'site']),
  constraint ck_rule_key__data_class
    check (data_class in ('general', 'internal', 'commercial', 'sensitive'))
);
create unique index uq_rule_key__key on adm.rule_key (key);

comment on table adm.rule_key is
  'Every dated rule the panel knows (CONFIGURATION section 3); modules add theirs as seed data.';

create table adm.rule (
  id uuid not null default core.uuid_v7(),
  rule_key_id uuid not null,
  scope_type text not null default 'company',
  scope_id uuid,
  valid_from date not null,
  value jsonb not null,
  reason text not null,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  constraint pk_rule primary key (id),
  constraint fk_rule__rule_key foreign key (rule_key_id) references adm.rule_key (id),
  constraint ck_rule__scope check (
    scope_type in ('company', 'unit', 'project', 'site')
    and (scope_type = 'company') = (scope_id is null)),
  constraint ck_rule__reason check (length(btrim(reason)) > 0)
);
create index ix_rule__lookup on adm.rule (rule_key_id, scope_type, scope_id, valid_from desc);

comment on table adm.rule is
  'Dated rule rows (REQ-ADM-007/008); never updated or deleted, a change is a new row.';

-- ---------------------------------------------------------------------------------------------
-- Custom fields (D-237)
-- ---------------------------------------------------------------------------------------------

create table adm.custom_field (
  id uuid not null default core.uuid_v7(),
  record_table text not null,
  code text not null,
  label text not null,
  field_type text not null,
  options jsonb,
  is_required boolean not null default false,
  is_searchable boolean not null default false,
  data_class text not null default 'internal',
  order_no integer not null default 0,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_custom_field primary key (id),
  -- The reference record types of D-237; ledger and approval records take no custom fields.
  constraint ck_custom_field__record_table check (record_table in (
    'prj.project', 'sit.site', 'crm.party', 'hr.employee', 'eqp.asset', 'inv.material',
    'cmp.contract', 'qte.quote', 'crm.lead')),
  constraint ck_custom_field__code check (code ~ '^[a-z][a-z0-9_]{0,39}$'),
  constraint ck_custom_field__label check (length(btrim(label)) > 0),
  constraint ck_custom_field__field_type
    check (field_type in ('text', 'number', 'date', 'select', 'boolean')),
  constraint ck_custom_field__options check (
    (field_type = 'select') = (options is not null)
    and (options is null or (jsonb_typeof(options) = 'array' and jsonb_array_length(options) > 0))),
  constraint ck_custom_field__data_class
    check (data_class in ('general', 'internal', 'commercial', 'sensitive'))
);
create unique index uq_custom_field__record_table_code on adm.custom_field (record_table, code);

comment on table adm.custom_field is
  'Typed custom field on a reference record type (REQ-ADM-009, D-237); retired, never deleted.';

insert into core.table_layer (schema_name, table_name, layer, portable, history) values
  ('adm', 'catalog', 'config', true, 'tracked'),
  ('adm', 'catalog_item', 'config', true, 'tracked'),
  ('adm', 'rule_key', 'config', true, 'tracked'),
  ('adm', 'rule', 'config', true, 'tracked'),
  ('adm', 'custom_field', 'config', true, 'tracked');

-- ---------------------------------------------------------------------------------------------
-- Rules: validation and lookup
-- ---------------------------------------------------------------------------------------------

-- Whether a JSON value fits a rule's value type.
create function adm.rule_value_fits(p_type text, p_value jsonb) returns boolean
language sql immutable parallel safe
as $$
  select case p_type
    when 'number' then pg_catalog.jsonb_typeof(p_value) = 'number'
    when 'money' then pg_catalog.jsonb_typeof(p_value) = 'number'
    when 'percent' then pg_catalog.jsonb_typeof(p_value) = 'number'
    when 'time' then pg_catalog.jsonb_typeof(p_value) = 'string'
                     and (p_value #>> '{}') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    when 'text' then pg_catalog.jsonb_typeof(p_value) = 'string'
    when 'boolean' then pg_catalog.jsonb_typeof(p_value) = 'boolean'
    when 'json' then true
    else false end
$$;

-- A rule row is written once (REQ-ADM-007): its value fits the key's type, its scope is one the
-- key allows; it is never updated or deleted.
create function adm.guard_rule() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  k adm.rule_key;
begin
  if tg_op <> 'INSERT' then
    raise exception 'a rule row is never changed; add a new validity row instead'
      using errcode = 'P0001', hint = 'adm.rule_immutable';
  end if;
  select * into k from adm.rule_key where id = new.rule_key_id;
  if not adm.rule_value_fits(k.value_type, new.value) then
    raise exception 'the value does not fit rule % (%)', k.key, k.value_type
      using errcode = 'P0001', hint = 'adm.rule_value_type';
  end if;
  if not new.scope_type = any (k.allowed_scopes) then
    raise exception 'rule % cannot be set for scope %', k.key, new.scope_type
      using errcode = 'P0001', hint = 'adm.rule_scope';
  end if;
  return new;
end
$$;

create trigger rule_guard before insert or update or delete on adm.rule
  for each row execute function adm.guard_rule();

-- The rule valid on a date for a place (CONFIGURATION section 3 and 6): the most specific scope
-- that has a row wins — site, then project, then unit, then company — and within it the latest
-- validity start not after the date; among rows with the same start, the one written last. No
-- row: no result, never a default. Runs with definer rights so a calculation finds its rule
-- whoever triggers it; reading rules on screen goes through the table's policy instead.
create function adm.rule_value(p_key text, p_on date, p_site_id uuid default null,
                               p_project_id uuid default null, p_unit_id uuid default null)
returns table (rule_id uuid, value jsonb, valid_from date, scope_type text)
language sql stable security definer
set search_path = ''
as $$
  select r.id, r.value, r.valid_from, r.scope_type
    from adm.rule r join adm.rule_key k on k.id = r.rule_key_id
   where k.key = p_key and r.valid_from <= p_on
     and ((r.scope_type = 'site' and r.scope_id = p_site_id)
          or (r.scope_type = 'project' and r.scope_id = p_project_id)
          or (r.scope_type = 'unit' and r.scope_id = p_unit_id)
          or r.scope_type = 'company')
   order by case r.scope_type when 'site' then 1 when 'project' then 2 when 'unit' then 3
                              else 4 end,
            r.valid_from desc, r.created_at desc, r.id desc
   limit 1
$$;

-- ---------------------------------------------------------------------------------------------
-- Catalog items: suggestions, merges, redirects (REQ-ADM-006, ADM-K3)
-- ---------------------------------------------------------------------------------------------

-- Word stems (first four letters of each folded word of three letters or more).
create function adm.name_stems(p_name text) returns text[]
language sql immutable parallel safe
as $$
  select coalesce(array_agg(distinct pg_catalog.left(w, 4)), '{}')
    from pg_catalog.regexp_split_to_table(core.fold_tr(p_name), '[^a-z0-9]+') as w
   where pg_catalog.length(w) >= 3
$$;

-- Active items whose name shares a word stem with the given name, for "did you mean…" before a
-- new item is added. Company-wide items and, for a project, that project's items.
create function adm.similar_catalog_items(p_catalog_key text, p_name text,
                                          p_project_id uuid default null)
returns table (id uuid, name text, project_id uuid)
language sql stable
set search_path = ''
as $$
  select i.id, i.name, i.project_id
    from adm.catalog_item i join adm.catalog c on c.id = i.catalog_id
   where c.key = p_catalog_key and i.status = 'active'
     and (i.project_id is null or i.project_id = p_project_id)
     and adm.name_stems(i.name) && adm.name_stems(p_name)
   order by i.name
   limit 20
$$;

-- The item a (possibly merged) item stands for today: follows merge redirects to the end.
create function adm.catalog_item_final(p_item_id uuid) returns uuid
language plpgsql stable
set search_path = ''
as $$
declare
  current_id uuid := p_item_id;
  next_id uuid;
  depth integer := 0;
begin
  loop
    select i.merged_into_item_id into next_id from adm.catalog_item i where i.id = current_id;
    exit when next_id is null or depth > 50;
    current_id := next_id;
    depth := depth + 1;
  end loop;
  return current_id;
end
$$;

-- Merges one item into another of the same catalog: the old item turns passive and keeps a
-- redirect; records keep pointing at it and show the new name; `catalog_item.merged` is published.
create function adm.merge_catalog_items(p_from uuid, p_into uuid, p_reason text) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  a adm.catalog_item;
  b adm.catalog_item;
begin
  if not iam.has_permission('adm.module.manage') then
    raise exception 'merging catalog items needs adm.module.manage' using errcode = '42501';
  end if;
  if coalesce(pg_catalog.btrim(p_reason), '') = '' then
    raise exception 'a merge needs a reason' using errcode = 'P0001', hint = 'adm.reason_required';
  end if;
  select * into a from adm.catalog_item where id = p_from for update;
  select * into b from adm.catalog_item where id = p_into for update;
  if a.id is null or b.id is null or a.catalog_id <> b.catalog_id or a.id = b.id then
    raise exception 'both items must exist, differ and belong to the same catalog'
      using errcode = 'P0001', hint = 'adm.merge_invalid';
  end if;
  if b.status <> 'active' or a.status <> 'active' then
    raise exception 'only active items can be merged'
      using errcode = 'P0001', hint = 'adm.merge_invalid';
  end if;
  perform pg_catalog.set_config('app.change_reason', p_reason, true);
  update adm.catalog_item set status = 'passive', merged_into_item_id = b.id where id = a.id;
  perform core.publish_event('catalog_item.merged', 'adm', 'adm', 'catalog_item', a.id,
    pg_catalog.jsonb_build_object('catalog_id', a.catalog_id, 'from_item_id', a.id,
                                  'into_item_id', b.id));
end
$$;

-- A merge is the only way to set a redirect, and it points inside the catalog.
create function adm.guard_catalog_item() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (new.catalog_id <> old.catalog_id) then
    raise exception 'an item stays in its catalog' using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' and old.merged_into_item_id is not null
     and new.merged_into_item_id is distinct from old.merged_into_item_id then
    raise exception 'a merge is not undone or redirected' using errcode = 'P0001',
      hint = 'adm.merge_invalid';
  end if;
  if new.project_id is not null and not exists (
       select from adm.catalog c where c.id = new.catalog_id and c.allows_project_scope) then
    raise exception 'this catalog has no project-only items' using errcode = 'P0001',
      hint = 'adm.catalog_project_scope';
  end if;
  return new;
end
$$;

create trigger catalog_item_guard before insert or update on adm.catalog_item
  for each row execute function adm.guard_catalog_item();

-- ---------------------------------------------------------------------------------------------
-- Custom field values (D-237): checked on write by a trigger each reference table attaches
-- ---------------------------------------------------------------------------------------------

-- Code and type of a field never change; a field is retired, not deleted (CONFIGURATION 4).
create function adm.guard_custom_field() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (new.record_table <> old.record_table or new.code <> old.code
                           or new.field_type <> old.field_type) then
    raise exception 'a custom field keeps its record type, code and type; add a new field instead'
      using errcode = 'P0001', hint = 'adm.custom_field_immutable';
  end if;
  if tg_op = 'UPDATE' and old.retired_at is not null and new.retired_at is null then
    raise exception 'a retired field is not brought back; add a new field instead'
      using errcode = 'P0001', hint = 'adm.custom_field_immutable';
  end if;
  return new;
end
$$;

create trigger custom_field_guard before update on adm.custom_field
  for each row execute function adm.guard_custom_field();

-- Refuses unknown fields, values of the wrong type or outside a selection, new values in a
-- retired field and empty required fields. Attached as BEFORE INSERT OR UPDATE to a reference
-- table with a `custom_fields jsonb not null default '{}'` column.
create function adm.check_custom_fields() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_table text := tg_table_schema || '.' || tg_table_name;
  n jsonb := coalesce(pg_catalog.to_jsonb(new) -> 'custom_fields', '{}');
  o jsonb := case when tg_op = 'UPDATE'
                  then coalesce(pg_catalog.to_jsonb(old) -> 'custom_fields', '{}') end;
  f adm.custom_field;
  k text;
  v jsonb;
  fits boolean;
begin
  if pg_catalog.jsonb_typeof(n) <> 'object' then
    raise exception 'custom_fields must be an object' using errcode = '22023',
      hint = 'adm.custom_field_invalid';
  end if;
  for k, v in select * from pg_catalog.jsonb_each(n) loop
    select * into f from adm.custom_field c where c.record_table = v_table and c.code = k;
    if f.id is null then
      raise exception 'unknown custom field % on %', k, v_table using errcode = '22023',
        hint = 'adm.custom_field_invalid';
    end if;
    continue when v = 'null'::jsonb;
    if f.retired_at is not null and (o is null or (o -> k) is distinct from v) then
      raise exception 'custom field % is retired', k using errcode = '22023',
        hint = 'adm.custom_field_invalid';
    end if;
    -- Computed apart: an IF condition ends at the first THEN, which a CASE contains.
    fits := case f.field_type
         when 'text' then pg_catalog.jsonb_typeof(v) = 'string'
         when 'number' then pg_catalog.jsonb_typeof(v) = 'number'
         when 'boolean' then pg_catalog.jsonb_typeof(v) = 'boolean'
         when 'date' then pg_catalog.jsonb_typeof(v) = 'string'
                          and (v #>> '{}') ~ '^\d{4}-\d{2}-\d{2}$'
                          and pg_catalog.to_char((v #>> '{}')::date, 'YYYY-MM-DD') = (v #>> '{}')
         when 'select' then pg_catalog.jsonb_typeof(v) = 'string' and exists (
                              select from pg_catalog.jsonb_array_elements(f.options) as opt
                               where opt ->> 'value' = v #>> '{}')
         else false end;
    if not fits then
      raise exception 'value of custom field % does not fit type %', k, f.field_type
        using errcode = '22023', hint = 'adm.custom_field_invalid';
    end if;
  end loop;
  for f in select * from adm.custom_field c
            where c.record_table = v_table and c.is_required and c.retired_at is null loop
    if coalesce(n -> f.code, 'null'::jsonb) = 'null'::jsonb
       or (f.field_type = 'text' and pg_catalog.btrim(n ->> f.code) = '') then
      raise exception 'custom field % is required', f.code using errcode = '22023',
        hint = 'adm.custom_field_invalid';
    end if;
  end loop;
  return new;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- History: custom fields field by field (REQ-AUD-004 for custom values)
-- ---------------------------------------------------------------------------------------------

-- As in 0004, with one addition: a change of `custom_fields` is written per custom field, as
-- `custom_fields.<code>`, with that field's data class, so a commercial or sensitive custom value
-- is hidden in history from those who may not see it.
create or replace function aud.capture_history() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  n jsonb := pg_catalog.to_jsonb(new);
  o jsonb;
  k text;
  c text;
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
    if k = 'custom_fields' then
      for c in select pg_catalog.jsonb_object_keys(coalesce(n -> k, '{}'))
               union select pg_catalog.jsonb_object_keys(coalesce(o -> k, '{}')) loop
        continue when (o -> k -> c) is not distinct from (n -> k -> c);
        insert into aud.record_history (record_schema, record_table, record_id, operation, field,
          old_value, new_value, data_class, reason, site_id, project_id,
          record_created_by_user_id, changed_by_user_id, changed_in_role_id)
        values (tg_table_schema, tg_table_name, (n ->> 'id')::uuid, 'update',
          'custom_fields.' || c, o -> k -> c, n -> k -> c,
          coalesce((select f.data_class from adm.custom_field f
                     where f.record_table = tg_table_schema || '.' || tg_table_name
                       and f.code = c), 'internal'),
          reason, (n ->> 'site_id')::uuid, (n ->> 'project_id')::uuid,
          (n ->> 'created_by_user_id')::uuid, core.current_user_id(), core.current_role_id());
      end loop;
      continue;
    end if;
    insert into aud.record_history (record_schema, record_table, record_id, operation, field,
      old_value, new_value, data_class, reason, site_id, project_id, record_created_by_user_id,
      changed_by_user_id, changed_in_role_id)
    values (tg_table_schema, tg_table_name, (n ->> 'id')::uuid, 'update', k, o -> k, n -> k,
      coalesce((select cd.data_class from core.column_data_class cd
                 where cd.schema_name = tg_table_schema and cd.table_name = tg_table_name
                   and cd.column_name = k), 'internal'),
      reason, (n ->> 'site_id')::uuid, (n ->> 'project_id')::uuid,
      (n ->> 'created_by_user_id')::uuid, core.current_user_id(), core.current_role_id());
  end loop;
  return null;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Stamps, history, policies, privileges
-- ---------------------------------------------------------------------------------------------

create trigger catalog_stamp before update on adm.catalog
  for each row execute function iam.stamp_update();
create trigger catalog_item_stamp before update on adm.catalog_item
  for each row execute function iam.stamp_update();
create trigger rule_key_stamp before update on adm.rule_key
  for each row execute function iam.stamp_update();
create trigger custom_field_stamp before update on adm.custom_field
  for each row execute function iam.stamp_update();

create trigger record_history after insert or update on adm.catalog
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on adm.catalog_item
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on adm.rule_key
  for each row execute function aud.capture_history();
create trigger record_history after insert on adm.rule
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on adm.custom_field
  for each row execute function aud.capture_history();

alter table adm.catalog enable row level security;
alter table adm.catalog_item enable row level security;
alter table adm.rule_key enable row level security;
alter table adm.rule enable row level security;
alter table adm.custom_field enable row level security;

-- Definitions are read by everyone signed in; changed by holders of adm.module.manage.
create policy catalog_read on adm.catalog for select to geoges_app
  using ((select core.current_user_id()) is not null);
create policy catalog_add on adm.catalog for insert to geoges_app
  with check ((select iam.has_permission('adm.module.manage')));
create policy catalog_change on adm.catalog for update to geoges_app
  using ((select iam.has_permission('adm.module.manage')))
  with check ((select iam.has_permission('adm.module.manage')));

-- A catalog open to user additions takes new items from anyone holding a role (REQ-ADM-006).
create policy catalog_item_read on adm.catalog_item for select to geoges_app
  using ((select core.current_user_id()) is not null);
create policy catalog_item_add on adm.catalog_item for insert to geoges_app
  with check (
    (select iam.has_permission('adm.module.manage'))
    or (status = 'active' and merged_into_item_id is null
        and exists (select from iam.my_grants())
        and exists (select from adm.catalog c where c.id = catalog_id and c.allows_user_additions)));
create policy catalog_item_change on adm.catalog_item for update to geoges_app
  using ((select iam.has_permission('adm.module.manage')))
  with check ((select iam.has_permission('adm.module.manage')));

create policy rule_key_read on adm.rule_key for select to geoges_app
  using ((select core.current_user_id()) is not null);
create policy rule_key_add on adm.rule_key for insert to geoges_app
  with check ((select iam.has_permission('adm.module.manage')));
create policy rule_key_change on adm.rule_key for update to geoges_app
  using ((select iam.has_permission('adm.module.manage')))
  with check ((select iam.has_permission('adm.module.manage')));

-- A commercial or sensitive rule (a unit price, a payroll parameter) is shown only to those who
-- may see that class in its module; calculations read it through adm.rule_value regardless.
create policy rule_read on adm.rule for select to geoges_app
  using (exists (
    select from adm.rule_key k
     where k.id = rule_key_id
       and (k.data_class in ('general', 'internal') or iam.can_see(k.module, k.data_class))));
create policy rule_add on adm.rule for insert to geoges_app
  with check ((select iam.has_permission('adm.module.manage')));

create policy custom_field_read on adm.custom_field for select to geoges_app
  using ((select core.current_user_id()) is not null);
create policy custom_field_add on adm.custom_field for insert to geoges_app
  with check ((select iam.has_permission('adm.module.manage')));
create policy custom_field_change on adm.custom_field for update to geoges_app
  using ((select iam.has_permission('adm.module.manage')))
  with check ((select iam.has_permission('adm.module.manage')));

revoke all on all tables in schema adm from public;
grant select, insert, update on adm.catalog, adm.catalog_item, adm.rule_key, adm.custom_field
  to geoges_app;
grant select, insert on adm.rule to geoges_app;

revoke all on all functions in schema adm from public;
grant execute on function adm.rule_value(text, date, uuid, uuid, uuid),
  adm.rule_value_fits(text, jsonb), adm.name_stems(text),
  adm.similar_catalog_items(text, text, uuid), adm.catalog_item_final(uuid),
  adm.merge_catalog_items(uuid, uuid, text)
  to geoges_app, geoges_worker;
