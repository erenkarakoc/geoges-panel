/**
 * Frees throw-away test people so the suite that made them can delete them again (TASK-0110
 * follow-up, 2026-09-23).
 *
 * A jobs worker may be running against the same database — the development server starts one —
 * and it writes rows for *every* active account without knowing which of them a test invented:
 * the daily digest writes a row per person each morning (an empty placeholder when they have
 * nothing to do), and a notification can reach anyone. Those rows point at `iam.user`, so the
 * suite's own `delete from iam.user` then fails on a foreign key and takes the whole database
 * run down with it. Each suite calls this right before it removes its people.
 *
 * It deletes only rows keyed by the given user ids, and nothing a suite is asserting on: call it
 * in the clean-up step, not between assertions. Tasks are never deleted (the database refuses),
 * so a suite that makes tasks clears them the way `tsk.dbtest.ts` does.
 */

/** Tables a background worker or another module may fill for a person, in delete order. */
const TABLES = ["tsk.daily_digest", "tsk.notification", "tsk.push_subscription", "tsk.app_install"];

/**
 * @param {{ query: (sql: string, params?: unknown[]) => Promise<unknown> }} admin admin connection
 * @param {readonly string[]} userIds the suite's own people
 */
export async function releaseTestPeople(admin, userIds) {
  if (!userIds?.length) return;
  for (const table of TABLES) {
    await admin.query(`delete from ${table} where user_id = any($1::uuid[])`, [userIds]);
  }
  // The digest job also blocks other suites' people with an empty placeholder; take those back.
  await admin.query("delete from tsk.daily_digest where is_empty and payload = '{}'::jsonb");
}
