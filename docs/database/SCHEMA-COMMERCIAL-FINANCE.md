# Şema — Ticari ve Finans (CRM, QTE, FIN)

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-20

Ortak kurallar `docs/database/CONVENTIONS.md`'dedir. Para sütunları D-243'e uyar: `amount` + `currency` + `amount_try` + `exchange_rate` + `exchange_rate_date`; satır bazında kuruşa yuvarlama. Görev: TASK-0068.

## crm — Talepler ve firmalar

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `crm.party` | Firma (işveren, müşteri, tedarikçi, taşeron, kiralayan) | `name`, `tax_no`, `roles[]`, `city`, `status` |
| `crm.party_contact` | Firma kişisi | `party_id`, `name`, `title`, `phone`, `email` |
| `crm.lead` | Talep | `party_id`, `source`, `owner_user_id`, `stage`, `expected_decision_on`, `lost_reason_item_id` |
| `crm.contact_log` | İletişim günlüğü | `lead_id`, `party_id`, `channel`, `summary`, `occurred_at`, `document_id` |
| `crm.scorecard_note` | İşveren karnesine elle not | `party_id`, `note`, `visibility` |
| `crm.tender` | İhale takibi | `party_id`, `name`, `deadline_at`, `status`, `document_id` |

`Party` tek tablodur; tedarikçi ve işveren aynı firmanın iki rolüdür (`roles[]`). İşveren karnesi hesaplanır, saklanmaz (okuma modeli, D-233).

## qte — Teklif ve ürün satışı

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `qte.quote` | Teklif | `lead_id`, `party_id`, `type` (application/product), `status`, `target_margin_percent`, `owner_user_id` |
| `qte.quote_version` | Gönderilmiş sürüm (değişmez) | `quote_id`, `version_no`, `sent_at`, `valid_until`, `total_amount`, `currency`, `amount_try`, `exchange_rate`, `document_id` |
| `qte.quote_line` | Kalem | `version_id`, `item_id`, `qty`, `unit`, `unit_price`, `line_amount`, `suggested_cost`, `entered_cost` |
| `qte.quote_template` | Teklif belgesi şablonu | `name`, `body`, `is_default` |
| `qte.cost_feedback` | Maliyet geri beslemesi | `quote_version_id`, `project_id`, `estimated_cost`, `actual_cost`, `deviation_percent`, `explanation` |
| `qte.sales_order` | Satış siparişi (ürün satışı) | `quote_version_id`, `party_id`, `status`, `promised_on`, `total_amount`, `amount_try` |
| `qte.sales_order_line` | Satış siparişi kalemi | `order_id`, `material_id`, `qty`, `unit_price`, `reserved_stock_qty` |

Gönderilen sürüm **güncellenmez**; değişiklik yeni sürümdür (REQ-QTE). Kazanılan uygulama teklifi CRM üzerinden taslak proje doğurur (REQ-CRM-014).

## fin — Finans

### Hakediş

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `fin.client_progress_payment` | İşveren hakedişi | `project_id`, `period`, `status`, `gross_amount`, `deduction_total`, `net_amount`, `currency`, `amount_try`, `exchange_rate`, `submitted_at`, `client_approved_at`, `invoiced_at`, `expected_collection_on` |
| `fin.progress_payment_line` | Kalem | `payment_id`, `item_id`, `suggested_qty`, `entered_qty`, `reason`, `carried_over_qty`, `unit_price`, `line_amount` |
| `fin.deduction` | Kesinti | `payment_id`, `type` (retention/withholding/advance/other), `amount`, `rule_ref` |
| `fin.subcontractor_progress_payment` | Taşeron hakedişi | `contract_id`, `site_id`, `period`, `status`, `net_amount`, `amount_try` |
| `fin.client_advance` | İşveren avansı | `project_id`, `amount`, `remaining_amount`, `document_id` |

### Defterler

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `fin.income` | Gelir kaydı | `party_id`, `project_id`, `category_item_id`, `amount`, `currency`, `amount_try`, `exchange_rate`, `source_*`, `occurred_on` |
| `fin.expense` | Gider kaydı | `party_id`, `cost_center_id`, `project_id`, `category_item_id`, `amount`, `amount_try`, `source_*`, `approval_status`, `document_id`, `possible_duplicate_of_id` |
| `fin.party_account_entry` | **Cari defter satırı** | `party_id`, `direction` (debit/credit), `amount`, `currency`, `amount_try`, `exchange_rate`, `source_*`, `occurred_on` |
| `fin.collection` | Tahsilat | `payment_id`, `party_id`, `amount`, `amount_try`, `received_on`, `document_id` |
| `fin.payment` | Ödeme | `party_id`, `amount`, `amount_try`, `due_on`, `paid_on`, `approval_status`, `prepared_by_user_id`, `approved_by_user_id`, `document_id` |
| `fin.invoice` | Fatura takibi | `party_id`, `direction` (issued/received), `invoice_no`, `issued_on`, `amount`, `amount_try`, `linked_payment_id` |

Defter satırları güncellenmez; düzeltme ters kayıttır. Hazırlayan kendi ödemesini onaylayamaz (`ck`: `prepared_by_user_id <> approved_by_user_id`, REQ-IAM-026).

### Nakit ve kapanış

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `fin.cash_flow_item` | Planlı nakit kalemi | `direction`, `amount`, `amount_try`, `expected_on`, `category_item_id`, `note` |
| `fin.cash_projection_run` | Projeksiyon çalışması | `run_at`, `horizon_weeks`, `result` (jsonb), `lowest_cumulative` |
| `fin.closing_unit` | Kapanış birimi | `type` (site/factory/general), `site_id`, `name` |
| `fin.period_close` | Dönem kapanışı | `closing_unit_id`, `period`, `status`, `closed_at`, `closed_by_user_id`, `reopened_at`, `reopen_reason` |
| `fin.period_close_blocker` | Engelleyici kalem | `period_close_id`, `blocker_type`, `record_*`, `resolved_at` |
| `fin.accounting_export` | Muhasebe dosyası | `period`, `file_document_id`, `generated_at`, `reconciliation_status`, `difference_note` |

**Kısıtlar.** Kapanmış dönemin (`period_close.status = 'closed'`) kapsamına düşen defter satırı yazılamaz; yazma denemesi reddedilir ve revizyon yoluna yönlendirir (REQ-FIN-029, REQ-ADM-008). Dövizli her satırda kur ve tarih zorunludur (`ck`, ADM-K5).

## Kur bekleyen kayıtlar

`exchange_rate` boşsa satır "kur bekliyor" sayılır: toplamlara girmez, ekranda işaretli görünür ve kur geldiğinde tamamlanır (ADM-K4). Bu bir durum sütunuyla değil, kurun yokluğuyla anlaşılır; böylece iki kaynak oluşmaz.

## Phase 06'ya giden not

Hakediş ve cari sorguları SPIKE-02'nin ikinci ölçüm kümesidir; kapanmış dönem kısıtı SPIKE-01 ile birlikte sınanır.
