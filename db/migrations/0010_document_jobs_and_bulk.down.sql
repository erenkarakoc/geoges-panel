-- Reverses 0010_document_jobs_and_bulk.sql.
drop function doc.record_bulk_download(uuid[], jsonb);
drop index doc.ix_upload__expired;
revoke select, update on doc.upload from geoges_worker;
revoke select, update on doc.extracted_text from geoges_worker;
revoke select on doc.document_version from geoges_worker;
