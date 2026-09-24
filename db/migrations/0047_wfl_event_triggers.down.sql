-- Reverses 0047_wfl_event_triggers.sql: the publish stops writing the engine's subscriptions
-- and goes back to what 0045 wrote.

delete from core.event_subscription where subscriber = 'wfl.engine';

/**
 * Publishes a draft (REQ-WFL-023): the previous published version becomes history, the draft
 * becomes the one that runs, and it is refused without a passed dry run of exactly this
 * definition. The publish is audited and announced, because a flow changing is everybody's
 * business (D-081).
 */
create or replace function wfl.publish_version(p_version_id uuid) returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v record;
  flow record;
begin
  if not iam.has_permission('wfl.workflow.design') then
    raise exception 'flow design needs wfl.workflow.design'
      using errcode = 'P0001', hint = 'wfl.design_permission';
  end if;

  select * into v from wfl.flow_version where id = p_version_id;
  if v is null then
    raise exception 'no such flow version' using errcode = 'P0001', hint = 'wfl.no_version';
  end if;
  if v.status <> 'draft' then
    raise exception 'only a draft is published'
      using errcode = 'P0001', hint = 'wfl.not_a_draft';
  end if;
  if not exists (select from wfl.dry_run r
                  where r.flow_version_id = v.id and r.passed and r.content_hash = v.content_hash)
  then
    raise exception 'this definition has not passed a dry run'
      using errcode = 'P0001', hint = 'wfl.dry_run_required';
  end if;

  select * into flow from wfl.flow where id = v.flow_id;

  update wfl.flow_version
     set status = 'superseded', superseded_at = pg_catalog.now()
   where flow_id = v.flow_id and status = 'published';

  update wfl.flow_version
     set status = 'published',
         published_at = pg_catalog.now(),
         published_by_user_id = core.current_user_id()
   where id = v.id;

  insert into aud.audit_log (event_type, actor_user_id, target_schema, target_table, target_id,
                             payload)
  values ('workflow.published', core.current_user_id(), 'wfl', 'flow_version', v.id,
          pg_catalog.jsonb_build_object('key', flow.key, 'version', v.version));

  perform core.publish_event('workflow.published', 'wfl', 'wfl', 'flow_version', v.id,
                             pg_catalog.jsonb_build_object('key', flow.key,
                                                           'version', v.version));
  return true;
end
$$;
