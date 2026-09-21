/**
 * Table layers (TASK-0076, D-246, ENVIRONMENTS section 4a).
 *
 * Every application table is registered in `core.table_layer` by the migration that creates it.
 * The reset and configuration-transfer commands work from that register, never from a list of
 * table names. The migration runner calls `checkLayers` after each migration: an unregistered
 * table, a foreign key pointing the wrong way between layers, or a transferable table without a
 * primary key rolls the migration back.
 *
 * Configuration is portable (moved by config:export/import) unless its register row says
 * otherwise; rows that name people are not, because people's ids differ per environment (D-256).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { ROOT, applicationSchemas } from "./db-admin.mjs";

export const LAYERS = ["seed", "config", "business", "system"];
export const SEEDS_DIR = resolve(ROOT, "db/seeds");
export const SAMPLES_DIR = resolve(ROOT, "db/samples");

/**
 * Which layers a table of each layer may reference. Business data may point anywhere; nothing
 * may point at business data except business data, so emptying it never breaks configuration
 * and exported configuration never depends on a business record. Seed and configuration may
 * point at system tables (people's accounts), which no command ever empties (D-256).
 */
const MAY_REFERENCE = {
  seed: ["seed", "system"],
  config: ["seed", "config", "system"],
  system: ["system"],
  business: LAYERS,
};

/** Rule violations, as readable lines; empty when the database follows the layer rules. */
export function layerProblems({ tables, registered, references, primaryKeys, portable = null }) {
  const problems = [];
  const actual = new Set(tables);
  for (const table of tables) {
    const layer = registered.get(table);
    if (!layer) problems.push(`${table} has no layer; register it in core.table_layer`);
    else if ((layer === "config" || layer === "seed") && !primaryKeys.has(table))
      problems.push(`${table} is ${layer} data and needs a primary key`);
  }
  for (const name of registered.keys()) {
    if (!actual.has(name)) problems.push(`${name} is registered but does not exist`);
  }
  for (const { from, to } of references) {
    const a = registered.get(from);
    const b = registered.get(to);
    if (a && b && !MAY_REFERENCE[a].includes(b))
      problems.push(`${from} (${a}) must not reference ${to} (${b})`);
    // Portable configuration travels alone: it cannot point at people or non-portable rows.
    else if (portable && a === "config" && portable.has(from) && b !== "seed" && !portable.has(to))
      problems.push(`${from} (portable config) must not reference ${to} (${b}, not portable)`);
  }
  return problems;
}

/**
 * Tables ordered so that every referenced table comes first. Self-references are ignored: rows
 * of one table go in with a single statement, and foreign keys are checked at its end.
 */
export function dependencyOrder(tables, references) {
  const inSet = new Set(tables);
  const needs = new Map(tables.map((t) => [t, new Set()]));
  for (const { from, to } of references) {
    if (from !== to && inSet.has(from) && inSet.has(to)) needs.get(from).add(to);
  }
  const ordered = [];
  const state = new Map();
  const visit = (table, path) => {
    if (state.get(table) === "done") return;
    if (state.get(table) === "active")
      throw new Error(`foreign keys form a cycle: ${[...path, table].join(" -> ")}`);
    state.set(table, "active");
    for (const dep of [...needs.get(table)].sort()) visit(dep, [...path, table]);
    state.set(table, "done");
    ordered.push(table);
  };
  for (const table of [...tables].sort()) visit(table, []);
  return ordered;
}

export async function hasLayerRegister(client) {
  const { rows } = await client.query("select to_regclass('core.table_layer') as t");
  return rows[0].t !== null;
}

/** Reads tables, register, references and primary keys of the application schemas. */
export async function readLayerState(client) {
  const { rows: schemaRows } = await client.query("select nspname from pg_namespace");
  const schemas = applicationSchemas(schemaRows.map((r) => r.nspname));
  const tables = await client.query(
    `select n.nspname || '.' || c.relname as name
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relkind in ('r', 'p') and not c.relispartition and n.nspname = any($1)`,
    [schemas],
  );
  const { rows: portableColumn } = await client.query(
    `select 1 from information_schema.columns
      where table_schema = 'core' and table_name = 'table_layer' and column_name = 'portable'`,
  );
  const registered = await client.query(
    `select schema_name || '.' || table_name as name, layer,
            ${portableColumn.length ? "portable" : "false"} as portable
       from core.table_layer`,
  );
  const references = await client.query(
    `select fn.nspname || '.' || fc.relname as "from", tn.nspname || '.' || tc.relname as "to"
       from pg_constraint k
       join pg_class fc on fc.oid = k.conrelid join pg_namespace fn on fn.oid = fc.relnamespace
       join pg_class tc on tc.oid = k.confrelid join pg_namespace tn on tn.oid = tc.relnamespace
      where k.contype = 'f' and fn.nspname = any($1)`,
    [schemas],
  );
  const keys = await client.query(
    `select n.nspname || '.' || c.relname as name
       from pg_index i join pg_class c on c.oid = i.indrelid
       join pg_namespace n on n.oid = c.relnamespace
      where i.indisprimary and n.nspname = any($1)`,
    [schemas],
  );
  return {
    tables: tables.rows.map((r) => r.name).sort(),
    registered: new Map(registered.rows.map((r) => [r.name, r.layer])),
    portable: new Set(registered.rows.filter((r) => r.portable).map((r) => r.name)),
    references: references.rows,
    primaryKeys: new Set(keys.rows.map((r) => r.name)),
  };
}

export async function checkLayers(client) {
  const problems = layerProblems(await readLayerState(client));
  if (problems.length) throw new Error(`table layer rules broken:\n  ${problems.join("\n  ")}`);
}

/**
 * Registered tables of the given layers, optionally limited to some schemas (tests) or to
 * portable configuration (config:export/import).
 */
export async function tablesInLayers(
  client,
  layers,
  schemas = null,
  { portableOnly = false } = {},
) {
  const { rows } = await client.query(
    `select schema_name, table_name from core.table_layer
      where layer = any($1) and ($2::text[] is null or schema_name = any($2))
        ${portableOnly ? "and portable" : ""}
      order by schema_name, table_name`,
    [layers, schemas],
  );
  return rows.map((r) => `${r.schema_name}.${r.table_name}`);
}

export function quoteTable(client, name) {
  const [schema, table] = name.split(".");
  return `${client.escapeIdentifier(schema)}.${client.escapeIdentifier(table)}`;
}

/** Throws when the environment holds real data; call inside the transaction that resets. */
export async function assertNoRealData(client) {
  const { rows } = await client.query(
    "select real_data_started_at from core.environment for update",
  );
  if (rows[0]?.real_data_started_at)
    throw new Error(
      `bu ortamda ${rows[0].real_data_started_at.toISOString().slice(0, 10)} tarihinden beri gerçek veri var; sıfırlama ve örnek veri kilitli`,
    );
}

/**
 * Empties every table of the given layers in one statement. Returns the emptied tables.
 * @param {import("pg").Client} client
 * @param {string[]} layers
 * @param {string[] | null} [schemas]
 */
export async function emptyLayers(client, layers, schemas = null) {
  const tables = await tablesInLayers(client, layers, schemas);
  if (tables.length)
    await client.query(
      `truncate table ${tables.map((t) => quoteTable(client, t)).join(", ")} restart identity`,
    );
  return tables;
}

/**
 * Removes sample rows kept in `system` tables (D-256): sample people live in `iam.user`, which no
 * reset empties, flagged `is_sample`. Every row pointing at them through a foreign key goes first
 * (their role assignments, managers, exceptions), then the sample rows themselves. Works from the
 * catalog, like every other reset step. Returns the tables touched and the rows removed.
 * @param {import("pg").Client} client
 * @param {string[] | null} [schemas]
 */
export async function removeSampleRows(client, schemas = null) {
  const { rows: flagged } = await client.query(
    `select l.schema_name || '.' || l.table_name as name
       from core.table_layer l
       join information_schema.columns c
         on c.table_schema = l.schema_name and c.table_name = l.table_name
        and c.column_name = 'is_sample' and c.data_type = 'boolean'
      where l.layer = 'system' and ($1::text[] is null or l.schema_name = any($1))
      order by 1`,
    [schemas],
  );
  let removed = 0;
  for (const { name } of flagged) {
    const target = quoteTable(client, name);
    const { rows: refs } = await client.query(
      `select fn.nspname || '.' || fc.relname as "from", fa.attname as col, ta.attname as key
         from pg_constraint k
         join pg_class fc on fc.oid = k.conrelid join pg_namespace fn on fn.oid = fc.relnamespace
         join pg_attribute fa on fa.attrelid = k.conrelid and fa.attnum = k.conkey[1]
         join pg_attribute ta on ta.attrelid = k.confrelid and ta.attnum = k.confkey[1]
        where k.contype = 'f' and k.confrelid = $1::regclass and cardinality(k.conkey) = 1
          and k.conrelid <> k.confrelid
        order by 1, 2`,
      [target],
    );
    for (const ref of refs) {
      const { rowCount } = await client.query(
        `delete from ${quoteTable(client, ref.from)}
          where ${client.escapeIdentifier(ref.col)} in
                (select ${client.escapeIdentifier(ref.key)} from ${target} where is_sample)`,
      );
      removed += rowCount;
    }
    const { rowCount } = await client.query(`delete from ${target} where is_sample`);
    removed += rowCount;
  }
  return { tables: flagged.map((f) => f.name), removed };
}

/** `NNNN_name.sql` files of a folder in name order; a missing folder has none. */
export function readSqlFolder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => /^\d{4}_[a-z0-9_]+\.sql$/.test(n))
    .sort()
    .map((name) => ({ name, sql: readFileSync(join(dir, name), "utf8") }));
}

/** Runs re-runnable data files (seeds or samples) on the given client, in order. */
export async function runSqlFolder(client, dir) {
  const files = readSqlFolder(dir);
  for (const file of files) await client.query(file.sql);
  return files.map((f) => f.name);
}
