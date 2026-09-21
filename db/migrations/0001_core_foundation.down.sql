-- Reverses 0001_core_foundation.sql. The `core` schema and its migration ledger belong to the
-- runner and stay. Dropping the functions removes their grants; the schema grant is revoked by
-- name, because Supabase's admin role may not use `drop owned`. A role can only be dropped once
-- nothing is granted to it, so later migrations' down files must revoke their own grants.
drop function core.uuid_v7();
drop function core.current_role_id();
drop function core.current_user_id();
revoke usage on schema core from geoges_app;
drop role geoges_app;
