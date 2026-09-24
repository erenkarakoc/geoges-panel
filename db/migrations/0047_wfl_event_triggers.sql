-- 0047 — a published flow starts listening (TASK-0117, REQ-WFL-007).
--
-- A flow's trigger lives in its definition, so nothing in code knows which events matter until a
-- definition says so. Publishing is therefore where the subscription is written: the engine is one
-- subscriber (`wfl.engine`) and the event codes it hears are whatever the published definitions
-- listen to.
--
-- The row is only ever added. A flow that is disabled or superseded keeps its subscription and
-- costs one delivery that starts nothing, which is cheaper than a subscription that has to be kept
-- in step with every publish, and it means a flow republished later is already heard.

create or replace function wfl.publish_version(p_version_id uuid) returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v record;
  flow record;
  trigger_event text;
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

  -- What this definition listens to, if anything: the engine hears it from now on.
  if v.definition -> 'trigger' ->> 'type' in ('event', 'threshold') then
    trigger_event := v.definition -> 'trigger' ->> 'event';
  end if;
  if trigger_event is not null then
    insert into core.event_subscription (subscriber, event_code, replayable)
    values ('wfl.engine', trigger_event, false)
    on conflict (subscriber, event_code) do update set last_seen_at = pg_catalog.now();
  end if;

  insert into aud.audit_log (event_type, actor_user_id, target_schema, target_table, target_id,
                             payload)
  values ('workflow.published', core.current_user_id(), 'wfl', 'flow_version', v.id,
          pg_catalog.jsonb_build_object('key', flow.key, 'version', v.version,
                                        'listens_to', trigger_event));

  perform core.publish_event('workflow.published', 'wfl', 'wfl', 'flow_version', v.id,
                             pg_catalog.jsonb_build_object('key', flow.key,
                                                           'version', v.version));
  return true;
end
$$;
