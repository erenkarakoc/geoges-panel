-- The eight end-to-end processes as templates (TASK-0120, REQ-WFL-011, REQ-WFL-028, D-104).
-- Re-runnable, forward only, like 0008.
--
-- An end-to-end process is **not** one long flow: it is a chain of short flows that trigger each
-- other (D-104), so that changing one link leaves everything else running. These are those links,
-- written from `docs/workflows/END_TO_END_FLOWS.md` where each one already has its trigger, its steps
-- and its default roles. Template names carry no process codes (A1.1, A2.3 …): those are the
-- design document's own numbering, not words the company uses (owner, 2026-09-26); each such
-- template moved one version forward when its name lost the code.
--
-- Four templates from 0008 are links of a chain as well, and this seed carries their fuller version:
-- the quote approval gains the lock and the margin condition, the progress claim its client step, the
-- purchase request and the material issue their return paths. A copy somebody has already made is not
-- touched — it is told that its template moved on (REQ-WFL-027).
--
-- What the core does is not here. "Fatura kesilir", "stok azalır", "cari bakiye düşer" are the
-- panel's own work and no flow may do them (D-080); the flow opens the task and a person finishes it.

insert into wfl.template (id, key, name, summary, version, definition)
values
  -- ------------------------------------------------------------------------------------------
  -- 1. Yeni işten tahsilata
  -- ------------------------------------------------------------------------------------------
  (
    md5('wfl.template:lead-intake')::uuid,
    'lead-intake',
    'Talep karşılama',
    'Yeni bir talep düştüğünde satışa ön inceleme görevi açar; üç iş günü içinde kapanmazsa genel müdüre çıkar.',
    2,
    $json$
    {
      "trigger": { "type": "event", "event": "lead.created" },
      "start": "task_1",
      "steps": [
        {
          "id": "task_1",
          "type": "task",
          "title": "Ön inceleme ve yaklaşık miktar",
          "owner": { "type": "role", "role": "SAT" },
          "priority": "normal",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:project-kickoff')::uuid,
    'project-kickoff',
    'Kazanılan işin başlatılması',
    'Proje açıldığında sözleşme ve proje bilgileri paralel yürür; ikisi de kapanınca proje aşaması teknik projeye geçer.',
    2,
    $json$
    {
      "trigger": { "type": "event", "event": "project.created" },
      "start": "parallel_1",
      "steps": [
        {
          "id": "parallel_1",
          "type": "parallel",
          "title": "Sözleşme ve proje bilgileri",
          "paths": ["task_1", "task_2"],
          "next": "join_1"
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "Sözleşmeyi ve yükümlülüklerini kaydet",
          "owner": { "type": "role", "role": "GM" },
          "priority": "high"
        },
        {
          "id": "task_2",
          "type": "task",
          "title": "Proje bilgilerini tamamla",
          "owner": { "type": "role", "role": "TO" },
          "priority": "normal"
        },
        { "id": "join_1", "type": "join", "title": "İkisi de tamam", "next": "record_1" },
        {
          "id": "record_1",
          "type": "record",
          "title": "Aşamayı teknik projeye taşı",
          "action": "set_status",
          "status": "technical_design",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:authority-approvals')::uuid,
    'authority-approvals',
    'Kurum onayı takibi',
    'Kurum onayı gereken her teknik ofis işi için dış taraf onayı alt akışı çalışır; hepsi bitince şantiyeyi açma görevi düşer ve proje mobilizasyona geçer.',
    2,
    $json$
    {
      "trigger": { "type": "event", "event": "project.stage_changed" },
      "start": "for_each_1",
      "steps": [
        {
          "id": "for_each_1",
          "type": "for_each",
          "title": "Kurum onayı gereken her iş",
          "list": "prj.authority_approvals",
          "body": "subflow_1",
          "limit": 20,
          "next": "task_1"
        },
        {
          "id": "subflow_1",
          "type": "subflow",
          "title": "Dış taraf onayı",
          "flow": "external-party-approval"
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "Şantiyeyi aç, mobilizasyonu başlat",
          "owner": { "type": "role", "role": "KO" },
          "priority": "high",
          "next": "record_1"
        },
        {
          "id": "record_1",
          "type": "record",
          "title": "Aşamayı mobilizasyona taşı",
          "action": "set_status",
          "status": "mobilisation",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:monthly-progress-claim')::uuid,
    'monthly-progress-claim',
    'Aylık hakediş hazırlığı',
    'Her ayın 25''inde uygulama aşamasındaki her proje için hakediş taslağı açar ve kontrol görevini hakediş sorumlusuna verir.',
    2,
    $json$
    {
      "trigger": { "type": "clock", "dailyAt": "06:00", "monthlyOn": 25 },
      "start": "for_each_1",
      "steps": [
        {
          "id": "for_each_1",
          "type": "for_each",
          "title": "Hakediş dönemindeki her proje",
          "list": "prj.claim_due_projects",
          "body": "record_1",
          "limit": 50,
          "next": "end_1"
        },
        {
          "id": "record_1",
          "type": "record",
          "title": "Hakediş taslağı aç",
          "action": "create",
          "recordType": "fin.client_progress_payment",
          "next": "task_1"
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "Hakedişi kontrol et ve iç onaya hazırla",
          "owner": { "type": "role", "role": "MUH" },
          "priority": "normal"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:overdue-collection')::uuid,
    'overdue-collection',
    'Geciken tahsilat',
    'Vadesi geçen hakediş için satışa takip görevi açar; kapanmazsa genel müdüre, sonra sahibe çıkar.',
    2,
    $json$
    {
      "trigger": { "type": "event", "event": "client_progress_payment.overdue" },
      "start": "task_1",
      "steps": [
        {
          "id": "task_1",
          "type": "task",
          "title": "Tahsilatı takip et",
          "owner": { "type": "role", "role": "SAT" },
          "priority": "high",
          "next": "escalate_1"
        },
        {
          "id": "escalate_1",
          "type": "escalate",
          "title": "Yönetime bildir",
          "to": { "type": "role", "role": "GM" },
          "subject": "Geciken tahsilat takibi tamamlandı mı?",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:cost-feedback')::uuid,
    'cost-feedback',
    'Maliyet geri beslemesi',
    'Proje tamamlandığında teklifi hazırlayana "teklif ile gerçekleşeni karşılaştır" görevi düşer.',
    2,
    $json$
    {
      "trigger": { "type": "event", "event": "project.stage_changed" },
      "start": "condition_1",
      "steps": [
        {
          "id": "condition_1",
          "type": "condition",
          "title": "Tamamlama aşaması mı?",
          "test": { "field": "record.stage", "op": "=", "value": "completion" },
          "whenTrue": "task_1",
          "whenFalse": "end_1"
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "Teklif ile gerçekleşeni incele",
          "owner": { "type": "role", "role": "SAT" },
          "priority": "normal",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  -- ------------------------------------------------------------------------------------------
  -- 2. Çelik şeridin siparişten sahada kullanıma
  -- ------------------------------------------------------------------------------------------
  (
    md5('wfl.template:critical-stock-request')::uuid,
    'critical-stock-request',
    'Kritik stok → satın alma talebi',
    'Stok kritik seviyeye yaklaştığında satın alma talebi taslağı açar ve tamamlama görevini satın almaya verir.',
    2,
    $json$
    {
      "trigger": {
        "type": "threshold",
        "event": "stock.below_critical",
        "test": { "field": "record.days_to_critical", "op": "<=", "value": 14 }
      },
      "start": "record_1",
      "steps": [
        {
          "id": "record_1",
          "type": "record",
          "title": "Satın alma talebi taslağı aç",
          "action": "create",
          "recordType": "pur.purchase_request",
          "next": "task_1"
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "Talebi tamamla ve gönder",
          "owner": { "type": "role", "role": "SAL" },
          "priority": "high",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:weighbridge-difference')::uuid,
    'weighbridge-difference',
    'Fark ve fire kontrolü',
    'Kantar farkı eşiği aştığında sevkiyat sorumlusuna açıklama görevi açar; fark ikinci eşiği de aşarsa yönetime bildirir.',
    2,
    $json$
    {
      "trigger": { "type": "event", "event": "weighbridge_difference.exceeded" },
      "start": "task_1",
      "steps": [
        {
          "id": "task_1",
          "type": "task",
          "title": "Farkı açıkla",
          "owner": { "type": "role", "role": "SAL" },
          "priority": "high",
          "next": "condition_1"
        },
        {
          "id": "condition_1",
          "type": "condition",
          "title": "İkinci eşik",
          "test": { "field": "record.difference_percent", "op": ">", "value": 5 },
          "whenTrue": "notify_1",
          "whenFalse": "end_1"
        },
        {
          "id": "notify_1",
          "type": "notify",
          "title": "Yönetime bildir",
          "owner": { "type": "role", "role": "GM" },
          "subject": "Kantar farkı ikinci eşiği aştı",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  -- ------------------------------------------------------------------------------------------
  -- 3. Günlük saha üretimi
  -- ------------------------------------------------------------------------------------------
  (
    md5('wfl.template:daily-log-opening')::uuid,
    'daily-log-opening',
    'Günlük kaydın açılması',
    'Çalışma günlerinde sabah, aktif her şantiye için günlük kayıt taslağı açar ve giriş sorumlusuna haber verir.',
    2,
    $json$
    {
      "trigger": { "type": "clock", "dailyAt": "07:00" },
      "start": "for_each_1",
      "steps": [
        {
          "id": "for_each_1",
          "type": "for_each",
          "title": "Aktif her şantiye",
          "list": "sit.active_sites",
          "body": "record_1",
          "limit": 50,
          "next": "end_1"
        },
        {
          "id": "record_1",
          "type": "record",
          "title": "Günlük kayıt taslağı aç",
          "action": "create",
          "recordType": "sit.daily_site_log",
          "next": "notify_1"
        },
        {
          "id": "notify_1",
          "type": "notify",
          "title": "Giriş sorumlusuna haber",
          "owner": { "type": "role", "role": "SM" },
          "subject": "Günün saha kaydı açıldı"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:missed-daily-log')::uuid,
    'missed-daily-log',
    'Kaçırılan giriş',
    'Günlük kaydın süresi geçtiğinde giriş sorumlusuna görev açar ve koordinatöre çıkar.',
    2,
    $json$
    {
      "trigger": { "type": "event", "event": "daily_site_log.deadline_missed" },
      "start": "task_1",
      "steps": [
        {
          "id": "task_1",
          "type": "task",
          "title": "Günün kaydını gir",
          "owner": { "type": "role", "role": "SM" },
          "priority": "critical",
          "next": "escalate_1"
        },
        {
          "id": "escalate_1",
          "type": "escalate",
          "title": "Koordinatöre bildir",
          "to": { "type": "role", "role": "KO" },
          "subject": "Günlük saha kaydı gecikti",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  -- ------------------------------------------------------------------------------------------
  -- 5. İşveren gecikmesi
  -- ------------------------------------------------------------------------------------------
  (
    md5('wfl.template:repeated-client-wait')::uuid,
    'repeated-client-wait',
    'Tekrarlayan işveren beklemesi',
    'Aynı şantiyede son 30 günde üçten fazla bekleme olduğunda koordinatöre ve genel müdüre haber verir.',
    2,
    $json$
    {
      "trigger": { "type": "event", "event": "client_wait.recorded" },
      "start": "condition_1",
      "steps": [
        {
          "id": "condition_1",
          "type": "condition",
          "title": "Son 30 günde tekrar etti mi?",
          "test": { "countOf": "flow_runs", "withinDays": 30, "op": ">", "value": 3 },
          "whenTrue": "notify_1",
          "whenFalse": "end_1"
        },
        {
          "id": "notify_1",
          "type": "notify",
          "title": "Yönetime bildir",
          "owner": { "type": "role", "role": "KO" },
          "subject": "Bu şantiyede işveren beklemesi tekrarlıyor",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:client-obligation-delay')::uuid,
    'client-obligation-delay',
    'İşveren yükümlülüğü gecikmesi',
    'Yükümlülük geciktiğinde ihtarname taslağı açar ve gönderme kararını genel müdüre bırakır.',
    2,
    $json$
    {
      "trigger": { "type": "event", "event": "client_obligation.delayed" },
      "start": "record_1",
      "steps": [
        {
          "id": "record_1",
          "type": "record",
          "title": "İhtarname taslağı aç",
          "action": "create",
          "recordType": "cmp.notice_letter",
          "next": "task_1"
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "Yazıyı incele, gönderme kararını ver",
          "owner": { "type": "role", "role": "GM" },
          "priority": "high",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  -- ------------------------------------------------------------------------------------------
  -- 6. Toplantı kararından tamamlanan göreve
  -- ------------------------------------------------------------------------------------------
  (
    md5('wfl.template:decision-reminder')::uuid,
    'decision-reminder',
    'Karar hatırlatması',
    'Her sabah, son tarihine iki gün kalan toplantı kararlarının sorumlularına hatırlatma gönderir.',
    2,
    $json$
    {
      "trigger": { "type": "clock", "dailyAt": "08:00" },
      "start": "for_each_1",
      "steps": [
        {
          "id": "for_each_1",
          "type": "for_each",
          "title": "Son tarihi yaklaşan her karar",
          "list": "mtg.decisions_due_soon",
          "body": "notify_1",
          "limit": 50,
          "next": "end_1"
        },
        {
          "id": "notify_1",
          "type": "notify",
          "title": "Sorumluya hatırlat",
          "owner": { "type": "relation", "relation": "record.owner" },
          "subject": "Toplantı kararınızın son tarihi yaklaşıyor"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:overdue-decision')::uuid,
    'overdue-decision',
    'Geciken karar',
    'Toplantı kararı geciktiğinde sorumlusundan toplantıyı yönetene, oradan genel müdüre çıkar.',
    2,
    $json$
    {
      "trigger": { "type": "event", "event": "meeting_decision.overdue" },
      "start": "escalate_1",
      "steps": [
        {
          "id": "escalate_1",
          "type": "escalate",
          "title": "Yönetime bildir",
          "to": { "type": "role", "role": "GM" },
          "subject": "Toplantı kararı gecikti",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  -- ------------------------------------------------------------------------------------------
  -- 7. Kritik sertifika / İSG olayı
  -- ------------------------------------------------------------------------------------------
  (
    md5('wfl.template:expiring-document')::uuid,
    'expiring-document',
    'Süresi biten belge',
    'Süresi yaklaşan belge, sertifika veya eğitim için sorumlusuna yenileme görevi açar; kapanmazsa kalite ve İSG sorumlusuna çıkar.',
    2,
    $json$
    {
      "trigger": { "type": "event", "event": "document.expiring" },
      "start": "task_1",
      "steps": [
        {
          "id": "task_1",
          "type": "task",
          "title": "Yenile",
          "owner": { "type": "role", "role": "KIS" },
          "priority": "high",
          "next": "escalate_1"
        },
        {
          "id": "escalate_1",
          "type": "escalate",
          "title": "Yönetime bildir",
          "to": { "type": "role", "role": "GM" },
          "subject": "Süresi biten belge hâlâ yenilenmedi",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:ohs-incident')::uuid,
    'ohs-incident',
    'İSG olayı',
    'İSG olayı kaydedildiğinde ciddi olanlarda yönetime kritik bildirim gider ve uygunsuzluk taslağı açılır; her olayda inceleme görevi kalite ve İSG sorumlusuna düşer.',
    2,
    $json$
    {
      "trigger": { "type": "event", "event": "ohs_incident.recorded" },
      "start": "condition_1",
      "steps": [
        {
          "id": "condition_1",
          "type": "condition",
          "title": "Ciddi mi?",
          "test": { "field": "record.severity", "op": "=", "value": "serious" },
          "whenTrue": "notify_1",
          "whenFalse": "task_1"
        },
        {
          "id": "notify_1",
          "type": "notify",
          "title": "Yönetime kritik bildirim",
          "owner": { "type": "role", "role": "SAH" },
          "subject": "Ciddi İSG olayı kaydedildi",
          "next": "record_1"
        },
        {
          "id": "record_1",
          "type": "record",
          "title": "Uygunsuzluk taslağı aç",
          "action": "create",
          "recordType": "qhs.nonconformity",
          "next": "task_1"
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "Olayı incele, aksiyonları tamamla",
          "owner": { "type": "role", "role": "KIS" },
          "priority": "critical",
          "next": "record_2"
        },
        {
          "id": "record_2",
          "type": "record",
          "title": "Olayı kapat",
          "action": "set_status",
          "status": "closed",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  -- ------------------------------------------------------------------------------------------
  -- 8. Nakit sıkışması
  -- ------------------------------------------------------------------------------------------
  (
    md5('wfl.template:cash-shortfall')::uuid,
    'cash-shortfall',
    'Nakit açığı',
    'Nakit projeksiyonunda açık göründüğünde yönetime kritik bildirim gider ve vadesi geçen her hakediş için satışa hızlandırma görevi açılır.',
    2,
    $json$
    {
      "trigger": { "type": "event", "event": "cash_projection.shortfall_expected" },
      "start": "notify_1",
      "steps": [
        {
          "id": "notify_1",
          "type": "notify",
          "title": "Yönetime kritik bildirim",
          "owner": { "type": "role", "role": "SAH" },
          "subject": "Nakit projeksiyonunda açık bekleniyor",
          "next": "for_each_1"
        },
        {
          "id": "for_each_1",
          "type": "for_each",
          "title": "Açık penceresindeki her hakediş",
          "list": "fin.collections_at_risk",
          "body": "task_1",
          "limit": 50,
          "next": "end_1"
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "Tahsilatı hızlandır",
          "owner": { "type": "role", "role": "SAT" },
          "priority": "critical"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  -- ------------------------------------------------------------------------------------------
  -- The four links of 0008 in their fuller form (version 2)
  -- ------------------------------------------------------------------------------------------
  (
    md5('wfl.template:quote-approval')::uuid,
    'quote-approval',
    'Teklif onayı',
    'Onay çıkana kadar teklif gönderilemez: marj hedefin altındaysa ya da tutar eşiği aşıyorsa genel müdür onayı ister, değilse onay gerekmez. Reddedilirse hazırlayana bildirilir, düzeltmeye dönerse aynı onaya geri gelir.',
    3,
    $json$
    {
      "trigger": { "type": "event", "event": "quote.submitted_for_approval" },
      "start": "lock_1",
      "steps": [
        {
          "id": "lock_1",
          "type": "lock",
          "title": "Göndermeyi kilitle",
          "transition": "quote.send",
          "reason": "Onay çıkmadan teklif gönderilemez",
          "next": "condition_1"
        },
        {
          "id": "condition_1",
          "type": "condition",
          "title": "Onay gerekiyor mu?",
          "test": { "field": "record.margin_percent", "op": "<", "value": 20 },
          "whenTrue": "approval_1",
          "whenFalse": "end_1"
        },
        {
          "id": "approval_1",
          "type": "approval",
          "title": "Genel müdür onayı",
          "owner": { "type": "role", "role": "GM" },
          "escalation": { "after": "P2D", "to": { "type": "role", "role": "SAH" } },
          "outcomes": { "approve": "notify_1", "reject": "notify_2", "return": "task_1" }
        },
        {
          "id": "notify_1",
          "type": "notify",
          "title": "Satışa haber",
          "owner": { "type": "role", "role": "SAT" },
          "subject": "Teklif onaylandı",
          "next": "end_1"
        },
        {
          "id": "notify_2",
          "type": "notify",
          "title": "Hazırlayana haber",
          "owner": { "type": "role", "role": "SAT" },
          "subject": "Teklif reddedildi",
          "next": "end_1"
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "Düzelt ve yeniden sun",
          "owner": { "type": "role", "role": "SAT" },
          "priority": "high",
          "next": "approval_1"
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
    'Hazırlanan hakediş tutarına göre genel müdür ya da koordinatör onayından geçer; onaydan sonra işverene sunma, dış taraf onayı ve fatura görevleri sırayla işler. Faturayı akış kesmez, insan keser.',
    3,
    $json$
    {
      "trigger": { "type": "event", "event": "client_progress_payment.prepared" },
      "start": "condition_1",
      "steps": [
        {
          "id": "condition_1",
          "type": "condition",
          "title": "Tutar eşiği",
          "test": { "field": "record.net_amount", "op": ">", "value": 250000 },
          "whenTrue": "approval_1",
          "whenFalse": "approval_2"
        },
        {
          "id": "approval_1",
          "type": "approval",
          "title": "Genel müdür onayı",
          "owner": { "type": "role", "role": "GM" },
          "outcomes": { "approve": "task_1", "reject": "end_1", "return": "task_3" }
        },
        {
          "id": "approval_2",
          "type": "approval",
          "title": "Koordinatör onayı",
          "owner": { "type": "role", "role": "KO" },
          "outcomes": { "approve": "task_1", "reject": "end_1", "return": "task_3" }
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "İşverene sun",
          "owner": { "type": "role", "role": "MUH" },
          "priority": "high",
          "next": "subflow_1"
        },
        {
          "id": "subflow_1",
          "type": "subflow",
          "title": "İşveren onayı",
          "flow": "external-party-approval",
          "next": "record_1"
        },
        {
          "id": "record_1",
          "type": "record",
          "title": "İşveren onayladı olarak işaretle",
          "action": "set_status",
          "status": "client_approved",
          "next": "task_2"
        },
        {
          "id": "task_2",
          "type": "task",
          "title": "Faturayı kes",
          "owner": { "type": "role", "role": "MUH" },
          "priority": "high",
          "next": "end_1"
        },
        {
          "id": "task_3",
          "type": "task",
          "title": "Hakedişi düzelt",
          "owner": { "type": "role", "role": "MUH" },
          "priority": "normal",
          "next": "condition_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  ),
  (
    md5('wfl.template:purchase-request-approval')::uuid,
    'purchase-request-approval',
    'Satın alma talebi onayı',
    'Tutarı eşiği aşan talep genel müdüre, aşmayan koordinatöre düşer; onaydan sonra tedarikçi karşılaştırma ve sipariş görevi satın almaya gider, düzeltmeye dönen talep aynı onaya geri gelir.',
    3,
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
          "outcomes": { "approve": "task_1", "reject": "notify_1", "return": "task_2" }
        },
        {
          "id": "approval_2",
          "type": "approval",
          "title": "Koordinatör onayı",
          "owner": { "type": "role", "role": "KO" },
          "outcomes": { "approve": "task_1", "reject": "notify_1", "return": "task_2" }
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "Tedarikçileri karşılaştır ve sipariş ver",
          "owner": { "type": "role", "role": "SAL" },
          "priority": "normal",
          "next": "end_1"
        },
        {
          "id": "notify_1",
          "type": "notify",
          "title": "Talep edene haber",
          "owner": { "type": "role", "role": "SAL" },
          "subject": "Satın alma talebi reddedildi",
          "next": "end_1"
        },
        {
          "id": "task_2",
          "type": "task",
          "title": "Talebi düzelt",
          "owner": { "type": "role", "role": "SAL" },
          "priority": "normal",
          "next": "condition_1"
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
    'Sahadan gelen çıkış talebi koordinatörün onayına düşer; onaylanınca sevk görevi satın alma ve lojistiğe gider, düzeltmeye dönen talep aynı onaya geri gelir.',
    3,
    $json$
    {
      "trigger": { "type": "event", "event": "material_issue_request.submitted" },
      "start": "approval_1",
      "steps": [
        {
          "id": "approval_1",
          "type": "approval",
          "title": "Çıkış onayı",
          "owner": { "type": "role", "role": "KO" },
          "escalation": { "after": "PT4H", "to": { "type": "role", "role": "GK" } },
          "outcomes": { "approve": "task_1", "reject": "end_1", "return": "task_2" }
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "Sevk et",
          "owner": { "type": "role", "role": "SAL" },
          "priority": "normal",
          "next": "end_1"
        },
        {
          "id": "task_2",
          "type": "task",
          "title": "Talebi düzelt",
          "owner": { "type": "role", "role": "SM" },
          "priority": "normal",
          "next": "approval_1"
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
  where wfl.template.version < excluded.version;
