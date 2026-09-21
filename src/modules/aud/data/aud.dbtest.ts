/**
 * Record history and the audit log against the real database (TASK-0103, REQ-AUD, D-258).
 *
 * A throw-away module schema `zzt` with one tracked table stands in for product tables; its
 * permission types, two test roles and the test people are written over the admin connection
 * and removed afterwards, together with their history. Audit log rows cannot be removed by
 * design (AUD-K1), so each run leaves its "Deneme" events in the test environment's log.
 * `npm run test:db`.
 */
import { sql } from "kysely";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { checkLayers, purgeHistory } from "../../../../scripts/db-layers.mjs";
import { readDatabaseConfig } from "@/platform/db/database-config";
import { createRunAsUser } from "@/platform/db/run-as-user";
import { setChangeReason } from "@/platform/db/change-reason";

const id = (n: number) => `0192f0c1-0103-7000-8000-${String(n).padStart(12, "0")}`;
const OWNER = id(1);
const VIEWER_A = id(2);
const VIEWER_B = id(3);
const FINANCE_A = id(4);
const FULL = id(5);
const PEOPLE = [OWNER, VIEWER_A, VIEWER_B, FINANCE_A, FULL];
const SITE_A = id(101);
const SITE_B = id(102);
const ROLES = ["T0103_SITE", "T0103_FIN", "T0103_FULL", "T0103_OTHER"];
const P = "zzt";

let admin: pg.Client;
let pool: pg.Pool;
let runAsUser: ReturnType<typeof createRunAsUser>;
const role: Record<string, string> = {};

async function cleanUp() {
  const ids = "$1::uuid[]";
  const iamTables = [
    "role_assignment",
    "user_exception",
    "role_permission",
    "role_data_class",
    "role",
    "permission",
    "user",
  ];
  const { rows } = await admin.query(
    `select 'iam.role_assignment' as t, id from iam.role_assignment where user_id = any(${ids})
     union all select 'iam.user_exception', id from iam.user_exception where user_id = any(${ids})
     union all select 'iam.user', id from iam.user where id = any(${ids})
     union all select 'iam.role', id from iam.role where code = any($2)
     union all select 'iam.role_permission', rp.id from iam.role_permission rp
                join iam.role r on r.id = rp.role_id where r.code = any($2)
     union all select 'iam.role_data_class', d.id from iam.role_data_class d
                join iam.role r on r.id = d.role_id where r.code = any($2)
     union all select 'iam.permission', id from iam.permission where module = '${P}'`,
    [PEOPLE, ROLES],
  );
  for (const table of iamTables) {
    const tableIds = rows.filter((r) => r.t === `iam.${table}`).map((r) => r.id);
    if (tableIds.length)
      await admin.query("select aud.purge_record_history_for_reset($1, $2::uuid[])", [
        `iam.${table}`,
        tableIds,
      ]);
  }
  await admin.query(`delete from iam.user_exception where user_id = any(${ids})`, [PEOPLE]);
  await admin.query(`delete from iam.role_assignment where user_id = any(${ids})`, [PEOPLE]);
  await admin.query(`delete from iam.user where id = any(${ids})`, [PEOPLE]);
  await admin.query(
    `delete from iam.role_permission where role_id in (select id from iam.role where code = any($1))
        or permission_id in (select id from iam.permission where module = '${P}')`,
    [ROLES],
  );
  await admin.query(
    "delete from iam.role_data_class where role_id in (select id from iam.role where code = any($1))",
    [ROLES],
  );
  await admin.query("delete from iam.role where code = any($1)", [ROLES]);
  await admin.query(`delete from iam.permission where module = '${P}'`);
  await purgeHistory(admin, [`${P}.record`]);
  await admin.query(`
    drop schema if exists ${P} cascade;
    delete from core.column_data_class where schema_name = '${P}';
    delete from core.table_layer where schema_name = '${P}';`);
}

/** Runs one statement as a person, optionally with an acting role and a change reason. */
function as<T>(
  userId: string,
  query: string,
  { actingRoleId = null, reason }: { actingRoleId?: string | null; reason?: string } = {},
) {
  return runAsUser({ userId, actingRoleId }, async (db) => {
    if (reason) await setChangeReason(db, reason);
    const { rows } = await sql.raw<T>(query).execute(db);
    return rows;
  });
}

const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { hint?: string; code?: string }) => e.hint ?? e.code ?? "no code",
  );

type History = {
  operation: string;
  field: string | null;
  old_value: unknown;
  new_value: unknown;
  is_masked: boolean;
  reason: string | null;
  changed_in_role_id: string | null;
};

const historyAs = (userId: string, recordId: string) =>
  as<History>(
    userId,
    `select operation, field, old_value, new_value, is_masked, reason, changed_in_role_id
       from aud.history_of('${P}', 'record', '${recordId}')`,
  );

let recordId: string;
/** Audit rows of earlier runs stay (AUD-K1); assertions look only at this run's rows. */
let startedAt: Date;

beforeAll(async () => {
  admin = await connectAdmin();
  pool = new pg.Pool(readDatabaseConfig());
  runAsUser = createRunAsUser(pool);
  await cleanUp();
  startedAt = (await admin.query("select clock_timestamp() as t")).rows[0].t;

  await admin.query(`
    create schema ${P};
    create table ${P}.record (
      id uuid primary key default core.uuid_v7(),
      site_id uuid not null,
      price numeric(18,2),
      note text,
      created_by_user_id uuid default core.current_user_id(),
      updated_at timestamptz not null default now()
    );
    create trigger record_history after insert or update on ${P}.record
      for each row execute function aud.capture_history();
    alter table ${P}.record enable row level security;
    create policy record_all on ${P}.record for all to geoges_app using (true) with check (true);
    grant usage on schema ${P} to geoges_app;
    grant select, insert, update on ${P}.record to geoges_app;
    insert into core.column_data_class values ('${P}', 'record', 'price', 'commercial');
    insert into core.table_layer (schema_name, table_name, layer, history)
      values ('${P}', 'record', 'business', 'tracked');

    insert into iam.permission (code, module, name, created_from) values
      ('${P}.module.view', '${P}', 'Deneme: görür', 'seed'),
      ('${P}.record.view', '${P}', 'Deneme kaydı: görür', 'seed');
    insert into iam.role (code, name, level) values
      ('T0103_SITE', 'Deneme şantiye', 10), ('T0103_FIN', 'Deneme finans', 10),
      ('T0103_OTHER', 'Deneme diğer', 10);
    insert into iam.role (code, name, level, has_full_visibility)
      values ('T0103_FULL', 'Deneme tam görünürlük', 10, true);
    insert into iam.role_permission (role_id, permission_id)
      select r.id, p.id from iam.role r, iam.permission p
       where r.code in ('T0103_SITE', 'T0103_FIN') and p.code = '${P}.module.view';
    insert into iam.role_data_class (role_id, module, can_see_commercial)
      select id, '${P}', true from iam.role where code = 'T0103_FIN';
  `);
  const { rows } = await admin.query("select code, id from iam.role");
  for (const r of rows) role[r.code] = r.id;

  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id)
     select u.id, 't0103-' || u.n || '@example.test', 'Deneme ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  const assign = (user: string, code: string, site: string | null) =>
    admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
       values ($1, $2, $3, $4, iam.today() - 1)`,
      [user, role[code], site ? "site" : "company", site ? [site] : []],
    );
  await assign(OWNER, "SAH", null);
  await assign(VIEWER_A, "T0103_SITE", SITE_A);
  await assign(VIEWER_B, "T0103_SITE", SITE_B);
  await assign(FINANCE_A, "T0103_FIN", SITE_A);
  await assign(FULL, "T0103_FULL", null);

  const [created] = await as<{ id: string }>(
    VIEWER_A,
    `insert into ${P}.record (site_id, price, note) values ('${SITE_A}', 100, 'ilk')
     returning id`,
    { reason: "ilk kayıt", actingRoleId: role.T0103_SITE },
  );
  recordId = created.id;
  await as(
    VIEWER_A,
    `update ${P}.record set price = 120, note = 'düzeltildi' where id = '${recordId}'`,
    {
      reason: "ölçü düzeltmesi",
      actingRoleId: role.T0103_SITE,
    },
  );
});

afterAll(async () => {
  await pool?.end();
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("record history (REQ-AUD-001, REQ-AUD-004)", () => {
  it("writes one row on insert and one per changed field, with reason and acting role", async () => {
    // One statement's field rows share a timestamp; their order among themselves is not fixed.
    const rows = (await historyAs(FINANCE_A, recordId)).sort((a, b) =>
      (a.field ?? "").localeCompare(b.field ?? ""),
    );
    expect(rows.map((r) => [r.operation, r.field])).toEqual([
      ["insert", null],
      ["update", "note"],
      ["update", "price"],
    ]);
    expect(rows.map((r) => r.reason)).toEqual(["ilk kayıt", "ölçü düzeltmesi", "ölçü düzeltmesi"]);
    expect(new Set(rows.map((r) => r.changed_in_role_id))).toEqual(new Set([role.T0103_SITE]));
    const price = rows.find((r) => r.field === "price");
    expect([price?.old_value, price?.new_value, price?.is_masked]).toEqual([100, 120, false]);
  });

  it("shows a commercial value only as 'changed' to someone without the right", async () => {
    const rows = await historyAs(VIEWER_A, recordId);
    const price = rows.find((r) => r.field === "price");
    expect([price?.old_value, price?.new_value, price?.is_masked]).toEqual([null, null, true]);
    const note = rows.find((r) => r.field === "note");
    expect([note?.old_value, note?.new_value]).toEqual(["ilk", "düzeltildi"]);
  });

  it("shows the history only to those who may see the record's site", async () => {
    expect(await historyAs(VIEWER_B, recordId)).toEqual([]);
    expect((await historyAs(OWNER, recordId)).length).toBe(3);
  });

  it("gives the runtime role no direct way into the history table", async () => {
    expect(await errorOf(as(VIEWER_A, "select * from aud.record_history"))).toBe("42501");
    expect(
      await errorOf(
        as(
          VIEWER_A,
          `insert into aud.record_history (record_schema, record_table, record_id, operation)
           values ('x', 'y', '${recordId}', 'insert')`,
        ),
      ),
    ).toBe("42501");
  });

  it("keeps a tracked table without the history trigger out of the database", async () => {
    await admin.query("begin");
    try {
      await admin.query(`drop trigger record_history on ${P}.record`);
      await expect(checkLayers(admin)).rejects.toThrow(
        /zzt.record is tracked but has no record_history trigger/,
      );
    } finally {
      await admin.query("rollback");
    }
  });
});

describe("audit log (REQ-AUD-005, REQ-AUD-006, REQ-IAM-008)", () => {
  it("records role assignments and sign-ins with the acting person", async () => {
    await as(VIEWER_A, "select iam.note_session('signed_in')");
    const { rows } = await admin.query(
      `select event_type, actor_user_id from aud.audit_log
        where ((target_table = 'role_assignment' and payload ->> 'user_id' = $1::text)
            or (event_type = 'user.signed_in' and actor_user_id = $1::uuid))
          and occurred_at >= $2
        order by occurred_at`,
      [VIEWER_A, startedAt],
    );
    expect(rows.map((r) => r.event_type)).toEqual(["role_assignment.created", "user.signed_in"]);
    expect(rows[1].actor_user_id).toBe(VIEWER_A);
  });

  it("cannot be changed or deleted by anyone, owners and the admin connection included", async () => {
    const [row] = (await admin.query("select id from aud.audit_log limit 1")).rows;
    expect(
      await errorOf(
        admin.query(`update aud.audit_log set event_type = 'x.y' where id = '${row.id}'`),
      ),
    ).toBe("aud.append_only");
    expect(await errorOf(admin.query(`delete from aud.audit_log where id = '${row.id}'`))).toBe(
      "aud.append_only",
    );
    expect(await errorOf(admin.query("truncate aud.audit_log"))).toBe("aud.append_only");
    expect(await errorOf(admin.query("delete from aud.record_history"))).toBe("aud.append_only");
  });

  it("opens the audit screen's page only to the owner layer", async () => {
    const page = (userId: string) =>
      as<{ event_type: string; total: string }>(
        userId,
        "select event_type, total from aud.audit_log_page(p_event_prefix => 'user.', p_limit => 5)",
      );
    expect(await errorOf(page(VIEWER_A))).toBe("42501");
    expect(await errorOf(page(FULL))).toBe("42501");
    const rows = await page(OWNER);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.event_type.startsWith("user."))).toBe(true);
    expect(Number(rows[0].total)).toBeGreaterThanOrEqual(rows.length);
  });

  it("refuses the audit permission to any role outside the owner layer and to exceptions", async () => {
    const toRole = admin.query(
      `insert into iam.role_permission (role_id, permission_id)
       select '${role.T0103_OTHER}', id from iam.permission where code = 'aud.audit-log.view'`,
    );
    expect(await errorOf(toRole)).toBe("aud.audit_owner_only");
    const byException = admin.query(
      `insert into iam.user_exception (user_id, target, effect, reason)
       values ('${VIEWER_A}', 'aud', 'grant', 'deneme')`,
    );
    expect(await errorOf(byException)).toBe("aud.audit_owner_only");
  });
});

describe("resets (D-258)", () => {
  it("removes the history of emptied tables and keeps the audit log", async () => {
    const events = async () =>
      Number((await admin.query("select count(*) from aud.audit_log")).rows[0].count);
    const before = await events();
    await admin.query("begin");
    try {
      const removed = await purgeHistory(admin, [`${P}.record`]);
      expect(removed).toBe(3);
      expect(await events()).toBe(before);
    } finally {
      await admin.query("rollback");
    }
  });
});
