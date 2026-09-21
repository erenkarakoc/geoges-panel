#!/usr/bin/env node
/**
 * SQL migrations (TASK-0101, CONVENTIONS section 11, ENVIRONMENTS section 5).
 *
 * `db/migrations/NNNN_name.sql` files run in name order, each in its own transaction, over the
 * admin connection. The file name and a SHA-256 of its text go into `core.schema_migration`;
 * an applied file that later changes, disappears or is joined by an older-numbered file stops
 * the run, because the database would no longer match the repository. A transaction-level
 * advisory lock keeps two runs from applying the same file (a session lock is not safe on the
 * transaction pooler). A dump younger than an hour is required before any migration once one
 * has been applied (BACKUP_AND_RECOVERY section 2); before the first there is nothing to keep,
 * and CI's throw-away database on localhost needs none.
 *
 * Every migration is reversible (CONVENTIONS section 11): it comes with `NNNN_name.down.sql`,
 * or says why not in a `-- irreversible:` line, in which case the way back is the dump. CI
 * applies every migration to an empty database, rolls them back one by one and applies them
 * again (CI.md section 4).
 *
 *   npm run db:migrate                     apply pending migrations
 *   npm run db:migrate -- --status         list applied and pending, change nothing
 *   npm run db:migrate -- --rollback-last  run the newest applied migration's down file
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { ROOT, adminConfig, connectAdmin, readEnvFile, safeError } from "./db-admin.mjs";

export const MIGRATIONS_DIR = resolve(ROOT, "db/migrations");
export const BACKUPS_DIR = resolve(ROOT, "backups");
export const BACKUP_MAX_AGE_MS = 60 * 60 * 1000;
const NAME = /^(\d{4})_[a-z0-9_]+\.sql$/;
const DOWN = /\.down\.sql$/;
const IRREVERSIBLE = /^--[ \t]*irreversible:[ \t]*\S/m;
const LOCK_KEY = "geoges.schema_migration";

/** The ledger is created by the runner, so migration 0001 can already be recorded in it. */
const LEDGER_SQL = `
create schema if not exists core;
revoke all on schema core from public;
create table if not exists core.schema_migration (
  name text primary key,
  checksum text not null,
  applied_at timestamptz not null default now(),
  applied_by text not null default current_user
);
alter table core.schema_migration enable row level security;
revoke all on core.schema_migration from public;
`;

/** Line endings do not change a migration: a CRLF checkout must not look like an edit. */
export function checksum(text) {
  return createHash("sha256").update(text.replace(/\r\n/g, "\n")).digest("hex");
}

export function readMigrations(dir = MIGRATIONS_DIR) {
  const all = readdirSync(dir).filter((n) => n.endsWith(".sql"));
  const downs = new Set(all.filter((n) => DOWN.test(n)));
  const names = all.filter((n) => !DOWN.test(n));
  const numbers = new Map();
  for (const name of names) {
    const match = NAME.exec(name);
    if (!match) throw new Error(`${name}: migration names look like 0001_short_name.sql`);
    if (numbers.has(match[1]))
      throw new Error(`${name} and ${numbers.get(match[1])} share number ${match[1]}`);
    numbers.set(match[1], name);
  }
  for (const down of downs) {
    if (!names.includes(down.replace(DOWN, ".sql")))
      throw new Error(`${down} has no matching migration`);
  }
  return names.sort().map((name) => {
    const sql = readFileSync(join(dir, name), "utf8");
    const downName = name.replace(/\.sql$/, ".down.sql");
    const down = downs.has(downName) ? readFileSync(join(dir, downName), "utf8") : null;
    if (down === null && !IRREVERSIBLE.test(sql))
      throw new Error(`${name} needs ${downName} or an "-- irreversible: <reason>" line`);
    return { name, sql, checksum: checksum(sql), down };
  });
}

/** Compares the repository with the ledger; throws when they no longer describe one history. */
export function planMigrations(files, applied) {
  const byName = new Map(files.map((f) => [f.name, f]));
  for (const row of applied) {
    const file = byName.get(row.name);
    if (!file) throw new Error(`${row.name} is applied but missing from db/migrations`);
    if (file.checksum !== row.checksum)
      throw new Error(`${row.name} changed after it was applied; write a new migration instead`);
  }
  const done = new Set(applied.map((r) => r.name));
  const pending = files.filter((f) => !done.has(f.name));
  const lastApplied = [...done].sort().at(-1);
  const early = lastApplied && pending.find((f) => f.name < lastApplied);
  if (early) throw new Error(`${early.name} sorts before the applied ${lastApplied}; renumber it`);
  return pending;
}

/** Newest dump file time in `dir`, or null. */
export function latestBackupTime(dir = BACKUPS_DIR) {
  if (!existsSync(dir)) return null;
  const times = readdirSync(dir)
    .filter((n) => n.endsWith(".dump"))
    .map((n) => statSync(join(dir, n)))
    .filter((s) => s.size > 0)
    .map((s) => s.mtimeMs);
  return times.length ? Math.max(...times) : null;
}

/** CI's database: created empty for the run on the same machine and thrown away after it. */
export function isThrowAwayDatabase(env, host) {
  return env.CI === "true" && ["localhost", "127.0.0.1", "::1"].includes(host);
}

/** Null when the run may go ahead, otherwise the reason it may not. */
export function backupProblem({
  appliedCount,
  pendingCount,
  backupTime,
  throwAway = false,
  now = Date.now(),
}) {
  if (pendingCount === 0 || appliedCount === 0 || throwAway) return null;
  if (backupTime === null) return "no dump found in backups/; run `npm run db:backup` first";
  if (now - backupTime > BACKUP_MAX_AGE_MS)
    return "the newest dump is older than an hour; run `npm run db:backup` first";
  return null;
}

/** Runs `sql` and the ledger change in one transaction under the migration lock. */
async function inLockedTransaction(client, work) {
  await client.query("begin");
  try {
    await client.query("select pg_advisory_xact_lock(hashtext($1))", [LOCK_KEY]);
    const result = await work();
    await client.query(result === "skip" ? "rollback" : "commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  }
}

async function applyPending(client, pending) {
  for (const file of pending) {
    try {
      const result = await inLockedTransaction(client, async () => {
        const again = await client.query("select 1 from core.schema_migration where name = $1", [
          file.name,
        ]);
        if (again.rowCount) return "skip";
        await client.query(file.sql);
        await client.query("insert into core.schema_migration (name, checksum) values ($1, $2)", [
          file.name,
          file.checksum,
        ]);
        return "done";
      });
      console.log(
        result === "skip"
          ? `skipped  ${file.name} (applied by a parallel run)`
          : `done     ${file.name}`,
      );
    } catch (error) {
      throw new Error(`${file.name} failed and was rolled back: ${safeError(error)}`);
    }
  }
}

async function rollbackLast(client, files, applied) {
  const last = applied.at(-1);
  if (!last) throw new Error("nothing is applied");
  const file = files.find((f) => f.name === last.name);
  if (!file.down) throw new Error(`${file.name} is irreversible; restore the pre-migration dump`);
  try {
    await inLockedTransaction(client, async () => {
      await client.query(file.down);
      await client.query("delete from core.schema_migration where name = $1", [file.name]);
    });
    console.log(`reverted ${file.name}`);
  } catch (error) {
    throw new Error(`${file.name} down failed and was rolled back: ${safeError(error)}`);
  }
}

async function run({ statusOnly, rollback }) {
  const files = readMigrations();
  const env = readEnvFile();
  const throwAway = isThrowAwayDatabase(env, adminConfig(env).host);
  const client = await connectAdmin(env);
  try {
    if (!statusOnly) await client.query(LEDGER_SQL);
    const ledger = await client.query("select to_regclass('core.schema_migration') as t");
    const { rows: applied } = ledger.rows[0].t
      ? await client.query("select name, checksum from core.schema_migration order by name")
      : { rows: [] };
    const pending = planMigrations(files, applied);
    for (const row of applied) console.log(`applied  ${row.name}`);
    for (const file of pending) console.log(`pending  ${file.name}`);
    if (statusOnly) {
      console.log(pending.length ? `${pending.length} pending` : "database is up to date");
      return;
    }
    const work = rollback ? 1 : pending.length;
    if (work === 0) return console.log("database is up to date");
    const problem = backupProblem({
      appliedCount: applied.length,
      pendingCount: work,
      backupTime: latestBackupTime(),
      throwAway,
    });
    if (problem) throw new Error(problem);
    if (rollback) await rollbackLast(client, files, applied);
    else await applyPending(client, pending);
  } finally {
    await client.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  run({
    statusOnly: process.argv.includes("--status"),
    rollback: process.argv.includes("--rollback-last"),
  }).catch((error) => {
    console.error(`db:migrate stopped — ${error.code ? safeError(error) : error.message}`);
    process.exitCode = 1;
  });
}
