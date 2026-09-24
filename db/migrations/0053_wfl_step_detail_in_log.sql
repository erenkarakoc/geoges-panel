-- 0053 — the run log carries what the step decided with (TASK-0117, D-087, D-223).
--
-- `wfl.leave_step` kept the step's own detail on the step state and wrote only the status and the
-- outcome to the log. The log is what the run screen and "why is this mine" are built from, so a
-- condition that answered "no" could be read there without the number it counted, or the field it
-- looked at. Now the detail travels with it.

create or replace function wfl.leave_step(p_state_id uuid, p_status text, p_outcome text default null,
                                          p_detail jsonb default '{}')
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  s record;
begin
  update wfl.step_state
     set status = p_status, outcome = p_outcome, left_at = pg_catalog.now(),
         detail = coalesce(p_detail, '{}'::jsonb)
   where id = p_state_id and status = 'running'
  returning instance_id, step_id into s;
  if s is null then
    return false;
  end if;
  insert into wfl.run_log (instance_id, step_id, kind, detail)
  values (s.instance_id, s.step_id, 'left',
          coalesce(p_detail, '{}'::jsonb)
            || pg_catalog.jsonb_build_object('status', p_status, 'outcome', p_outcome));
  return true;
end
$$;
