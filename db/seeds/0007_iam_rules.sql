-- Account security settings (TASK-0112, REQ-IAM-003, REQ-IAM-005, D-257, D-272).
-- Rules are never updated: a change is a new validity row written from Tanımlar. Re-runnable.

insert into adm.rule_key (id, key, module, name, description, value_type, unit, allowed_scopes)
values
  (md5('adm.rule_key:iam.login-attempt-limit')::uuid, 'iam.login-attempt-limit', 'iam',
   'Hatalı giriş sınırı', 'Hesabın geçici olarak kilitlenmesi için ardışık hatalı deneme sayısı.',
   'number', 'deneme', '{company}'),
  (md5('adm.rule_key:iam.login-lock-minutes')::uuid, 'iam.login-lock-minutes', 'iam',
   'Giriş kilidi süresi', 'Sınır aşıldığında hesabın kilitli kalacağı süre.',
   'number', 'dakika', '{company}'),
  (md5('adm.rule_key:iam.session-days')::uuid, 'iam.session-days', 'iam',
   'Oturum ömrü', 'Bir oturumun en çok yaşayacağı gün sayısı.',
   'number', 'gün', '{company}'),
  (md5('adm.rule_key:iam.session-idle-days')::uuid, 'iam.session-idle-days', 'iam',
   'Hareketsizlik süresi', 'Bu kadar gün hiç kullanılmayan oturum kapanır.',
   'number', 'gün', '{company}'),
  (md5('adm.rule_key:iam.two-factor-roles')::uuid, 'iam.two-factor-roles', 'iam',
   'İki adımlı giriş zorunlu roller',
   'Bu rolleri taşıyan kişi ikinci adımı kurmadan panele geçemez.',
   'json', null, '{company}')
on conflict do nothing;

insert into adm.rule (id, rule_key_id, valid_from, value, reason)
values
  (md5('adm.rule:iam.login-attempt-limit:2026-01-01')::uuid,
   md5('adm.rule_key:iam.login-attempt-limit')::uuid, '2026-01-01', '5',
   'Başlangıç ayarı: 5 hatalı deneme; yönetici değiştirebilir'),
  (md5('adm.rule:iam.login-lock-minutes:2026-01-01')::uuid,
   md5('adm.rule_key:iam.login-lock-minutes')::uuid, '2026-01-01', '15',
   'Başlangıç ayarı: 15 dakika kilit; yönetici değiştirebilir'),
  (md5('adm.rule:iam.session-days:2026-01-01')::uuid,
   md5('adm.rule_key:iam.session-days')::uuid, '2026-01-01', '30',
   'Başlangıç ayarı: 30 gün'),
  (md5('adm.rule:iam.session-idle-days:2026-01-01')::uuid,
   md5('adm.rule_key:iam.session-idle-days')::uuid, '2026-01-01', '3',
   'Başlangıç ayarı: 3 günlük hareketsizlik'),
  (md5('adm.rule:iam.two-factor-roles:2026-01-01')::uuid,
   md5('adm.rule_key:iam.two-factor-roles')::uuid, '2026-01-01', '[]',
   'Başlangıç ayarı: hiçbir rol için zorunlu değil; sahip Tanımlar''dan seçer')
on conflict do nothing;
