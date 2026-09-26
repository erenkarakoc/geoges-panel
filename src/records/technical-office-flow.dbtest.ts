/**
 * A late technical office item, end to end (TASK-0123 step 4, REQ-PRJ-005, D-298).
 *
 * The shipped "Geciken teknik ofis işi" template is copied, dry-run and published the way a person
 * does it in the designer; an item passes its due day; the daily look announces it; the flow asks
 * PRJ — through the composition root, with the item as the flow's record — who is responsible, and
 * opens the task for that person. An item with nobody responsible goes to the technical office.
 * The flow, the project and the people are this test's own and are removed afterwards.
 */
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../scripts/db-test-people.mjs";
import {
  dryRunVersion,
  publishVersion,
  readInstance,
  runEventTriggers,
  startFromTemplate,
} from "@/modules/wfl";
import { readDatabaseConfig } from "@/platform/db/database-config";
import type { SystemDb } from "@/platform/jobs/types";
import { ownerRelations } from "@/records/capabilities";

const id = (n: number) => `0192f0c1-0123-7600-8000-${String(n).padStart(12, "0")}`;
const OFFICE = id(1);
const ENGINEER = id(2);
const DESIGNER = id(3);
const PEOPLE = [OFFICE, ENGINEER, DESIGNER];
const PREFIX = "zz-t0123t-";
const CODE = "ZZT-0123TF-A";

let admin: pg.Client;
let workerPool: pg.Pool;
let worker: SystemDb;
let project: string;
let drawing: string;

const as = (userId: string) => ({ userId, actingRoleId: null });

/**
 * The engine's runtime: PRJ's own relation through the composition root, a role resolved among
 * this test's people only, and every opened task recorded rather than written (TSK proves its own).
 */
const opened: { assigneeUserId: string; title: string }[] = [];
const runtime = {
  resolve: async (
    db: SystemDb,
    code: string,
    argument: string | null,
    record?: { schema: string; table: string; id: string } | null,
  ) => {
    if (code !== "role.holder") return ownerRelations.resolve(db, code, argument, record ?? null);
    const { rows } = await admin.query(
      `select a.user_id from iam.role_assignment a join iam.role r on r.id = a.role_id
        where r.code = $1 and a.user_id = any($2::uuid[]) limit 1`,
      [argument, PEOPLE],
    );
    return rows[0]?.user_id ?? null;
  },
  run: async (_db: SystemDb, code: string, input: unknown) => {
    if (code === "task.open") opened.push(input as { assigneeUserId: string; title: string });
    return null;
  },
};

/** An item made late, announced by the daily look, and handed to the flow. */
async function lateItem(assignee: string | null) {
  const item = (
    await admin.query(
      `insert into prj.technical_office_item (project_id, type_item_id, title, assignee_user_id, due_on)
       values ($1, $2, 'Deneme: statik hesap', $3, iam.today() - 1) returning id`,
      [project, drawing, assignee],
    )
  ).rows[0].id as string;
  await admin.query("select prj.announce_overdue_technical_items()");
  const { rows } = await admin.query(
    `select event_id, payload from core.outbox
      where record_id = $1 and event_code = 'technical_office_item.overdue'`,
    [item],
  );
  expect(rows).toHaveLength(1);
  const started = await runEventTriggers(
    worker,
    {
      code: "technical_office_item.overdue",
      id: rows[0].event_id,
      payload: rows[0].payload,
      record: { id: item, schema: "prj", table: "technical_office_item" },
    },
    runtime,
  );
  const ours = [];
  for (const instanceId of started) {
    const row = await readInstance(as(DESIGNER), instanceId);
    if (row?.flowKey.startsWith(PREFIX)) ours.push(instanceId);
  }
  expect(ours).toHaveLength(1);
}

async function cleanUp() {
  const { rows: flows } = await admin.query("select id from wfl.flow where key like $1", [
    `${PREFIX}%`,
  ]);
  const flowIds = flows.map((row: { id: string }) => row.id);
  if (flowIds.length) {
    await admin.query("delete from wfl.instance where flow_id = any($1::uuid[])", [flowIds]);
    await admin.query(
      `delete from wfl.dry_run where flow_version_id in (
         select id from wfl.flow_version where flow_id = any($1::uuid[]))`,
      [flowIds],
    );
    await admin.query("delete from wfl.flow_version where flow_id = any($1::uuid[])", [flowIds]);
    await admin.query("delete from wfl.flow where id = any($1::uuid[])", [flowIds]);
  }
  await admin.query(
    `delete from core.event_subscription s
      where s.subscriber = 'wfl.engine' and s.event_code = 'technical_office_item.overdue'
        and not exists (
          select from wfl.flow_version v join wfl.flow f on f.id = v.flow_id
           where v.status = 'published' and f.disabled_at is null
             and v.definition -> 'trigger' ->> 'event' = s.event_code)`,
  );
  const { rows } = await admin.query("select id from prj.project where code = $1", [CODE]);
  if (rows[0]) {
    const projectId = rows[0].id as string;
    const items = (
      await admin.query("select id from prj.technical_office_item where project_id = $1", [
        projectId,
      ])
    ).rows.map((row: { id: string }) => row.id);
    const records = [projectId, ...items];
    await admin.query(
      `delete from core.outbox_delivery where outbox_id in
         (select id from core.outbox where record_id = any($1::uuid[]))`,
      [records],
    );
    await admin.query("delete from core.outbox where record_id = any($1::uuid[])", [records]);
    await admin.query(
      `delete from core.search_posting where search_row_id in
         (select id from core.search_row where record_id = any($1::uuid[]))`,
      [records],
    );
    await admin.query("delete from core.search_row where record_id = any($1::uuid[])", [records]);
    await admin.query(
      "select aud.purge_record_history_for_reset('prj.technical_office_item', $1::uuid[])",
      [items],
    );
    await admin.query("delete from prj.technical_office_item where project_id = $1", [projectId]);
    await admin.query("alter table prj.project_stage_change disable trigger append_only_guard");
    try {
      await admin.query("delete from prj.project_stage_change where project_id = $1", [projectId]);
    } finally {
      await admin.query("alter table prj.project_stage_change enable trigger append_only_guard");
    }
    await admin.query(
      "select aud.purge_record_history_for_reset('prj.project', array[$1]::uuid[])",
      [projectId],
    );
    await admin.query("delete from prj.project where id = $1", [projectId]);
  }
  await releaseTestPeople(admin, PEOPLE);
  await admin.query("delete from iam.role_assignment where user_id = any($1::uuid[])", [PEOPLE]);
  await admin.query("delete from iam.user where id = any($1::uuid[])", [PEOPLE]);
}

beforeAll(async () => {
  admin = await connectAdmin();
  workerPool = new pg.Pool(readDatabaseConfig(process.env, undefined, "DATABASE_WORKER_URL"));
  worker = new Kysely({ dialect: new PostgresDialect({ pool: workerPool }) });
  await cleanUp();
  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id)
     select u.id, 't0123tf-' || u.n || '@example.test', 'Deneme teknik ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  for (const [person, role] of [
    [OFFICE, "TO"],
    [DESIGNER, "SAH"],
  ]) {
    await admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
       select $1, r.id, 'company', '{}', iam.today() - 1 from iam.role r where r.code = $2`,
      [person, role],
    );
  }
  project = (
    await admin.query(
      "insert into prj.project (code, name) values ($1, 'Deneme teknik akış') returning id",
      [CODE],
    )
  ).rows[0].id;
  drawing = (
    await admin.query(
      `select i.id from adm.catalog_item i join adm.catalog c on c.id = i.catalog_id
        where c.key = 'technical_office_type' and i.code = 'static_calculation'`,
    )
  ).rows[0].id;
  const versionId = await startFromTemplate(as(DESIGNER), {
    flowKey: `${PREFIX}technical-office-overdue`,
    flowName: "Deneme: geciken teknik ofis işi",
    templateKey: "technical-office-overdue",
  });
  const report = await dryRunVersion(worker, versionId, { record: {} }, runtime);
  expect(report.passed).toBe(true);
  expect(await publishVersion(as(DESIGNER), versionId)).toBe(true);
});

afterAll(async () => {
  await worker?.destroy();
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("a late technical office item falls to somebody (REQ-PRJ-005)", () => {
  it("opens a task for the person responsible for the item", async () => {
    opened.length = 0;
    await lateItem(ENGINEER);
    expect(opened).toEqual([
      expect.objectContaining({
        assigneeUserId: ENGINEER,
        title: "Geciken teknik ofis işini teslim et",
      }),
    ]);
  });

  it("gives it to the technical office when nobody is responsible", async () => {
    opened.length = 0;
    await lateItem(null);
    expect(opened).toEqual([
      expect.objectContaining({
        assigneeUserId: OFFICE,
        title: "Sorumlusu olmayan geciken teknik ofis işi",
      }),
    ]);
  });
});
