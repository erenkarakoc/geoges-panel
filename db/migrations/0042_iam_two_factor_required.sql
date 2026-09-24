-- 0042 — which roles must have a second factor is the administrator's setting
--        (TASK-0112, REQ-IAM-003, D-257, D-272).
--
-- REQ-IAM-003 leaves the list to the administrator: the owner, the general manager and any role
-- that reaches commercial or sensitive data may be made to use a second factor. The list is a dated
-- rule (`iam.two-factor-roles`, seed 0007) and, like the lock's numbers, it is read here rather than
-- passed in — a rule about who must be protected is not the caller's to choose, and reading it in
-- the application would mean IAM asking ADM for its settings, which the module map forbids.
--
-- The answer is about the person asking and nobody else: it reads `core.current_user_id()`, so it
-- cannot be used to ask about somebody else's account.

create function iam.second_factor_required() returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select from iam.role_assignment a
      join iam.role r on r.id = a.role_id
     where a.user_id = core.current_user_id()
       and a.starts_on <= iam.today()
       and (a.ends_on is null or a.ends_on >= iam.today())
       and r.code in (
         select pg_catalog.jsonb_array_elements_text(v.value)
           from adm.rule_value('iam.two-factor-roles', iam.today(), null, null, null) v))
$$;
revoke all on function iam.second_factor_required() from public;
grant execute on function iam.second_factor_required() to geoges_app;
