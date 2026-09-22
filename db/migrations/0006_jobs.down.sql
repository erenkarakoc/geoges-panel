-- Reverses 0006_jobs.sql: the event backbone tables and functions, the IAM trigger's outbox
-- publishing (back to its 0004 form), and the worker role with every privilege it was given.
-- Outbox rows are lost with it; test period only (D-255).
create or replace function iam.emit_audit_event() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  n jsonb := pg_catalog.to_jsonb(new);
  o jsonb := case when tg_op = 'UPDATE' then pg_catalog.to_jsonb(old) end;
  kind text;
  payload jsonb := '{}';
begin
  case tg_table_name
    when 'role_assignment' then
      payload := pg_catalog.jsonb_build_object('user_id', n -> 'user_id', 'role_id', n -> 'role_id',
        'scope_type', n -> 'scope_type', 'scope_ids', n -> 'scope_ids',
        'starts_on', n -> 'starts_on', 'ends_on', n -> 'ends_on',
        'delegated_by_user_id', n -> 'delegated_by_user_id');
      if tg_op = 'INSERT' then
        kind := case when new.is_delegation then 'role_delegation.started'
                     else 'role_assignment.created' end;
      elsif new.ends_on is distinct from old.ends_on then
        kind := case when new.is_delegation then 'role_delegation.changed'
                     else 'role_assignment.ended' end;
      elsif (n - 'updated_at' - 'updated_by_user_id' - 'reason')
            is distinct from (o - 'updated_at' - 'updated_by_user_id' - 'reason') then
        kind := 'role_assignment.changed';
      end if;
    when 'user_exception' then
      payload := pg_catalog.jsonb_build_object('user_id', n -> 'user_id', 'target', n -> 'target',
        'effect', n -> 'effect', 'scope_type', n -> 'scope_type', 'scope_ids', n -> 'scope_ids');
      if tg_op = 'INSERT' then kind := 'user_exception.created';
      elsif new.revoked_at is not null and old.revoked_at is null then
        kind := 'user_exception.revoked';
      end if;
    when 'user_manager' then
      payload := pg_catalog.jsonb_build_object('user_id', n -> 'user_id',
        'manager_user_id', n -> 'manager_user_id', 'scope_type', n -> 'scope_type',
        'scope_ids', n -> 'scope_ids');
      if tg_op = 'INSERT' then kind := 'user_manager.assigned';
      elsif new.revoked_at is not null and old.revoked_at is null then
        kind := 'user_manager.revoked';
      end if;
    when 'role_permission' then
      payload := pg_catalog.jsonb_build_object('role_id', n -> 'role_id',
        'permission_id', n -> 'permission_id');
      if tg_op = 'INSERT' then kind := 'role_permission.granted';
      elsif new.revoked_at is not null and old.revoked_at is null then
        kind := 'role_permission.revoked';
      end if;
    when 'user' then
      payload := pg_catalog.jsonb_build_object('status', n -> 'status', 'left_on', n -> 'left_on');
      if tg_op = 'INSERT' then kind := 'user.created';
      elsif new.status = 'disabled' and old.status <> 'disabled' then kind := 'user.deactivated';
      elsif new.status = 'active' and old.status <> 'active' then kind := 'user.reactivated';
      elsif new.left_on is distinct from old.left_on then kind := 'user.leaving_date_set';
      end if;
  end case;
  if kind is not null then
    perform aud.record_event(kind, tg_table_schema, tg_table_name, (n ->> 'id')::uuid, payload);
  end if;
  return null;
end
$$;

drop function iam.publish_ended_assignments();
drop function iam.deactivate_departed();
drop function core.schedule_job(text, timestamptz, text, jsonb);
drop function core.publish_event(text, text, text, text, uuid, jsonb, integer, text);
drop table core.dead_letter;
drop table core.scheduled_job;
drop table core.outbox_delivery;
drop table core.outbox;
drop table core.event_subscription;
drop table core.read_model;
delete from core.table_layer where schema_name = 'core'
   and table_name in ('outbox', 'event_subscription', 'outbox_delivery', 'scheduled_job',
                      'dead_letter', 'read_model');

alter default privileges revoke select, insert, update on tables from geoges_worker;
alter default privileges revoke usage, select on sequences from geoges_worker;
alter default privileges revoke execute on functions from geoges_worker;
revoke all on all tables in schema core, iam, aud from geoges_worker;
revoke all on all sequences in schema core, iam, aud from geoges_worker;
revoke all on all functions in schema core, iam, aud from geoges_worker;
revoke usage on schema core, iam, aud from geoges_worker;
drop role geoges_worker;
