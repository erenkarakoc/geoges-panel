# Şema — Platform (IAM, AUD, DOC, WFL, TSK, ADM)

Durum: TASLAK · Son güncelleme: 2026-09-20

Platform modüllerinin tabloları. Ortak kurallar `docs/database/CONVENTIONS.md`'dedir ve burada tekrar edilmez: her tabloda `id`, oluşturma/güncelleme izleri, kapsam sütunu, RLS politikası ve geçmiş kanalı vardır. Alan modeli: `docs/domain/DOMAIN_MODEL.md`. Görev: TASK-0066.

Sütun listeleri **ayırt edici** olanları verir; ortak sütunlar yazılmaz.

## iam — Kimlik ve yetki

| Tablo | Ne tutar | Ayırt edici sütunlar | Notlar |
|---|---|---|---|
| `iam.user` | Panele giren kişi | `email`, `status` (active/disabled), `auth_provider_id`, `employee_id` (HR, nullable), `must_setup_2fa` | Kendi kendine kayıt yok. `auth_provider_id` Supabase Auth kimliği (ADR-002) |
| `iam.role` | Dinamik rol | `code`, `name`, `level`, `parent_role_id`, `is_owner_layer`, `has_full_visibility` | `has_full_visibility` sütunu D-083'ün dayanağı: akış tasarlama yetkisi yalnız burada `true` olan role verilebilir (kısıt) |
| `iam.permission` | Yetki tipi | `code`, `module`, `name`, `created_from` (admin/designer) | Akış tasarımcısından gelen de aynı tabloya yazılır (REQ-IAM-016) |
| `iam.role_permission` | Rol × yetki | `role_id`, `permission_id` | |
| `iam.role_data_class` | Rolün modül bazında veri sınıfı izni | `role_id`, `module`, `can_see_commercial`, `can_see_sensitive` | `PERMISSION_MATRIX.md`'nin t/h işaretlerinin karşılığı |
| `iam.role_assignment` | Kişiye rol | `user_id`, `role_id`, `scope_type` (company/site/project), `scope_ids[]`, `starts_on`, `ends_on`, `is_delegation`, `delegated_by_user_id`, `reason` | Vekâlet ayrı tablo değil, süreli atamadır (REQ-IAM-018) |
| `iam.user_exception` | Kişisel istisna | `user_id`, `module_or_screen`, `effect` (grant/deny), `reason` | Yalnız sahip yazar (REQ-IAM-015) |
| `iam.user_manager` | Elle amir ataması | `user_id`, `manager_user_id`, `scope_type`, `scope_ids[]` | Yoksa amir rol hiyerarşisinden gelir (REQ-IAM-014) |
| `iam.recovery_code` | 2FA kurtarma kodu | `user_id`, `code_hash`, `used_at` | Kod yalnız üretim anında gösterilir (D-236) |
| `iam.login_attempt` | Giriş denemesi | `email`, `succeeded`, `ip`, `user_agent`, `locked_until` | Geçici kilidin dayanağı (REQ-IAM-005) |
| `iam.session` | Açık oturum | `user_id`, `last_seen_at`, `expires_at`, `device_label` | 30 gün / 3 gün hareketsizlik (D-230); pasifleşen kullanıcının satırları silinmez, `revoked_at` yazılır |

**Kısıtlar.** Akış tasarlama yetkisi, `has_full_visibility = false` olan bir role bağlanamaz (`ck`/tetikleyici). Sahip katmanındaki rolün veri sınıfı izinleri kapatılamaz (IAM-K1). Aynı kullanıcı-rol-kapsam için çakışan tarih aralığı olamaz.

## aud — Geçmiş, denetim, revizyon

| Tablo | Ne tutar | Ayırt edici sütunlar | Notlar |
|---|---|---|---|
| `aud.record_history` | Alan bazlı değişiklik | `record_schema`, `record_table`, `record_id`, `field`, `old_value`, `new_value`, `data_class`, `reason`, `changed_by_user_id`, `changed_in_role_id` | Tek kanaldan yazılır; `data_class` süzmeyi mümkün kılar (REQ-AUD-004) |
| `aud.audit_log` | Şirket geneli işlem ve giriş olayları | `event_type`, `actor_user_id`, `target`, `payload`, `occurred_at` | Yalnız ekleme; `UPDATE`/`DELETE` veritabanı düzeyinde reddedilir (AUD-K1) |
| `aud.revision_request` | Kilitli kayıtta değişiklik talebi | `record_*`, `requested_changes` (alan, eski, yeni), `reason`, `status`, `decided_by_user_id`, `decision_reason` | Ret gerekçesiz olamaz (AUD-K4) |
| `aud.revision_effect` | Onaylanan revizyonun ürettiği düzeltme | `revision_request_id`, `ledger_ref` | Önceki değer silinmez, fark ayrı hareket olur (AUD-K3) |

## doc — Belgeler

| Tablo | Ne tutar | Ayırt edici sütunlar | Notlar |
|---|---|---|---|
| `doc.document` | Bir kayda bağlı belge | `record_schema`, `record_table`, `record_id`, `doc_type`, `data_class`, `title` | Kayda bağlı olmayan belge yok (DOC-K1) |
| `doc.document_version` | Sürüm | `document_id`, `version_no`, `storage_key`, `size`, `mime`, `is_signed`, `uploaded_by_user_id` | Yeni sürüm öncekini silmez (DOC-K4) |
| `doc.extracted_text` | Metin tanıma çıktısı | `document_version_id`, `text`, `status` (pending/ready/failed) | Arşiv içerik araması buradan (REQ-DOC-004) |

Belgenin kapsamı ve veri sınıfı **bağlı kayıttan** türetilir; RLS politikası bağlı kaydın politikasına bakar (DOC-K2).

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
| `wfl.rule` | Tarihli şirket kuralı | `key`, `scope_type`, `scope_ids[]`, `valid_from`, `value` (jsonb), `reason` | Tek okuma noktası `getRule` (`CONFIGURATION.md`) |

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
| `adm.catalog` | Katalog türü | `key`, `name`, `allows_project_scope` | Gider kategorisi, birim, iş kalemi… |
| `adm.catalog_item` | Katalog kalemi | `catalog_id`, `code`, `name`, `status`, `project_id`, `merged_into_item_id` | Silinmez, pasifleşir; birleşme yönlendirme bırakır (ADM-K3) |
| `adm.panel_type` | Panel tipi | `code`, `width`, `height`, `area_m2` (türetilmiş), `neighbour_type_id` | m² en × boydan hesaplanır (ADM-K2) |
| `adm.strip_type` | Şerit tipi | `code`, `width_mm`, `thickness_mm`, `hole_count`, `standard_lengths[]` | |
| `adm.consumption_recipe` | Sarf reçetesi | `output_type`, `material_item_id`, `qty_per_unit`, `valid_from`, `project_id` | Günlük kayıttaki öneri buradan (REQ-ADM-004) |
| `adm.custom_field` | Özel alan tanımı | `record_table`, `code`, `label`, `type`, `data_class`, `is_searchable`, `retired_at` | Yalnız referans kayıtlarda (D-237) |
| `adm.working_calendar` | Takvim | `scope_type`, `scope_ids[]`, `valid_from`, `work_hours`, `weekend_days[]`, `overtime_rules` | Birim/şantiye takvimi şirketi geçersiz kılar |
| `adm.holiday` | Resmî tatil | `calendar_id`, `date`, `name` | |
| `adm.exchange_rate` | Günlük kur | `currency`, `rate_date`, `buying_rate`, `source` (tcmb/manual), `entered_by_user_id`, `reason` | Alınamazsa satır yok → "kur bekliyor" (ADM-K4) |

## Ortak altyapı tabloları

| Tablo | Ne tutar | Notlar |
|---|---|---|
| `core.outbox` | Yayımlanacak olay | `event_code`, `event_version`, `publisher_module`, `record_*`, `sequence_key`, `payload`, `status`, `attempts`, `available_at` | Kayıtla aynı işlemde yazılır (ADR-014) |
| `core.outbox_delivery` | Abone × olay teslimi | `outbox_id`, `subscriber`, `status`, `attempts`, `last_error`, `processed_at` | Tekrarsızlık anahtarı `(outbox_id, subscriber)` |
| `core.dead_letter` | Beş denemede teslim edilemeyen | `outbox_id`, `subscriber`, `error`, `payload` | Sahip katmanına kritik bildirim üretir |
| `core.scheduled_job` | Zamanlanmış iş ve uyandırma | `job_type`, `run_at`, `idempotency_key`, `payload`, `status` | Akışın bekleme adımları burada (WORKFLOW_ENGINE bölüm 4) |
| `core.search_row` | Arama satırı | `record_*`, `record_type`, `title`, `secondary`, `search_vector`, `scope_type`, `scope_ids[]` | GIN + trigram dizinli (ADR-017); ticari/hassas alan girmez |

`core` şeması modüllerin ortak altyapısıdır; iş verisi tutmaz ve yalnız platform kodu yazar.

## Phase 06'ya giden not

`core.outbox` ve `core.search_row` en çok yazılan tablolardır; SPIKE-03 ve SPIKE-12 bunların yük altındaki davranışını ölçer.
