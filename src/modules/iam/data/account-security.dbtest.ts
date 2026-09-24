/**
 * Account security against the real database (TASK-0112, D-230, D-236, D-272; migration 0038).
 *
 * The lock, the panel's own session and the recovery codes are asked exactly as request code asks
 * them: the sign-in path through the identity-less runner, everything after it as the person.
 * People are written over the admin connection with fixed ids and removed afterwards.
 * `npm run test:db`.
 */
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../../scripts/db-test-people.mjs";
import { readDatabaseConfig } from "@/platform/db/database-config";
import { createRunAsUser } from "@/platform/db/run-as-user";
import { createRunSignedOut } from "@/platform/db/run-signed-out";

const id = (n: number) => `0192f0c1-0112-7000-8000-${String(n).padStart(12, "0")}`;
const PERSON = id(1);
const OTHER = id(2);
const PEOPLE = [PERSON, OTHER];
const mail = (n: number) => `t0112-${n}@example.test`;
const MANAGER_ROLE = "T0112_MGR";
/** The company's own settings, which the functions read for themselves (seed 0007, 0039). */
const LIMIT = 5;

let admin: pg.Client;
let pool: pg.Pool;

/** The hash shape the store writes: sixty-four hex characters (0038 checks it). */
const hash = (seed: string) =>
  seed
    .padEnd(64, "0")
    .slice(0, 64)
    .replaceAll(/[^0-9a-f]/g, "a");

async function cleanUp() {
  await admin.query("delete from iam.session where user_id = any($1::uuid[])", [PEOPLE]);
  await admin.query("delete from iam.recovery_code where user_id = any($1::uuid[])", [PEOPLE]);
  await admin.query("delete from iam.login_attempt where email = any($1::text[])", [
    [mail(1), mail(2)],
  ]);
  // The audit log is append-only by design, so the events this suite writes about its own
  // throw-away addresses stay; the assertions below read only what this run wrote.
  // Assignments first: a role with one pointing at it cannot be deleted.
  await admin.query(
    `delete from iam.role_assignment
      where role_id in (select id from iam.role where code = '${MANAGER_ROLE}')`,
  );
  await admin.query(
    `delete from iam.role_permission
      where role_id in (select id from iam.role where code = '${MANAGER_ROLE}')`,
  );
  await admin.query(`delete from iam.role where code = '${MANAGER_ROLE}'`);
  await releaseTestPeople(admin, PEOPLE);
  await admin.query("select aud.purge_record_history_for_reset('iam.user', $1::uuid[])", [PEOPLE]);
  await admin.query("delete from iam.user where id = any($1::uuid[])", [PEOPLE]);
}

beforeAll(async () => {
  admin = await connectAdmin();
  pool = new pg.Pool(readDatabaseConfig());
  await cleanUp();
  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id)
     select u.id, 't0112-' || u.n || '@example.test', 'Deneme güvenlik ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  // One of the two may manage users; the other is an ordinary person (0040, 0041).
  await admin.query(`
    insert into iam.role (code, name, level) values ('${MANAGER_ROLE}', 'Deneme kullanıcı yön.', 20);
    insert into iam.role_permission (role_id, permission_id)
      select r.id, p.id from iam.role r, iam.permission p
       where r.code = '${MANAGER_ROLE}' and p.code = 'iam.module.manage';
  `);
  await admin.query(
    `insert into iam.role_assignment (user_id, role_id, scope_type, starts_on)
     select $1, id, 'company', iam.today() - 1 from iam.role where code = '${MANAGER_ROLE}'`,
    [OTHER],
  );
});

afterAll(async () => {
  if (admin) {
    await cleanUp();
    await admin.end();
  }
  await pool?.end();
});

/** The database's own clock: comparing its rows to this machine's clock is a race. */
const dbNow = async () => (await admin.query<{ t: Date }>("select now() as t")).rows[0].t;
const runAsUser = () => createRunAsUser({ connect: () => pool.connect() });
const runSignedOut = () => createRunSignedOut({ connect: () => pool.connect() });
const as = (userId: string) => ({ userId, actingRoleId: null });

describe("the sign-in lock (REQ-IAM-005)", () => {
  const store = async () => await import("./account-security-store");

  it("locks after the limit and reports the same lock while it lasts", async () => {
    const startedAt = await dbNow();
    const { loginLock, noteLoginAttempt } = await store();
    expect(await loginLock(mail(1))).toBeNull();
    const attempt = (succeeded: boolean) =>
      noteLoginAttempt({ email: mail(1), succeeded, ip: "127.0.0.1", userAgent: "deneme" });

    for (let n = 1; n < LIMIT; n += 1) expect(await attempt(false)).toBeNull();
    const locked = await attempt(false);
    expect(locked?.endsAt).toBeInstanceOf(Date);
    // The wait is measured by the database, which owns the lock: near a quarter of an hour, and
    // not a number that depends on this machine's clock.
    expect(locked!.remainingMs).toBeGreaterThan(14 * 60_000);
    expect(locked!.remainingMs).toBeLessThanOrEqual(15 * 60_000);
    // Knocking again neither extends the lock nor clears it.
    const again = await attempt(false);
    expect(again?.endsAt.getTime()).toBe(locked?.endsAt.getTime());
    expect((await loginLock(mail(1)))?.endsAt.getTime()).toBe(locked?.endsAt.getTime());

    // The lock is the audit log's business too, with no actor: nobody is signed in yet.
    const { rows } = await admin.query(
      `select actor_user_id, payload->>'email' as email, payload->>'failures' as failures
         from aud.audit_log where event_type = 'sign_in.locked' and payload->>'email' = $1
          and occurred_at >= $2 order by occurred_at desc`,
      [mail(1), startedAt],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actor_user_id: null,
      email: mail(1),
      failures: String(LIMIT),
    });
  });

  it("counts from the last success, so an old failure does not add up", async () => {
    const { noteLoginAttempt } = await store();
    const attempt = (succeeded: boolean) =>
      noteLoginAttempt({ email: mail(2), succeeded, ip: null, userAgent: null });
    // Fail up to one short of the limit, then succeed: the count starts over.
    for (let n = 1; n < LIMIT; n += 1) expect(await attempt(false)).toBeNull();
    expect(await attempt(true)).toBeNull();
    for (let n = 1; n < LIMIT; n += 1) expect(await attempt(false)).toBeNull();
    expect((await attempt(false))?.endsAt).toBeInstanceOf(Date);
  });

  it("is closed to the application: only its functions answer", async () => {
    // Not a policy that returns nothing — no privilege at all, so the table cannot be read even
    // by a signed-in person with every permission the panel has.
    await expect(
      runSignedOut()(async (db) => {
        const { sql } = await import("kysely");
        return sql`select count(*) from iam.login_attempt`.execute(db);
      }),
    ).rejects.toThrow("permission denied for table login_attempt");
  });
});

describe("the panel's own session (D-230, REQ-IAM-006)", () => {
  const store = async () => await import("./account-security-store");

  it("lives until its day, its idle window or its revocation", async () => {
    const { startSession, touchSession, revokeSession } = await store();
    const sessionId = await startSession(as(PERSON), {
      deviceLabel: "deneme cihaz",
      secondFactor: false,
    });
    const live = await touchSession(sessionId);
    expect(live).toMatchObject({ userId: PERSON, secondFactorAt: null });

    // Idle for longer than the window: the same row no longer answers.
    await admin.query(
      "update iam.session set last_seen_at = now() - interval '4 days' where id = $1",
      [sessionId],
    );
    expect(await touchSession(sessionId)).toBeNull();
    await admin.query("update iam.session set last_seen_at = now() where id = $1", [sessionId]);
    expect(await touchSession(sessionId)).not.toBeNull();

    // Past its day, whatever its last use. A session may not be born expired — the constraint
    // says so — so the simulation moves its birth back with it.
    await admin.query(
      `update iam.session set created_at = now() - interval '31 days',
                              expires_at = now() - interval '1 hour' where id = $1`,
      [sessionId],
    );
    expect(await touchSession(sessionId)).toBeNull();
    await admin.query(
      `update iam.session set created_at = now(), expires_at = now() + interval '30 days'
        where id = $1`,
      [sessionId],
    );

    expect(await revokeSession(as(PERSON), sessionId, "signed_out")).toBe(true);
    expect(await touchSession(sessionId)).toBeNull();
    // Revoking twice changes nothing, and the row is kept with its reason.
    expect(await revokeSession(as(PERSON), sessionId, "signed_out")).toBe(false);
    const { rows } = await admin.query(
      "select revoked_reason, device_label from iam.session where id = $1",
      [sessionId],
    );
    expect(rows[0]).toMatchObject({ revoked_reason: "signed_out", device_label: "deneme cihaz" });
  });

  it("writes the last use at most every five minutes", async () => {
    const { startSession, touchSession } = await store();
    const sessionId = await startSession(as(PERSON), {
      deviceLabel: null,
      secondFactor: true,
    });
    const seenAt = async () =>
      (await admin.query("select last_seen_at from iam.session where id = $1", [sessionId])).rows[0]
        .last_seen_at as Date;
    const first = await seenAt();
    await touchSession(sessionId);
    expect((await seenAt()).getTime()).toBe(first.getTime());

    await admin.query(
      "update iam.session set last_seen_at = now() - interval '6 minutes' where id = $1",
      [sessionId],
    );
    await touchSession(sessionId);
    expect((await seenAt()).getTime()).toBeGreaterThan(first.getTime() - 60_000);
  });

  it("closes every session of an account the moment it is disabled", async () => {
    const { startSession, touchSession } = await store();
    const one = await startSession(as(OTHER), { deviceLabel: null, secondFactor: true });
    const two = await startSession(as(OTHER), { deviceLabel: null, secondFactor: true });
    await admin.query("update iam.user set status = 'disabled' where id = $1", [OTHER]);
    try {
      expect(await touchSession(one)).toBeNull();
      expect(await touchSession(two)).toBeNull();
      const { rows } = await admin.query(
        "select distinct revoked_reason from iam.session where user_id = $1",
        [OTHER],
      );
      expect(rows).toEqual([{ revoked_reason: "account_disabled" }]);
    } finally {
      await admin.query("update iam.user set status = 'active' where id = $1", [OTHER]);
    }
  });

  it("shows a person their own sessions and nobody else's", async () => {
    const { startSession } = await store();
    await startSession(as(PERSON), { deviceLabel: "kendi", secondFactor: true });
    await startSession(as(OTHER), { deviceLabel: "başkası", secondFactor: true });
    const mine = await runAsUser()(as(PERSON), async (db) => {
      const { sql } = await import("kysely");
      const { rows } = await sql<{
        user_id: string;
      }>`select user_id from iam.session`.execute(db);
      return rows;
    });
    expect(mine.length).toBeGreaterThan(0);
    expect([...new Set(mine.map((row) => row.user_id))]).toEqual([PERSON]);
  });

  it("marks the second step the panel passed itself, once", async () => {
    const { startSession, touchSession, markSessionSecondFactor } = await store();
    const sessionId = await startSession(as(PERSON), {
      deviceLabel: null,
      secondFactor: false,
    });
    expect(await markSessionSecondFactor(as(PERSON), sessionId)).toBe(true);
    expect((await touchSession(sessionId))?.secondFactorAt).toBeInstanceOf(Date);
    // Already marked: nothing to do and no second timestamp.
    expect(await markSessionSecondFactor(as(PERSON), sessionId)).toBe(false);
  });
});

describe("recovery codes (D-236)", () => {
  const store = async () => await import("./account-security-store");

  it("spends a code once, and only its owner's", async () => {
    const { issueRecoveryCodes, spendRecoveryCode, recoveryCodesLeft } = await store();
    const codes = ["1", "2", "3"].map((n) => hash(`code${n}`));
    expect(await issueRecoveryCodes(as(PERSON), PERSON, codes)).toBe(3);
    expect(await recoveryCodesLeft(as(PERSON), PERSON)).toBe(3);

    expect(await spendRecoveryCode(as(PERSON), codes[0])).toBe(true);
    expect(await spendRecoveryCode(as(PERSON), codes[0])).toBe(false);
    expect(await recoveryCodesLeft(as(PERSON), PERSON)).toBe(2);

    // Another person's code is nobody else's key, even though the hash is known.
    expect(await spendRecoveryCode(as(OTHER), codes[1])).toBe(false);
    expect(await recoveryCodesLeft(as(PERSON), PERSON)).toBe(2);
    // A code that was never issued does not open anything either.
    expect(await spendRecoveryCode(as(PERSON), hash("elsewhere"))).toBe(false);
  });

  it("replaces what was left when new codes are issued", async () => {
    const { issueRecoveryCodes, spendRecoveryCode, recoveryCodesLeft } = await store();
    const old = [hash("old1"), hash("old2")];
    await issueRecoveryCodes(as(PERSON), PERSON, old);
    const fresh = [hash("new1"), hash("new2")];
    expect(await issueRecoveryCodes(as(PERSON), PERSON, fresh)).toBe(2);
    expect(await recoveryCodesLeft(as(PERSON), PERSON)).toBe(2);
    expect(await spendRecoveryCode(as(PERSON), old[0])).toBe(false);
    expect(await spendRecoveryCode(as(PERSON), fresh[0])).toBe(true);
  });

  it("never lets the application read a hash", async () => {
    await expect(
      runAsUser()(as(PERSON), async (db) => {
        const { sql } = await import("kysely");
        return sql`select count(*) from iam.recovery_code`.execute(db);
      }),
    ).rejects.toThrow("permission denied for table recovery_code");
  });
});

describe("the second-factor flag (TASK-0112, D-236; 0040, 0041)", () => {
  const store = async () => await import("./account-security-store");
  const flagOf = async (userId: string) =>
    (await admin.query("select must_setup_2fa from iam.user where id = $1", [userId])).rows[0]
      .must_setup_2fa as boolean;

  it("follows the provider for the person themselves, and says so in the audit log", async () => {
    const { noteSecondFactor } = await store();
    const startedAt = await dbNow();
    expect(await noteSecondFactor(as(PERSON), PERSON, true)).toBe(true);
    expect(await flagOf(PERSON)).toBe(false);
    expect(await noteSecondFactor(as(PERSON), PERSON, false)).toBe(true);
    expect(await flagOf(PERSON)).toBe(true);

    const { rows } = await admin.query(
      `select event_type, actor_user_id, payload->>'by' as by from aud.audit_log
        where target_id = $1 and occurred_at >= $2 order by occurred_at`,
      [PERSON, startedAt],
    );
    expect(rows.map((row) => [row.event_type, row.by])).toEqual([
      ["two_factor.enrolled", "self"],
      ["two_factor.reset", "self"],
    ]);
    expect(rows.every((row) => row.actor_user_id === PERSON)).toBe(true);
  });

  it("lets a user manager reset somebody else and tells the owner layer", async () => {
    const { noteSecondFactor } = await store();
    const startedAt = await dbNow();
    expect(await noteSecondFactor(as(OTHER), PERSON, false)).toBe(true);
    expect(await flagOf(PERSON)).toBe(true);

    const { rows: audited } = await admin.query(
      `select payload->>'by' as by, actor_user_id from aud.audit_log
        where target_id = $1 and event_type = 'two_factor.reset' and occurred_at >= $2`,
      [PERSON, startedAt],
    );
    expect(audited).toEqual([{ by: "manager", actor_user_id: OTHER }]);

    // The notification itself is TSK's business, so IAM only puts the event on the outbox (0041).
    const { rows: published } = await admin.query(
      `select payload->>'by' as by, payload->>'actor_user_id' as actor from core.outbox
        where event_code = 'two_factor.reset' and record_id = $1 and occurred_at >= $2`,
      [PERSON, startedAt],
    );
    expect(published).toEqual([{ by: "manager", actor: OTHER }]);
  });

  it("refuses somebody with no right over the account, and publishes nothing", async () => {
    const { noteSecondFactor } = await store();
    const startedAt = await dbNow();
    await expect(noteSecondFactor(as(PERSON), OTHER, false)).rejects.toMatchObject({
      code: "42501",
    });
    const { rows } = await admin.query(
      `select count(*)::int as n from core.outbox
        where event_code = 'two_factor.reset' and record_id = $1 and occurred_at >= $2`,
      [OTHER, startedAt],
    );
    expect(rows[0].n).toBe(0);
  });

  it("does not invent an account: an unknown id changes nothing", async () => {
    const { noteSecondFactor } = await store();
    expect(await noteSecondFactor(as(OTHER), id(99), false)).toBe(false);
  });
});

describe("roles that must use a second factor (REQ-IAM-003; 0042)", () => {
  const store = async () => await import("./account-security-store");

  it("says no while the administrator's list is empty", async () => {
    const { secondFactorRequired } = await store();
    expect(await secondFactorRequired(as(OTHER))).toBe(false);
    expect(await secondFactorRequired(as(PERSON))).toBe(false);
  });

  it("says yes for somebody carrying a role on the list", async () => {
    // A rule row is immutable once written, so the list is set inside a transaction that is rolled
    // back: the environment's real configuration is never touched. The function reads the rule and
    // the person's own assignments, so both are visible here.
    await admin.query("begin");
    try {
      await admin.query(
        `insert into adm.rule (rule_key_id, valid_from, value, reason)
         select id, iam.today(), $1::jsonb, 'Test: iki adımlı zorunlu roller'
           from adm.rule_key where key = 'iam.two-factor-roles'`,
        [JSON.stringify([MANAGER_ROLE])],
      );
      const asks = async (userId: string) => {
        await admin.query("select set_config('app.user_id', $1, true)", [userId]);
        const { rows } = await admin.query<{ required: boolean }>(
          "select iam.second_factor_required() as required",
        );
        return rows[0].required;
      };
      // OTHER carries that role; PERSON does not.
      expect(await asks(OTHER)).toBe(true);
      expect(await asks(PERSON)).toBe(false);
    } finally {
      await admin.query("rollback");
    }
  });

  it("leaves the configuration as it was", async () => {
    const { rows } = await admin.query(
      `select count(*)::int as n from adm.rule r join adm.rule_key k on k.id = r.rule_key_id
        where k.key = 'iam.two-factor-roles'`,
    );
    expect(rows[0].n).toBe(1);
  });
});
