-- The project revision's approval template (TASK-0123, REQ-PRJ-009, D-136, D-292 rule 2).
-- Re-runnable, and moved forward only as 0008 describes: a newer version replaces the definition,
-- an older or equal one changes nothing, a copy somebody made is only told the template moved on.
--
-- The default approver is the general manager (D-292); management changes it in the designer. An
-- approval makes the revision valid from that day; a refusal or a return sends it back to the
-- technical office as a draft, with a notification.

insert into wfl.template (id, key, name, summary, version, definition)
values
  (
    md5('wfl.template:project-revision-approval')::uuid,
    'project-revision-approval',
    'Proje revizyonu onayı',
    'Teknik ofisin onaya gönderdiği revizyonu genel müdür onaylar; onaylanan revizyon o günden geçerli olur, reddedilen ya da geri gönderilen taslağa döner ve teknik ofise bildirilir.',
    1,
    $json$
    {
      "trigger": { "type": "event", "event": "project_revision.submitted" },
      "start": "approval_1",
      "steps": [
        {
          "id": "approval_1",
          "type": "approval",
          "title": "Revizyon kararı",
          "owner": { "type": "role", "role": "GM" },
          "outcomes": { "approve": "record_1", "reject": "record_2", "return": "record_2" }
        },
        {
          "id": "record_1",
          "type": "record",
          "title": "Revizyonu geçerli kıl",
          "action": "set_status",
          "status": "approved",
          "next": "end_1"
        },
        {
          "id": "record_2",
          "type": "record",
          "title": "Taslağa geri gönder",
          "action": "set_status",
          "status": "draft",
          "next": "notify_1"
        },
        {
          "id": "notify_1",
          "type": "notify",
          "title": "Teknik ofise haber",
          "owner": { "type": "role", "role": "TO" },
          "subject": "Proje revizyonu düzeltmeye geri döndü",
          "next": "end_1"
        },
        { "id": "end_1", "type": "end" }
      ]
    }
    $json$::jsonb
  )
on conflict (key) do update
  set name = excluded.name, summary = excluded.summary, version = excluded.version,
      definition = excluded.definition, updated_at = now()
  where wfl.template.version < excluded.version;
