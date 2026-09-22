-- Document types (TASK-0107, REQ-DOC-001 "Tanımla ayarlanan: belge türleri", D-262): the
-- examples of REQ-DOC-001. No health report type exists (D-186; a guard refuses one). Re-runnable.
insert into adm.catalog (id, key, name, description, allows_project_scope, allows_user_additions)
values (md5('adm.catalog:document_type')::uuid, 'document_type', 'Belge türleri',
        'Kayıtlara eklenen belgelerin türleri.', false, false)
on conflict do nothing;

insert into adm.catalog_item (id, catalog_id, code, name)
select md5('adm.catalog_item:document_type:' || t.code)::uuid, md5('adm.catalog:document_type')::uuid,
       t.code, t.name
  from (values ('contract', 'Sözleşme'), ('progress_payment', 'Hakediş'), ('payroll', 'Bordro'),
               ('custody_record', 'Zimmet tutanağı'), ('invoice', 'Fatura'),
               ('weighing_slip', 'Tartım fişi'), ('certificate', 'Sertifika'),
               ('photo', 'Fotoğraf'), ('receipt', 'Dekont'), ('delivery_note', 'İrsaliye'),
               ('other', 'Diğer')) as t(code, name)
on conflict do nothing;
