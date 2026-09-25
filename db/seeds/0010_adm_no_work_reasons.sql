-- "No work" reasons (TASK-0121, REQ-SIT-010). Re-runnable: fixed ids from the key, never
-- overwritten. A working day with no work needs one of these before its short record can be sent;
-- management adds more under Tanımlar.
insert into adm.catalog (id, key, name, description, allows_project_scope, allows_user_additions)
values (md5('adm.catalog:no_work_reason')::uuid, 'no_work_reason', 'Çalışma yok nedenleri',
        'Bir iş gününde iş yapılmadığında seçilen neden (REQ-SIT-010).', false, false)
on conflict do nothing;

insert into adm.catalog_item (id, catalog_id, code, name)
select md5('adm.catalog_item:no_work_reason:' || r.code)::uuid,
       md5('adm.catalog:no_work_reason')::uuid, r.code, r.name
  from (values ('weather', 'Hava koşulları'),
               ('client_wait', 'İşveren beklemesi'),
               ('no_material', 'Malzeme yok'),
               ('equipment_down', 'Ekipman arızası'),
               ('site_closed', 'Şantiye kapalı'),
               ('other', 'Diğer')) as r(code, name)
on conflict do nothing;
