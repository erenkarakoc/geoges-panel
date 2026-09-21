-- Reverses 0004_audit.sql: the aud schema with its history and audit rows, the IAM history and
-- event triggers, the owner-only guard, the column data-class register and the history column of
-- the layer register; iam.my_grants returns to its 0003 definition. The owner-only audit
-- permission added by seed 0002 is removed with its grants.
drop trigger record_history on iam.user;
drop trigger record_history on iam.role;
drop trigger record_history on iam.permission;
drop trigger record_history on iam.role_permission;
drop trigger record_history on iam.role_data_class;
drop trigger record_history on iam.role_assignment;
drop trigger record_history on iam.user_exception;
drop trigger record_history on iam.user_manager;
drop trigger audit_event on iam.role_assignment;
drop trigger audit_event on iam.user_exception;
drop trigger audit_event on iam.user_manager;
drop trigger audit_event on iam.role_permission;
drop trigger audit_event on iam.user;
drop trigger owner_only_permission_guard on iam.role_permission;
drop trigger owner_only_permission_guard on iam.user_exception;
drop function iam.emit_audit_event();
drop function iam.note_session(text);
drop function iam.guard_owner_only_permission();

delete from iam.role_permission
 where permission_id in (select id from iam.permission where code like 'aud.audit-log.%');
delete from iam.permission where code like 'aud.audit-log.%';

create or replace function iam.my_grants()
returns table (permission_code text, role_id uuid, scope_type text, scope_ids uuid[])
language sql stable security definer
set search_path = ''
as $$
  with a as (select * from iam.active_assignments(core.current_user_id())),
  from_roles as (
    select p.code, a.role_id, a.scope_type, a.scope_ids
      from a
      join iam.role_permission rp on rp.role_id = a.role_id and rp.revoked_at is null
      join iam.permission p on p.id = rp.permission_id and p.is_active
  ),
  full_view as (
    select p.code, a.role_id, 'company'::text, '{}'::uuid[]
      from a join iam.permission p on p.is_active and p.code like '%.view'
     where a.has_full_visibility
  ),
  exceptions as (
    select e.target, e.effect, e.scope_type, e.scope_ids
      from iam.user_exception e
     where e.user_id = core.current_user_id() and e.revoked_at is null
       and exists (select from a)
  ),
  granted as (
    select p.code, null::uuid, e.scope_type, e.scope_ids
      from exceptions e
      join iam.permission p on p.is_active
        and (p.code = e.target or (p.module = e.target and p.code like '%.view'))
     where e.effect = 'grant'
  ),
  denied as (
    select p.code
      from exceptions e
      join iam.permission p on p.code = e.target or p.module = e.target
     where e.effect = 'deny' and not exists (select from a where a.is_owner_layer)
  )
  select g.* from (select * from from_roles
                   union all select * from full_view
                   union all select * from granted) g
   where g.code not in (select d.code from denied d)
$$;

drop schema aud cascade;
delete from core.table_layer where schema_name = 'aud'
   or (schema_name = 'core' and table_name = 'column_data_class');
drop table core.column_data_class;
alter table core.table_layer drop column history;
