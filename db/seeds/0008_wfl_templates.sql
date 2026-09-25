-- The company's default flow templates (TASK-0120, REQ-WFL-027, REQ-WFL-028, D-086).
-- Re-runnable: a template is written once and then only ever moved forward — a seed carrying a newer
-- version replaces the definition, an older or equal one changes nothing. A copy somebody made is
-- never touched here; it is told that its template has moved on (REQ-WFL-027).
--
-- The steps, roles and thresholds are the **template's defaults**, from
-- `docs/workflows/END_TO_END_FLOWS.md`. Management changes them in the designer, which is the whole
-- reason these are templates and not code. Where a step wants "the site's own coordinator", the
-- template names the role instead: the relation belongs to the module that owns sites and that
-- module has not declared it yet, so the honest default is the role and the designer picks the
-- relation once it exists.

insert into wfl.template (id, key, name, summary, version, definition)
values
  (
    md5('wfl.template:daily-site-log-approval')::uuid,
    'daily-site-log-approval',
    'Günlük saha kaydı onayı',
    'Saha mühendisinin günlük kaydını koordinatör çapraz kontrol eder; 8 saatte karar çıkmazsa bir üst basamağa gider, harcaması eşiği aşan gün ayrıca genel müdür onayına düşer.',
    1,
    $json$
    {
      "trigger": { "type": "event", "event": "daily_site_log.submitted" },
      "start": "approval_1",
      "steps": [
        {
          "id": "approval_1",
          "type": "approval",
          "title": "Koordinatör kontrolü",
          "owner": { "type": "role", "role": "KO" },
          "escalation": { "after": "PT8H", "to": { "type": "role", "role": "GK" } },
          "outcomes": { "approve": "condition_1", "return": "task_1" }
        },
        {
          "id": "condition_1",
          "type": "condition",
          "title": "Harcama eşiği",
          "test": { "field": "record.expense_total", "op": ">", "value": 5000 },
          "whenTrue": "approval_2",
          "whenFalse": "end_1"
        },
        {
          "id": "approval_2",
          "type": "approval",
          "title": "Saha harcaması onayı",
          "owner": { "type": "role", "role": "GM" },
          "outcomes": { "approve": "end_1" }
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "Düzelt ve yeniden gönder",
          "owner": { "type": "role", "role": "SM" },
          "priority": "high",
          "next": "approval_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:payment-approval')::uuid,
    'payment-approval',
    'Ödeme onayı',
    'Onaya sunulan ödeme, tutarı eşiği aşarsa genel müdüre, aşmazsa koordinatöre düşer.',
    1,
    $json$
    {
      "trigger": { "type": "event", "event": "payment.submitted_for_approval" },
      "start": "condition_1",
      "steps": [
        {
          "id": "condition_1",
          "type": "condition",
          "title": "Tutar eşiği",
          "test": { "field": "record.amount", "op": ">", "value": 50000 },
          "whenTrue": "approval_1",
          "whenFalse": "approval_2"
        },
        {
          "id": "approval_1",
          "type": "approval",
          "title": "Genel müdür onayı",
          "owner": { "type": "role", "role": "GM" },
          "outcomes": { "approve": "end_1" }
        },
        {
          "id": "approval_2",
          "type": "approval",
          "title": "Koordinatör onayı",
          "owner": { "type": "role", "role": "KO" },
          "outcomes": { "approve": "end_1" }
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:revision-request-approval')::uuid,
    'revision-request-approval',
    'Revizyon talebi onayı',
    'Kilitli bir kayıtta istenen değişiklik, teknik ofisin onayına düşer; reddedilirse gerekçesi talep edene gider.',
    1,
    $json$
    {
      "trigger": { "type": "event", "event": "revision_request.submitted" },
      "start": "approval_1",
      "steps": [
        {
          "id": "approval_1",
          "type": "approval",
          "title": "Revizyon kararı",
          "owner": { "type": "role", "role": "TO" },
          "outcomes": { "approve": "end_1", "reject": "notify_1", "return": "notify_1" }
        },
        {
          "id": "notify_1",
          "type": "notify",
          "title": "Talep edene haber",
          "owner": { "type": "role", "role": "SM" },
          "subject": "Revizyon talebiniz karara bağlandı",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:stock-count-approval')::uuid,
    'stock-count-approval',
    'Stok sayımı onayı',
    'Sayım farkı toleransı aşarsa genel müdür, aşmazsa koordinatör onaylar.',
    1,
    $json$
    {
      "trigger": { "type": "event", "event": "stock_count.submitted" },
      "start": "condition_1",
      "steps": [
        {
          "id": "condition_1",
          "type": "condition",
          "title": "Fark toleransı",
          "test": { "field": "record.difference_percent", "op": ">", "value": 2 },
          "whenTrue": "approval_1",
          "whenFalse": "approval_2"
        },
        {
          "id": "approval_1",
          "type": "approval",
          "title": "Genel müdür onayı",
          "owner": { "type": "role", "role": "GM" },
          "outcomes": { "approve": "end_1" }
        },
        {
          "id": "approval_2",
          "type": "approval",
          "title": "Koordinatör onayı",
          "owner": { "type": "role", "role": "KO" },
          "outcomes": { "approve": "end_1" }
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:quote-approval')::uuid,
    'quote-approval',
    'Teklif onayı',
    'Onaya sunulan teklif genel müdüre düşer; onaylanınca satış haberdar edilir.',
    1,
    $json$
    {
      "trigger": { "type": "event", "event": "quote.submitted_for_approval" },
      "start": "approval_1",
      "steps": [
        {
          "id": "approval_1",
          "type": "approval",
          "title": "Teklif kararı",
          "owner": { "type": "role", "role": "GM" },
          "escalation": { "after": "P2D", "to": { "type": "role", "role": "SAH" } },
          "outcomes": { "approve": "notify_1", "reject": "end_1" }
        },
        {
          "id": "notify_1",
          "type": "notify",
          "title": "Satışa haber",
          "owner": { "type": "role", "role": "SAT" },
          "subject": "Teklif onaylandı",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:purchase-request-approval')::uuid,
    'purchase-request-approval',
    'Satın alma talebi',
    'Talep, tutarı eşiği aşarsa genel müdür onayından geçer; onaydan sonra satın almaya sipariş görevi düşer.',
    1,
    $json$
    {
      "trigger": { "type": "event", "event": "purchase_request.submitted" },
      "start": "condition_1",
      "steps": [
        {
          "id": "condition_1",
          "type": "condition",
          "title": "Tutar eşiği",
          "test": { "field": "record.amount", "op": ">", "value": 25000 },
          "whenTrue": "approval_1",
          "whenFalse": "approval_2"
        },
        {
          "id": "approval_1",
          "type": "approval",
          "title": "Genel müdür onayı",
          "owner": { "type": "role", "role": "GM" },
          "outcomes": { "approve": "task_1" }
        },
        {
          "id": "approval_2",
          "type": "approval",
          "title": "Satın alma onayı",
          "owner": { "type": "role", "role": "SAL" },
          "outcomes": { "approve": "task_1" }
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "Siparişi verin",
          "owner": { "type": "role", "role": "SAL" },
          "priority": "normal",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:material-issue-request')::uuid,
    'material-issue-request',
    'Malzeme çıkış talebi',
    'Sahadan gelen malzeme talebi saha mühendisinin onayına düşer; onaylanınca depoya hazırlama görevi açılır.',
    1,
    $json$
    {
      "trigger": { "type": "event", "event": "material_issue_request.submitted" },
      "start": "approval_1",
      "steps": [
        {
          "id": "approval_1",
          "type": "approval",
          "title": "Çıkış onayı",
          "owner": { "type": "role", "role": "SM" },
          "escalation": { "after": "PT4H", "to": { "type": "role", "role": "KO" } },
          "outcomes": { "approve": "task_1", "reject": "end_1" }
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "Malzemeyi hazırlayın",
          "owner": { "type": "role", "role": "SAL" },
          "priority": "normal",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:progress-claim-to-invoice')::uuid,
    'progress-claim-to-invoice',
    'Hakediş → fatura',
    'Onaylanan hakedişten sonra muhasebeye fatura görevi düşer; fatura kesilince satış haberdar edilir. Faturayı akış kesmez, insan keser.',
    1,
    $json$
    {
      "trigger": { "type": "event", "event": "progress_claim.approved" },
      "start": "task_1",
      "steps": [
        {
          "id": "task_1",
          "type": "task",
          "title": "Faturayı kesin",
          "owner": { "type": "role", "role": "MUH" },
          "priority": "high",
          "next": "notify_1"
        },
        {
          "id": "notify_1",
          "type": "notify",
          "title": "Satışa haber",
          "owner": { "type": "role", "role": "SAT" },
          "subject": "Hakediş faturası kesildi",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:personnel-exit')::uuid,
    'personnel-exit',
    'Personel çıkışı',
    'Ayrılacak personel için çıkış kontrol listesi açılır, liste kapanana kadar çıkış kilitlenir; evrak maddeleri ve açık zimmetler paralel yürür, hepsi kapanınca liste tamamlanır.',
    1,
    $json$
    {
      "trigger": { "type": "event", "event": "employee.leaving_date_set" },
      "start": "record_1",
      "steps": [
        {
          "id": "record_1",
          "type": "record",
          "title": "Çıkış kontrol listesini aç",
          "action": "create",
          "recordType": "hr.offboarding_checklist",
          "next": "lock_1"
        },
        {
          "id": "lock_1",
          "type": "lock",
          "title": "Çıkışı kilitle",
          "transition": "employee.mark_left",
          "reason": "Çıkış kontrol listesi kapanmadan personel ayrıldı yapılamaz",
          "next": "parallel_1"
        },
        {
          "id": "parallel_1",
          "type": "parallel",
          "title": "Evraklar ve zimmetler",
          "paths": ["for_each_1", "for_each_2"],
          "next": "join_1"
        },
        {
          "id": "for_each_1",
          "type": "for_each",
          "title": "Her evrak maddesi",
          "list": "hr.open_checklist_items",
          "body": "task_1",
          "limit": 20
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "Evrak maddesini tamamlayın",
          "owner": { "type": "role", "role": "IK" },
          "priority": "normal"
        },
        {
          "id": "for_each_2",
          "type": "for_each",
          "title": "Her açık zimmet",
          "list": "hr.open_custody",
          "body": "task_2",
          "limit": 20
        },
        {
          "id": "task_2",
          "type": "task",
          "title": "Zimmeti teslim alın",
          "owner": { "type": "role", "role": "SAL" },
          "priority": "high"
        },
        { "id": "join_1", "type": "join", "title": "Hepsi kapandı", "next": "record_2" },
        {
          "id": "record_2",
          "type": "record",
          "title": "Listeyi tamamla",
          "action": "set_status",
          "status": "completed",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:external-party-approval')::uuid,
    'external-party-approval',
    'Dış taraf onayı (alt akış)',
    'Panele girmeyen bir tarafın onayı: bizden biri görevi alır, iletir, cevabı ve belgesini işler. Gecikirse görevin kendi eskalasyonu çalışır; dış taraflara panel girişi açılmaz.',
    1,
    $json$
    {
      "trigger": { "type": "manual" },
      "start": "task_1",
      "steps": [
        {
          "id": "task_1",
          "type": "task",
          "title": "Dış tarafa iletin ve cevabını işleyin",
          "owner": { "type": "role", "role": "TO" },
          "priority": "high",
          "next": "notify_1"
        },
        {
          "id": "notify_1",
          "type": "notify",
          "title": "Cevap işlendi",
          "owner": { "type": "role", "role": "KO" },
          "subject": "Dış taraf cevabı işlendi",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  )
on conflict (key) do update
  set name = excluded.name,
      summary = excluded.summary,
      version = excluded.version,
      definition = excluded.definition,
      updated_at = now()
  -- Only forward: a seed carrying an older or equal version leaves what is there alone, and a copy
  -- somebody made is never touched from here.
  where wfl.template.version < excluded.version;
