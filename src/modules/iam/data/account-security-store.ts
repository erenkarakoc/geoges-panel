import { sql } from "kysely";

import { runAsUser, runSignedOut, type DbIdentity } from "@/platform/db";

/**
 * Account security in the database (TASK-0112, D-230, D-236, D-272; migration 0038).
 *
 * The sign-in path has no identity yet, so the lock and the session cookie are read through
 * `runSignedOut`; everything that happens once the panel knows who is asking goes through
 * `runAsUser`. Every statement here calls one of the definer functions of 0038: the three tables
 * themselves are closed to the application, and the code hashes are never read back at all.
 */

/** When an e-mail's lock ends, or null when it may try (REQ-IAM-005). */
export function loginLock(email: string) {
  return runSignedOut(async (db) => {
    const { rows } = await sql<{ until: Date | null }>`
      select iam.login_lock(${email}) as until`.execute(db);
    return rows[0]?.until ?? null;
  });
}

/**
 * Records one try and returns the lock it caused, or the lock already in force. How many tries
 * are allowed and how long the lock lasts are not arguments: the function reads the company's
 * dated rules itself, so the numbers cannot arrive with the call (0039, D-257).
 */
export function noteLoginAttempt(attempt: {
  email: string;
  succeeded: boolean;
  ip: string | null;
  userAgent: string | null;
}) {
  return runSignedOut(async (db) => {
    const { rows } = await sql<{ until: Date | null }>`
      select iam.note_login_attempt(${attempt.email}, ${attempt.succeeded}, ${attempt.ip},
                                    ${attempt.userAgent}) as until`.execute(db);
    return rows[0]?.until ?? null;
  });
}

/** How long a session may live is the company's rule, read by the function itself (0039). */
export function startSession(
  identity: DbIdentity,
  session: { deviceLabel: string | null; secondFactor: boolean },
) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ id: string }>`
      select iam.start_session(${identity.userId}::uuid, ${session.deviceLabel},
                               ${session.secondFactor}) as id`.execute(db);
    return rows[0].id;
  });
}

/**
 * The session as the request path needs it, or null when it is over. Reading it also keeps it
 * alive, at most one write every five minutes (D-230).
 */
export function useSession(sessionId: string) {
  return runSignedOut(async (db) => {
    const { rows } = await sql<{
      user_id: string;
      second_factor_at: Date | null;
      expires_at: Date;
    }>`select * from iam.use_session(${sessionId}::uuid)`.execute(db);
    const row = rows[0];
    return row
      ? {
          userId: row.user_id,
          secondFactorAt: row.second_factor_at,
          expiresAt: row.expires_at,
        }
      : null;
  });
}

/** The second step was passed with a recovery code; the panel's own session records it (D-236). */
export function markSessionSecondFactor(identity: DbIdentity, sessionId: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ done: boolean | null }>`
      select iam.mark_session_second_factor(${sessionId}::uuid) as done`.execute(db);
    return rows[0]?.done === true;
  });
}

export function revokeSession(identity: DbIdentity, sessionId: string, reason: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ done: boolean | null }>`
      select iam.revoke_session(${sessionId}::uuid, ${reason}) as done`.execute(db);
    return rows[0]?.done === true;
  });
}

/** Every live session of one person, at once (REQ-IAM-006). */
export function revokeSessions(identity: DbIdentity, userId: string, reason: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ closed: number }>`
      select iam.revoke_sessions(${userId}::uuid, ${reason}) as closed`.execute(db);
    return Number(rows[0]?.closed ?? 0);
  });
}

/** Ten fresh codes replace whatever was left; only their hashes are stored (D-236). */
export function issueRecoveryCodes(identity: DbIdentity, userId: string, hashes: string[]) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ written: number }>`
      select iam.issue_recovery_codes(${userId}::uuid, ${hashes}::text[]) as written`.execute(db);
    return Number(rows[0]?.written ?? 0);
  });
}

/** Uses one code, once. False when it is unknown to this person or already spent. */
export function useRecoveryCode(identity: DbIdentity, hash: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ used: boolean | null }>`
      select iam.use_recovery_code(${identity.userId}::uuid, ${hash}) as used`.execute(db);
    return rows[0]?.used === true;
  });
}

export function recoveryCodesLeft(identity: DbIdentity, userId: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ left: number }>`
      select iam.recovery_codes_left(${userId}::uuid) as left`.execute(db);
    return Number(rows[0]?.left ?? 0);
  });
}
