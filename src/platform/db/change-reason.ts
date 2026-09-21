import { sql, type Kysely } from "kysely";

/**
 * Gives the reason for the changes of the current transaction (REQ-AUD-001, TASK-0103). The
 * history trigger copies it into every history row the transaction writes; it vanishes with the
 * transaction like the identity. Call it inside `runAsUser`, before the writes.
 */
export async function setChangeReason<DB>(db: Kysely<DB>, reason: string): Promise<void> {
  const text = reason.trim();
  if (!text) throw new Error("A change reason must not be empty.");
  await sql`select set_config('app.change_reason', ${text}, true)`.execute(db);
}
