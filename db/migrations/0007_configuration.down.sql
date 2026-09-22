-- Reverses 0007_configuration.sql: the adm schema with its catalogs, rules and custom field
-- definitions, Turkish folding, and the history trigger back to its 0004 form.

create or replace function aud.capture_history() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  n jsonb := pg_catalog.to_jsonb(new);
  o jsonb;
  k text;
  reason text := nullif(pg_catalog.current_setting('app.change_reason', true), '');
begin
  if tg_op = 'INSERT' then
    insert into aud.record_history (record_schema, record_table, record_id, operation, reason,
      site_id, project_id, record_created_by_user_id, changed_by_user_id, changed_in_role_id)
    values (tg_table_schema, tg_table_name, (n ->> 'id')::uuid, 'insert', reason,
      (n ->> 'site_id')::uuid, (n ->> 'project_id')::uuid, (n ->> 'created_by_user_id')::uuid,
      core.current_user_id(), core.current_role_id());
    return null;
  end if;

  o := pg_catalog.to_jsonb(old);
  for k in select pg_catalog.jsonb_object_keys(n) loop
    continue when k in ('updated_at', 'updated_by_user_id');
    continue when (o -> k) is not distinct from (n -> k);
    insert into aud.record_history (record_schema, record_table, record_id, operation, field,
      old_value, new_value, data_class, reason, site_id, project_id, record_created_by_user_id,
      changed_by_user_id, changed_in_role_id)
    values (tg_table_schema, tg_table_name, (n ->> 'id')::uuid, 'update', k, o -> k, n -> k,
      coalesce((select c.data_class from core.column_data_class c
                 where c.schema_name = tg_table_schema and c.table_name = tg_table_name
                   and c.column_name = k), 'internal'),
      reason, (n ->> 'site_id')::uuid, (n ->> 'project_id')::uuid,
      (n ->> 'created_by_user_id')::uuid, core.current_user_id(), core.current_role_id());
  end loop;
  return null;
end
$$;

drop schema adm cascade;
delete from core.table_layer where schema_name = 'adm';
drop function core.fold_tr(text);
