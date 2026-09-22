-- 0010 — documents' background work and bulk download (TASK-0107 steps 2-4, D-262,
-- SPIKE-15/16, REQ-DOC-007).
--
-- The worker reads each new version to recognise its text and writes the result, and closes
-- uploads that were never finished once they expire. It never deletes and never touches a
-- document row. A bulk download is written to the audit log with who, when and which
-- documents, before any file is sent.

grant select on doc.document_version to geoges_worker;
grant select, update on doc.extracted_text to geoges_worker;
grant select, update on doc.upload to geoges_worker;

create index ix_upload__expired on doc.upload (expires_at) where status = 'open';

-- Records a bulk download of the given documents (REQ-DOC-007). Only documents the person may
-- see are named; the scope says whether a record's or a project's documents were asked for.
create function doc.record_bulk_download(p_document_ids uuid[], p_scope jsonb) returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  visible uuid[];
begin
  select coalesce(pg_catalog.array_agg(d.id order by d.id), '{}') into visible
    from doc.document d
   where d.id = any (p_document_ids)
     and doc.can_access(d.record_schema, d.site_id, d.project_id, d.record_owner_user_id,
                        d.data_class);
  perform aud.record_event('document.bulk_downloaded', 'doc', 'document', null,
    pg_catalog.jsonb_build_object('scope', p_scope, 'count', pg_catalog.cardinality(visible),
                                  'document_ids', pg_catalog.to_jsonb(visible)));
  return pg_catalog.cardinality(visible);
end
$$;

revoke all on function doc.record_bulk_download(uuid[], jsonb) from public;
grant execute on function doc.record_bulk_download(uuid[], jsonb) to geoges_app;
