-- Sample projects and sites for the pilot (TASK-0123, D-290). SAMPLE DATA: invented projects on
-- the sample firms of 0002, with the site names the shell's sample seats already use (Kavaklı,
-- Ilgaz, Sarıyar). Loaded by `npm run db:sample`; re-runnable (fixed ids, never overwritten).
-- Walls, revisions and a week of daily logs arrive with later steps and TASK-0131.

insert into prj.project (id, code, name, client_party_id, authority, city, location,
                         contract_no, contract_signed_on, contract_start_on, contract_end_on,
                         theoretical_end_on, management_target_end_on, stage)
select md5('sample:project:' || p.key)::uuid, p.code, p.name,
       md5('sample:party:' || p.client)::uuid, p.authority, p.city, p.location, p.contract_no,
       p.signed::date, p.started::date, p.contract_end::date, p.theoretical_end::date,
       p.target_end::date, p.stage
  from (values
    ('kastamonu', 'ORN-2026-01', 'Örnek Kastamonu istinat duvarları', 'client-highways',
     'Örnek Karayolları Bölge Müdürlüğü', 'Kastamonu', 'Km 12+300 – 14+100', 'ÖRN/2026/01',
     '2026-03-02', '2026-03-16', '2027-06-30', '2027-05-15', '2027-03-31', 'execution'),
    ('ankara', 'ORN-2026-02', 'Örnek Sarıyar baraj yolu duvarı', 'client-contractor',
     'Örnek Devlet Su İşleri Bölge Müdürlüğü', 'Ankara', 'Baraj yolu, 3. kesim', 'ÖRN/2026/02',
     '2026-05-11', '2026-06-01', '2027-09-30', '2027-08-31', '2027-07-15', 'mobilisation'))
       as p(key, code, name, client, authority, city, location, contract_no, signed, started,
            contract_end, theoretical_end, target_end, stage)
on conflict do nothing;

insert into prj.project_contract (id, project_id, contract_value, currency)
select md5('sample:project_contract:' || c.key)::uuid, md5('sample:project:' || c.key)::uuid,
       c.value, c.currency
  from (values ('kastamonu', 48500000.00, 'TRY'), ('ankara', 1250000.00, 'EUR'))
       as c(key, value, currency)
on conflict do nothing;

insert into sit.site (id, project_id, name, work_model, subcontractor_party_id, city, latitude,
                      longitude)
select md5('sample:site:' || s.key)::uuid, md5('sample:project:' || s.project)::uuid, s.name,
       s.model, case when s.subcontractor is null then null
                     else md5('sample:party:' || s.subcontractor)::uuid end,
       s.city, s.latitude, s.longitude
  from (values
    ('kavakli', 'kastamonu', 'Kavaklı Şantiyesi', 'in_house', null, 'Kastamonu', 41.37600, 33.77600),
    ('ilgaz', 'kastamonu', 'Ilgaz Şantiyesi', 'subcontracted', 'subcontractor-crew', 'Kastamonu',
     41.05000, 33.72000),
    ('sariyar', 'ankara', 'Sarıyar Şantiyesi', 'in_house', null, 'Ankara', 40.03800, 31.41800))
       as s(key, project, name, model, subcontractor, city, latitude, longitude)
on conflict do nothing;
