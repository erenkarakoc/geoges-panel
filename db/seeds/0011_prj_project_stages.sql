-- Project stages (TASK-0123, REQ-PRJ-003). Re-runnable: fixed ids from the code, never
-- overwritten. The codes are the ones Phase 08's templates already move projects to
-- (`technical_design`, `mobilisation`, `completion`), so those flows run unchanged. Management adds
-- stages under Tanımlar; which transitions need an approval is the flows'.
insert into adm.catalog (id, key, name, description, allows_project_scope, allows_user_additions)
values (md5('adm.catalog:project_stage')::uuid, 'project_stage', 'Proje aşamaları',
        'Projenin talepten kapanışa geçtiği aşamalar (REQ-PRJ-003).', false, false)
on conflict do nothing;

insert into adm.catalog_item (id, catalog_id, code, name)
select md5('adm.catalog_item:project_stage:' || s.code)::uuid,
       md5('adm.catalog:project_stage')::uuid, s.code, s.name
  from (values ('lead', 'Talep / fırsat'),
               ('pre_study', 'Ön inceleme ve yaklaşık miktar'),
               ('quote', 'Teklif'),
               ('negotiation', 'Görüşme / pazarlık'),
               ('contract', 'Sözleşme'),
               ('technical_design', 'Teknik proje, statik hesap, kurum onayı'),
               ('mobilisation', 'Mobilizasyon ve saha kurulumu'),
               ('execution', 'Uygulama / üretim'),
               ('progress_payments', 'Aylık hakedişler ve ara teslimler'),
               ('completion', 'Tamamlama'),
               ('final_acceptance', 'Kesin kabul / kapanış'),
               ('closure', 'Teminat ve kapanış yükümlülükleri')) as s(code, name)
on conflict do nothing;
