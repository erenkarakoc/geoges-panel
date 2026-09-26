-- Reverts 0067. Deleted flows stay deleted; archived flows and removed templates return to their
-- lists, because the marks that hid them go.

create or replace function wfl.use_template(p_template_key text, p_flow_key text, p_flow_name text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  tpl record;
  version_id uuid;
begin
  if not iam.has_permission('wfl.workflow.design') then
    raise exception 'flow design needs wfl.workflow.design'
      using errcode = 'P0001', hint = 'wfl.design_permission';
  end if;

  select * into tpl from wfl.template where key = p_template_key and is_active;
  if not found then
    raise exception 'no such template' using errcode = 'P0001', hint = 'wfl.no_template';
  end if;

  version_id := wfl.save_draft(p_flow_key, p_flow_name, tpl.definition, true);

  update wfl.flow
     set source_template_key = tpl.key, source_template_version = tpl.version
   where key = p_flow_key;

  insert into aud.audit_log (event_type, actor_user_id, target_schema, target_table, target_id,
                             payload)
  values ('workflow.template_used', core.current_user_id(), 'wfl', 'flow_version', version_id,
          pg_catalog.jsonb_build_object('template', tpl.key, 'template_version', tpl.version,
                                        'flow', p_flow_key));
  return version_id;
end
$$;

drop function wfl.set_template_removed(text, boolean);
drop function wfl.reopen_flow(uuid);
drop function wfl.restore_flow(uuid);
drop function wfl.remove_flow(uuid, text);
drop function wfl.flow_has_run(uuid);

alter table wfl.template
  drop constraint ck_template__removed,
  drop column removed_by_user_id,
  drop column removed_at;

alter table wfl.flow
  drop constraint ck_flow__archived,
  drop column archived_reason,
  drop column archived_by_user_id,
  drop column archived_at;
