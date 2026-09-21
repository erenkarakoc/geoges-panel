-- 0001 — data access foundation (TASK-0101, ADR-015, D-254).
--
-- The restricted runtime login role, the transaction-local identity functions every row level
-- security policy reads, and the time-ordered id default (CONVENTIONS section 2). No product
-- table yet. The `core` schema and `core.schema_migration` are created by the migration runner.
--
-- Rollback: this file only adds objects. Drop the three functions, revoke the grants and drop
-- the role `geoges_app` (roles are cluster-wide, so a restored dump keeps it).

-- Runtime role. It logs in, but may not bypass RLS, create roles or databases, or inherit any
-- other role's rights. The password is set separately by `npm run db:app-role`, so it never
-- appears in a migration. Created only when missing, because roles outlive a database restore.
do $$
begin
  if not exists (select from pg_catalog.pg_roles where rolname = 'geoges_app') then
    create role geoges_app login nosuperuser nocreatedb nocreaterole noinherit noreplication
      nobypassrls connection limit 20;
  end if;
end
$$;

grant usage on schema core to geoges_app;

-- Transaction-local identity. The data layer writes both values with set_config(..., true) as the
-- first statement of every request transaction; outside such a transaction they are empty, the
-- functions return NULL and no policy matches a row. Function and type names are schema-qualified
-- instead of pinning search_path, so the planner can still inline them inside policies.
create function core.current_user_id() returns uuid
language sql stable parallel safe
as $$ select nullif(pg_catalog.current_setting('app.user_id', true), '')::pg_catalog.uuid $$;

create function core.current_role_id() returns uuid
language sql stable parallel safe
as $$ select nullif(pg_catalog.current_setting('app.role_id', true), '')::pg_catalog.uuid $$;

comment on function core.current_user_id() is
  'Signed-in user of the current transaction (app.user_id), NULL when none was set.';
comment on function core.current_role_id() is
  'Acting role of the current transaction (app.role_id), NULL when none was set.';

-- Time-ordered UUID (version 7) for primary keys; PostgreSQL 17 has no built-in uuidv7().
-- 48-bit Unix milliseconds, then random bits from gen_random_uuid(); bits 52 and 53 turn the
-- version nibble from 4 into 7, the variant bits stay those of the random UUID.
create function core.uuid_v7() returns uuid
language sql volatile parallel safe
set search_path = ''
as $$
  select encode(
    set_bit(
      set_bit(
        overlay(
          uuid_send(gen_random_uuid())
          placing substring(int8send((extract(epoch from clock_timestamp()) * 1000)::bigint) from 3)
          from 1 for 6),
        52, 1),
      53, 1),
    'hex')::uuid
$$;

comment on function core.uuid_v7() is 'Time-ordered UUID version 7, the default for every id column.';

revoke all on function core.current_user_id(), core.current_role_id(), core.uuid_v7() from public;
grant execute on function core.current_user_id(), core.current_role_id(), core.uuid_v7()
  to geoges_app;
