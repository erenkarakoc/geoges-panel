-- Reverses 0053_wfl_step_detail_in_log.sql: the log goes back to status and outcome alone.

/** Leaves the step with what it decided; the engine reads the outcome to find the next one. */
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
          pg_catalog.jsonb_build_object('status', p_status, 'outcome', p_outcome));
  return true;
end
$$;
