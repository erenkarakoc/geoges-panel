# Şema — Operasyon (PRJ, SIT, INV, PUR, FAC, EQP)

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-20

Ortak kurallar `docs/database/CONVENTIONS.md`'dedir; her tabloda `id`, izler, kapsam sütunu, RLS ve geçmiş kanalı vardır ve tekrar yazılmaz. Alan modeli ve değişmezler: `docs/domain/DOMAIN_MODEL.md`. Görev: TASK-0067.

## prj — Projeler

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `prj.project` | Proje kartı | `code`, `client_party_id`, `authority`, `stage`, `contract_ref`, `planned_start`, `planned_end`, `management_target_end`, `contract_value`, `currency` |
| `prj.project_revision` | Onaylı hedef sürümü | `project_id`, `revision_no`, `reason`, `approved_at`, `approved_by_user_id` |
| `prj.wall` | Duvar | `project_revision_id`, `site_id`, `code`, `length_m`, `height_m`, `area_m2` |
| `prj.wall_target` | Duvarın panel/şerit hedefi | `wall_id`, `panel_type_id`, `strip_type_id`, `target_qty`, `target_m2`, `target_length_m` |
| `prj.supply_responsibility` | Tedarik matrisi satırı | `project_id`, `item_id`, `responsible_party` (geoges/client/subcontractor), `valid_from` |
| `prj.technical_office_item` | Teknik ofis işi | `project_id`, `type` (proje/statik/kurum onayı), `status`, `due_on`, `assignee_user_id` |
| `prj.daily_target` | Günlük üretim hedefi | `project_revision_id`, `site_id`, `panel_type_id`, `qty_per_day` |

Hedefler **revizyona** bağlıdır: yeni revizyon eski hedefi değiştirmez, yeni satır üretir (REQ-PRJ-006).

## sit — Şantiye ve günlük kayıt

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `sit.site` | Şantiye | `project_id`, `name`, `work_model` (own/subcontractor), `coordinator_user_id`, `entry_owner_user_id`, `status` |
| `sit.daily_site_log` | Günün ana kaydı | `site_id`, `log_date`, `status`, `is_late_entry`, `weather`, `no_work_reason`, `submitted_at`, `submitted_by_user_id`, `approved_at`, `approved_by_user_id` |
| `sit.casting_session` | Döküm seansı | `log_id`, `session_no`, `started_at`, `ended_at`, `heating_used` |
| `sit.casting_entry` | Panel tipi başına döküm | `session_id`, `panel_type_id`, `qty`, `area_m2`, `over_target_reason`, `before_authority_approval` |
| `sit.installation_entry` | Panel montajı | `log_id`, `wall_id`, `panel_type_id`, `qty`, `area_m2`, `started_at`, `ended_at` |
| `sit.strip_installation_entry` | Şerit montajı | `log_id`, `wall_id`, `strip_type_id`, `length_m`, `qty`, `started_at`, `ended_at` |
| `sit.other_item_entry` | Harpuşta ve diğer kalemler | `log_id`, `item_id`, `qty`, `unit` |
| `sit.handover_time` | Teslim-tesellüm saati | `log_id`, `kind` (fill_out/fill_back/concrete/rebar), `at` |
| `sit.client_wait` | İşveren beklemesi | `log_id`, `hours`, `crew_count`, `idle_asset_ids[]`, `estimated_cost_try`, `obligation_id` |
| `sit.timesheet_entry` | Puantaj girişi | `log_id`, `employee_id`, `day_fraction`, `hours`, `absence_type` |
| `sit.subcontractor_worker_entry` | Taşeron işçi girişi | `log_id`, `full_name`, `crew_lead_employee_id`, `hours` |
| `sit.activity_time_entry` | Faaliyet süresi | `log_id`, `activity` (casting/installation/strip/fill), `started_at`, `ended_at` |
| `sit.equipment_use_entry` | Kullanılan ekipman | `log_id`, `asset_id`, `hours` |
| `sit.material_consumption_entry` | Tüketilen malzeme | `log_id`, `material_id`, `suggested_qty`, `entered_qty`, `deviation_percent` |
| `sit.damaged_unit_entry` | Zayi | `log_id`, `panel_type_id`, `qty`, `reason`, `document_id` |
| `sit.site_expense` | Saha harcaması | `log_id`, `amount`, `currency`, `amount_try`, `exchange_rate`, `category_item_id`, `document_id`, `approval_status` |
| `sit.log_photo` | Günün fotoğrafı | `log_id`, `document_id`, `caption` |

**Kısıtlar.** `(site_id, log_date)` tekildir. Zayi satırı belgesiz kaydedilemez (`ck`, REQ-SIT-020). Onaylanan kayıt salt okunur olur; değişiklik ancak revizyon talebiyle (AUD).

## inv — Stok

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `inv.material` | Malzeme | `catalog_item_id`, `unit`, `critical_threshold`, `theoretical_unit_weight`, `dimensions` |
| `inv.location` | Lokasyon | `type` (factory/warehouse/galvanizer/site/in_transit), `site_id`, `name` |
| `inv.material_lot` | Parti | `material_id`, `lot_code`, `received_at`, `certificate_document_id` |
| `inv.stock_movement` | **Defter satırı** | `material_id`, `location_id`, `lot_id`, `direction` (in/out), `qty`, `unit_cost`, `unit_cost_status` (actual/provisional/unknown), `source_schema`, `source_table`, `source_id`, `occurred_at` |
| `inv.stock_balance` | Türetilmiş bakiye | `material_id`, `location_id`, `process_state`, `qty`, `rebuilt_at` |
| `inv.shipment` | Sevkiyat | `from_location_id`, `to_location_id`, `status`, `dispatched_at`, `received_at` |
| `inv.truck_load` | Tır | `shipment_id`, `plate`, `driver`, `weighbridge_in`, `weighbridge_out`, `difference_percent`, `explanation` |
| `inv.material_issue_request` | Malzeme çıkış talebi | `site_id`, `material_id`, `qty`, `needed_on`, `status` |
| `inv.stock_count` | Sayım | `location_id`, `counted_on`, `status`, `approved_by_user_id` |
| `inv.stock_count_line` | Sayım satırı | `count_id`, `material_id`, `system_qty`, `counted_qty`, `difference_percent`, `reason`, `document_id` |
| `inv.scrap_record` | Fire ve hurda | `source_movement_id`, `weight_kg`, `document_id`, `stage` (generated/weighed/scrapped/sold), `sale_income_id` |

Stok hareketi **güncellenmez**; düzeltme ters kayıttır (`CONVENTIONS.md` bölüm 8). `inv.stock_balance` hızlandırma amaçlıdır ve defterden yeniden kurulur.

## pur — Satın alma

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `pur.purchase_request` | Satın alma talebi | `requested_by_user_id`, `cost_center_id`, `urgency`, `needed_on`, `amount_estimate`, `status` |
| `pur.supplier_quote` | Tedarikçi teklifi | `request_id`, `supplier_party_id`, `price`, `currency`, `lead_time_days`, `terms`, `document_id` |
| `pur.purchase_order` | Sipariş | `supplier_party_id`, `order_no`, `currency`, `total_amount`, `total_amount_try`, `exchange_rate`, `promised_on`, `status` |
| `pur.purchase_order_line` | Sipariş satırı | `order_id`, `material_id`, `qty`, `unit_price`, `line_amount` |
| `pur.goods_receipt` | Teslim alım | `order_id`, `truck_load_id`, `received_at`, `received_by_user_id` |
| `pur.goods_receipt_line` | Teslim satırı | `receipt_id`, `order_line_id`, `qty`, `over_delivery_qty`, `approval_status` |

Teslim alım **stok hareketi üretir** (INV); hareketi yazan INV'dir, PUR olay yayımlar.

## fac — Fabrika

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `fac.factory_daily_log` | Fabrika günlük kaydı | `log_date`, `status`, `submitted_by_user_id`, `approved_by_user_id` |
| `fac.production_entry` | Üretim satırı | `log_id`, `work_type` (strip/lug/improvement), `input_material_id`, `output_material_id`, `input_qty`, `output_qty`, `scrap_qty`, `labour_hours` |
| `fac.production_batch` | Parti (zincir) | `work_type`, `started_at`, `finished_at`, `current_stage` |
| `fac.batch_stage` | Zincir adımı | `batch_id`, `stage`, `qty_in`, `qty_out`, `scrap_qty`, `at`, `location_id` |
| `fac.cost_period` | Aylık maliyet dönemi | `period`, `status` (provisional/final), `total_cost`, `total_hours` |
| `fac.unit_cost` | İş türü birim maliyeti | `cost_period_id`, `work_type`, `unit_cost`, `basis` |
| `fac.improvement_work` | Teknik iyileştirme işi | `title`, `status`, `asset_id`, `hours`, `cost` |

## eqp — Ekipman ve araçlar

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `eqp.asset` | Varlık kartı | `code`, `category_item_id`, `ownership` (own/rented), `purchase_amount`, `useful_life_months`, `residual_value`, `status` |
| `eqp.asset_group` | Adetle izlenen düşük değerli eşya | `category_item_id`, `location_id`, `qty` |
| `eqp.rented_asset` | Kiralık varlık | `asset_id`, `lessor_party_id`, `rent_amount`, `period`, `ends_on` |
| `eqp.asset_location_period` | Nerede, hangi tarihler | `asset_id`, `location_id`, `site_id`, `from_at`, `to_at` |
| `eqp.asset_assignment` | Zimmet | `asset_id`, `employee_id`, `assigned_at`, `returned_at` |
| `eqp.custody_record` | Devir-teslim tutanağı | `asset_id`, `from_employee_id`, `to_employee_id`, `both_confirmed`, `document_id` |
| `eqp.working_day` | Çalışma günü | `asset_id`, `site_id`, `date`, `hours`, `source_type` |
| `eqp.periodic_inspection` | Periyodik kontrol | `asset_id`, `type`, `due_on`, `done_on`, `result`, `document_id` |
| `eqp.breakdown` | Arıza ve tamir | `asset_id`, `reported_at`, `description`, `photo_document_id`, `repair_cost`, `resolved_at` |
| `eqp.crane_daily_log` | Vinç günlük kaydı | `asset_id`, `site_id`, `operator_user_id`, `log_date`, `hours`, `counter_reading`, `fuel_litres`, `fuel_amount`, `fuel_receipt_document_id`, `status` |
| `eqp.write_off` | Zayi / hurdaya ayırma | `asset_id`, `reason`, `approved_by_user_id`, `document_id` |

**Kısıtlar.** Sayaç değeri geri gidemez (`ck`). Yakıt fişi belgesi olmadan vinç kaydı gönderilemez (REQ-EQP-019). Bir varlık aynı anda iki lokasyon döneminde olamaz (dışlama kısıtı).

## Phase 06'ya giden not

En çok satır `sit.*` giriş tabloları ve `inv.stock_movement` olacaktır; SPIKE-02 liste ve detay sorgularını bu iki küme üzerinde ölçer.
