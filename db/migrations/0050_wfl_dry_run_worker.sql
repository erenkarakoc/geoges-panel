-- 0050 — the engine writes the evidence of the dry run it performed (TASK-0117, REQ-WFL-025).
--
-- The dry run is the engine's own loop with a sink that writes nothing, so the engine is what
-- performs it. It could not write the result: `wfl.record_dry_run` asks the caller for the design
-- permission, and the engine has no person to ask about — it is the system (REQ-WFL-020).
--
-- Rather than loosen the permission on the person's door, the system gets its own. The two write
-- the same row; what differs is who is allowed to knock.

create function wfl.record_dry_run_as_system(p_version_id uuid, p_passed boolean, p_summary jsonb)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  hash text;
  run_id uuid;
begin
  select v.content_hash into hash from wfl.flow_version v where v.id = p_version_id;
  if hash is null then
    raise exception 'no such flow version' using errcode = 'P0001', hint = 'wfl.no_version';
  end if;
  insert into wfl.dry_run (flow_version_id, content_hash, passed, summary)
  values (p_version_id, hash, p_passed, coalesce(p_summary, '{}'::jsonb))
  returning id into run_id;
  return run_id;
end
$$;

revoke all on function wfl.record_dry_run_as_system(uuid, boolean, jsonb) from public;
grant execute on function wfl.record_dry_run_as_system(uuid, boolean, jsonb) to geoges_worker;
