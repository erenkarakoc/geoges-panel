import { type Kysely } from "kysely";

import { kyselyOn, STATEMENT_TIMEOUT, type ClientPool } from "./run-as-user";

/**
 * The one way to reach the database with nobody signed in (TASK-0112, D-272).
 *
 * Signing in needs it: a failed attempt is recorded and a lock is checked before anyone has an
 * identity, and the session cookie has to be read before the panel knows whose it is. No identity
 * is set, so row level security denies every table — which is the safety in it, not a gap. The
 * only things that answer here are the definer functions written for this path
 * (`iam.login_lock`, `iam.note_login_attempt`, `iam.use_session`), each of which decides for
 * itself what it will do without a caller.
 *
 * Anything that knows who is asking uses `runAsUser` instead.
 */
export function createRunSignedOut(pool: ClientPool) {
  return async function runSignedOut<DB, T>(work: (db: Kysely<DB>) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("select set_config('statement_timeout', $1, true)", [STATEMENT_TIMEOUT]);
      const result = await work(kyselyOn<DB>(client));
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
