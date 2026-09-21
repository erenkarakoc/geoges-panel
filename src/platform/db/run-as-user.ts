import { Kysely, PostgresDialect } from "kysely";
import type { PostgresPool, PostgresPoolClient } from "kysely";

import { assertDbIdentity, type DbIdentity } from "./db-identity";

/** The part of a `pg` pool client this layer uses; `release(error)` destroys the connection. */
export interface PooledClient {
  query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }>;
  release(destroy?: boolean | Error): void;
}

export interface ClientPool {
  connect(): Promise<PooledClient>;
}

export const STATEMENT_TIMEOUT = "15s";

/**
 * Statements the work must not send itself. Its own `begin`/`commit` would end the identity
 * transaction early; a session-level `set`/`reset` (anything but `set local`, `set constraints`
 * and `set transaction`) would outlive the transaction on a pooled connection and reach the next
 * request; `set local role` would step out of the restricted role.
 */
const FORBIDDEN =
  /^\s*(begin|start\s+transaction|commit|end|rollback(?!\s+to\b)|abort|reset|discard|set\s+(?!local\b|constraints\b|transaction\b)|set\s+local\s+(role|session\s+authorization)\b)/i;

/** Hands the one checked-out connection to Kysely; Kysely's release is a no-op here. */
function singleClientPool(client: PooledClient): PostgresPool {
  const guarded = {
    query(sql: string, params: readonly unknown[]) {
      if (typeof sql === "string" && FORBIDDEN.test(sql)) {
        return Promise.reject(
          new Error(`"${sql.trim().split(/\s+/, 2).join(" ")}" is not allowed inside runAsUser.`),
        );
      }
      return client.query(sql, [...params]);
    },
    release() {},
  };
  // No `Client` constructor: Kysely then has no side channel to open a second connection.
  return {
    connect: async () => guarded as unknown as PostgresPoolClient,
    end: async () => {},
    options: {},
  };
}

/**
 * Builds `runAsUser` over a pool (TASK-0101, ADR-015, SPIKE-01 section "Phase 07 için kural").
 *
 * Every request query runs inside one transaction whose first statement writes the identity as
 * transaction-local settings, bound as parameters. The settings vanish at commit or rollback, so
 * nothing is left on the pooled connection. If even the rollback fails, the connection is
 * destroyed instead of returned: a half-open transaction must never reach another request.
 */
export function createRunAsUser(pool: ClientPool) {
  return async function runAsUser<DB, T>(
    identity: DbIdentity,
    work: (db: Kysely<DB>) => Promise<T>,
  ): Promise<T> {
    const { userId, actingRoleId } = assertDbIdentity(identity);
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(
        "select set_config('app.user_id', $1, true), set_config('app.role_id', $2, true), set_config('statement_timeout', $3, true)",
        [userId, actingRoleId ?? "", STATEMENT_TIMEOUT],
      );
      const db = new Kysely<DB>({
        dialect: new PostgresDialect({ pool: singleClientPool(client) }),
      });
      const result = await work(db);
      await client.query("commit");
      client.release();
      return result;
    } catch (error) {
      try {
        await client.query("rollback");
        client.release();
      } catch {
        client.release(true);
      }
      throw error;
    }
  };
}
