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
    ('sariyar', 'ankara', 'Sarıyar Şantiyesi', 'in_house', null, 'Ankara', 40.03800, 31.41800),
    ('beypazari', 'ankara', 'Beypazarı Şantiyesi', 'subcontracted', 'subcontractor-crew', 'Ankara',
     40.16700, 31.92100))
       as s(key, project, name, model, subcontractor, city, latitude, longitude)
on conflict do nothing;

-- Rev.0 of the Kastamonu project: two walls on Kavaklı, one on Ilgaz, with panel and strip
-- targets from the sample definitions of 0001. It is written as a draft and approved in place, the
-- way the flow would (the approval sets its valid-from day to the day the samples are loaded).
insert into prj.project_revision (id, project_id, revision_no, reason)
values (md5('sample:revision:kastamonu:0')::uuid, md5('sample:project:kastamonu')::uuid, 0,
        'Örnek ilk hedefler (pilot)')
on conflict do nothing;

insert into prj.wall (id, project_id, site_id, code, name)
select md5('sample:wall:' || w.code)::uuid, md5('sample:project:kastamonu')::uuid,
       md5('sample:site:' || w.site)::uuid, w.code, w.name
  from (values ('K-D1', 'kavakli', 'Kavaklı Duvar 1 Sağ'),
               ('K-D2', 'kavakli', 'Kavaklı Duvar 2 Sol'),
               ('I-D1', 'ilgaz', 'Ilgaz Şev Duvarı')) as w(code, site, name)
on conflict do nothing;

insert into prj.revision_wall (id, revision_id, project_id, wall_id, length_m, height_m)
select md5('sample:revision_wall:' || w.code)::uuid, md5('sample:revision:kastamonu:0')::uuid,
       md5('sample:project:kastamonu')::uuid, md5('sample:wall:' || w.code)::uuid, w.len, w.h
  from (values ('K-D1', 180.0, 6.0), ('K-D2', 95.0, 4.5), ('I-D1', 240.0, 7.5)) as w(code, len, h)
 where exists (select from prj.project_revision r
                where r.id = md5('sample:revision:kastamonu:0')::uuid and r.status = 'draft')
on conflict do nothing;

insert into prj.wall_target (id, revision_id, wall_id, kind, panel_type_id, strip_type_id,
                             strip_length_m, qty, length_m)
select md5('sample:wall_target:' || t.key)::uuid, md5('sample:revision:kastamonu:0')::uuid,
       md5('sample:wall:' || t.wall)::uuid, t.kind,
       case when t.kind = 'panel' then md5('sample:panel_type:' || t.type)::uuid end,
       case when t.kind = 'strip' then md5('sample:strip_type:' || t.type)::uuid end,
       t.strip_length, t.qty, t.length
  from (values ('kd1-p150', 'K-D1', 'panel', 'P-150', null::numeric, 420::numeric, null::numeric),
               ('kd1-p100', 'K-D1', 'panel', 'P-100', null, 60, null),
               ('kd1-t100', 'K-D1', 'panel', 'T-100', null, 120, null),
               ('kd1-s50x4', 'K-D1', 'strip', '50x4', 6, null, 7560),
               ('kd2-p150', 'K-D2', 'panel', 'P-150', null, 170, null),
               ('kd2-t075', 'K-D2', 'panel', 'T-075', null, 64, null),
               ('kd2-s40x4', 'K-D2', 'strip', '40x4', 4.5, null, 2880),
               ('id1-p150', 'I-D1', 'panel', 'P-150', null, 760, null),
               ('id1-p125', 'I-D1', 'panel', 'P-125', null, 40, null),
               ('id1-s50x5', 'I-D1', 'strip', '50x5', 9, null, 14400))
       as t(key, wall, kind, type, strip_length, qty, length)
 where exists (select from prj.project_revision r
                where r.id = md5('sample:revision:kastamonu:0')::uuid and r.status = 'draft')
on conflict do nothing;

update prj.project_revision set status = 'submitted'
 where id = md5('sample:revision:kastamonu:0')::uuid and status = 'draft';
update prj.project_revision set status = 'approved'
 where id = md5('sample:revision:kastamonu:0')::uuid and status = 'submitted';
