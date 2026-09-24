-- 0041 — a manager's second-factor reset reaches the owner layer (TASK-0112, D-236).
--
-- 0040 made the flag follow the provider and wrote the audit entry. D-236 asks for one more thing:
-- a reset somebody performs on another person's account is **notified to the owner layer**. The
-- notification itself belongs to TSK, and IAM may not call TSK in code, so the event goes on the
-- outbox and TSK's own subscriber turns it into a notification — the same way role assignments and
-- deactivations have been published since 0006.
--
-- Only a manager's reset is published. Setting up a factor, or a person removing their own, is
-- nobody else's news.

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
  -- The audit log has an actor here, unlike a sign-in lock: somebody is signed in (REQ-IAM-008).
  perform aud.record_event(
    case when p_present then 'two_factor.enrolled' else 'two_factor.reset' end,
    'iam', 'user', p_user_id, jsonb_build_object('by', by_whom));
  if by_whom = 'manager' and not p_present then
    perform core.publish_event('two_factor.reset', 'iam', 'iam', 'user', p_user_id,
                               jsonb_build_object('user_id', p_user_id, 'by', by_whom,
                                                  'actor_user_id', actor),
                               1, null);
  end if;
  return true;
end
$$;
