-- Back to a reset that only reaches the audit log. The TSK subscriber may stay: with no event
-- published it simply never runs.
create or replace function iam.note_second_factor(p_user_id uuid, p_present boolean) returns boolean
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
  perform aud.record_event(
    case when p_present then 'two_factor.enrolled' else 'two_factor.reset' end,
    'iam', 'user', p_user_id, jsonb_build_object('by', by_whom));
  return true;
end
$$;
