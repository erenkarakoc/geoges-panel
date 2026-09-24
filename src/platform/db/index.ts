import "server-only";

import { Pool } from "pg";

import { readDatabaseConfig } from "./database-config";
import { createRunAsUser, type ClientPool } from "./run-as-user";
import { createRunSearchAsUser } from "./run-search-as-user";
import { createRunSignedOut } from "./run-signed-out";

/**
 * Database access for request code (TASK-0101, ADR-015, PORTS_AND_SERVICES section 2).
 *
 * Entry points require an identity: the pool and raw client are not exported, so no code path can
 * query without an identity. The one exception is `runSignedOut`, which signing in needs and which
 * carries no identity at all, so row level security denies it every table (TASK-0112, D-272). Module data layers (`modules/<code>/data/`) call it with their own
 * table types; SQL lives only there. The admin connection is not reachable from here at all.
 */
export type { DbIdentity } from "./db-identity";
export type { Kysely as DbTransaction } from "kysely";
export { setChangeReason } from "./change-reason";

const globalForDb = globalThis as unknown as { geogesDbPool?: Pool };

/** One pool per server process; kept on globalThis so development reloads do not leak pools. */
function pool(): ClientPool {
  globalForDb.geogesDbPool ??= new Pool(readDatabaseConfig());
  return globalForDb.geogesDbPool;
}

export const runAsUser = createRunAsUser({ connect: () => pool().connect() });
export const runSearchAsUser = createRunSearchAsUser({ connect: () => pool().connect() });
export const runSignedOut = createRunSignedOut({ connect: () => pool().connect() });
