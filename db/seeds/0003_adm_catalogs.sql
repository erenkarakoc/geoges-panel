-- Factory catalogs of REQ-ADM-001 (TASK-0105, CONFIGURATION section 2). Re-runnable: fixed ids
-- from the key, never overwritten. The domain-specific definitions of REQ-ADM-002…004 (panel and
-- strip types, consumption recipes) arrive with Phase 09's master data.
insert into adm.catalog (id, key, name, description, allows_project_scope, allows_user_additions)
values
  (md5('adm.catalog:work_item')::uuid, 'work_item', 'İş kalemleri',
   'Keşif, hakediş ve teklif satırlarının kalemleri.', true, false),
  (md5('adm.catalog:unit')::uuid, 'unit', 'Birimler', 'Miktarların ölçü birimleri.', false, false),
  (md5('adm.catalog:consumable')::uuid, 'consumable', 'Sarf malzemeler',
   'Sahada ve fabrikada tüketilen sarf malzemeler.', false, true),
  (md5('adm.catalog:expense_category')::uuid, 'expense_category', 'Gider kategorileri',
   'Harcama ve gider kayıtlarının kategorileri.', true, true)
on conflict do nothing;

insert into adm.catalog_item (id, catalog_id, code, name)
select md5('adm.catalog_item:unit:' || u.code)::uuid, md5('adm.catalog:unit')::uuid, u.code, u.name
  from (values ('adet', 'Adet'), ('m', 'Metre'), ('m2', 'Metrekare'), ('m3', 'Metreküp'),
               ('kg', 'Kilogram'), ('t', 'Ton'), ('h', 'Saat'), ('gun', 'Gün')) as u(code, name)
on conflict do nothing;
