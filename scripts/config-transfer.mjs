#!/usr/bin/env node
/**
 * Configuration export and import (TASK-0076, D-246, ENVIRONMENTS section 4b).
 *
 * Export writes every portable `config` table's rows to one JSON file together with the database's last
 * applied migration. Import loads such a file into another environment on the same migration:
 * a row missing in the target is added, an identical row is skipped, and a row that differs is
 * a conflict. One conflict writes nothing; every conflict is reported by table and key. Business
 * data, search helpers and configuration that names people (role assignments, personal
 * exceptions, manual managers; D-256) never enter the file.
 *
 *   npm run config:export [-- <file>]           default exports/config-<time>.json
 *   npm run config:import -- <file> [--dry-run]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { ROOT, connectAdmin, safeError } from "./db-admin.mjs";
import { dependencyOrder, quoteTable, readLayerState, tablesInLayers } from "./db-layers.mjs";

export const FORMAT = "geoges-config";
export const FORMAT_VERSION = 1;

/** Stable text of a row, independent of key order, for comparing source and target. */
export function rowText(row) {
  return JSON.stringify(
    Object.keys(row)
      .sort()
      .map((k) => [k, row[k]]),
  );
}

export function keyText(row, keyColumns) {
  return JSON.stringify(keyColumns.map((c) => row[c]));
}

/**
 * Splits the incoming rows of one table into rows to add and conflicts; identical rows are
 * skipped. Only the columns present in the file are compared.
 */
export function compareRows(incoming, existing, keyColumns) {
  const byKey = new Map(existing.map((r) => [keyText(r, keyColumns), r]));
  const add = [];
  const conflicts = [];
  let same = 0;
  for (const row of incoming) {
    const key = keyText(row, keyColumns);
    const current = byKey.get(key);
    if (!current) add.push(row);
    else {
      const projected = Object.fromEntries(Object.keys(row).map((c) => [c, current[c]]));
      if (rowText(projected) === rowText(row)) same += 1;
      else conflicts.push(key);
    }
  }
  return { add, conflicts, same };
}

export function validateExport(data) {
  if (data?.format !== FORMAT) throw new Error("bu dosya bir yapılandırma dışa aktarımı değil");
  if (data.version !== FORMAT_VERSION)
    throw new Error(`desteklenmeyen dosya sürümü ${data.version} (beklenen ${FORMAT_VERSION})`);
  if (typeof data.migration_head !== "string" || typeof data.tables !== "object")
    throw new Error("dosyada göç sürümü veya tablolar eksik");
  return data;
}

async function migrationHead(client) {
  const { rows } = await client.query("select max(name) as head from core.schema_migration");
  return rows[0].head;
}

/** Insertable columns and primary key columns of a table. */
async function tableShape(client, name) {
  const [schema, table] = name.split(".");
  const cols = await client.query(
    `select column_name, is_identity = 'YES' and identity_generation = 'ALWAYS' as always_identity
       from information_schema.columns
      where table_schema = $1 and table_name = $2 and is_generated = 'NEVER'
      order by ordinal_position`,
    [schema, table],
  );
  const key = await client.query(
    `select a.attname from pg_index i
       join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
      where i.indrelid = $1::regclass and i.indisprimary
      order by array_position(i.indkey, a.attnum)`,
    [quoteTable(client, name)],
  );
  return {
    columns: cols.rows.map((r) => r.column_name),
    alwaysIdentity: cols.rows.some((r) => r.always_identity),
    key: key.rows.map((r) => r.attname),
  };
}

async function readRows(client, name, shape) {
  const list = shape.columns.map((c) => client.escapeIdentifier(c)).join(", ");
  const order = shape.key.map((c) => client.escapeIdentifier(c)).join(", ");
  const { rows } = await client.query(
    `select to_jsonb(t) as r from (select ${list} from ${quoteTable(client, name)} order by ${order}) t`,
  );
  return rows.map((r) => r.r);
}

/**
 * Rows inserted with their own identity or serial values leave the sequence behind; move it to
 * the largest value so the next ordinary insert does not collide. Never moves a sequence back.
 */
async function advanceSequences(client, name, columns) {
  for (const column of columns) {
    const { rows } = await client.query("select pg_get_serial_sequence($1, $2) as seq", [
      quoteTable(client, name),
      column,
    ]);
    const seq = rows[0].seq;
    if (!seq) continue;
    await client.query(
      `select setval($1::regclass, greatest(m, coalesce(pg_sequence_last_value($1::regclass), m)))
         from (select max(${client.escapeIdentifier(column)}) as m from ${quoteTable(client, name)}) t
        where m is not null`,
      [seq],
    );
  }
}

/**
 * The export object; `schemas` limits it to some schemas (tests).
 * @param {import("pg").Client} client
 * @param {{ schemas?: string[] | null, now?: Date }} [options]
 */
export async function exportConfig(client, { schemas = null, now = new Date() } = {}) {
  const tables = {};
  for (const name of await tablesInLayers(client, ["config"], schemas, { portableOnly: true })) {
    tables[name] = await readRows(client, name, await tableShape(client, name));
  }
  return {
    format: FORMAT,
    version: FORMAT_VERSION,
    exported_at: now.toISOString(),
    migration_head: await migrationHead(client),
    tables,
  };
}

/**
 * Loads an export in one transaction. Returns a per-table report; throws, writing nothing, on a
 * migration mismatch, an unknown table or any conflict.
 */
export async function importConfig(client, data, { dryRun = false, schemas = null } = {}) {
  validateExport(data);
  await client.query("begin");
  try {
    const head = await migrationHead(client);
    if (head !== data.migration_head)
      throw new Error(
        `hedef veritabanı ${head} göçünde, dosya ${data.migration_head} göçünden; önce göçleri eşitleyin`,
      );
    const configTables = new Set(
      await tablesInLayers(client, ["config"], schemas, { portableOnly: true }),
    );
    const unknown = Object.keys(data.tables).filter((t) => !configTables.has(t));
    if (unknown.length)
      throw new Error(`hedefte taşınabilir yapılandırma tablosu olmayanlar: ${unknown.join(", ")}`);

    const { references } = await readLayerState(client);
    const order = dependencyOrder(Object.keys(data.tables), references);
    const report = [];
    const conflicts = [];
    const plans = [];
    for (const name of order) {
      const shape = await tableShape(client, name);
      const result = compareRows(data.tables[name], await readRows(client, name, shape), shape.key);
      report.push({ table: name, add: result.add.length, same: result.same });
      for (const key of result.conflicts) conflicts.push(`${name} ${key}`);
      plans.push({ name, shape, rows: result.add });
    }
    if (conflicts.length) {
      const error = new Error(
        `${conflicts.length} çakışma; hiçbir şey yazılmadı:\n  ${conflicts.join("\n  ")}`,
      );
      error.conflicts = conflicts;
      throw error;
    }
    if (!dryRun) {
      for (const { name, shape, rows } of plans) {
        if (!rows.length) continue;
        const cols = Object.keys(rows[0]).filter((c) => shape.columns.includes(c));
        const list = cols.map((c) => client.escapeIdentifier(c)).join(", ");
        await client.query(
          `insert into ${quoteTable(client, name)} (${list})
           ${shape.alwaysIdentity ? "overriding system value" : ""}
           select ${list} from jsonb_populate_recordset(null::${quoteTable(client, name)}, $1::jsonb)`,
          [JSON.stringify(rows)],
        );
        await advanceSequences(client, name, cols);
      }
    }
    await client.query(dryRun ? "rollback" : "commit");
    return report;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  }
}

export function defaultExportPath(now = new Date()) {
  return resolve(ROOT, "exports", `config-${now.toISOString().replace(/[:.]/g, "-")}.json`);
}

export async function writeExport(client, path = defaultExportPath()) {
  const data = await exportConfig(client);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  const rows = Object.values(data.tables).reduce((n, t) => n + t.length, 0);
  return { path, tables: Object.keys(data.tables).length, rows };
}

async function run(argv) {
  const [command, ...rest] = argv;
  const file = rest.find((a) => !a.startsWith("--"));
  const client = await connectAdmin();
  try {
    if (command === "export") {
      const out = await writeExport(client, file ? resolve(file) : undefined);
      console.log(
        `yapılandırma dışa aktarıldı: ${out.path} (${out.tables} tablo, ${out.rows} satır)`,
      );
    } else if (command === "import") {
      if (!file) throw new Error("içe aktarılacak dosyayı verin: npm run config:import -- <dosya>");
      const dryRun = rest.includes("--dry-run");
      const data = JSON.parse(readFileSync(resolve(file), "utf8"));
      const report = await importConfig(client, data, { dryRun });
      for (const r of report) console.log(`${r.table}: ${r.add} yeni, ${r.same} aynı`);
      console.log(dryRun ? "deneme: hiçbir şey yazılmadı" : "yapılandırma içe aktarıldı");
    } else {
      throw new Error("kullanım: config-transfer.mjs export [dosya] | import <dosya> [--dry-run]");
    }
  } finally {
    await client.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  run(process.argv.slice(2)).catch((error) => {
    console.error(`durdu — ${error.code ? safeError(error) : error.message}`);
    process.exitCode = 1;
  });
}
