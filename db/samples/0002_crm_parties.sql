-- Sample firms for the pilot (TASK-0122, D-290). SAMPLE DATA: invented firms with invented tax
-- numbers (they start 999, which no real tax office issues in this form), one for each role the
-- daily log and the project card will ask for. Loaded by `npm run db:sample`; re-runnable (fixed
-- ids, never overwritten).

insert into crm.party (id, name, tax_no, tax_office, roles, city, phone, email, note)
select md5('sample:party:' || p.key)::uuid, p.name, p.tax_no, p.tax_office, p.roles::text[],
       p.city, p.phone, p.email, 'Örnek firma (pilot)'
  from (values
    ('client-highways', 'Örnek Karayolları Bölge Müdürlüğü', '9990000001', 'Örnek VD',
     '{client}', 'Ankara', '0312 000 00 01', null),
    ('client-contractor', 'Örnek Yol Yapım İnşaat A.Ş.', '9990000002', 'Örnek VD',
     '{client,customer}', 'İstanbul', '0212 000 00 02', 'bilgi@ornek-yol.example'),
    ('supplier-galvanizer', 'Örnek Galvaniz Sanayi Ltd. Şti.', '9990000003', 'Örnek VD',
     '{supplier}', 'Kocaeli', '0262 000 00 03', null),
    ('supplier-steel', 'Örnek Hadde ve Çelik A.Ş.', '9990000004', 'Örnek VD',
     '{supplier,customer}', 'Karabük', '0370 000 00 04', null),
    ('subcontractor-crew', 'Örnek Montaj Taşeronluk', '9990000005', 'Örnek VD',
     '{subcontractor}', 'Konya', '0332 000 00 05', null),
    ('lessor-crane', 'Örnek Vinç Kiralama Ltd. Şti.', '9990000006', 'Örnek VD',
     '{lessor}', 'Ankara', '0312 000 00 06', null))
       as p(key, name, tax_no, tax_office, roles, city, phone, email)
on conflict do nothing;

insert into crm.party_contact (id, party_id, name, title, phone)
select md5('sample:party_contact:' || c.key)::uuid, md5('sample:party:' || c.party)::uuid,
       c.name, c.title, c.phone
  from (values
    ('highways-control', 'client-highways', 'Örnek Kontrol Mühendisi', 'Kontrol mühendisi',
     '0500 000 00 01'),
    ('contractor-site', 'client-contractor', 'Örnek Şantiye Şefi', 'Şantiye şefi',
     '0500 000 00 02'),
    ('galvanizer-sales', 'supplier-galvanizer', 'Örnek Satış Sorumlusu', 'Satış',
     '0500 000 00 03'),
    ('crane-dispatch', 'lessor-crane', 'Örnek Operasyon Sorumlusu', 'Operasyon',
     '0500 000 00 06'))
       as c(key, party, name, title, phone)
on conflict do nothing;
