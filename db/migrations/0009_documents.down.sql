-- Reverses 0009_documents.sql: the doc schema and the document-type guard on catalog items.
-- R2 objects of test documents are removed separately (they are never deleted by the panel).
drop trigger document_type_guard on adm.catalog_item;
drop schema doc cascade;
delete from core.table_layer where schema_name = 'doc';
