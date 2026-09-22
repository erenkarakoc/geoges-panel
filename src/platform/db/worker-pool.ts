import { Pool } from "pg";

import { readDatabaseConfig } from "./database-config";
import type { ClientPool } from "./run-as-user";

/**
 * The outbox worker's connection pool (TASK-0104, D-259): the `geoges_worker` role from
 * DATABASE_WORKER_URL, certificate verified like the runtime pool. Only `platform/jobs` uses it;
 * request code never gets it.
 */
export function createWorkerPool(
  env: Record<string, string | undefined> = process.env,
): ClientPool & {
  end(): Promise<void>;
} {
  return new Pool({ ...readDatabaseConfig(env, undefined, "DATABASE_WORKER_URL"), max: 3 });
}
