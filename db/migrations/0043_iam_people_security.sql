-- 0043 — what a user manager needs to see about accounts (TASK-0112, D-273, D-236).
--
-- The minimal "Kullanıcılar & Roller" screen shows the people and lets a manager reset a lost
-- second factor. Three of the things it shows are closed to the application on purpose: the
-- recovery codes have no grant at all, and a person may read only their own sessions. So the
-- screen cannot assemble this from tables; this function answers instead, and it answers only for
-- somebody holding `iam.module.manage` — the same right the reset itself needs.
--
-- It returns counts, never a code hash and never a session id: a manager needs to know whether
-- somebody has a way back in, not what it is.

create function iam.people_security()
returns table (id uuid, display_name text, email text, status text, must_setup_2fa boolean,
               recovery_codes_left integer, live_sessions integer, last_seen_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select u.id, u.display_name, u.email, u.status, u.must_setup_2fa,
         (select count(*)::int from iam.recovery_code c
           where c.user_id = u.id and c.used_at is null),
         (select count(*)::int from iam.session s
           where s.user_id = u.id and s.revoked_at is null
             and s.expires_at > pg_catalog.now()),
         (select max(s.last_seen_at) from iam.session s where s.user_id = u.id)
    from iam.user u
   where iam.has_permission('iam.module.manage')
   order by u.display_name, u.id
$$;
revoke all on function iam.people_security() from public;
grant execute on function iam.people_security() to geoges_app;
