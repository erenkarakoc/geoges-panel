-- 0067 — removing a flow or a template (owner 2026-09-26, D-293).
--
-- "Bir akışı veya şablonu tamamen silme özelliği ekleyelim." What may disappear depends on what the
-- thing has left behind, and the owner chose the rule:
--
--   * A flow that never ran — a draft, a copy, a trial — is deleted with its versions and dry runs.
--     Nothing points at it: no run, no approval, no task.
--   * A flow that ran has produced approvals, tasks and a run log, and those are records (a task is
--     never deleted, migration 0011; an approval is the answer to "who decided this"). It is closed
--     and archived instead: gone from the list, its history intact, and it can be brought back.
--   * A template is removed from the list for good — a panel update does not bring it back, because
--     the seeds only ever move a template's version forward and never touch this mark — and it can be
--     restored from the removed templates. Flows copied from it are their own and are not touched.
--
-- Every one of these is written to the audit log, deletion included: the flow is gone, the fact
-- that somebody deleted it and why is not.

alter table wfl.flow
  add column archived_at timestamptz,
  add column archived_by_user_id uuid,
  add column archived_reason text,
  add constraint ck_flow__archived check (
    (archived_at is null) = (archived_by_user_id is null)
    -- An archived flow is a closed one: archiving never leaves a hidden flow that still starts.
    and (archived_at is null or disabled_at is not null));

comment on column wfl.flow.archived_at is
  'Removed from the list after it had run; its runs, approvals and tasks stay (D-293).';

alter table wfl.template
  add column removed_at timestamptz,
  add column removed_by_user_id uuid,
  add constraint ck_template__removed check ((removed_at is null) = (removed_by_user_id is null));

comment on column wfl.template.removed_at is
  'Taken off the template list by the company (D-293); seeds never clear it, restoring does.';

/** Whether a flow has ever run: one instance of it, of any kind, is enough. */
create function wfl.flow_has_run(p_flow_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$ select exists (select from wfl.instance i where i.flow_id = p_flow_id) $$;

revoke all on function wfl.flow_has_run(uuid) from public;
grant execute on function wfl.flow_has_run(uuid) to geoges_app;

/**
 * Removes a flow (D-293): deletes it when it never ran, archives it when it did, and says which.
 * Refused while another live flow hands work to it as a subflow — deleting it would make that flow
 * stop at the step with "not published", and nobody would know why.
 */
create function wfl.remove_flow(p_flow_id uuid, p_reason text) returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  f wfl.flow;
  user_of text;
begin
  if not iam.has_permission('wfl.workflow.design') then
    raise exception 'flow design needs wfl.workflow.design'
      using errcode = 'P0001', hint = 'wfl.design_permission';
  end if;
  if p_reason is null or pg_catalog.length(pg_catalog.btrim(p_reason)) < 3 then
    raise exception 'removing a flow needs a reason' using errcode = 'P0001', hint = 'wfl.reason';
  end if;

  select * into f from wfl.flow where id = p_flow_id for update;
  if f.id is null or f.archived_at is not null then
    return null;
  end if;

  select other.name into user_of
    from wfl.flow other
    join wfl.flow_version v on v.flow_id = other.id and v.status in ('draft', 'published')
   where other.id <> f.id and other.archived_at is null
     and pg_catalog.jsonb_path_exists(
           v.definition, '$.steps[*] ? (@.type == "subflow" && @.flow == $key)',
           pg_catalog.jsonb_build_object('key', f.key))
   order by other.name
   limit 1;
  if user_of is not null then
    raise exception 'flow % is a subflow of %', f.key, user_of
      using errcode = 'P0001', hint = 'wfl.flow_in_use', detail = user_of;
  end if;

  if wfl.flow_has_run(f.id) then
    update wfl.flow
       set disabled_at = coalesce(disabled_at, pg_catalog.now()),
           disabled_by_user_id = coalesce(disabled_by_user_id, core.current_user_id()),
           disabled_reason = coalesce(disabled_reason, pg_catalog.btrim(p_reason)),
           archived_at = pg_catalog.now(),
           archived_by_user_id = core.current_user_id(),
           archived_reason = pg_catalog.btrim(p_reason)
     where id = f.id;
    insert into aud.audit_log (event_type, actor_user_id, target_schema, target_table, target_id,
                               payload)
    values ('workflow.archived', core.current_user_id(), 'wfl', 'flow', f.id,
            pg_catalog.jsonb_build_object('flow', f.key, 'name', f.name,
                                          'reason', pg_catalog.btrim(p_reason)));
    return 'archived';
  end if;

  delete from wfl.flow where id = f.id;
  insert into aud.audit_log (event_type, actor_user_id, target_schema, target_table, target_id,
                             payload)
  values ('workflow.deleted', core.current_user_id(), 'wfl', 'flow', f.id,
          pg_catalog.jsonb_build_object('flow', f.key, 'name', f.name,
                                        'reason', pg_catalog.btrim(p_reason)));
  return 'deleted';
end
$$;

revoke all on function wfl.remove_flow(uuid, text) from public;
grant execute on function wfl.remove_flow(uuid, text) to geoges_app;

/** Brings an archived flow back to the list, still closed; reopening it is a separate choice. */
create function wfl.restore_flow(p_flow_id uuid) returns boolean
language plpgsql security definer
set search_path = ''
as $$
begin
  if not iam.has_permission('wfl.workflow.design') then
    raise exception 'flow design needs wfl.workflow.design'
      using errcode = 'P0001', hint = 'wfl.design_permission';
  end if;
  update wfl.flow
     set archived_at = null, archived_by_user_id = null, archived_reason = null
   where id = p_flow_id and archived_at is not null;
  if not found then
    return false;
  end if;
  insert into aud.audit_log (event_type, actor_user_id, target_schema, target_table, target_id,
                             payload)
  values ('workflow.restored', core.current_user_id(), 'wfl', 'flow', p_flow_id, '{}'::jsonb);
  return true;
end
$$;

revoke all on function wfl.restore_flow(uuid) from public;
grant execute on function wfl.restore_flow(uuid) to geoges_app;

/**
 * Opens a closed flow again: its published version starts on its trigger from now on. What was
 * missed while it was closed is not replayed — a closed flow heard nothing.
 */
create function wfl.reopen_flow(p_flow_id uuid) returns boolean
language plpgsql security definer
set search_path = ''
as $$
begin
  if not iam.has_permission('wfl.workflow.design') then
    raise exception 'flow design needs wfl.workflow.design'
      using errcode = 'P0001', hint = 'wfl.design_permission';
  end if;
  update wfl.flow
     set disabled_at = null, disabled_by_user_id = null, disabled_reason = null
   where id = p_flow_id and disabled_at is not null and archived_at is null;
  if not found then
    return false;
  end if;
  insert into aud.audit_log (event_type, actor_user_id, target_schema, target_table, target_id,
                             payload)
  values ('workflow.reopened', core.current_user_id(), 'wfl', 'flow', p_flow_id, '{}'::jsonb);
  return true;
end
$$;

revoke all on function wfl.reopen_flow(uuid) from public;
grant execute on function wfl.reopen_flow(uuid) to geoges_app;

/** Takes a template off the list, or puts it back (D-293). */
create function wfl.set_template_removed(p_template_key text, p_removed boolean) returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  tpl_id uuid;
begin
  if not iam.has_permission('wfl.workflow.design') then
    raise exception 'flow design needs wfl.workflow.design'
      using errcode = 'P0001', hint = 'wfl.design_permission';
  end if;
  update wfl.template
     set removed_at = case when p_removed then pg_catalog.now() end,
         removed_by_user_id = case when p_removed then core.current_user_id() end,
         updated_at = pg_catalog.now()
   where key = p_template_key and (removed_at is null) = p_removed
  returning id into tpl_id;
  if tpl_id is null then
    return false;
  end if;
  insert into aud.audit_log (event_type, actor_user_id, target_schema, target_table, target_id,
                             payload)
  values (case when p_removed then 'workflow.template_removed' else 'workflow.template_restored' end,
          core.current_user_id(), 'wfl', 'template', tpl_id,
          pg_catalog.jsonb_build_object('template', p_template_key));
  return true;
end
$$;

revoke all on function wfl.set_template_removed(text, boolean) from public;
grant execute on function wfl.set_template_removed(text, boolean) to geoges_app;

-- A removed template cannot be copied again; everything else about 0059's function is unchanged.
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

  select * into tpl from wfl.template
   where key = p_template_key and is_active and removed_at is null;
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
