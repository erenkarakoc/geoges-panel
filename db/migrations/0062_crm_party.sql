-- 0062 — the firm card: one record per real firm, with its roles and its people
-- (TASK-0122, REQ-CRM-004, REQ-PUR-001, D-027, D-033, D-237, D-287).
--
-- A client, a product customer, a supplier, a subcontractor and a lessor are not five kinds of
-- record. They are roles of one firm, and the same firm often holds two of them: a galvaniser we
-- buy from may also buy panels from us, and its balance is one net account (D-033). So there is a
-- single table with a role list, and the rule that matters most is the one that keeps a firm from
-- being entered twice (CRM-K1). It is kept in two places:
--
-- The tax number is unique. Two cards with the same number are the same firm by definition.
--
-- Before a name is saved the card shows firms whose name looks like it (REQ-CRM-004). Turkish firm
-- names share most of their words — "İnşaat", "Sanayi", "Ticaret", "Ltd. Şti." — so the likeness
-- is judged on what is left once those are gone, or every construction firm would resemble every
-- other one.

create schema crm;
grant usage on schema crm to geoges_app, geoges_worker;

comment on schema crm is 'Firms, their people, leads and client scorecards (REQ-CRM).';

-- ---------------------------------------------------------------------------------------------
-- Name likeness
-- ---------------------------------------------------------------------------------------------

-- The words of a firm's name that tell it apart: folded (Turkish case and diacritics), split on
-- anything that is not a letter or digit, without the legal-form and trade words every firm has.
create function crm.name_words(p_name text) returns text[]
language sql immutable parallel safe
set search_path = ''
as $$
  select coalesce(array_agg(w order by n), '{}')
    from pg_catalog.regexp_split_to_table(core.fold_tr(p_name), '[^a-z0-9]+')
         with ordinality as t(w, n)
   where pg_catalog.length(w) >= 2
     and w <> all (array[
       'insaat', 'ins', 'sanayi', 'san', 'ticaret', 'tic', 'limited', 'ltd', 'sirketi', 'sirket',
       'sti', 'anonim', 'as', 've', 'muhendislik', 'muh', 'taahhut', 'taah', 'yapi', 'ithalat',
       'ihracat', 'pazarlama', 'paz', 'dis', 'holding', 'grup', 'group', 'gmbh', 'llc', 'inc',
       'co', 'musavirlik', 'danismanlik', 'hizmetleri', 'hiz', 'urunleri', 'malzemeleri',
       'nakliyat', 'nak', 'turizm', 'tur', 'enerji', 'mimarlik', 'proje'])
$$;

comment on function crm.name_words(text) is
  'Distinctive words of a firm name, without legal-form and trade words (REQ-CRM-004).';

-- The distinctive words as one string, for spelling closeness and its index. Immutable in fact:
-- joining text words has no setting to depend on, which array_to_string cannot promise in general.
create function crm.name_key(p_name text) returns text
language sql immutable parallel safe
set search_path = ''
as $$
  select pg_catalog.array_to_string(crm.name_words(p_name), ' ')
$$;

-- ---------------------------------------------------------------------------------------------
-- Firms
-- ---------------------------------------------------------------------------------------------

create table crm.party (
  id uuid not null default core.uuid_v7(),
  /** Trade name as on the firm's invoices. */
  name text not null,
  /** Tax number (VKN, 10 digits), national id of a sole trader (11), or a foreign firm's id. */
  tax_no text,
  tax_office text,
  roles text[] not null,
  city text,
  address text,
  phone text,
  email text,
  note text,
  status text not null default 'active',
  custom_fields jsonb not null default '{}',
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_party primary key (id),
  constraint ck_party__name check (length(btrim(name)) between 2 and 200),
  constraint ck_party__tax_no check (tax_no is null or tax_no ~ '^[0-9A-Za-z-]{5,20}$'),
  -- The five roles of D-027 and D-287; a firm holds at least one of them.
  constraint ck_party__roles check (
    cardinality(roles) > 0
    and roles <@ array['client', 'customer', 'supplier', 'subcontractor', 'lessor']),
  constraint ck_party__email check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint ck_party__status check (status in ('active', 'passive'))
);

-- One card per tax number (CRM-K1): a second card with the same number is refused.
create unique index uq_party__tax_no on crm.party (upper(tax_no)) where tax_no is not null;
create index ix_party__roles on crm.party using gin (roles);
create index ix_party__name_words on crm.party
  using gin (crm.name_key(name) extensions.gin_trgm_ops);

comment on table crm.party is
  'Firm (Party, D-027): one record per real firm, with roles; never deleted, turns passive.';

create trigger check_custom_fields before insert or update on crm.party
  for each row execute function adm.check_custom_fields();

-- Active and passive firms whose name looks like the given one: a distinctive word starts the same
-- way (first four letters), or the distinctive part is spelt nearly the same (a typo, a missing
-- letter). Read as the person asking, so row level security applies.
create function crm.similar_parties(p_name text, p_except uuid default null)
returns table (id uuid, name text, roles text[], city text, status text)
language sql stable
set search_path = ''
as $$
  with asked as (
    select crm.name_words(p_name) as words, crm.name_key(p_name) as joined
  )
  select p.id, p.name, p.roles, p.city, p.status
    from crm.party p, asked a
   where (p_except is null or p.id <> p_except)
     and pg_catalog.cardinality(a.words) > 0
     and (
       exists (select from pg_catalog.unnest(crm.name_words(p.name)) as mine(w),
                           pg_catalog.unnest(a.words) as theirs(w)
                where pg_catalog.length(mine.w) >= 3 and pg_catalog.length(theirs.w) >= 3
                  and pg_catalog.left(mine.w, 4) = pg_catalog.left(theirs.w, 4))
       or extensions.similarity(crm.name_key(p.name), a.joined) >= 0.5)
   order by extensions.similarity(crm.name_key(p.name), a.joined) desc, p.name
   limit 10
$$;

comment on function crm.similar_parties(text, uuid) is
  'Firms whose name looks like the given one, for "is this the same firm?" (REQ-CRM-004).';

-- ---------------------------------------------------------------------------------------------
-- A firm's people
-- ---------------------------------------------------------------------------------------------

create table crm.party_contact (
  id uuid not null default core.uuid_v7(),
  party_id uuid not null,
  name text not null,
  title text,
  phone text,
  email text,
  -- Somebody who left the firm stays on its history; they are no longer offered.
  status text not null default 'active',
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_party_contact primary key (id),
  constraint fk_party_contact__party foreign key (party_id) references crm.party (id),
  constraint ck_party_contact__name check (length(btrim(name)) between 2 and 120),
  constraint ck_party_contact__email
    check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint ck_party_contact__status check (status in ('active', 'passive'))
);

create index ix_party_contact__party on crm.party_contact (party_id);

comment on table crm.party_contact is
  'Person at a firm: work contact details only, no sensitive fields; turns passive, never deleted.';

-- ---------------------------------------------------------------------------------------------
-- Events: a firm registered, a firm's card changed
-- ---------------------------------------------------------------------------------------------

create function crm.publish_party_event() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform core.publish_event('party.created', 'crm', 'crm', 'party', new.id,
      pg_catalog.jsonb_build_object('id', new.id, 'name', new.name, 'roles', new.roles));
  elsif (pg_catalog.to_jsonb(new) - array['updated_at', 'updated_by_user_id'])
        is distinct from (pg_catalog.to_jsonb(old) - array['updated_at', 'updated_by_user_id'])
  then
    perform core.publish_event('party.changed', 'crm', 'crm', 'party', new.id,
      pg_catalog.jsonb_build_object('id', new.id, 'name', new.name, 'roles', new.roles,
                                    'status', new.status));
  end if;
  return null;
end
$$;

create trigger publish_event after insert or update on crm.party
  for each row execute function crm.publish_party_event();

-- ---------------------------------------------------------------------------------------------
-- Who may do what
-- ---------------------------------------------------------------------------------------------

-- Firms are registered where they are met: sales registers clients, purchasing its suppliers,
-- equipment the firms it rents from (REQ-PUR-001, REQ-EQP-003).
create function crm.may_register_parties() returns boolean
language sql stable
set search_path = ''
as $$
  select iam.has_permission('crm.module.manage') or iam.has_permission('pur.module.manage')
      or iam.has_permission('eqp.module.manage')
$$;

-- The card itself — people, phone numbers, notes — is for those who work with firms.
create function crm.may_see_party_cards() returns boolean
language sql stable
set search_path = ''
as $$
  select iam.has_permission('crm.module.view') or iam.has_permission('crm.module.own')
      or iam.has_permission('pur.module.view') or iam.has_permission('eqp.module.view')
      or crm.may_register_parties()
$$;

-- ---------------------------------------------------------------------------------------------
-- Layers, history, security
-- ---------------------------------------------------------------------------------------------

insert into core.table_layer (schema_name, table_name, layer, history, portable, scope_source)
values
  ('crm', 'party', 'business', 'tracked', false, 'company'),
  ('crm', 'party_contact', 'business', 'tracked', false, 'parent');

create trigger record_history after insert or update on crm.party
  for each row execute function aud.capture_history();
create trigger record_history after insert or update on crm.party_contact
  for each row execute function aud.capture_history();

alter table crm.party enable row level security;
alter table crm.party_contact enable row level security;

-- A firm's name and roles are what other records show — a project's client, a site's
-- subcontractor, a rented crane's lessor — so everyone signed in reads the firm row.
create policy party_read on crm.party for select to geoges_app
  using ((select core.current_user_id()) is not null);
create policy party_add on crm.party for insert to geoges_app
  with check ((select crm.may_register_parties()));
create policy party_change on crm.party for update to geoges_app
  using ((select crm.may_register_parties()))
  with check ((select crm.may_register_parties()));

create policy party_contact_read on crm.party_contact for select to geoges_app
  using ((select crm.may_see_party_cards()));
create policy party_contact_add on crm.party_contact for insert to geoges_app
  with check ((select crm.may_register_parties()));
create policy party_contact_change on crm.party_contact for update to geoges_app
  using ((select crm.may_register_parties()))
  with check ((select crm.may_register_parties()));

revoke all on crm.party, crm.party_contact from public;
grant select, insert, update on crm.party, crm.party_contact to geoges_app;
grant select on crm.party, crm.party_contact to geoges_worker;

revoke all on function crm.name_words(text), crm.name_key(text), crm.similar_parties(text, uuid),
  crm.publish_party_event(), crm.may_register_parties(), crm.may_see_party_cards() from public;
grant execute on function crm.name_words(text), crm.name_key(text), crm.similar_parties(text, uuid),
  crm.may_register_parties(), crm.may_see_party_cards() to geoges_app, geoges_worker;
