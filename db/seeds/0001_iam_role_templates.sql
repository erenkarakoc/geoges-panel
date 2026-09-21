-- Factory roles and permission types (TASK-0102, docs/domain/PERMISSION_MATRIX.md, D-256).
--
-- Re-runnable: every row has a fixed id derived from its code, and an existing row is never
-- overwritten, so a role the owner renamed or a permission the owner took back stays as it is.
-- `db:reset:config` empties configuration and runs this file again.
--
-- The matrix below is PERMISSION_MATRIX's table, cell for cell, in its column order:
--   SAH GM GK KO SM FO TEB VO TO SAT MUH IK SAL FAB KIS
-- Y = `<object>.manage` and `<object>.view`, G = `<object>.view`, K = `<object>.own` (only what
-- concerns the person), - = nothing; a trailing t / h opens commercial / sensitive personal data
-- of that module (REQ-IAM-011). Modules refine these module-level types with their own permission
-- types when they are built; the role templates keep these rows.

-- Hierarchy (REQ-IAM-014): owner → general manager → general coordinator → coordinator → site
-- engineer → foreman → crew lead; crane operator under the site engineer; the office roles under
-- the general manager. The owner can change every level and link afterwards (REQ-IAM-009).
with template (code, name, level, parent_code, is_owner_layer, description) as (values
  ('SAH', 'Sahip', 100, null, true, 'Varsayılan kapsam: tüm şirket (kısıtlanamaz).'),
  ('GM', 'Genel Müdür', 90, 'SAH', false,
   'Genel Müdür Yardımcısı da bu şablondan kurulur. Varsayılan kapsam: tüm şirket.'),
  ('GK', 'Genel Koordinatör', 80, 'GM', false, 'Varsayılan kapsam: tüm şirket.'),
  ('KO', 'Koordinatör', 70, 'GK', false,
   'Şantiyeler Koordinatörü. Varsayılan kapsam: atandığı şantiyeler.'),
  ('SM', 'Saha Mühendisi', 60, 'KO', false, 'Varsayılan kapsam: atandığı şantiye.'),
  ('FO', 'Formen', 50, 'SM', false, 'Varsayılan kapsam: atandığı şantiye.'),
  ('TEB', 'Taşeron Ekip Başı', 40, 'FO', false, 'Varsayılan kapsam: kendi ekibi ve şantiyesi.'),
  ('VO', 'Vinç Operatörü', 40, 'SM', false, 'Varsayılan kapsam: atandığı vinçler.'),
  ('TO', 'Teknik Ofis', 70, 'GM', false, 'Varsayılan kapsam: tüm şirket.'),
  ('SAT', 'Satış / İş Geliştirme', 70, 'GM', false, 'Varsayılan kapsam: tüm şirket.'),
  ('MUH', 'Muhasebe', 70, 'GM', false, 'Varsayılan kapsam: tüm şirket.'),
  ('IK', 'İnsan Kaynakları', 70, 'GM', false, 'Varsayılan kapsam: tüm şirket.'),
  ('SAL', 'Satın Alma & Lojistik', 70, 'GM', false, 'Varsayılan kapsam: tüm şirket.'),
  ('FAB', 'Fabrika Sorumlusu', 70, 'GM', false, 'Varsayılan kapsam: fabrika.'),
  ('KIS', 'Kalite & İSG Sorumlusu', 70, 'GM', false, 'Varsayılan kapsam: tüm şirket.')
)
insert into iam.role (id, code, name, description, level, parent_role_id, is_owner_layer,
                      has_full_visibility)
select md5('iam.role:' || t.code)::uuid, t.code, t.name, t.description, t.level,
       md5('iam.role:' || t.parent_code)::uuid, t.is_owner_layer, t.is_owner_layer
  from template t
on conflict do nothing;

-- One matrix cell per row, used by the three statements below; dropped at commit.
create temporary table seed_matrix_cell on commit drop as
with matrix (object, label, actions, cells) as (values
  ('tsk.module', 'Bugün, görevler, bildirimler', 'manage view own',
   'Y  Y  Y  Y  Y  Y  K  K  Y  Y  Y  Y  Y  Y  Y'),
  ('wfl.approval', 'Onay Merkezi', 'manage view own',
   'Y  Y  Y  Y  K  K  K  K  K  K  K  K  K  K  K'),
  ('wfl.workflow', 'Akış tasarımı', 'design',
   'Y  -  -  -  -  -  -  -  -  -  -  -  -  -  -'),
  ('iam.module', 'Kullanıcılar & Roller', 'manage view own',
   'Y  G  -  -  -  -  -  -  -  -  -  G  -  -  -'),
  ('aud.module', 'Denetim Kayıtları', 'manage view own',
   'Y  -  -  -  -  -  -  -  -  -  -  -  -  -  -'),
  ('adm.module', 'Tanımlar', 'manage view own',
   'Y  Y  G  G  G  -  -  -  Y  G  Y  Y  G  G  G'),
  ('prj.module', 'Projeler', 'manage view own',
   'Yt Yt Yt Gt G  G  K  -  Yt Gt Gt -  G  -  G'),
  ('sit.module', 'Şantiye ve günlük kayıt', 'manage view own',
   'Gt Gt Gt Yt Y  Y  K  -  G  -  Gt G  G  -  G'),
  ('inv.module', 'Stok', 'manage view own',
   'Gt Gt Gt Gt Y  K  -  -  G  G  Gt -  Yt Y  G'),
  ('pur.module', 'Satın Alma', 'manage view own',
   'Yt Yt Gt K  K  K  -  -  -  -  Gt -  Yt K  -'),
  ('fac.module', 'Fabrika', 'manage view own',
   'Gt Gt G  -  -  -  -  -  G  G  Gt G  G  Y  G'),
  ('eqp.module', 'Ekipman', 'manage view own',
   'Gt Gt Gt Gt Y  K  -  K  -  -  Gt G  Yt Y  G'),
  ('fin.module', 'Finans', 'manage view own',
   'Yt Yt Gt Yt K  K  K  K  -  Gt Yt -  Gt K  -'),
  ('hr.module', 'İK', 'manage view own',
   'Yh Gh G  G  K  K  -  K  K  K  Gh Yh K  K  G'),
  ('crm.module', 'Talepler & Müşteriler', 'manage view own',
   'Gt Gt G  K  -  -  -  -  Y  Yt Gt -  -  -  -'),
  ('qte.module', 'Teklif', 'manage view own',
   'Yt Yt Gt -  -  -  -  -  Yt Yt Gt -  G  G  -'),
  ('cmp.module', 'Uyum', 'manage view own',
   'Yt Yt Gt Gt G  -  -  -  G  Gt Yt G  Gt -  G'),
  ('qhs.module', 'Kalite & İSG', 'manage view own',
   'G  G  G  Y  Y  Y  K  K  G  -  -  G  G  Y  Y'),
  ('mtg.module', 'Toplantı & Karar', 'manage view own',
   'Y  Y  Y  Y  K  K  K  K  K  K  K  K  K  K  K'),
  ('doc.module', 'Arşiv', 'manage view own',
   'G  G  G  G  G  G  K  K  G  G  G  G  G  G  G'),
  ('sup.module', 'Destek', 'manage view own',
   'Y  Y  Y  Y  Y  Y  Y  Y  Y  Y  Y  Y  Y  Y  Y'),
  ('prf.module', 'Performans', 'manage view own',
   'Yh Yh G  Y  Y  Y  -  K  K  K  Gh Gh K  Y  K'),
  ('int.module', 'Öneriler', 'manage view own',
   'Gt Gt Gt Gt K  -  -  -  G  G  Gt -  G  G  G'),
  ('str.module', 'Strateji', 'manage view own',
   'Yt Yt -  -  -  -  -  -  -  -  Gt -  -  -  -'),
  ('rpt.system-health', 'Sistem gözü', 'view',
   'G  G  -  -  -  -  -  -  -  -  -  -  -  -  -')
),
role_order (code, n) as (
  select code, n from unnest(array['SAH', 'GM', 'GK', 'KO', 'SM', 'FO', 'TEB', 'VO', 'TO', 'SAT',
                                   'MUH', 'IK', 'SAL', 'FAB', 'KIS']) with ordinality as r(code, n)
)
select m.object, m.label, m.actions, r.code as role_code, c.value as mark
  from matrix m
 cross join lateral regexp_split_to_table(btrim(m.cells), '\s+') with ordinality as c(value, n)
  join role_order r on r.n = c.n;

insert into iam.permission (id, code, module, name, created_from)
select distinct on (p.code) md5('iam.permission:' || p.code)::uuid, p.code,
       split_part(p.code, '.', 1),
       p.label || case p.action
         when 'manage' then ': veri girer ve işlem yapar'
         when 'view' then ': görür'
         when 'own' then ': yalnız kendisiyle ilgili olanı görür'
         when 'design' then ': akış tasarlar' end,
       'seed'
  from (select c.object || '.' || a.action as code, c.label, a.action
          from seed_matrix_cell c
         cross join lateral regexp_split_to_table(c.actions, ' ') as a(action)) p
on conflict do nothing;

insert into iam.role_permission (id, role_id, permission_id)
select md5('iam.role_permission:' || c.role_code || ':' || c.object || '.' || g.action)::uuid,
       md5('iam.role:' || c.role_code)::uuid,
       md5('iam.permission:' || c.object || '.' || g.action)::uuid
  from seed_matrix_cell c
 cross join lateral unnest(case left(c.mark, 1)
     when 'Y' then case when c.actions = 'design' then array['design']
                        else array['manage', 'view'] end
     when 'G' then array['view']
     when 'K' then array['own']
     else array[]::text[] end) as g(action)
on conflict do nothing;

-- The owner layer has full visibility (module '*'), so it needs no rows here.
with data_class as (
  select c.role_code, split_part(c.object, '.', 1) as module,
         bool_or(position('t' in c.mark) > 0) as commercial,
         bool_or(position('h' in c.mark) > 0) as sensitive
    from seed_matrix_cell c
   where c.role_code <> 'SAH' and c.mark ~ '[th]'
   group by c.role_code, split_part(c.object, '.', 1)
)
insert into iam.role_data_class (id, role_id, module, can_see_commercial, can_see_sensitive)
select md5('iam.role_data_class:' || d.role_code || ':' || d.module)::uuid,
       md5('iam.role:' || d.role_code)::uuid, d.module, d.commercial, d.sensitive
  from data_class d
on conflict do nothing;

-- The bootstrap owner gets the owner role back after a configuration reset (D-256).
insert into iam.role_assignment (user_id, role_id, scope_type, reason)
select u.id, md5('iam.role:SAH')::uuid, 'company', 'Başlangıç sahibi (fabrika ayarı)'
  from iam.user u
 where u.is_bootstrap_owner
   and not exists (
     select from iam.role_assignment x
      where x.user_id = u.id and x.role_id = md5('iam.role:SAH')::uuid and not x.is_delegation
        and (x.ends_on is null or x.ends_on >= iam.today()));
