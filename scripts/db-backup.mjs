#!/usr/bin/env node
/**
 * Pre-migration dump (TASK-0101, BACKUP_AND_RECOVERY section 2, ENVIRONMENTS section 7).
 *
 * Runs `pg_dump` (major version 17 or newer, from PATH or `PG_DUMP_PATH`) in custom format into
 * `backups/` (ignored by Git). It covers the application schemas, not the provider's own ones
 * (auth, storage, realtime …): those belong to Supabase and are restored by it. The password is
 * passed to pg_dump through its environment, never on the command line, and nothing secret is
 * printed. `npm run db:migrate` refuses to run without a dump younger than an hour.
 *
 *   npm run db:backup
 */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { DEFAULT_CA_PATH, adminConfig, connectAdmin, readEnvFile, safeError } from "./db-admin.mjs";
import { BACKUPS_DIR } from "./db-migrate.mjs";

/** Schemas owned by the provider or the database itself; everything else is ours. */
const PROVIDER_SCHEMAS = new Set([
  "auth",
  "extensions",
  "graphql",
  "graphql_public",
  "information_schema",
  "net",
  "pgbouncer",
  "pgsodium",
  "pgsodium_masks",
  "realtime",
  "storage",
  "supabase_functions",
  "supabase_migrations",
  "vault",
]);

export function applicationSchemas(names) {
  return names.filter((n) => !n.startsWith("pg_") && !PROVIDER_SCHEMAS.has(n)).sort();
}

export function dumpFileName(now = new Date()) {
  return `${now.toISOString().replace(/[:.]/g, "-")}.dump`;
}

function pgDumpMajor(bin) {
  const out = spawnSync(bin, ["--version"], { encoding: "utf8" });
  if (out.error || out.status !== 0) return null;
  const match = /(\d+)(\.\d+)?/.exec(out.stdout);
  return match ? Number(match[1]) : null;
}

async function run() {
  const env = readEnvFile();
  const bin = process.env.PG_DUMP_PATH || env.PG_DUMP_PATH || "pg_dump";
  const major = pgDumpMajor(bin);
  if (major === null)
    throw new Error(
      "pg_dump was not found; install the PostgreSQL 17 command-line tools or set PG_DUMP_PATH",
    );
  if (major < 17) throw new Error(`pg_dump ${major} is older than the server (17)`);

  const client = await connectAdmin(env);
  let schemas;
  try {
    const { rows } = await client.query("select nspname from pg_namespace");
    schemas = applicationSchemas(rows.map((r) => r.nspname));
  } finally {
    await client.end();
  }

  const cfg = adminConfig(env);
  mkdirSync(BACKUPS_DIR, { recursive: true });
  const file = join(BACKUPS_DIR, dumpFileName());
  const args = ["--format=custom", `--file=${file}`, ...schemas.map((s) => `--schema=${s}`)];
  const result = spawnSync(bin, args, {
    stdio: ["ignore", "ignore", "pipe"],
    encoding: "utf8",
    env: {
      ...process.env,
      PGHOST: cfg.host,
      PGPORT: String(cfg.port),
      PGDATABASE: cfg.database,
      PGUSER: cfg.user,
      PGPASSWORD: cfg.password,
      PGSSLMODE: "verify-full",
      PGSSLROOTCERT: env.DATABASE_CA_CERT_PATH || DEFAULT_CA_PATH,
    },
  });
  if (result.status !== 0) throw new Error(`pg_dump failed with exit code ${result.status}`);
  console.log(
    `dump written: backups/${file.split(/[\\/]/).at(-1)} (schemas: ${schemas.join(", ")})`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  run().catch((error) => {
    console.error(`db:backup stopped — ${error.code ? safeError(error) : error.message}`);
    process.exitCode = 1;
  });
}
