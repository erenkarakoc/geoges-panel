-- Task and notification settings (TASK-0108, REQ-TSK-006, REQ-TSK-012, REQ-TSK-013, D-263).
-- Rules are never updated: a change is a new validity row written from Tanımlar. Re-runnable.

insert into adm.rule_key (id, key, module, name, description, value_type, unit, allowed_scopes)
values
  (md5('adm.rule_key:tsk.digest-time')::uuid, 'tsk.digest-time', 'tsk',
   'Günlük özet saati', 'Sabah özetinin gönderildiği saat (İstanbul).', 'time', null,
   '{company}'),
  (md5('adm.rule_key:tsk.escalation-wait-hours')::uuid, 'tsk.escalation-wait-hours', 'tsk',
   'Eskalasyon bekleme süresi', 'Geciken görev bir üst basamağa çıkmadan önce beklenen saat.',
   'number', 'saat', '{company,unit,project,site}')
on conflict do nothing;

insert into adm.rule (id, rule_key_id, valid_from, value, reason)
values
  (md5('adm.rule:tsk.digest-time:2026-01-01')::uuid,
   md5('adm.rule_key:tsk.digest-time')::uuid, '2026-01-01', '"07:30"',
   'Başlangıç ayarı: sabah 07:30 (REQ-TSK-013 örneği)'),
  (md5('adm.rule:tsk.escalation-wait-hours:2026-01-01')::uuid,
   md5('adm.rule_key:tsk.escalation-wait-hours')::uuid, '2026-01-01', '24',
   'Başlangıç ayarı: 24 saat; eskalasyon akışı Faz 08''de bu ayarı devralır (D-263)')
on conflict do nothing;
