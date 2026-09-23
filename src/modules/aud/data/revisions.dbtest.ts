/**
 * Revision requests against the real database (TASK-0109, REQ-AUD-007…010, D-265).
 *
 * A throw-away module schema `zzr` stands in for a module that owns records: its table locks an
 * approved row with its own guard, its record type is written into the register, and a test
 * applier carries an approved request out and writes the correction entry. People, roles and
 * the schema are removed afterwards; audit log rows stay by design (AUD-K1). `npm run test:db`.
 */
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../../scripts/db-test-people.mjs";
import { purgeHistory } from "../../../../scripts/db-layers.mjs";

import { createRevisionService, type RevisionApplier } from "../application/revisions";
import { buildChanges, REVISION_RULE_MESSAGES, stillCurrent } from "../domain/revisions";
import { readRevisableType, type DbIdentity } from "./revision-store";

const id = (n: number) => `0192f0c1-0109-7000-8000-${String(n).padStart(12, "0")}`;
const WORKER_A = id(1);
const MANAGER_A = id(2);
const OUTSIDER = id(3);
const PEOPLE = [WORKER_A, MANAGER_A, OUTSIDER];
const SITE_A = id(101);
const ROLES = ["T0109_FIELD", "T0109_LEAD"];
const P = "zzr";

let admin: pg.Client;
const role: Record<string, string> = {};
let signedIn: string | null = null;
let recordId: string;

const as = (userId: string): DbIdentity => ({ userId, actingRoleId: null });

/** What went wrong, as the caller sees it: the service turns a database hint into Turkish. */
const failure = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { message?: string; hint?: string; code?: string }) =>
      e.hint ?? e.message ?? e.code ?? "no code",
  );

const says = (hint: string) => REVISION_RULE_MESSAGES[hint];

const FIELDS = [
  { code: "quantity", label: "Miktar" },
  { code: "note", label: "Not" },
];

/** Reads the throw-away record as the admin would see it. */
async function record(): Promise<Record<string, unknown>> {
  const { rows } = await admin.query(`select * from ${P}.entry where id = $1`, [recordId]);
  return rows[0];
}

/** The owning module's applier: writes the change and a correction entry of its own. */
const applier: RevisionApplier = async (_identity, request) => {
  const current = await record();
  if (!stillCurrent(request.changes, current)) {
    return { applied: false, stale: true, note: "Kayıt bu arada değişti." };
  }
  for (const change of request.changes) {
    await admin.query(
      `update ${P}.entry set ${change.field} = $1, is_locked = true where id = $2`,
      [change.new, request.record.id],
    );
  }
  const { rows } = await admin.query(
    `insert into ${P}.correction (entry_id, note) values ($1, $2) returning id`,
    [request.record.id, "Revizyon farkı"],
  );
  return {
    applied: true,
    note: "Kayıt düzeltildi.",
    effects: [{ schema: P, table: "correction", id: rows[0].id, note: "Fark hareketi" }],
  };
};

const service = createRevisionService({
  appliers: { [`${P}.entry`]: applier },
  identity: async () => (signedIn ? as(signedIn) : null),
});

function signIn(userId: string) {
  signedIn = userId;
  return service;
}

async function cleanUp() {
  const { rows: requests } = await admin.query(
    "select id from aud.revision_request where record_schema = $1",
    [P],
  );
  const ids = requests.map((r) => r.id as string);
  if (ids.length) {
    await admin.query(
      "select aud.purge_record_history_for_reset('aud.revision_request', $1::uuid[])",
      [ids],
    );
    await admin.query(
      "delete from aud.revision_effect where revision_request_id = any($1::uuid[])",
      [ids],
    );
    await admin.query("begin");
    await admin.query("select set_config('aud.reset_purge', 'on', true)");
    await admin.query("delete from aud.revision_request where id = any($1::uuid[])", [ids]);
    await admin.query("commit");
    await admin.query(
      `delete from core.outbox_delivery where outbox_id in
         (select id from core.outbox where record_schema = 'aud' and record_id = any($1::uuid[]))`,
      [ids],
    );
    await admin.query(
      "delete from core.outbox where record_schema = 'aud' and record_id = any($1::uuid[])",
      [ids],
    );
  }
  const { rows: raised } = await admin.query(
    "select id from tsk.task where problem_key like 'revision:%' and record_schema = $1",
    [P],
  );
  if (raised.length) {
    const taskIds = raised.map((r) => r.id as string);
    await admin.query("select aud.purge_record_history_for_reset('tsk.task', $1::uuid[])", [
      taskIds,
    ]);
    await admin.query("begin");
    await admin.query("select set_config('aud.reset_purge', 'on', true)");
    await admin.query("delete from tsk.notification where task_id = any($1::uuid[])", [taskIds]);
    await admin.query("delete from tsk.task where id = any($1::uuid[])", [taskIds]);
    await admin.query("commit");
    await admin.query(
      `delete from core.outbox_delivery where outbox_id in
         (select id from core.outbox where record_schema = 'tsk' and record_id = any($1::uuid[]))`,
      [taskIds],
    );
    await admin.query(
      "delete from core.outbox where record_schema = 'tsk' and record_id = any($1::uuid[])",
      [taskIds],
    );
  }
  await admin.query("delete from tsk.notification where user_id = any($1)", [PEOPLE]);
  const { rows: register } = await admin.query(
    "select id from aud.revisable_record where record_schema = $1",
    [P],
  );
  if (register.length) {
    await admin.query(
      "select aud.purge_record_history_for_reset('aud.revisable_record', $1::uuid[])",
      [register.map((r) => r.id)],
    );
    await admin.query("delete from aud.revisable_record where record_schema = $1", [P]);
  }

  const { rows } = await admin.query(
    `select 'iam.role_assignment' as t, id from iam.role_assignment where user_id = any($1)
     union all select 'iam.user', id from iam.user where id = any($1)
     union all select 'iam.role', id from iam.role where code = any($2)
     union all select 'iam.permission', id from iam.permission where module = '${P}'`,
    [PEOPLE, ROLES],
  );
  for (const table of new Set(rows.map((r) => r.t as string))) {
    await admin.query("select aud.purge_record_history_for_reset($1, $2::uuid[])", [
      table,
      rows.filter((r) => r.t === table).map((r) => r.id),
    ]);
  }
  await releaseTestPeople(admin, PEOPLE);
  await admin.query("delete from iam.user_manager where user_id = any($1)", [PEOPLE]);
  await admin.query("delete from iam.role_assignment where user_id = any($1)", [PEOPLE]);
  await admin.query("delete from iam.user where id = any($1)", [PEOPLE]);
  await admin.query(
    `delete from iam.role_permission where role_id in (select id from iam.role where code = any($1))
        or permission_id in (select id from iam.permission where module = '${P}')`,
    [ROLES],
  );
  await admin.query("delete from iam.role where code = any($1)", [ROLES]);
  await admin.query(`delete from iam.permission where module = '${P}'`);
  await purgeHistory(admin, [`${P}.entry`]);
  await admin.query(`
    drop schema if exists ${P} cascade;
    delete from core.column_data_class where schema_name = '${P}';
    delete from core.table_layer where schema_name = '${P}';`);
}

beforeAll(async () => {
  admin = await connectAdmin();
  await cleanUp();
  await admin.query(`
    create schema ${P};
    -- A record that locks itself once approved; only its own module may change it afterwards.
    create table ${P}.entry (
      id uuid primary key default core.uuid_v7(),
      site_id uuid not null,
      quantity integer not null,
      note text,
      is_locked boolean not null default false,
      created_by_user_id uuid default core.current_user_id(),
      updated_at timestamptz not null default now()
    );
    create table ${P}.correction (
      id uuid primary key default core.uuid_v7(),
      entry_id uuid not null references ${P}.entry (id),
      note text,
      created_at timestamptz not null default now()
    );
    create function ${P}.guard_entry() returns trigger
    language plpgsql set search_path = '' as $$
    begin
      if old.is_locked and session_user::text = 'geoges_app' then
        raise exception 'bu kayıt kilitli; revizyon talebi açın'
          using errcode = 'P0001', hint = '${P}.locked';
      end if;
      return new;
    end $$;
    create trigger entry_guard before update on ${P}.entry
      for each row execute function ${P}.guard_entry();
    create trigger record_history after insert or update on ${P}.entry
      for each row execute function aud.capture_history();
    alter table ${P}.entry enable row level security;
    create policy entry_all on ${P}.entry for all to geoges_app using (true) with check (true);
    grant usage on schema ${P} to geoges_app, geoges_worker;
    grant select, insert, update on ${P}.entry to geoges_app;
    insert into core.table_layer (schema_name, table_name, layer, history)
      values ('${P}', 'entry', 'business', 'tracked'), ('${P}', 'correction', 'business', 'none');

    insert into iam.permission (code, module, name, created_from) values
      ('${P}.module.view', '${P}', 'Deneme: görür', 'seed'),
      ('${P}.module.manage', '${P}', 'Deneme: yönetir', 'seed');
    insert into iam.role (code, name, level) values
      ('T0109_LEAD', 'Deneme koordinatör', 20);
    -- The field role answers to the lead role, so iam.manager_of finds the approver (D-265).
    insert into iam.role (code, name, level, parent_role_id)
      select 'T0109_FIELD', 'Deneme saha', 10, id from iam.role where code = 'T0109_LEAD';
    insert into iam.role_permission (role_id, permission_id)
      select r.id, p.id from iam.role r, iam.permission p
       where r.code in ('T0109_FIELD', 'T0109_LEAD') and p.module = '${P}';
  `);
  const { rows } = await admin.query("select code, id from iam.role where code = any($1)", [ROLES]);
  for (const r of rows) role[r.code] = r.id;
  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id)
     select u.id, 't0109-' || u.n || '@example.test', 'Deneme revizyon ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  const assign = (user: string, code: string, site: string | null) =>
    admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
       values ($1, $2, $3, $4, iam.today() - 1)`,
      [user, role[code], site ? "site" : "company", site ? [site] : []],
    );
  await assign(WORKER_A, "T0109_FIELD", SITE_A);
  await assign(MANAGER_A, "T0109_LEAD", SITE_A);
  await assign(OUTSIDER, "T0109_FIELD", id(102));

  // The register: which fields of this record type may be asked to change, and who decides.
  await admin.query(
    `insert into aud.revisable_record (module, record_schema, record_table, label,
                                       revisable_fields, approver)
     values ($1, $1, 'entry', 'Deneme kaydı', array['quantity', 'note'], 'manager')`,
    [P],
  );
  const { rows: created } = await admin.query(
    `insert into ${P}.entry (site_id, quantity, note, is_locked) values ($1, 40, 'ilk', true)
     returning id`,
    [SITE_A],
  );
  recordId = created[0].id;
});

afterAll(async () => {
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("a locked record (REQ-AUD-007)", () => {
  it("cannot be changed directly by the runtime role", async () => {
    const { Pool } = pg;
    const pool = new Pool({
      ...(await import("@/platform/db/database-config")).readDatabaseConfig(),
    });
    try {
      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query("select set_config('app.user_id', $1, true)", [WORKER_A]);
        expect(
          await failure(
            client.query(`update ${P}.entry set quantity = 99 where id = $1`, [recordId]),
          ),
        ).toBe(`${P}.locked`);
        await client.query("rollback");
      } finally {
        client.release();
      }
    } finally {
      await pool.end();
    }
  });
});

describe("asking for a change (REQ-AUD-008, D-265)", () => {
  let requestId: string;

  it("is open to the register's fields only, once per record, and not to outsiders", async () => {
    const current = await record();
    const changes = buildChanges(current, { quantity: 42, note: "düzeltildi" }, FIELDS);
    expect(changes).toHaveLength(2);

    expect(
      await failure(
        signIn(OUTSIDER).request({
          record: { schema: P, table: "entry", id: recordId },
          changes,
          reason: "başka şantiyeden",
          place: { siteId: SITE_A, dataClass: "internal" },
        }),
      ),
    ).toBe(says("aud.may_not_request"));

    expect(
      await failure(
        signIn(WORKER_A).request({
          record: { schema: P, table: "entry", id: recordId },
          changes: [{ field: "is_locked", old: true, new: false }],
          reason: "kilidi açalım",
          place: { siteId: SITE_A },
        }),
      ),
    ).toBe(says("aud.field_not_revisable"));

    requestId = await signIn(WORKER_A).request({
      record: { schema: P, table: "entry", id: recordId },
      changes,
      reason: "sayım yanlış girilmiş",
      place: { siteId: SITE_A },
    });
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);

    expect(
      await failure(
        signIn(WORKER_A).request({
          record: { schema: P, table: "entry", id: recordId },
          changes,
          reason: "ikinci talep",
          place: { siteId: SITE_A },
        }),
      ),
    ).toBe(says("aud.revision_open"));
  });

  it("is seen by the requester, the approver and nobody else", async () => {
    expect((await signIn(WORKER_A).list("mine")).map((r) => r.id)).toContain(requestId);
    const waiting = await signIn(MANAGER_A).list("pending");
    expect(waiting.map((r) => r.id)).toContain(requestId);
    expect(waiting.find((r) => r.id === requestId)?.canDecide).toBe(true);
    expect((await signIn(OUTSIDER).list("all")).map((r) => r.id)).not.toContain(requestId);
    // The requester may not decide their own request (D-265).
    expect((await signIn(WORKER_A).list("mine")).find((r) => r.id === requestId)?.canDecide).toBe(
      false,
    );
  });

  it("refuses a decision from the requester and a refusal without a reason", async () => {
    expect(await failure(signIn(WORKER_A).decide(requestId, true, null))).toBe(
      says("aud.not_approver"),
    );
    expect(await failure(signIn(MANAGER_A).decide(requestId, false, "   "))).toBe(
      says("aud.reason_required"),
    );
  });

  it("carries an approval out through the owning module and links the correction", async () => {
    const answer = await signIn(MANAGER_A).decide(requestId, true, null);
    expect(answer).toMatchObject({ status: "approved", note: "Kayıt düzeltildi." });

    const after = await record();
    expect(after.quantity).toBe(42);
    expect(after.note).toBe("düzeltildi");

    const effects = await signIn(MANAGER_A).effectsOf(requestId);
    expect(effects).toHaveLength(1);
    expect(effects[0]).toMatchObject({ schema: P, table: "correction", note: "Fark hareketi" });

    const [request] = (
      await signIn(MANAGER_A).list("record", {
        schema: P,
        table: "entry",
        id: recordId,
      })
    ).filter((r) => r.id === requestId);
    expect(request).toMatchObject({ status: "approved", applyNote: "Kayıt düzeltildi." });
    expect(request.appliedAt).not.toBeNull();

    // Deciding again answers the same and writes nothing twice.
    const again = await signIn(MANAGER_A).decide(requestId, true, null);
    expect(again).toMatchObject({ status: "approved" });
    const { rows: corrections } = await admin.query(
      `select count(*)::int as n from ${P}.correction where entry_id = $1`,
      [recordId],
    );
    expect(corrections[0].n).toBe(1);
    expect(await signIn(MANAGER_A).effectsOf(requestId)).toHaveLength(1);
  });

  it("becomes stale when the record moved on after the request was made", async () => {
    const current = await record();
    const changes = buildChanges(current, { quantity: 50 }, FIELDS);
    const staleId = await signIn(WORKER_A).request({
      record: { schema: P, table: "entry", id: recordId },
      changes,
      reason: "bir daha düzeltelim",
      place: { siteId: SITE_A },
    });
    await admin.query(`update ${P}.entry set quantity = 45 where id = $1`, [recordId]);

    const answer = await signIn(MANAGER_A).decide(staleId, true, null);
    expect(answer.status).toBe("stale");
    expect((await record()).quantity).toBe(45);
    const [stale] = (await signIn(WORKER_A).list("mine")).filter((r) => r.id === staleId);
    expect(stale.status).toBe("stale");
  });

  it("knows the record type from the register", async () => {
    expect(await readRevisableType(as(WORKER_A), P, "entry")).toMatchObject({
      module: P,
      label: "Deneme kaydı",
      approver: "manager",
    });
    expect(await readRevisableType(as(WORKER_A), P, "correction")).toBeNull();
  });
});
