# Şema — Analiz ve Yönetim (RPT, PRF, INT, STR)

Durum: TASLAK · Son güncelleme: 2026-09-20

Bu dört modül kendi iş verisini üretmez; başkasının verisinden türetir (D-233). Tabloları iki gruptur: **okuma modelleri** (olaylarla beslenir, yeniden kurulabilir) ve **kendi kayıtları** (kullanıcının girdiği veya onayladığı şeyler: KPI kataloğu, prim, öneri kararı, bütçe). Ortak kurallar `docs/database/CONVENTIONS.md`'dedir. Görev: TASK-0070.

## Okuma modeli kuralı

Her okuma modeli tablosu şunları taşır: kaynak kaydın kimliği, **kapsam sütunları**, `data_class` gerektiren alanlar için ayrı sütunlar, `rebuilt_at` ve `source_event_id`. Hiçbiri kaynak değildir: silinip olaylardan yeniden kurulabilir (SPIKE-14). Kullanıcı bir rakama tıklayınca kaynak kayda gider (REQ-RPT-002).

## rpt — "Bugün", göstergeler, raporlar

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `rpt.attention_item` | "Dikkat" öğesi | `type`, `severity`, `record_*`, `opened_at`, `resolved_at`, `seen_by_user_ids[]`, `scope_*` |
| `rpt.indicator_value` | Gösterge değeri (okuma modeli) | `indicator_key`, `scope_type`, `scope_id`, `period`, `value`, `data_class`, `rebuilt_at` |
| `rpt.indicator_selection` | Rol varsayılanı ve kişi düzeni | `role_id`, `user_id`, `indicator_keys[]`, `layout` |
| `rpt.site_summary` | Şantiye özeti (okuma modeli) | `site_id`, `period`, `production_qty`, `production_m2`, `target_diff`, `waste_qty`, `client_wait_hours`, `profit_loss_try` |
| `rpt.project_summary` | Proje özeti (okuma modeli) | `project_id`, `period`, `progress_percent`, `revenue_try`, `cost_try`, `profit_loss_try`, `uncalculable_reasons[]` |
| `rpt.saved_view` | Kayıtlı görünüm | `owner_user_id`, `shared_role_ids[]`, `screen_key`, `filters`, `name` |
| `rpt.official_daily_report` | Resmî günlük rapor | `daily_site_log_id`, `version_no`, `document_id`, `sent_to_client_at`, `sent_by_user_id` |
| `rpt.report_run` | Rapor çalıştırma kaydı | `report_key`, `run_by_user_id`, `filters`, `row_count`, `exported`, `run_at` |

`uncalculable_reasons[]`, "hesaplanamadı" durumunu taşır; boş değer sessizce sıfır sayılmaz (REQ-RPT-013).

## prf — Performans ve prim

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `prf.kpi` | KPI tanımı | `code`, `role_id`, `weight_percent`, `scoring_type`, `data_source`, `valid_from` |
| `prf.target` | Hedef | `level` (company/role/person), `role_id`, `employee_id`, `period`, `kpi_id`, `target_value` |
| `prf.kpi_result` | Kişinin aylık KPI değeri | `employee_id`, `kpi_id`, `period`, `value`, `source` (calculated/manager), `entered_by_user_id`, `reason` |
| `prf.score` | Aylık puan | `employee_id`, `period`, `score`, `band`, `is_final`, `finalised_at` |
| `prf.bonus_rule` | Prim kuralı (tarihli) | `role_id`, `valid_from`, `formula`, `cap_amount` |
| `prf.bonus` | Prim | `score_id`, `amount`, `amount_try`, `breakdown`, `approval_status`, `paid_in_payroll_id` |
| `prf.development_plan` | Gelişim planı | `employee_id`, `period`, `items`, `owner_user_id` |

**Kısıtlar.** Bir rolün KPI ağırlıkları toplamı %100 olmalıdır (tetikleyici, PRF-K2). Hesaplanabilir KPI'ya elle değer yazılamaz; kimse kendi KPI'sini giremez (`ck`, PRF-K1). Kapanmış ayın puanı ve primi katalog değişse de değişmez (PRF-K4): satırlar kullandıkları `kpi.valid_from` sürümünü taşır. Prim tutarı hassas veridir.

## int — Öneriler ve senaryolar

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `int.recommendation_type` | Öneri türü | `key`, `name`, `is_enabled`, `threshold_rule_key` |
| `int.recommendation` | Öneri | `type_id`, `severity`, `rationale`, `numbers` (jsonb), `source_records` (jsonb), `status`, `dismissed_reason`, `scope_*` |
| `int.resource_transfer_suggestion` | Transfer önerisi | `recommendation_id`, `asset_id`, `employee_id`, `from_site_id`, `to_site_id`, `net_effect_try`, `approved_transfer_ref` |
| `int.acceleration_scenario` | Hızlandırma senaryosu | `project_id`, `inputs` (jsonb), `breakdown` (jsonb), `estimated_end`, `net_effect_try`, `not_recommended_reason`, `approved_at`, `approved_by_user_id` |
| `int.scenario_limit` | Senaryo sınırı | `key`, `value`, `valid_from` |

INT hiçbir stok, ekipman, personel veya para kaydını doğrudan değiştirmez (INT-K1): onaylanan öneri yalnız kaynağı olan kaydı işaretler, işlemi ilgili modül yapar. Gerekçesiz kapatma engellenir (`ck`, INT-K2).

## str — Strateji ve bütçe

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `str.annual_target` | Yıllık hedef | `year`, `key`, `value`, `unit` |
| `str.budget` | Bütçe | `year`, `status`, `approved_at`, `approved_by_user_id` |
| `str.budget_revision` | Bütçe revizyonu | `budget_id`, `revision_no`, `reason`, `approved_at` |
| `str.budget_line` | Bütçe satırı | `budget_revision_id`, `month`, `cost_center_id`, `category_item_id`, `amount`, `amount_try` |
| `str.investment_analysis` | Yatırım analizi | `title`, `asset_category_item_id`, `inputs` (jsonb), `payback_months`, `decision`, `decided_at` |
| `str.inflation_index` | TÜFE endeksi | `month`, `index_value`, `source` |
| `str.health_scorecard` | Sağlık karnesi (okuma modeli) | `as_of`, `heading`, `colour`, `reasons` (jsonb), `rebuilt_at` |

Onaylanan bütçe kilitlidir; değişiklik yeni revizyondur ve eski satırlar durur (STR-K1). Enflasyona göre düzeltilmiş görünüm hiçbir kaydı değiştirmez; endeksi eksik ay sessizce hesaplanmaz (STR-K2): `str.inflation_index` satırı yoksa görünüm o ay için "endeks yok" der. Tek toplam şirket puanı tutulmaz (STR-K3).

## Yeniden kurma

Okuma modelleri `core.outbox` geçmişinden yeniden kurulur. Yeniden kurma sırasında görev ve bildirim üreten aboneler atlanır (D-234); bu, abone tanımındaki `replayable` bayrağıyla ayrılır. Yeniden kurma sonucu kaynak kayıtlarla karşılaştırılır; fark varsa denetime yazılır (D-233).
