-- 0040 — the "set up your second factor" flag follows the provider (TASK-0112, D-236, REQ-IAM-003).
--
-- `iam.user.must_setup_2fa` has been written by one hand only: the owner bootstrap command. Nothing
-- cleared it when somebody actually enrolled a factor, and nothing set it again when a factor was
-- taken away — the owner's flag had to be cleared by hand on 2026-09-22. From here the panel keeps
-- it in step with what the provider holds, and says who did it in the audit log.
--
-- Who may: the person themselves, because their own factor is theirs to set up or lose, and a user
-- manager, because a manager's reset is exactly the case D-236 asks for. Nobody else, even with
-- every other permission: the check is inside the function, not in a policy that a caller could be
-- reading around.

create function iam.note_second_factor(p_user_id uuid, p_present boolean) returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  actor uuid := core.current_user_id();
  by_whom text;
begin
  if actor is null then
    raise exception 'a second-factor change needs a signed-in person' using errcode = '42501';
  end if;
  by_whom := case when actor = p_user_id then 'self' else 'manager' end;
  if by_whom = 'manager' and not iam.has_permission('iam.module.manage') then
    raise exception 'only the person themselves or a user manager may change this'
      using errcode = '42501';
  end if;

  update iam.user set must_setup_2fa = not p_present where id = p_user_id;
  if not found then
    return false;
  end if;
  -- The audit log has an actor here, unlike a sign-in lock: somebody is signed in (REQ-IAM-008).
  perform aud.record_event(
    case when p_present then 'two_factor.enrolled' else 'two_factor.reset' end,
    'iam', 'user', p_user_id, jsonb_build_object('by', by_whom));
  return true;
end
$$;
revoke all on function iam.note_second_factor(uuid, boolean) from public;
grant execute on function iam.note_second_factor(uuid, boolean) to geoges_app;
