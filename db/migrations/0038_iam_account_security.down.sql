-- Revert the application code first: it calls these functions. No account, factor or password is
-- touched; the three tables and everything in them go.
revoke select on iam.session from geoges_app;
drop trigger user_disabled_revokes_sessions on iam.user;
drop function iam.revoke_sessions_on_disable();
drop function iam.recovery_codes_left(uuid);
drop function iam.use_recovery_code(uuid, text);
drop function iam.issue_recovery_codes(uuid, text[]);
drop function iam.revoke_sessions(uuid, text);
drop function iam.revoke_session(uuid, text);
drop function iam.mark_session_second_factor(uuid);
drop function iam.use_session(uuid, integer);
drop function iam.start_session(uuid, text, integer, boolean);
drop function iam.note_login_attempt(text, boolean, text, text, integer, integer);
drop function iam.login_lock(text);
delete from core.table_layer where schema_name = 'iam'
  and table_name in ('login_attempt', 'session', 'recovery_code');
drop table iam.recovery_code;
drop table iam.session;
drop table iam.login_attempt;
