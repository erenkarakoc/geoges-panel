-- 0056 — a flow inside a flow (TASK-0117, REQ-WFL-011, REQ-WFL-018).
--
-- "Uçtan uca süreçler kısa akışların zinciridir": a step may hand the work to another flow and
-- wait for it, which is how the ready-made template for an outside party's approval is used
-- (REQ-WFL-018). A subflow is a branch like any other — a run of its own, with its own log and
-- its own waiting — except that it runs a different flow, starting where that flow starts.
--
-- Depth is what keeps this from becoming a maze: three levels, the same limit branches have, so a
-- flow that calls itself stops with a reason instead of filling the database.

alter table wfl.instance drop constraint ck_instance__branch;
alter table wfl.instance
  add constraint ck_instance__branch check (
    (parent_instance_id is null) = (parent_step_state_id is null)
    -- A branch of the same flow starts at its own step; a subflow starts where its flow starts.
    and (parent_instance_id is not null or start_step_id is null)
    and (parent_instance_id is not null or depth = 0)
    and depth between 0 and 3);

/**
 * Starts another flow as a child of this run (REQ-WFL-011). Null when the flow is not published,
 * is disabled or the parent is no longer running; the record and the trigger's own context are
 * carried over, because the child is doing part of the same piece of work.
 */
create function wfl.start_subflow(p_parent_instance_id uuid, p_parent_step_state_id uuid,
                                  p_flow_key text, p_context jsonb default '{}')
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  parent wfl.instance;
  v record;
  new_id uuid;
begin
  select * into parent from wfl.instance where id = p_parent_instance_id;
  if parent.id is null or parent.status <> 'running' then
    return null;
  end if;
  if parent.depth >= 3 then
    raise exception 'a flow may not branch more than three levels deep'
      using errcode = 'P0001', hint = 'wfl.branch_too_deep';
  end if;

  select ver.id as version_id, ver.flow_id, ver.version
    into v
    from wfl.flow_version ver
    join wfl.flow f on f.id = ver.flow_id
   where f.key = p_flow_key and ver.status = 'published' and f.disabled_at is null;
  if v is null then
    return null;
  end if;

  insert into wfl.instance (flow_version_id, flow_id, flow_key, version, trigger_kind,
                            record_schema, record_table, record_id, context,
                            parent_instance_id, parent_step_state_id, branch_label,
                            depth, started_by_user_id)
  values (v.version_id, v.flow_id, p_flow_key, v.version, 'branch',
          parent.record_schema, parent.record_table, parent.record_id,
          coalesce(p_context, '{}'::jsonb),
          parent.id, p_parent_step_state_id, p_flow_key, parent.depth + 1,
          parent.started_by_user_id)
  returning id into new_id;

  insert into wfl.run_log (instance_id, step_id, kind, detail)
  values (parent.id, null, 'branch_opened',
          pg_catalog.jsonb_build_object('subflow', p_flow_key, 'instance_id', new_id));
  return new_id;
end
$$;

revoke all on function wfl.start_subflow(uuid, uuid, text, jsonb) from public;
grant execute on function wfl.start_subflow(uuid, uuid, text, jsonb) to geoges_worker;
