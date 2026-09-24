-- 0044 — where a table's scope comes from (TASK-0116, D-277, OQ-037).
--
-- COVERAGE.md section 3 asked every table for a scope column. Measured against the fifty tables
-- that exist, the rule was wrong about more than twenty of them, and rightly so: an exchange rate
-- is company-wide, a document version and an extracted text hang off the document that carries the
-- scope, a notification belongs to a person rather than a place. The owner chose the rule that
-- describes them (D-277): a record's root carries the scope, and every other table says where its
-- scope comes from.
--
-- The declaration is the point. `adm.rule_key` has a column called `unit` — the unit of the value,
-- "gün" or "TL" — and a rule that reads column names would have called it scoped. A migration
-- knows what its table is; a test guessing from names does not.

alter table core.table_layer add column scope_source text;

comment on column core.table_layer.scope_source is
  'Where the table''s scope comes from (D-277): own (the record root carries site/project/unit), '
  'parent (through the row it belongs to), person (the row belongs to somebody), '
  'company (no narrower scope exists). Written by the migration that creates the table.';

-- The fifty tables that were registered before this migration, classified from what they hold
-- rather than from their columns (2026-09-24).
update core.table_layer set scope_source = 'own'
 where (schema_name, table_name) in (
   ('aud', 'revision_request'), ('doc', 'document'), ('tsk', 'task'),
   ('adm', 'catalog_item'), ('adm', 'holiday'), ('adm', 'rule'), ('adm', 'working_calendar'),
   ('iam', 'role_assignment'), ('iam', 'user_exception'), ('iam', 'user_manager'),
   ('aud', 'record_history'), ('core', 'search_row'), ('core', 'search_posting'));

update core.table_layer set scope_source = 'parent'
 where (schema_name, table_name) in (
   ('aud', 'revision_effect'), ('doc', 'document_version'), ('doc', 'extracted_text'),
   ('doc', 'upload'), ('tsk', 'escalation'),
   ('iam', 'role_data_class'), ('iam', 'role_permission'),
   ('core', 'outbox_delivery'), ('core', 'dead_letter'));

update core.table_layer set scope_source = 'person'
 where (schema_name, table_name) in (
   ('tsk', 'app_install'), ('tsk', 'daily_digest'), ('tsk', 'notification'),
   ('tsk', 'push_subscription'), ('iam', 'user_action_role_choice'),
   ('iam', 'recovery_code'), ('iam', 'session'));

update core.table_layer set scope_source = 'company' where scope_source is null;

alter table core.table_layer alter column scope_source set not null;
alter table core.table_layer add constraint ck_table_layer__scope_source
  check (scope_source in ('own', 'parent', 'person', 'company'));
