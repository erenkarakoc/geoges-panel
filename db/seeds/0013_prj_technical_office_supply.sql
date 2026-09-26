-- Technical office kinds, supply matrix items and the overdue technical item template
-- (TASK-0123 step 4, REQ-PRJ-004, REQ-PRJ-005, D-298). Re-runnable: fixed ids from the key,
-- never overwritten; the lists are the requirements' own and management adds to them.

insert into adm.catalog (id, key, name, description, allows_project_scope, allows_user_additions)
values
  (md5('adm.catalog:technical_office_type')::uuid, 'technical_office_type', 'Teknik ofis iş türleri',
   'Teknik ofisin projede izlediği işlerin türleri.', false, false),
  (md5('adm.catalog:supply_item')::uuid, 'supply_item', 'Tedarik matrisi kalemleri',
   'Projede kimin neyi karşıladığının kalemleri.', false, false)
on conflict do nothing;

insert into adm.catalog_item (id, catalog_id, code, name)
select md5('adm.catalog_item:technical_office_type:' || t.code)::uuid,
       md5('adm.catalog:technical_office_type')::uuid, t.code, t.name
  from (values ('drawing', 'Proje çizimi'), ('revision', 'Revizyon'),
               ('static_calculation', 'Statik hesap'), ('quantity', 'Metraj'),
               ('authority_approval', 'Kurum onayı'), ('claim_support', 'Hakediş hazırlık desteği'),
               ('technical_documents', 'Teknik evrak')) as t(code, name)
on conflict do nothing;

insert into adm.catalog_item (id, catalog_id, code, name)
select md5('adm.catalog_item:supply_item:' || s.code)::uuid,
       md5('adm.catalog:supply_item')::uuid, s.code, s.name
  from (values ('concrete', 'Beton'), ('rebar', 'Demir'), ('fill_supply', 'Dolgu temini'),
               ('fill_placing', 'Dolgu serme ve sıkıştırma'), ('meals', 'Yemek'),
               ('lodging', 'Konaklama'), ('camp', 'Kamp / konteyner'), ('transport', 'Nakliye'),
               ('crane', 'Vinç ve operatör'), ('formwork', 'Kalıp / demirbaş'),
               ('steel_strip', 'Çelik şerit'), ('consumables', 'Sarf')) as s(code, name)
on conflict do nothing;

-- The overdue technical item falls to its responsible person as a task; with nobody named, to the
-- technical office. Management changes whom in the designer (REQ-PRJ-005).
insert into wfl.template (id, key, name, summary, version, definition)
values
  (
    md5('wfl.template:technical-office-overdue')::uuid,
    'technical-office-overdue',
    'Geciken teknik ofis işi',
    'Teslim tarihi geçen teknik ofis işi, sorumlusuna yüksek öncelikli görev olarak düşer; sorumlusu yoksa teknik ofise.',
    1,
    $json$
    {
      "trigger": { "type": "event", "event": "technical_office_item.overdue" },
      "start": "condition_1",
      "steps": [
        {
          "id": "condition_1",
          "type": "condition",
          "title": "Sorumlusu var mı?",
          "test": { "field": "record.assignee_user_id", "op": "exists" },
          "whenTrue": "task_1",
          "whenFalse": "task_2"
        },
        {
          "id": "task_1",
          "type": "task",
          "title": "Geciken teknik ofis işini teslim et",
          "owner": { "type": "relation", "relation": "technical_office_item.assignee" },
          "priority": "high",
          "next": "end_1"
        },
        {
          "id": "task_2",
          "type": "task",
          "title": "Sorumlusu olmayan geciken teknik ofis işi",
          "owner": { "type": "role", "role": "TO" },
          "priority": "high",
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
