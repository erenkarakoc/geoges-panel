import "server-only";

import { Pool } from "pg";

import { readDatabaseConfig } from "./database-config";
import { createRunAsUser, type ClientPool } from "./run-as-user";
import { createRunSearchAsUser } from "./run-search-as-user";

/**
 * Database access for request code (TASK-0101, ADR-015, PORTS_AND_SERVICES section 2).
 *
 * Entry points require an identity: the pool and raw client are not exported, so no code path can
 * query without an identity. Module data layers (`modules/<code>/data/`) call it with their own
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
