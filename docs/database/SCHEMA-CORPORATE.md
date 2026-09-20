# Şema — Kurumsal (HR, CMP, QHS, MTG, SUP)

Durum: CONFIRMED (sahip, 2026-09-20) · Son güncelleme: 2026-09-20

Ortak kurallar `docs/database/CONVENTIONS.md`'dedir. Bu şemalarda hassas kişisel veri yoğundur; her hassas sütun `data_class = sensitive` işaretlidir ve izni olmayanın sorgusundan çıkarılır (`docs/architecture/PERMISSIONS.md` bölüm 3). Görev: TASK-0069.

## hr — Personel ve bordro

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `hr.employee` | Personel kartı | `full_name`, `unit`, `position_role_id`, `hired_on`, `left_on`, `status`, `user_id` (IAM, nullable) |
| `hr.employee_sensitive` | Hassas özlük alanları | `employee_id`, `national_id`, `social_security_no`, `iban`, `salary_amount`, `birth_date`, `address` |
| `hr.employee_document` | Süreli belge | `employee_id`, `doc_type`, `valid_until`, `document_id` |
| `hr.medical_report` | Sağlık raporu **yalnız varlığı** | `employee_id`, `starts_on`, `ends_on`, `reported_by_user_id` | Teşhis, belge ve ayrıntı tutulmaz (D-186, DOC-K3) |
| `hr.timesheet` | Aylık puantaj | `employee_id`, `period`, `source` (site_log/manual), `work_days`, `hours`, `overtime_hours`, `absence_days`, `status` |
| `hr.timesheet_day` | Gün satırı | `timesheet_id`, `date`, `day_fraction`, `hours`, `type` (work/leave/absent/holiday), `source_log_id` |
| `hr.payroll` | Bordro | `period`, `unit`, `status`, `parameter_version_id`, `approved_by_user_id`, `paid_at` |
| `hr.payroll_line` | Kişi satırı | `payroll_id`, `employee_id`, `gross`, `social_security`, `tax`, `deductions`, `net`, `bonus_id` |
| `hr.payroll_parameter` | Bordro parametresi (tarihli) | `valid_from`, `minimum_wage`, `social_security_rates`, `tax_brackets`, `meal_allowance` |
| `hr.salary_advance` | Maaş avansı | `employee_id`, `amount`, `requested_on`, `approval_status`, `deducted_in_payroll_id` |
| `hr.bank_payment_file` | Banka ödeme dosyası | `payroll_id`, `document_id`, `generated_at` |
| `hr.leave` | İzin | `employee_id`, `type`, `starts_on`, `ends_on`, `days`, `status`, `medical_report_id` |
| `hr.leave_balance` | İzin bakiyesi | `employee_id`, `year`, `entitled_days`, `used_days`, `carried_days` |
| `hr.checklist` | Giriş/çıkış kontrol listesi | `employee_id`, `kind` (onboarding/offboarding), `status`, `due_on` |
| `hr.checklist_item` | Liste maddesi | `checklist_id`, `catalog_item_id`, `responsible_role_id`, `status`, `document_id`, `blocking` |
| `hr.daily_activity_report` | Günlük faaliyet raporu | `employee_id`, `date`, `text`, `submitted_at` |

**Kısıtlar.** `hr.employee_sensitive` ayrı tablodadır; böylece personel listesi hassas sütunlara hiç dokunmadan sorgulanır. Ayrılış tarihi geçmiş personelin açık kontrol listesi kapanana kadar `blocking` maddeler kilit üretir (REQ-HR-015, WFL kilidi). Bordro onaylanmadan ödeme satırı yazılamaz.

## cmp — Sözleşme ve uyum

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `cmp.contract` | Sözleşme | `type` (client/subcontractor/supplier_framework), `party_id`, `project_id`, `signed_on`, `starts_on`, `ends_on`, `value`, `currency`, `document_id` |
| `cmp.contract_term` | İzlenen şart | `contract_id`, `key`, `value`, `unit`, `note` |
| `cmp.contract_amendment` | Tarihli değişiklik | `contract_id`, `amendment_no`, `effective_from`, `document_id` |
| `cmp.obligation` | Yükümlülük | `contract_id`, `project_id`, `responsible_party` (geoges/client/subcontractor/supplier), `description`, `due_on`, `status`, `penalty_risk_amount`, `source_*` |
| `cmp.extension_of_time` | Süre uzatımı | `contract_id`, `days`, `reason`, `decided_at`, `document_id` |
| `cmp.client_delay_file` | İşveren gecikme dosyası | `project_id`, `opened_on`, `status` |
| `cmp.client_delay_event` | Gecikme olayı | `file_id`, `occurred_on`, `hours`, `evidence_document_id`, `client_wait_id` |
| `cmp.notice_letter` | Bildirim yazısı | `file_id`, `obligation_id`, `draft_document_id`, `sent_at`, `decision_reason` |
| `cmp.guarantee` | Teminat | `contract_id`, `type`, `amount`, `currency`, `valid_until`, `commission_expense_id`, `document_id` |
| `cmp.periodic_document` | Süreli şirket belgesi | `doc_type`, `valid_until`, `owner_unit`, `document_id` |
| `cmp.dispute` | Uyuşmazlık dosyası | `party_id`, `project_id`, `subject`, `status`, `amount_at_risk` |

İşveren beklemesi (`sit.client_wait`) sözleşmedeki süreli yükümlülüğü aşarsa panel onu `cmp.obligation`'a bağlar ve gecikmiş sayar (D-222); bağ `client_wait_id` ve `obligation_id` sütunlarıyla iki yönlü izlenir.

## qhs — Kalite ve İSG

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `qhs.test_certificate` | Test ve sertifika | `material_lot_id`, `type`, `result` (pass/fail), `issued_on`, `valid_until`, `document_id` |
| `qhs.quality_check` | Saha kalite kontrolü | `site_id`, `checklist_item_id`, `result`, `checked_at`, `checked_by_user_id`, `photo_document_id` |
| `qhs.nonconformity` | Uygunsuzluk | `source_*`, `type`, `impact_level`, `is_repeat`, `root_cause`, `status`, `due_on`, `closed_at` |
| `qhs.corrective_action` | DÖF aksiyonu | `nonconformity_id`, `description`, `owner_user_id`, `due_on`, `status`, `task_id` |
| `qhs.ohs_incident` | İSG olayı | `site_id`, `type` (accident/near_miss), `severity`, `occurred_at`, `description`, `employee_id`, `document_id` |
| `qhs.training` | Eğitim tanımı | `name`, `is_mandatory`, `valid_months`, `target_role_ids[]` |
| `qhs.training_record` | Eğitim kaydı | `training_id`, `employee_id`, `completed_on`, `valid_until`, `document_id` |
| `qhs.ppe_issue` | KKD teslimi | `employee_id`, `item_id`, `qty`, `issued_at`, `confirmed_at`, `document_id` |
| `qhs.risk_assessment` | Risk değerlendirmesi | `site_id`, `valid_until`, `document_id`, `status` |
| `qhs.ohs_checklist_run` | Günlük İSG kontrolü | `site_id`, `date`, `status`, `completed_by_user_id` |
| `qhs.ohs_checklist_line` | Kontrol maddesi | `run_id`, `item_id`, `result`, `explanation`, `photo_document_id` |

**Kısıtlar.** İSG olayında sağlık bilgisi sütunu yoktur (yalnız olayın kendisi). "Uygun değil" sonucu açıklamasız kaydedilemez (`ck`). Kök nedeni ve en az bir aksiyonu olmayan uygunsuzluk kapanamaz (`ck`, QHS değişmezi).

## mtg — Toplantı ve karar

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `mtg.meeting` | Toplantı | `title`, `held_at`, `project_id`, `site_id`, `created_by_user_id` |
| `mtg.meeting_participant` | Katılımcı | `meeting_id`, `user_id`, `external_name` |
| `mtg.meeting_minutes` | Tutanak | `meeting_id`, `body`, `locked_at` |
| `mtg.meeting_decision` | Karar | `meeting_id`, `description`, `owner_user_id`, `due_on`, `status`, `task_id` |

Tutanak kaydedilince kilitlenir (`locked_at`); değişiklik yalnız revizyon talebiyle (MTG-K1). Karar ile görevin durumu birbirine bağlıdır (MTG-K3).

## sup — İç destek

| Tablo | Ne tutar | Ayırt edici sütunlar |
|---|---|---|
| `sup.ticket` | Destek talebi | `opened_by_user_id`, `assignee_user_id`, `category_item_id`, `subject`, `priority`, `status`, `purchase_request_id` |
| `sup.message` | Mesaj | `ticket_id`, `author_user_id`, `body`, `document_id` |
| `sup.referral` | Üst pozisyona sevk | `ticket_id`, `from_user_id`, `to_user_id`, `at`, `reason` |

Sevk edilen talep ilk muhatabın listesinden düşmez (SUP-K2): `assignee_user_id` değişmez, sevk ayrı satırdır.
