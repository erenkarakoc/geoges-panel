# Şema — Platform (IAM, AUD, DOC, WFL, TSK, ADM)

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-22

Platform modüllerinin tabloları. Ortak kurallar `docs/database/CONVENTIONS.md`'dedir ve burada tekrar edilmez: her tabloda `id`, oluşturma/güncelleme izleri, kapsam sütunu, RLS politikası ve geçmiş kanalı vardır. Alan modeli: `docs/domain/DOMAIN_MODEL.md`. Görev: TASK-0066.

Sütun listeleri **ayırt edici** olanları verir; ortak sütunlar yazılmaz.

## iam — Kimlik ve yetki

| Tablo | Ne tutar | Ayırt edici sütunlar | Notlar |
|---|---|---|---|
| `iam.user` | Panele giren kişi | `email`, `display_name`, `status` (active/disabled), `auth_provider_id`, `employee_id` (HR, nullable), `must_setup_2fa`, `left_on`, `is_bootstrap_owner`, `is_sample` | Kendi kendine kayıt yok. `id` Supabase Auth kullanıcı kimliğidir, `auth_provider_id` ayrıca tutulur (ADR-002, D-256). `system` katmanı: hiçbir sıfırlama gerçek hesabı silmez; `is_sample` örnek kişiyi, `is_bootstrap_owner` fabrika ayarından sonra sahip rolünü geri alacak kişiyi işaretler. Ayrılış tarihinden itibaren hiçbir yetki taşımaz (REQ-IAM-007) |
| `iam.role` | Dinamik rol | `code`, `name`, `description`, `level`, `parent_role_id`, `is_owner_layer`, `has_full_visibility`, `is_active` | `has_full_visibility` sütunu D-083'ün dayanağı: akış tasarlama yetkisi yalnız burada `true` olan role verilebilir (kısıt). Tam görünürlük bütün `view` yetkilerini ve veri sınıflarını şirket genelinde verir; sahip katmanı her zaman tam görünürlüktedir. Fabrika şablonları: `db/seeds/0001_iam_role_templates.sql` |
| `iam.permission` | Yetki tipi | `code` (`modül.nesne.eylem`), `module`, `name`, `created_from` (seed/admin/designer), `is_active` | Akış tasarımcısından gelen de aynı tabloya yazılır (REQ-IAM-016). Fabrika yetkileri matrisin modül düzeyindeki karşılığıdır: `.manage` (Y), `.view` (G), `.own` (K) |
| `iam.role_permission` | Rol × yetki | `role_id`, `permission_id`, `revoked_at` | Silinmez; geri alma `revoked_at` ile. Sahip katmanının tuttuğu geri alınamaz (REQ-IAM-024) |
| `iam.role_data_class` | Rolün modül bazında veri sınıfı izni | `role_id`, `module`, `can_see_commercial`, `can_see_sensitive` | `PERMISSION_MATRIX.md`'nin t/h işaretlerinin karşılığı |
| `iam.role_assignment` | Kişiye rol | `user_id`, `role_id`, `scope_type` (company/site/project), `scope_ids[]`, `starts_on`, `ends_on`, `is_delegation`, `delegated_by_user_id`, `reason` | Vekâlet ayrı tablo değil, süreli atamadır (REQ-IAM-018); yalnız verenin bütün kapsam ve sürede taşıdığı rol devredilir (REQ-IAM-019). Bitirme `ends_on` ile |
| `iam.user_exception` | Kişisel istisna | `user_id`, `target` (yetki kodu veya modül kodu), `effect` (grant/deny), `scope_type`, `scope_ids[]`, `reason`, `revoked_at` | Yalnız sahip yazar (REQ-IAM-015). Modül açma `view` yetkilerini açar, modül kapatma hepsini kapatır; kapatma şirket genelidir. Sahip katmanına kapatma yazılamaz |
| `iam.user_manager` | Elle amir ataması | `user_id`, `manager_user_id`, `scope_type`, `scope_ids[]`, `revoked_at` | Yoksa amir rol hiyerarşisinden gelir (REQ-IAM-014) |
| `iam.user_action_role_choice` | Hatırlanan rol seçimi | `user_id`, `permission_code`, `role_id` | İki rolü aynı işleme izin veren kişiye bir kez sorulur (REQ-IAM-013) |
| `iam.recovery_code` | 2FA kurtarma kodu | `user_id`, `code_hash`, `used_at` | Kod yalnız üretim anında gösterilir (D-236) |
| `iam.login_attempt` | Giriş denemesi | `email`, `succeeded`, `ip`, `user_agent`, `locked_until` | Geçici kilidin dayanağı (REQ-IAM-005) |
| `iam.session` | Açık oturum | `user_id`, `last_seen_at`, `expires_at`, `device_label` | 30 gün / 3 gün hareketsizlik (D-230); pasifleşen kullanıcının satırları silinmez, `revoked_at` yazılır |

**Kısıtlar.** Akış tasarlama yetkisi, `has_full_visibility = false` olan bir role bağlanamaz (`ck`/tetikleyici). Sahip katmanındaki rolün veri sınıfı izinleri kapatılamaz (IAM-K1). Aynı kullanıcı-rol-kapsam için çakışan tarih aralığı olamaz.

**Kuruldu (TASK-0102, 0003 göçü, D-256).** Yukarıdaki kısıtlara ek olarak: sahip katmanı hiçbir yoldan daraltılamaz (rol, atama, yetki, veri sınıfı, istisna, hesap pasifleştirme); tam görünürlüklü rol yalnız tüm şirket kapsamıyla atanır; rol hiyerarşisinde döngü olamaz. Kayıt, yetki, atama ve istisna tabloları taşınabilirliğe göre ayrılır: rol, yetki tipi, rol-yetki ve rol-veri sınıfı `config:export` ile taşınır; kişi adı taşıyan atama, istisna, elle amir ve rol seçimi taşınmaz. Etkin yetki `iam.my_grants()` ve `iam.my_data_classes()` ile hesaplanır; modül politikaları `iam.has_company_scope`, `iam.scope_ids`, `iam.can_see` ve `iam.acting_role_valid` ile yazılır (`CONVENTIONS.md` bölüm 10). `iam.recovery_code`, `iam.login_attempt` ve `iam.session` TASK-0112'de kurulur.

## aud — Geçmiş, denetim, revizyon

| Tablo | Ne tutar | Ayırt edici sütunlar | Notlar |
|---|---|---|---|
| `aud.record_history` | Alan bazlı değişiklik | `record_schema`, `record_table`, `record_id`, `operation` (insert/update), `field`, `old_value`, `new_value`, `data_class`, `reason`, `site_id`, `project_id`, `record_created_by_user_id`, `changed_by_user_id`, `changed_in_role_id` | Tek kanaldan yazılır (`aud.capture_history`, TASK-0103); `data_class` süzmeyi, kapsam ve oluşturan görünürlüğü mümkün kılar (REQ-AUD-004). Okuma yalnız `aud.history_of()` ile |
| `aud.audit_log` | Şirket geneli işlem ve giriş olayları | `event_type`, `actor_user_id`, `actor_role_id`, `target_schema`, `target_table`, `target_id`, `payload`, `occurred_at` | Yalnız ekleme; `UPDATE`/`DELETE`/`TRUNCATE` yönetici bağlantısında da reddedilir (AUD-K1). Yazma `aud.record_event()`, okuma `aud.audit_log_page()` (yalnız sahip katmanı) |
| `aud.revisable_record` | Revizyona açık kayıt türü kütüğü | `module`, `record_schema`, `record_table`, `label`, `revisable_fields[]`, `approver` (manager/owner) | Kilit kaydın sahibi modülde, kütük AUD'de; uygulayıcısı olmayan tür için talep açılmaz (D-265) |
| `aud.revision_request` | Kilitli kayıtta değişiklik talebi | `record_*`, `requested_changes` (alan, eski, yeni), `reason`, `status`, `decided_by_user_id`, `decision_reason` | Ret gerekçesiz olamaz (AUD-K4) |
| `aud.revision_effect` | Onaylanan revizyonun ürettiği düzeltme | `revision_request_id`, `ledger_ref` | Önceki değer silinmez, fark ayrı hareket olur (AUD-K3) |

## doc — Belgeler

| Tablo | Ne tutar | Ayırt edici sütunlar | Notlar |
|---|---|---|---|
| `doc.document` | Bir kayda bağlı belge | `record_schema`, `record_table`, `record_id`, `site_id`, `project_id`, `record_owner_user_id`, `data_class`, `doc_type_item_id`, `title`, `status`, `archive_reason` | Kayda bağlı olmayan belge yok (DOC-K1); kayıt, kapsam ve veri sınıfı sonradan değişmez; silinmez, gerekçeyle arşivlenir (D-262) |
| `doc.document_version` | Sürüm | `document_id`, `version_no`, `storage_key`, `file_name`, `mime_type`, `size_bytes`, `sha256`, `is_signed`, `uploaded_by_user_id` | Yeni sürüm öncekini silmez (DOC-K4); numarayı veritabanı verir; yalnız imzalı işareti değişebilir |
| `doc.upload` | Sürdürülebilir yükleme oturumu | `document_id`, `file_name`, `mime_type`, `size_bytes`, `part_size`, `received_bytes`, `storage_key`, `multipart_upload_id`, `parts`, `status` | Yalnız başlatan kişi görür; konum sunucudadır, uyuşmazlıkta 409 (SPIKE-15, D-262) |
| `doc.extracted_text` | Metin tanıma çıktısı | `document_version_id`, `status` (pending/ready/failed/skipped), `method`, `text_content`, `confidence`, `is_low_quality` | Arşiv içerik araması buradan (REQ-DOC-004); "okunuyor" = pending |

Belgenin kapsamı ve veri sınıfı **bağlı kayıttan** türetilir ve belgeye yazılır; RLS politikası `doc.can_access` ile geçmişle aynı kuralı uygular (DOC-K2, D-262). Belge türü ADM kataloğu `document_type`'tır.

## wfl — Akış, onay, kilit

| Tablo | Ne tutar | Ayırt edici sütunlar | Notlar |
|---|---|---|---|
| `wfl.workflow` | Akış kimliği | `key`, `name`, `source_template_key`, `status` (draft/published/disabled) | Şablondan kopya (D-086) |
| `wfl.workflow_version` | Sürümlü tanım | `workflow_id`, `version_no`, `definition` (jsonb), `published_at`, `published_by_user_id`, `trial_run_id` | Deneme yapılmadan yayımlanamaz (WFL-K3) |
| `wfl.workflow_instance` | Yürüyen örnek | `workflow_version_id`, `trigger_event_id`, `record_*`, `status` (running/waiting/completed/failed), `failed_reason`, `started_at`, `finished_at` | Başladığı sürümle biter (WFL-K1) |
| `wfl.step_run` | Adım çalışması | `instance_id`, `step_id`, `type`, `status`, `owner_user_id`, `result`, `started_at`, `finished_at` | Çalışma günlüğünün kaynağı (SCR-197) |
| `wfl.approval` | Onay isteği | `step_run_id`, `record_*`, `assigned_user_id`, `decision` (approve/reject/return), `reason`, `decided_at`, `decided_by_user_id` | Onaylar kuyruğu buradan okur; gerekçe zorunluluğu kısıtla (WFL-K4) |
| `wfl.lock` | Bağımlılık kilidi | `record_*`, `reason_code`, `message`, `created_by_instance_id`, `released_at`, `overridden_by_user_id`, `override_reason` | Aşma yalnız sahip/GM (WFL-K6) |
| `wfl.trial_run` | Deneme çalıştırması | `workflow_version_id`, `sample_record_*`, `result` (jsonb), `run_at`, `run_by_user_id` | Kuru mod; gerçek kayıt üretmez |

## tsk — Görev ve bildirim

| Tablo | Ne tutar | Ayırt edici sütunlar | Notlar |
|---|---|---|---|
| `tsk.task` | Görev | `title`, `assignee_user_id`, `due_at`, `priority`, `status`, `source_type` (manual/workflow), `source_step_run_id`, `record_*`, `needs_giver_approval`, `problem_key` | `problem_key` aynı sorun için ikinci görev açılmasını engeller (TSK-K2) |
| `tsk.escalation` | Eskalasyon | `task_id`, `from_user_id`, `to_user_id`, `at`, `rule_ref` | İlk sorumlunun listesinden düşmez (TSK-K3) |
| `tsk.notification` | Bildirim | `user_id`, `type`, `title`, `body`, `record_*`, `source_step_run_id`, `read_at`, `channels[]` | Metinde hassas veri yok (TSK-K4) |
| `tsk.push_subscription` | Telefon bildirimi aboneliği | `user_id`, `endpoint`, `keys`, `last_used_at` | Web push (REQ-TSK-010) |
| `tsk.daily_digest` | Günlük özet | `user_id`, `for_date`, `payload`, `sent_at` | Gönderim saati yönetim ayarı (REQ-TSK-013) |

## adm — Tanımlar

| Tablo | Ne tutar | Ayırt edici sütunlar | Notlar |
|---|---|---|---|
| `adm.catalog` | Katalog türü | `key`, `name`, `allows_project_scope`, `allows_user_additions` | Gider kategorisi, birim, iş kalemi… Kullanıcı eklemesine açık kataloğa rolü olan herkes kalem ekler (REQ-ADM-006) |
| `adm.catalog_item` | Katalog kalemi | `catalog_id`, `code`, `name`, `name_folded`, `status`, `project_id`, `merged_into_item_id` | Silinmez, pasifleşir; birleşme yönlendirme bırakır ve `catalog_item.merged` yayımlar (ADM-K3). `project_id` yabancı anahtar değildir (D-260) |
| `adm.rule_key` | Kural anahtarı | `key`, `module`, `value_type`, `unit`, `allowed_scopes[]`, `data_class` | Modüller kendi anahtarlarını başlangıç verisiyle ekler |
| `adm.rule` | Tarihli şirket kuralı | `rule_key_id`, `scope_type` (company/unit/project/site), `scope_id`, `valid_from`, `value` (jsonb), `reason` | Hiç güncellenmez ve silinmez; tek okuma noktası `getRule` / `adm.rule_value` (`CONFIGURATION.md`). Önceki taslakta `wfl.rule` idi; kurallar Tanımlar'da yönetildiği için ADM'ye alındı (D-260) |
| `adm.panel_type` | Panel tipi | `code`, `width`, `height`, `area_m2` (türetilmiş), `neighbour_type_id` | m² en × boydan hesaplanır (ADM-K2) |
| `adm.strip_type` | Şerit tipi | `code`, `width_mm`, `thickness_mm`, `hole_count`, `standard_lengths[]` | |
| `adm.consumption_recipe` | Sarf reçetesi | `output_type`, `material_item_id`, `qty_per_unit`, `valid_from`, `project_id` | Günlük kayıttaki öneri buradan (REQ-ADM-004) |
| `adm.custom_field` | Özel alan tanımı | `record_table`, `code`, `label`, `field_type`, `options`, `is_required`, `is_searchable`, `data_class`, `order_no`, `retired_at` | Yalnız D-237'nin dokuz referans kaydında (kısıt). Değerler kaydın `custom_fields` JSONB sütununda, yazarken `adm.check_custom_fields()` denetler; kod ve tip değişmez (D-260) |
| `adm.working_calendar` | Takvim | `scope_type` (company/unit/site), `scope_id`, `valid_from`, `office_start`/`office_end`, `field_start`/`field_end`, `weekend_days[]`, `overtime_rules`, `salary_day`, `reason` | Birim/şantiye takvimi şirketi geçersiz kılar; satır hiç güncellenmez, değişiklik yeni geçerlilik satırıdır (D-261) |
| `adm.holiday` | Resmî tatil | `scope_type`, `scope_id`, `holiday_on`, `name`, `is_half_day`, `revoked_at` | Yıl bazında girilir; yarım gün arife iş günüdür (D-261) |
| `adm.exchange_rate` | Günlük kur | `currency`, `bulletin_on`, `buying_rate` (bir birim için), `source` (tcmb/manual), `entered_by_user_id`, `reason` | Alınamazsa satır yok → "kur bekliyor" (ADM-K4). Bir günün kuru önceki iş gününün bültenidir (`adm.rate_for`, D-140); satır değişmez, elle kur gerekçelidir (D-261) |
| `adm.exchange_rate_fetch` | Bülten günü başına alım durumu | `bulletin_on`, `attempts`, `last_attempt_at`, `last_outcome`, `received_at`, `missing_published_at` | `exchange_rate.missing` gün başına bir kez (SPIKE-11) |

## Ortak altyapı tabloları

| Tablo | Ne tutar | Notlar |
|---|---|---|
| `core.outbox` | Yayımlanan olay | `event_id`, `event_code`, `event_version`, `publisher_module`, `record_*`, `sequence_key`, `payload`, `actor_user_id`, `occurred_at` | Kayıtla aynı işlemde, yalnız `core.publish_event()` ile yazılır; silinmez (ADR-014, D-231). Deneme ve durum teslim satırındadır (TASK-0104) |
| `core.event_subscription` | Abone × olay kodu | `subscriber`, `event_code`, `replayable` | İşleyici kod içindeki kayıt defterinden yazar; yayımlama her satır için teslim açar (D-259) |
| `core.outbox_delivery` | Abone × olay teslimi | `outbox_id`, `subscriber`, `sequence_key`, `status` (pending/done/dead), `attempts`, `available_at`, `last_error`, `processed_at` | Tekrarsızlık anahtarı `(outbox_id, subscriber)`; aynı abone ve sıra anahtarında eski teslim bitmeden sonraki alınmaz (SPIKE-03) |
| `core.dead_letter` | Beş denemede teslim edilemeyen teslim veya iş | `delivery_id` / `scheduled_job_id`, `handler`, `error`, `payload`, `resolved_at` | Denetim kaydına `system.dead_letter` yazar; sahip katmanına kritik bildirim TASK-0108'de. Elle yeniden çalıştırma: `npm run jobs:retry` |
| `core.scheduled_job` | Zamanlanmış iş ve uyandırma | `job_type`, `run_at`, `idempotency_key`, `payload`, `status`, `attempts`, `available_at` | Akışın bekleme adımları burada (WORKFLOW_ENGINE bölüm 4); aynı anahtar ikinci kez kaydedilmez |
| `core.read_model` | Okuma modelinin etkin sürümü | `name`, `active_table`, `version`, `rebuilt_at`, `last_difference` | Yeniden kurma sürümü tek güncellemeyle değiştirir (D-233, SPIKE-14) |
| `core.search_row` | Arama satırı | `record_*`, `record_type`, `title`, `secondary`, `search_vector`, `scope_type`, `scope_ids[]`, `search_document_id`, `normalization_version`, `projection_version`, `source_event_id` | UUID kimlik korunur; benzersiz iç arama numarası ve üç yardımcı veri kümesi D-247 / ADR-017 ile eklenir. Ticari/hassas alan girmez |

| `core.search_posting` | Sözcük → arama kaydı | `search_row_id`, `word`, `scope_type`, `scope_ids[]`, `normalization_version`, `projection_version` | Kaynak arama satırına FK; aynı sürümde kayıt/sözcük tekil; kaynak görünürlüğüyle RLS |
| `core.search_word` | Kapsam/tür bazında sözcük adedi | `word`, `record_type`, `scope_type`, `scope_ids[]`, `record_count`, `projection_version` | Türetilmiş sözlük; yetkisiz varlık veya adet açığa çıkmaz |
| `core.search_word_bucket` | Sözcüğün sıralı arama numaraları | `word`, `record_type`, `scope_key` (`site:<id>` / `project:<id>` / `company`), `data_class`, `search_document_ids integer[]` | Kapsam/tür/sözcük/sürüm tekil; sıralı, tekrarsız, NULL içermeyen dizi |

### Arama yardımcıları sözleşmesi (D-247, CHG-007)

0027 uygulama notu (2026-09-23): satır ve eşlemede normalleştirme sürümü, eşlemede ayrıca satırın izdüşüm sürümü uygulanmıştır. `core.search_normalization_version()` şu anda 1 döndürür. Eski sürüm kontrolü RLS kapsamındaki istenen türlerle sınırlıdır. Normalleştirici değiştiğinde sürüm işlevi, eski sürüm kısmi indekslerinin koşulları ve kaynaklardan yeniden kurma birlikte ele alınır; yalnız sürüm numarasını değiştirmek yeterli değildir. Çoklu kapsam görünürlüğü OQ-034 yanıtını, kova/sözlük sürüm düzeni ve tam içerik tutarlılığı kalan uygulama adımlarını bekler. Aşağıdaki maddeler hedef sözleşmedir.

- Ortak `id uuid` anahtarları korunur. `search_row.search_document_id` pozitif, UNIQUE int4 iç numaradır; UUID dökümü değildir, iş kaydının anahtarı veya dış API kimliği olmaz. Kaynak satıra kalıcı ve tekil eşlenir; yeniden kurmada keyfi yeniden atanmaz. 2.147.483.647 sınırına varmadan kapasite kontrolü ve uyarı gerekir; taşma/sarma veya başka kayda numara yeniden kullanma yoktur. Kapasite artışı yeni göç ve doğrulama gerektirir.
- Kapsam kümesi sıralı, tekrarsız UUID dizisiyle normalleştirilir; `scope_type` aynı IAM anlamını taşır. Sırf ortak bir şantiyesi var diye farklı görünürlük kümeleri birleştirilmez. Çok kapsamlı kayıt bir sonuç olarak döner; deneydeki tek skaler kapsam ürün yetkilerinin yerine geçmez.
- Her yardımcıda RLS vardır. Eşlemeler kaynak satırın güncel görünürlüğüne bağlıdır. Sözcük ve adet yalnız görünür eşlemelerden türetilir. Bir kümedeki tüm kayıtların görünürlüğü kanıtlanamıyorsa kümenin ham kimlik dizisi/adedi kullanıcıya verilmez; yetkili eşlemelerden hesaplanan yol kullanılır. Bu kısmi yetki yolunun performansı ürün IAM testinde ayrıca doğrulanır; hız için yetki gevşetilmez.
- Kaynak olayının sürümü kontrol edilir; arama satırı ile üç yardımcının değişimi tek işlemde tamamlanır. Eski/tekrar teslim edilmiş olay daha yeni indeksi ezmez. Başlık, kapsam, veri sınıfı, alan emekliliği ve aranabilirlik değişimleri eski sözcükleri de günceller. İş kayıtları ve AUD geçmişi korunur; yeniden kurulabilen yardımcıların yenilenmesi tarihçe silme değildir. Kullanıcı rolüne yazma/silme verilmez.
- pg_trgm, btree_gist ve intarray gereklidir; göç öncesi sürüm/şema/izin kontrolü yapılır. RUM bağımlılığı yoktur. FK ve sözcük/kapsam/tür indeksleri gerçek sorgularla doğrulanır; intarray yalnız NULL içermeyen dizilerde kullanılır.
- Yeniden kurma, kaynak arama satırlarından sürümlü bir gölge veri kümesi üretir; sayım, RLS ve sonuç karşılaştırması sonrası okuma sürümü atomik değiştirilir. Hata halinde önceki sürüm okunur. Eski yavaş yolun varlığı performans kabulü değildir. Güncel kaynakla tutarlılık için olay yüksek su işareti ve değişimlerin tamamlanması SPIKE-14 ile doğrulanır.
- Kaynak, yardımcı ve eşleme uyuşmazlığında eksik veriyi başarılı sonuç diye sunmak yerine kontrollü hata üretilir. Yeniden kurma kaynak olay/görev/bildirim doğurmaz. Genel iş tablosu AUD zorunluluğundan `core.*` muafiyeti geçerlidir; kurulum/yeniden kurma işletim günlüğüne yazılır.
- Bu belge tasarım ekidir; ürün göçü veya kodu teslim edilmedi. İlk istek, eşzamanlılık, UUID eşlemesi, tüm kapsam türleri, kısmi yetki ve olayla güncelleme kabul testleri açıkça korunur.

`core` şeması modüllerin ortak altyapısıdır; iş verisi tutmaz ve yalnız platform kodu yazar.

## Phase 06'ya giden not

`core.outbox` ve `core.search_row` en çok yazılan tablolardır; SPIKE-03 ve SPIKE-12 bunların yük altındaki davranışını ölçer.

### Arama uygulama notu — 2026-09-23 (TASK-0110)

Yukarıdaki arama satırları tasarım sözleşmesini gösterir. Göç 0020–0023'te fiilen bulunan alanlar: arama satırında `search_text`, `site_id`, `project_id`, `record_owner_user_id`, `data_class`, `projection_version`, `source_event_at`; eşlemelerde aynı kapsam/sahip/sınıf; sözlükte `word`, `record_type`, `record_count`; kovada sözcük/tür/yer/sınıf ve iç kimlik dizisi. Kullanıcı sözlüğü doğrudan okuyamaz; öneri kendi görünür eşlemelerinden hesaplanır. Kovalar tüm kayıtlara bakma hakkı olan kapsamda okunur; kişisel erişimde kaynak RLS yolu korunur.

0022 ortak yayınlama kilidiyle kaynak okumayı ve arama yazıcılarını yeniden kurmayla sıralar. İşlemci geçici gölge tabloda kaynakların izdüşümünü üretir, alanları ve sayımı karşılaştırır; aynı işlemde satırları, yardımcıları ve `core.read_model` içindeki `core.search` sürümünü yayımlar. MVCC nedeniyle diğer okuyucular commit'e kadar eski satırları görür. Mevcut `search_document_id` korunur. Kalıcı tablo sayısı değişmedi; geçici küme commit/rollback sonrasında kalmaz.

Tasarımdaki çok kapsamlı kayıtlar, normalleştirme sürümünün ayrı izlenmesi ve üretim hacminde yeniden kurma kabulü henüz kapanmış değildir. TASK-0110 bu farklar ve tarayıcı kabulü nedeniyle IMPLEMENTING durumundadır; tasarım sözleşmesi kaldırılmaz.

**0026 kural düzeltme sırası:** `adm.rule.revision_order bigint`, yeni eklenen aynı tarih/zamanlı kuralların sırasını belirler; `adm.rule_revision_order_seq` kolona aittir. Eski satırlarda NULL korunur. `adm.rule_value` geçerlilik ve kayıt zamanından sonra bu alanı, en son UUID'yi sıralar. Tablo sayısı değişmez.
