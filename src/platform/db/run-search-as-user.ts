import { assertDbIdentity, type DbIdentity } from "./db-identity";
import type { ClientPool } from "./run-as-user";

/** A fixed, read-only search request; no caller-provided SQL or unbound identity. */
export function createRunSearchAsUser(pool: ClientPool) {
  return async function runSearchAsUser<T>(
    identity: DbIdentity,
    query: string,
    types?: readonly string[],
  ): Promise<T> {
    const { userId, actingRoleId } = assertDbIdentity(identity);
    const client = await pool.connect();
    try {
      // Constant SQL only. The timeout must be active BEFORE the bound search statement starts.
      await client.query("begin read only; set local statement_timeout = '15s'");
      const result = await client.query(
        "select core.search_request($1::uuid, $2::uuid, $3::text, $4::text[]) as answer",
        [userId, actingRoleId, query, types ?? null],
      );
      const answer = (result.rows[0] as { answer: T }).answer;
      await client.query("commit");
      client.release();
      return answer;
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
