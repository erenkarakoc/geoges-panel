-- 0009 — documents (TASK-0107, REQ-DOC-001…008, ADR-003, D-262, SPIKE-09/15/16).
--
-- A document belongs to a record and carries that record's module, scope (site / project),
-- owner and data class from the moment it is attached; visibility follows the same rule as record
-- history: `<module>.module.view` over the scope, or `<module>.module.own` for the record's
-- owner, plus the right to see the data class (DOC-K2, REQ-DOC-003). Nothing is deleted:
-- documents are archived with a reason, versions stack up (DOC-K4, REQ-DOC-005/006). Files live
-- in R2 under `documents/<document>/<version>`; the database holds only their description.

create schema doc;
grant usage on schema doc to geoges_app, geoges_worker;

create table doc.document (
  id uuid not null default core.uuid_v7(),
  record_schema text not null,
  record_table text not null,
  record_id uuid not null,
  site_id uuid,
  project_id uuid,
  record_owner_user_id uuid,
  data_class text not null default 'internal',
  doc_type_item_id uuid not null,
  title text not null,
  description text,
  status text not null default 'active',
  archived_at timestamptz,
  archived_by_user_id uuid,
  archive_reason text,
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  created_in_role_id uuid default core.current_role_id(),
  updated_at timestamptz not null default now(),
  updated_by_user_id uuid,
  constraint pk_document primary key (id),
  constraint fk_document__doc_type_item foreign key (doc_type_item_id)
    references adm.catalog_item (id),
  constraint ck_document__record check (record_schema ~ '^[a-z]{2,3}$' and record_table ~ '^[a-z][a-z0-9_]*$'),
  constraint ck_document__data_class
    check (data_class in ('general', 'internal', 'commercial', 'sensitive')),
  constraint ck_document__title check (length(btrim(title)) > 0),
  constraint ck_document__status check (status in ('active', 'archived')),
  constraint ck_document__archive check (
    (status = 'archived') = (archived_at is not null)
    and (status <> 'archived' or length(btrim(coalesce(archive_reason, ''))) > 0))
);
create index ix_document__record on doc.document (record_schema, record_table, record_id);
create index ix_document__doc_type_item_id on doc.document (doc_type_item_id);
create index ix_document__site on doc.document (site_id) where site_id is not null;
create index ix_document__project on doc.document (project_id) where project_id is not null;

comment on table doc.document is
  'A document attached to a record, carrying its scope and data class (REQ-DOC-001/003, DOC-K2).';

create table doc.document_version (
  id uuid not null default core.uuid_v7(),
  document_id uuid not null,
  version_no integer not null,
  storage_key text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  sha256 text,
  is_signed boolean not null default false,
  uploaded_by_user_id uuid default core.current_user_id(),
  created_at timestamptz not null default now(),
  constraint pk_document_version primary key (id),
  constraint fk_document_version__document foreign key (document_id) references doc.document (id),
  constraint uq_document_version__document_id_version_no unique (document_id, version_no),
  constraint uq_document_version__storage_key unique (storage_key),
  constraint ck_document_version__size check (size_bytes > 0),
  constraint ck_document_version__file_name check (length(btrim(file_name)) > 0),
  constraint ck_document_version__sha256 check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$')
);

comment on table doc.document_version is
  'One uploaded file of a document; a new version never removes the previous one (DOC-K4).';

-- A resumable upload in progress (SPIKE-15): parts go to an R2 multipart upload through the app.
create table doc.upload (
  id uuid not null default core.uuid_v7(),
  document_id uuid not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  part_size integer not null,
  received_bytes bigint not null default 0,
  storage_key text not null default '',
  multipart_upload_id text,
  parts jsonb not null default '[]',
  status text not null default 'open',
  is_signed boolean not null default false,
  expires_at timestamptz not null default now() + interval '2 days',
  created_at timestamptz not null default now(),
  created_by_user_id uuid default core.current_user_id(),
  updated_at timestamptz not null default now(),
  constraint pk_upload primary key (id),
  constraint fk_upload__document foreign key (document_id) references doc.document (id),
  constraint ck_upload__status check (status in ('open', 'completed', 'aborted')),
  constraint ck_upload__sizes check (
    size_bytes > 0 and part_size >= 5242880 and received_bytes between 0 and size_bytes),
  constraint ck_upload__parts check (jsonb_typeof(parts) = 'array')
);
create index ix_upload__document_id on doc.upload (document_id);
create index ix_upload__open on doc.upload (created_by_user_id) where status = 'open';

create table doc.extracted_text (
  document_version_id uuid not null,
  status text not null default 'pending',
  method text,
  text_content text,
  confidence numeric(5, 2),
  is_low_quality boolean not null default false,
  error text,
  updated_at timestamptz not null default now(),
  constraint pk_extracted_text primary key (document_version_id),
  constraint fk_extracted_text__document_version foreign key (document_version_id)
    references doc.document_version (id),
  constraint ck_extracted_text__status check (status in ('pending', 'ready', 'failed', 'skipped')),
  constraint ck_extracted_text__method check (method is null or method in ('ocr', 'pdf_text'))
);

comment on table doc.extracted_text is
  'Text of a version for search (REQ-DOC-004); "pending" shows as "okunuyor" until recognised.';

insert into core.table_layer (schema_name, table_name, layer, history) values
  ('doc', 'document', 'business', 'tracked'),
  ('doc', 'document_version', 'business', 'tracked'),
  ('doc', 'upload', 'business', 'none'),
  ('doc', 'extracted_text', 'business', 'none');

-- ---------------------------------------------------------------------------------------------
-- Visibility (DOC-K2, REQ-DOC-003)
-- ---------------------------------------------------------------------------------------------

-- Whether the signed-in person may see (or, with p_manage, attach to and change) documents of a
-- record with this module, scope, owner and data class.
create function doc.can_access(p_module text, p_site_id uuid, p_project_id uuid,
                               p_owner uuid, p_data_class text, p_manage boolean default false)
returns boolean
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
       where (g.permission_code = p_module || case when p_manage then '.module.manage'
                                                   else '.module.view' end
              or (g.permission_code = p_module || '.module.own'
                  and p_owner = core.current_user_id()))
         and iam.covers(g.scope_type, g.scope_ids, p.q_type, p.q_id))
     and (p_data_class in ('general', 'internal')
          or (select iam.can_see(p_module, p_data_class, p.q_type, p.q_id) from place p))
$$;

-- ---------------------------------------------------------------------------------------------
-- Guards
-- ---------------------------------------------------------------------------------------------

-- Nothing is deleted (REQ-DOC-006); a document keeps its record and scope; archiving is the only
-- way out of the default lists.
create function doc.guard_document() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if pg_catalog.current_setting('aud.reset_purge', true) = 'on'
       and session_user::text <> 'geoges_app' then
      return old;
    end if;
    raise exception 'a document is never deleted; archive it with a reason'
      using errcode = 'P0001', hint = 'doc.no_delete';
  end if;
  if (new.record_schema, new.record_table, new.record_id, new.site_id, new.project_id,
      new.record_owner_user_id, new.data_class)
     is distinct from
     (old.record_schema, old.record_table, old.record_id, old.site_id, old.project_id,
      old.record_owner_user_id, old.data_class) then
    raise exception 'a document stays with its record, scope and data class'
      using errcode = 'P0001', hint = 'doc.record_fixed';
  end if;
  return new;
end
$$;

create trigger document_guard before update or delete on doc.document
  for each row execute function doc.guard_document();

-- Versions are numbered in order, never changed except for the signed mark, never deleted.
create function doc.guard_document_version() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('doc.version:' || new.document_id));
    select coalesce(max(v.version_no), 0) + 1 into new.version_no
      from doc.document_version v where v.document_id = new.document_id;
    return new;
  end if;
  if tg_op = 'DELETE' then
    if pg_catalog.current_setting('aud.reset_purge', true) = 'on'
       and session_user::text <> 'geoges_app' then
      return old;
    end if;
    raise exception 'a document version is never deleted' using errcode = 'P0001',
      hint = 'doc.no_delete';
  end if;
  if (pg_catalog.to_jsonb(new) - 'is_signed') is distinct from (pg_catalog.to_jsonb(old) - 'is_signed') then
    raise exception 'a document version is never changed, apart from its signed mark'
      using errcode = 'P0001', hint = 'doc.version_fixed';
  end if;
  return new;
end
$$;

create trigger version_guard before insert or update or delete on doc.document_version
  for each row execute function doc.guard_document_version();

-- No health report document type (D-186): the document-type catalog refuses it.
create function doc.guard_document_type() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select from adm.catalog c where c.id = new.catalog_id and c.key = 'document_type')
     and new.name_folded ~ 'saglik\s*rapor' then
    raise exception 'a health report is never kept as a document (D-186)'
      using errcode = 'P0001', hint = 'doc.health_report_forbidden';
  end if;
  return new;
end
$$;

create trigger document_type_guard before insert or update on adm.catalog_item
  for each row execute function doc.guard_document_type();

create trigger document_stamp before update on doc.document
  for each row execute function iam.stamp_update();
create trigger record_history after insert or update on doc.document
  for each row execute function aud.capture_history();
-- Every upload and every change of the signed mark shows in the document's history.
create trigger record_history after insert or update on doc.document_version
  for each row execute function aud.capture_history();

-- ---------------------------------------------------------------------------------------------
-- Doors for DOC's data layer, which names no other module's schema (MODULE_BOUNDARIES)
-- ---------------------------------------------------------------------------------------------

-- The active document type with this code (REQ-DOC-001: an ADM catalog), or null.
create function doc.document_type_id(p_code text) returns uuid
language sql stable security definer
set search_path = ''
as $$
  select i.id from adm.catalog_item i join adm.catalog c on c.id = i.catalog_id
   where c.key = 'document_type' and i.code = p_code and i.status = 'active'
$$;

-- A document type's name as shown today (follows merges).
create function doc.document_type_name(p_item_id uuid) returns text
language sql stable security definer
set search_path = ''
as $$ select i.name from adm.catalog_item i where i.id = adm.catalog_item_final(p_item_id) $$;

-- An upload's object key is `documents/<document>/<upload>`, set by the database.
create function doc.set_upload_key() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.storage_key := 'documents/' || new.document_id || '/' || new.id;
  return new;
end
$$;

create trigger upload_key before insert on doc.upload
  for each row execute function doc.set_upload_key();

-- Archives a document the person may change, with its reason (REQ-DOC-006), in the audit log.
-- Returns false when the document does not exist for them.
create function doc.archive_document(p_document_id uuid, p_reason text) returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  d doc.document;
begin
  select * into d from doc.document where id = p_document_id for update;
  if d.id is null or not doc.can_access(d.record_schema, d.site_id, d.project_id,
                                        d.record_owner_user_id, d.data_class, true) then
    return false;
  end if;
  if coalesce(pg_catalog.btrim(p_reason), '') = '' then
    raise exception 'archiving needs a reason' using errcode = 'P0001',
      hint = 'doc.reason_required';
  end if;
  if d.status = 'archived' then
    return true;
  end if;
  perform pg_catalog.set_config('app.change_reason', p_reason, true);
  update doc.document
     set status = 'archived', archived_at = pg_catalog.now(),
         archived_by_user_id = core.current_user_id(), archive_reason = pg_catalog.btrim(p_reason)
   where id = d.id;
  perform aud.record_event('document.archived', 'doc', 'document', d.id, '{}'::jsonb);
  return true;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Completing an upload (SPIKE-15)
-- ---------------------------------------------------------------------------------------------

-- Types whose text the panel can read: images by recognition, PDFs by their text layer first.
create function doc.text_readable(p_mime text) returns boolean
language sql immutable parallel safe
as $$ select p_mime in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf') $$;

-- Turns a fully received upload into the document's next version, marks its text "okunuyor"
-- (or skipped for types without text), and publishes `document.uploaded`. Only the person who
-- started the upload may complete it; completing twice returns the same version.
create function doc.complete_upload(p_upload_id uuid, p_sha256 text default null) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  u doc.upload;
  version_id uuid;
begin
  select * into u from doc.upload where id = p_upload_id for update;
  if u.id is null or (session_user::text = 'geoges_app'
                      and u.created_by_user_id is distinct from core.current_user_id()) then
    raise exception 'no such upload' using errcode = '42501';
  end if;
  if u.status = 'completed' then
    select v.id into version_id from doc.document_version v where v.storage_key = u.storage_key;
    return version_id;
  end if;
  if u.status <> 'open' or u.received_bytes <> u.size_bytes then
    raise exception 'the upload is not complete' using errcode = 'P0001',
      hint = 'doc.upload_incomplete';
  end if;
  insert into doc.document_version (document_id, version_no, storage_key, file_name, mime_type,
                                    size_bytes, sha256, is_signed, uploaded_by_user_id)
  values (u.document_id, 0, u.storage_key, u.file_name, u.mime_type, u.size_bytes, p_sha256,
          u.is_signed, u.created_by_user_id)
  returning id into version_id;
  insert into doc.extracted_text (document_version_id, status)
  values (version_id, case when doc.text_readable(u.mime_type) then 'pending' else 'skipped' end);
  update doc.upload set status = 'completed', updated_at = pg_catalog.now() where id = u.id;
  perform core.publish_event('document.uploaded', 'doc', 'doc', 'document', u.document_id,
    pg_catalog.jsonb_build_object('document_id', u.document_id, 'version_id', version_id,
                                  'mime_type', u.mime_type));
  return version_id;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- Policies and privileges
-- ---------------------------------------------------------------------------------------------

alter table doc.document enable row level security;
alter table doc.document_version enable row level security;
alter table doc.upload enable row level security;
alter table doc.extracted_text enable row level security;

create policy document_read on doc.document for select to geoges_app
  using (doc.can_access(record_schema, site_id, project_id, record_owner_user_id, data_class));
create policy document_add on doc.document for insert to geoges_app
  with check (doc.can_access(record_schema, site_id, project_id, record_owner_user_id,
                             data_class, true));
create policy document_change on doc.document for update to geoges_app
  using (doc.can_access(record_schema, site_id, project_id, record_owner_user_id, data_class, true))
  with check (doc.can_access(record_schema, site_id, project_id, record_owner_user_id,
                             data_class, true));

create policy document_version_read on doc.document_version for select to geoges_app
  using (exists (select from doc.document d where d.id = document_id));
create policy document_version_add on doc.document_version for insert to geoges_app
  with check (exists (
    select from doc.document d
     where d.id = document_id
       and doc.can_access(d.record_schema, d.site_id, d.project_id, d.record_owner_user_id,
                          d.data_class, true)));
create policy document_version_sign on doc.document_version for update to geoges_app
  using (exists (
    select from doc.document d
     where d.id = document_id
       and doc.can_access(d.record_schema, d.site_id, d.project_id, d.record_owner_user_id,
                          d.data_class, true)));

-- An upload belongs to the person who started it.
create policy upload_own on doc.upload for all to geoges_app
  using (created_by_user_id = (select core.current_user_id()))
  with check (created_by_user_id = (select core.current_user_id()));

create policy extracted_text_read on doc.extracted_text for select to geoges_app
  using (exists (select from doc.document_version v where v.id = document_version_id));

revoke all on doc.document, doc.document_version, doc.upload, doc.extracted_text from public;
grant select, insert, update on doc.document, doc.document_version, doc.upload to geoges_app;
grant select on doc.extracted_text to geoges_app;

revoke all on function doc.can_access(text, uuid, uuid, uuid, text, boolean),
  doc.complete_upload(uuid, text), doc.text_readable(text), doc.document_type_id(text),
  doc.document_type_name(uuid), doc.archive_document(uuid, text) from public;
grant execute on function doc.can_access(text, uuid, uuid, uuid, text, boolean),
  doc.complete_upload(uuid, text), doc.text_readable(text), doc.document_type_id(text),
  doc.document_type_name(uuid), doc.archive_document(uuid, text) to geoges_app, geoges_worker;
