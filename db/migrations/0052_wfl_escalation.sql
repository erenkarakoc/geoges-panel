-- 0052 — an approval that has waited too long moves up (TASK-0117, REQ-WFL-005, REQ-IAM-020).
--
-- The architecture's own example writes it as a property of the step: "after eight hours, to the
-- general manager". What that means in the database is small and worth being exact about:
--
-- The approval moves; it is not copied. One approval has one person who must answer it, and the
-- run log says it moved and when, so "why is this mine" has an answer (D-223).
--
-- It moves only while it is still waiting. A decision made a minute before the timer fires wins,
-- which is what keeps an escalation from undoing somebody's answer.

create function wfl.escalate_approval(p_approval_id uuid, p_to_user_id uuid) returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  a record;
begin
  select * into a from wfl.approval where id = p_approval_id;
  if a is null or a.status <> 'waiting' or a.owner_user_id = p_to_user_id then
    return false;
  end if;

  update wfl.approval set owner_user_id = p_to_user_id where id = p_approval_id;

  insert into wfl.run_log (instance_id, step_id, kind, detail)
  values (a.instance_id, a.step_id, 'waiting',
          pg_catalog.jsonb_build_object('escalated_from', a.owner_user_id,
                                        'escalated_to', p_to_user_id));
  return true;
end
$$;

revoke all on function wfl.escalate_approval(uuid, uuid) from public;
grant execute on function wfl.escalate_approval(uuid, uuid) to geoges_worker;
