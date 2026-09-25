-- Factory company calendar, 2026 public holidays and the exchange-rate fetch rules (TASK-0106,
-- REQ-ADM-010, SPIKE-11, D-261). Re-runnable: fixed ids, never overwritten. Holidays of later
-- years are entered year by year (REQ-ADM-010).
insert into adm.working_calendar (id, scope_type, valid_from, office_start, office_end,
                                  field_start, field_end, weekend_days, salary_day, reason)
values (md5('adm.working_calendar:company:2026-01-01')::uuid, 'company', '2026-01-01',
        '08:00', '17:00', '08:00', '18:00', '{6,7}', 1, 'Başlangıç takvimi')
on conflict do nothing;

insert into adm.holiday (id, holiday_on, name, is_half_day)
select md5('adm.holiday:company:' || h.d)::uuid, h.d::date, h.name, h.half
  from (values
    ('2026-01-01', 'Yılbaşı', false),
    ('2026-03-19', 'Ramazan Bayramı arifesi', true),
    ('2026-03-20', 'Ramazan Bayramı 1. gün', false),
    ('2026-03-21', 'Ramazan Bayramı 2. gün', false),
    ('2026-03-22', 'Ramazan Bayramı 3. gün', false),
    ('2026-04-23', 'Ulusal Egemenlik ve Çocuk Bayramı', false),
    ('2026-05-01', 'Emek ve Dayanışma Günü', false),
    ('2026-05-19', 'Atatürk''ü Anma, Gençlik ve Spor Bayramı', false),
    ('2026-05-26', 'Kurban Bayramı arifesi', true),
    ('2026-05-27', 'Kurban Bayramı 1. gün', false),
    ('2026-05-28', 'Kurban Bayramı 2. gün', false),
    ('2026-05-29', 'Kurban Bayramı 3. gün', false),
    ('2026-05-30', 'Kurban Bayramı 4. gün', false),
    ('2026-07-15', 'Demokrasi ve Millî Birlik Günü', false),
    ('2026-08-30', 'Zafer Bayramı', false),
    ('2026-10-28', 'Cumhuriyet Bayramı arifesi', true),
    ('2026-10-29', 'Cumhuriyet Bayramı', false)) as h(d, name, half)
on conflict do nothing;

insert into adm.rule_key (id, key, module, name, description, value_type, unit, allowed_scopes)
values
  (md5('adm.rule_key:adm.exchange-rate-fetch-time')::uuid, 'adm.exchange-rate-fetch-time', 'adm',
   'Kur alma saati', 'TCMB bülteninin istendiği ilk saat (İstanbul).', 'time', null, '{company}'),
  (md5('adm.rule_key:adm.exchange-rate-retry-minutes')::uuid, 'adm.exchange-rate-retry-minutes',
   'adm', 'Kur yeniden deneme aralıkları', 'Bülten gelmezse denemeler arası dakikalar.', 'json',
   'dakika', '{company}')
on conflict do nothing;

insert into adm.rule (id, rule_key_id, valid_from, value, reason)
values
  (md5('adm.rule:adm.exchange-rate-fetch-time:2026-01-01')::uuid,
   md5('adm.rule_key:adm.exchange-rate-fetch-time')::uuid, '2026-01-01', '"16:00"',
   'Başlangıç ayarı: TCMB yayını 15.30 civarı (SPIKE-11)'),
  (md5('adm.rule:adm.exchange-rate-retry-minutes:2026-01-01')::uuid,
   md5('adm.rule_key:adm.exchange-rate-retry-minutes')::uuid, '2026-01-01', '[10, 30, 60]',
   'Başlangıç ayarı: 10, 30, 60 dakika (SPIKE-11)')
on conflict do nothing;
