import { sql } from "kysely";
import { describe, expect, it } from "vitest";

import { createRunAsUser, type PooledClient } from "./run-as-user";

const USER = "0192f0c1-0000-7000-8000-000000000001";
const ROLE = "0192f0c1-0000-7000-8000-000000000002";

function fakePool(fail: { on?: RegExp; rollback?: boolean } = {}) {
  const log: string[] = [];
  const releases: (boolean | Error | undefined)[] = [];
  const client: PooledClient = {
    async query(text, params) {
      log.push(params?.length ? `${text} ${JSON.stringify(params)}` : text);
      if (fail.rollback && text === "rollback") throw new Error("connection lost");
      if (fail.on?.test(text)) throw new Error("query failed");
      return { rows: [{ ok: 1 }] };
    },
    release(destroy) {
      releases.push(destroy);
    },
  };
  return { pool: { connect: async () => client }, log, releases };
}

describe("runAsUser (TASK-0101)", () => {
  it("writes the identity as the first statement, runs the work, commits and releases", async () => {
    const { pool, log, releases } = fakePool();
    const result = await createRunAsUser(pool)({ userId: USER, actingRoleId: ROLE }, async (db) => {
      await sql`select ${1} as ok`.execute(db);
      return "done";
    });
    expect(result).toBe("done");
    expect(log[0]).toBe("begin");
    expect(log[1]).toContain("set_config('app.user_id', $1, true)");
    expect(log[1]).toContain(JSON.stringify([USER, ROLE, "15s"]));
    expect(log[2]).toBe("select $1 as ok [1]");
    expect(log.at(-1)).toBe("commit");
    expect(releases).toEqual([undefined]);
  });

  it("writes an empty acting role instead of a string 'null'", async () => {
    const { pool, log } = fakePool();
    await createRunAsUser(pool)({ userId: USER, actingRoleId: null }, async () => {});
    expect(log[1]).toContain(JSON.stringify([USER, "", "15s"]));
  });

  it("rolls back and returns the connection when the work throws", async () => {
    const { pool, log, releases } = fakePool({ on: /^select \$1/ });
    await expect(
      createRunAsUser(pool)({ userId: USER, actingRoleId: null }, (db) =>
        sql`select ${1}`.execute(db),
      ),
    ).rejects.toThrow("query failed");
    expect(log.at(-1)).toBe("rollback");
    expect(log).not.toContain("commit");
    expect(releases).toEqual([undefined]);
  });

  it("destroys the connection when the rollback also fails", async () => {
    const { pool, releases } = fakePool({ on: /^select \$1/, rollback: true });
    await expect(
      createRunAsUser(pool)({ userId: USER, actingRoleId: null }, (db) =>
        sql`select ${1}`.execute(db),
      ),
    ).rejects.toThrow("query failed");
    expect(releases).toEqual([true]);
  });

  it("refuses an identity that is not a UUID before touching the pool", async () => {
    const { pool, log } = fakePool();
    await expect(
      createRunAsUser(pool)({ userId: "1' or '1'='1", actingRoleId: null }, async () => {}),
    ).rejects.toThrow(/not a UUID/);
    expect(log).toEqual([]);
  });

  it.each([
    ["its own transaction", "begin"],
    ["a commit", "COMMIT"],
    ["a session-level setting", "set search_path = public"],
    ["a role switch", "set local role postgres"],
    ["a reset", "reset all"],
  ])("blocks the work from sending %s", async (_label, statement) => {
    const { pool, log } = fakePool();
    await expect(
      createRunAsUser(pool)({ userId: USER, actingRoleId: null }, (db) =>
        sql.raw(statement).execute(db),
      ),
    ).rejects.toThrow(/not allowed inside runAsUser/);
    expect(log.at(-1)).toBe("rollback");
  });

  it("lets the work use transaction-scoped settings and savepoints", async () => {
    const { pool, log } = fakePool();
    await createRunAsUser(pool)({ userId: USER, actingRoleId: null }, async (db) => {
      await sql.raw("set local lock_timeout = '2s'").execute(db);
      await sql.raw("set constraints all deferred").execute(db);
      await sql.raw("savepoint a").execute(db);
      await sql.raw("rollback to savepoint a").execute(db);
    });
    expect(log.at(-1)).toBe("commit");
  });
});
