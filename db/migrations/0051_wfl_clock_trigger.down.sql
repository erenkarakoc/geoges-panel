-- Reverses 0051_wfl_clock_trigger.sql: the clock slot goes, and both doors go back to 0046's.

drop function wfl.start_instance(text, text, text, text, uuid, jsonb, uuid, text);
drop index wfl.uq_instance__clock;
alter table wfl.instance drop column clock_key;

/**
 * Starts the flow's published version, or returns the instance already running for this record
 * when the flow is single-instance (REQ-WFL-007). A disabled flow starts nothing, and a flow with
 * no published version starts nothing: both answer null rather than raising, because a trigger
 * arriving for a flow the company has turned off is ordinary, not an error.
 */
create function wfl.start_instance(p_flow_key text, p_trigger_kind text,
                                   p_record_schema text default null,
                                   p_record_table text default null,
                                   p_record_id uuid default null,
                                   p_context jsonb default '{}',
                                   p_trigger_event_id uuid default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v record;
  existing uuid;
  new_id uuid;
begin
  select ver.id as version_id, ver.flow_id, ver.version, f.single_instance
    into v
    from wfl.flow_version ver
    join wfl.flow f on f.id = ver.flow_id
   where f.key = p_flow_key and ver.status = 'published' and f.disabled_at is null;
  if v is null then
    return null;
  end if;

  if p_trigger_event_id is not null then
    select i.id into existing from wfl.instance i
     where i.flow_id = v.flow_id and i.trigger_event_id = p_trigger_event_id;
    if existing is not null then
      return existing;
    end if;
  end if;

  if v.single_instance and p_record_id is not null then
    select i.id into existing from wfl.instance i
     where i.flow_id = v.flow_id and i.status = 'running'
       and i.single_key = wfl.single_key(p_record_schema, p_record_table, p_record_id);
    if existing is not null then
      return existing;
    end if;
  end if;

  insert into wfl.instance (flow_version_id, flow_id, flow_key, version, trigger_kind,
                            trigger_event_id, record_schema, record_table, record_id, single_key,
                            context, started_by_user_id)
  values (v.version_id, v.flow_id, p_flow_key, v.version, p_trigger_kind,
          p_trigger_event_id, p_record_schema, p_record_table, p_record_id,
          case when v.single_instance
               then wfl.single_key(p_record_schema, p_record_table, p_record_id) end,
          coalesce(p_context, '{}'::jsonb), core.current_user_id())
  returning id into new_id;

  insert into wfl.run_log (instance_id, kind, detail)
  values (new_id, 'started', pg_catalog.jsonb_build_object('trigger', p_trigger_kind));

  perform core.publish_event('workflow_instance.started', 'wfl', 'wfl', 'instance', new_id,
                             pg_catalog.jsonb_build_object('flow', p_flow_key,
                                                           'trigger', p_trigger_kind));
  return new_id;
end
$$;

revoke all on function wfl.start_instance(text, text, text, text, uuid, jsonb, uuid) from public;
grant execute on function wfl.start_instance(text, text, text, text, uuid, jsonb, uuid)
  to geoges_worker;

/**
 * Starting a flow by hand (REQ-WFL-007). A separate door from the engine's, because this one asks
 * who is knocking: the engine is the system and needs no permission, while a person needs the one
 * that lets them design flows at all.
 */
create or replace function wfl.start_instance_by_hand(p_flow_key text, p_record_schema text default null,
                                           p_record_table text default null,
                                           p_record_id uuid default null,
                                           p_context jsonb default '{}')
returns uuid
language plpgsql security definer
set search_path = ''
as $$
begin
  if not iam.has_permission('wfl.workflow.design') then
    raise exception 'starting a flow by hand needs wfl.workflow.design'
      using errcode = 'P0001', hint = 'wfl.design_permission';
  end if;
  return wfl.start_instance(p_flow_key, 'manual', p_record_schema, p_record_table, p_record_id,
                            p_context, null);
end
$$;
