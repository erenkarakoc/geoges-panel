-- 0051 — a flow the clock starts (TASK-0117, REQ-WFL-007).
--
-- An event-triggered flow is kept from starting twice by the event's own id. A clock-triggered one
-- has no event, so it needs the same thing by another name: the slot it is being started for —
-- "this flow, today" or "this flow, at 09:35". The scheduler may run the job twice, a worker may
-- pick the same minute up after a restart, and neither may open a second run.

alter table wfl.instance add column clock_key text;

comment on column wfl.instance.clock_key is
  'The slot a clock-triggered run belongs to; one run per slot (REQ-WFL-007).';

create unique index uq_instance__clock on wfl.instance (flow_id, clock_key)
  where clock_key is not null;

drop function wfl.start_instance(text, text, text, text, uuid, jsonb, uuid);

create function wfl.start_instance(p_flow_key text, p_trigger_kind text,
                                   p_record_schema text default null,
                                   p_record_table text default null,
                                   p_record_id uuid default null,
                                   p_context jsonb default '{}',
                                   p_trigger_event_id uuid default null,
                                   p_clock_key text default null)
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

  -- The same slot never opens a second run, whoever asks and however often.
  if p_clock_key is not null then
    select i.id into existing from wfl.instance i
     where i.flow_id = v.flow_id and i.clock_key = p_clock_key;
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
                            trigger_event_id, clock_key, record_schema, record_table, record_id,
                            single_key, context, started_by_user_id)
  values (v.version_id, v.flow_id, p_flow_key, v.version, p_trigger_kind,
          p_trigger_event_id, p_clock_key, p_record_schema, p_record_table, p_record_id,
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

revoke all on function wfl.start_instance(text, text, text, text, uuid, jsonb, uuid, text)
  from public;
grant execute on function wfl.start_instance(text, text, text, text, uuid, jsonb, uuid, text)
  to geoges_worker;

-- The by-hand door follows the function it calls.
create or replace function wfl.start_instance_by_hand(p_flow_key text,
                                                      p_record_schema text default null,
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
                            p_context, null, null);
end
$$;
