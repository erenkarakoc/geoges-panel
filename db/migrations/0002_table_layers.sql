-- 0002 — table layers and the real-data lock (TASK-0076, D-246, ENVIRONMENTS section 4a).
--
-- Every table says which layer it belongs to, so the reset and configuration-transfer commands
-- never keep a list of table names: `seed` (factory data, rebuilt by both resets), `config`
-- (the owner's configuration: kept by db:reset:data, returned to factory by db:reset:config,
-- moved by config:export/import), `business` (sample business records, emptied by both resets)
-- and `system` (tooling tables no command touches). The migration runner refuses a migration
-- that leaves a table unregistered or points a foreign key the wrong way between layers.

create table core.table_layer (
  schema_name text not null,
  table_name text not null,
  layer text not null check (layer in ('seed', 'config', 'business', 'system')),
  registered_at timestamptz not null default now(),
  primary key (schema_name, table_name)
);

comment on table core.table_layer is
  'Layer of every application table (D-246); written by the migration that creates the table.';

-- One row. Once real_data_started_at is set, both resets and the sample loader refuse to run.
create table core.environment (
  id boolean primary key default true check (id),
  real_data_started_at timestamptz,
  real_data_marked_by text
);

insert into core.environment (id) values (true);

comment on table core.environment is
  'Environment flags; real_data_started_at locks the reset commands (D-246).';

alter table core.table_layer enable row level security;
alter table core.environment enable row level security;
revoke all on core.table_layer, core.environment from public;

insert into core.table_layer (schema_name, table_name, layer) values
  ('core', 'schema_migration', 'system'),
  ('core', 'table_layer', 'system'),
  ('core', 'environment', 'system');
