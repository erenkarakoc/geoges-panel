/**
 * The data access foundation against the real database (TASK-0101, ADR-015 Phase 07 conditions).
 *
 * Runs as the restricted runtime role through the transaction pooler with the certificate
 * verified. A throw-away schema with one RLS-protected table stands in for product tables; it
 * is created and dropped over the admin connection. `npm run test:db`; not part of CI.
 */
import { rootCertificates } from "node:tls";

import { sql, type Generated } from "kysely";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../scripts/db-admin.mjs";
import { readDatabaseConfig } from "./database-config";
import { createRunAsUser } from "./run-as-user";

const PROBE = "t0101_probe";
const USER_A = "0192f0c1-0000-7000-8000-00000000000a";
const USER_B = "0192f0c1-0000-7000-8000-00000000000b";

interface ProbeDb {
  "t0101_probe.note": { id: Generated<string>; owner_user_id: string; body: string };
}

let admin: pg.Client;
let pool: pg.Pool;
let runAsUser: ReturnType<typeof createRunAsUser>;

beforeAll(async () => {
  admin = await connectAdmin();
  await admin.query(`
    drop schema if exists ${PROBE} cascade;
    create schema ${PROBE};
    create table ${PROBE}.note (
      id uuid primary key default core.uuid_v7(),
      owner_user_id uuid not null,
      body text not null
    );
    alter table ${PROBE}.note enable row level security;
    create policy note_read on ${PROBE}.note for select to geoges_app
      using (owner_user_id = (select core.current_user_id()));
    create policy note_write on ${PROBE}.note for insert to geoges_app
      with check (owner_user_id = (select core.current_user_id()));
    create policy note_change on ${PROBE}.note for update to geoges_app
      using (owner_user_id = (select core.current_user_id()))
      with check (owner_user_id = (select core.current_user_id()));
    grant usage on schema ${PROBE} to geoges_app;
    grant select, insert, update on ${PROBE}.note to geoges_app;
    insert into ${PROBE}.note (owner_user_id, body)
      values ('${USER_A}', 'a1'), ('${USER_A}', 'a2'), ('${USER_B}', 'b1');
  `);
  pool = new pg.Pool(readDatabaseConfig());
  runAsUser = createRunAsUser(pool);
});

afterAll(async () => {
  await pool?.end();
  await admin?.query(`drop schema if exists ${PROBE} cascade`);
  await admin?.end();
});

const errorCode = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { code?: string }) => e.code ?? "no code",
  );

describe("connection", () => {
  it("logs in as the runtime role with the certificate verified", async () => {
    const { rows } = await pool.query("select current_user as who");
    expect(rows[0].who).toBe("geoges_app");
  });

  it("refuses a server whose certificate does not chain to the pinned root", async () => {
    const config = readDatabaseConfig();
    const wrong = new pg.Client({
      ...config,
      ssl: { ...(config.ssl as object), ca: rootCertificates.slice(0, 5).join("\n") },
    });
    const code = await errorCode(wrong.connect());
    await wrong.end().catch(() => {});
    expect(code).toMatch(/CERT|UNABLE_TO_VERIFY/);
  });

  it("has no privileges beyond logging in", async () => {
    const { rows } = await admin.query(
      `select rolsuper, rolbypassrls, rolcreaterole, rolcreatedb, rolinherit, rolreplication,
              (select count(*)::int from pg_auth_members m where m.member = r.oid) as memberships
         from pg_roles r where rolname = 'geoges_app'`,
    );
    expect(rows[0]).toEqual({
      rolsuper: false,
      rolbypassrls: false,
      rolcreaterole: false,
      rolcreatedb: false,
      rolinherit: false,
      rolreplication: false,
      memberships: 0,
    });
  });
});

describe("identity is transaction-local", () => {
  it("sees no row and may write none without an identity", async () => {
    const { rows } = await pool.query(
      `select core.current_user_id() as uid, (select count(*)::int from ${PROBE}.note) as n`,
    );
    expect(rows[0]).toEqual({ uid: null, n: 0 });
    expect(
      await errorCode(
        pool.query(`insert into ${PROBE}.note (owner_user_id, body) values ($1, 'x')`, [USER_A]),
      ),
    ).toBe("42501");
  });

  it("sees and writes only the signed-in user's rows", async () => {
    const bodies = await runAsUser<ProbeDb, string[]>(
      { userId: USER_A, actingRoleId: null },
      async (db) => {
        const rows = await db
          .selectFrom("t0101_probe.note")
          .select("body")
          .orderBy("body")
          .execute();
        return rows.map((r) => r.body);
      },
    );
    expect(bodies).toEqual(["a1", "a2"]);

    const code = await errorCode(
      runAsUser<ProbeDb, unknown>({ userId: USER_A, actingRoleId: null }, (db) =>
        db
          .insertInto("t0101_probe.note")
          .values({ owner_user_id: USER_B, body: "forged" })
          .execute(),
      ),
    );
    expect(code).toBe("42501");
  });

  it("never lets one request's identity reach another under concurrency", async () => {
    const users = Array.from({ length: 40 }, (_, i) => (i % 2 ? USER_A : USER_B));
    const seen = await Promise.all(
      users.map((userId) =>
        runAsUser<ProbeDb, { uid: string; owners: string[] }>(
          { userId, actingRoleId: null },
          async (db) => {
            const { rows } = await sql<{
              uid: string;
            }>`select core.current_user_id() as uid`.execute(db);
            await sql`select pg_sleep(0.01)`.execute(db);
            const owners = await db
              .selectFrom("t0101_probe.note")
              .select("owner_user_id")
              .execute();
            return { uid: rows[0].uid, owners: [...new Set(owners.map((o) => o.owner_user_id))] };
          },
        ),
      ),
    );
    seen.forEach((s, i) => {
      expect(s.uid).toBe(users[i]);
      expect(s.owners).toEqual([users[i]]);
    });
    const after = await Promise.all(
      Array.from({ length: 20 }, () =>
        pool.query(
          "select core.current_user_id() as uid, current_setting('statement_timeout') as t",
        ),
      ),
    );
    for (const r of after) expect(r.rows[0].uid).toBeNull();
    for (const r of after) expect(r.rows[0].t).not.toBe("15s");
  });

  it("rolls back everything when the work fails", async () => {
    await expect(
      runAsUser<ProbeDb, void>({ userId: USER_A, actingRoleId: null }, async (db) => {
        await db
          .insertInto("t0101_probe.note")
          .values({ owner_user_id: USER_A, body: "lost" })
          .execute();
        throw new Error("work failed");
      }),
    ).rejects.toThrow("work failed");
    const { rows } = await admin.query(
      `select count(*)::int as n from ${PROBE}.note where body = 'lost'`,
    );
    expect(rows[0].n).toBe(0);
  });

  it("treats SQL inside a bound value as plain text", async () => {
    const payload = `x'); delete from ${PROBE}.note; --`;
    await runAsUser<ProbeDb, void>({ userId: USER_A, actingRoleId: null }, async (db) => {
      await db
        .insertInto("t0101_probe.note")
        .values({ owner_user_id: USER_A, body: payload })
        .execute();
    });
    const { rows } = await admin.query(`select body from ${PROBE}.note order by body`);
    expect(rows.map((r) => r.body)).toEqual(["a1", "a2", "b1", payload]);
  });
});

describe("what the runtime role may not do", () => {
  it.each([
    ["delete a row", `delete from ${PROBE}.note`],
    [
      "write the migration ledger",
      "insert into core.schema_migration (name, checksum) values ('x', 'x')",
    ],
    ["read the migration ledger", "select * from core.schema_migration"],
    ["create a table in core", "create table core.x (id int)"],
    ["create a table in public", "create table public.x (id int)"],
    ["switch to the admin role", "set role postgres"],
    ["read Supabase Auth users", "select * from auth.users"],
    ["create a role", "create role x"],
  ])("cannot %s", async (_label, statement) => {
    expect(await errorCode(pool.query(statement))).toBe("42501");
  });

  it("gives the PostgREST roles nothing in core", async () => {
    const { rows } = await admin.query(`
      select r.role,
             has_schema_privilege(r.role, 'core', 'usage') as schema_usage,
             has_function_privilege(r.role, 'core.current_user_id()', 'execute') as identity_fn,
             has_table_privilege(r.role, 'core.schema_migration', 'select') as ledger
        from (values ('anon'), ('authenticated')) as r(role)`);
    for (const row of rows) {
      expect(row).toMatchObject({ schema_usage: false, identity_fn: false, ledger: false });
    }
  });
});

describe("core.uuid_v7()", () => {
  it("makes version 7 ids that sort by creation time", async () => {
    const { rows } = await pool.query(
      "select core.uuid_v7()::text as a, pg_sleep(0.005), core.uuid_v7()::text as b",
    );
    const { a, b } = rows[0];
    expect(a[14]).toBe("7");
    expect(["8", "9", "a", "b"]).toContain(a[19]);
    expect(a < b).toBe(true);
    const millis = parseInt(a.replace(/-/g, "").slice(0, 12), 16);
    expect(Math.abs(Date.now() - millis)).toBeLessThan(5 * 60_000);
  });
});
