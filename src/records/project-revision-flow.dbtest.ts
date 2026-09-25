/**
 * A project revision's approval, end to end (TASK-0123 step 2, REQ-PRJ-009, REQ-WFL-010, D-292).
 *
 * The shipped "Proje revizyonu onayı" template is copied, dry-run and published the way a person
 * does it in the designer; the technical office sends a revision; the general manager approves it
 * from the queue; the flow's record step reaches PRJ through the composition root's dispatcher and
 * the revision becomes valid that day. A second revision is returned and comes back as a draft.
 * The flow, the project and the people are this test's own and are removed afterwards.
 */
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../scripts/db-test-people.mjs";
import {
  decideApproval,
  dryRunVersion,
  publishVersion,
  readInstance,
  readMyApprovals,
  resumeFromApproval,
  runEventTriggers,
  startFromTemplate,
} from "@/modules/wfl";
import { readDatabaseConfig } from "@/platform/db/database-config";
import type { SystemDb } from "@/platform/jobs/types";
import { ownerRelations } from "@/records/capabilities";

const id = (n: number) => `0192f0c1-0123-7400-8000-${String(n).padStart(12, "0")}`;
const OFFICE = id(1);
const MANAGER = id(2);
const DESIGNER = id(3);
const PEOPLE = [OFFICE, MANAGER, DESIGNER];
const PREFIX = "zz-t0123-";
const CODE = "ZZT-0123F-A";

let admin: pg.Client;
let workerPool: pg.Pool;
let worker: SystemDb;
let project: string;

const as = (userId: string) => ({ userId, actingRoleId: null });

/**
 * The engine's runtime: the real record-step dispatcher, a role resolved among this test's people
 * only, and every other catalog action recorded rather than performed (TSK proves its own).
 */
const notified: string[] = [];
const runtime = {
  resolve: async (_db: SystemDb, code: string, argument: string | null) => {
    if (code !== "role.holder" || !argument) return null;
    const { rows } = await admin.query(
      `select a.user_id from iam.role_assignment a join iam.role r on r.id = a.role_id
        where r.code = $1 and a.user_id = any($2::uuid[]) limit 1`,
      [argument, PEOPLE],
    );
    return rows[0]?.user_id ?? null;
  },
  run: async (db: SystemDb, code: string, input: unknown) => {
    if (code.startsWith("record.")) return ownerRelations.run(db, code, input);
    notified.push(code);
    return null;
  },
};

async function submitted(revisionId: string) {
  await admin.query(
    "update prj.project_revision set status = 'submitted' where id = $1 and status = 'draft'",
    [revisionId],
  );
  const { rows } = await admin.query(
    `select event_id, payload from core.outbox
      where record_id = $1 and event_code = 'project_revision.submitted'
      order by id desc limit 1`,
    [revisionId],
  );
  const started = await runEventTriggers(
    worker,
    {
      code: "project_revision.submitted",
      id: rows[0].event_id,
      payload: rows[0].payload,
      record: { id: revisionId, schema: "prj", table: "project_revision" },
    },
    runtime,
  );
  const ours = [];
  for (const instanceId of started) {
    const row = await readInstance(as(DESIGNER), instanceId);
    if (row?.flowKey.startsWith(PREFIX)) ours.push(instanceId);
  }
  expect(ours).toHaveLength(1);
  return ours[0];
}

async function decide(instanceId: string, decision: "approve" | "reject") {
  const mine = (await readMyApprovals(as(MANAGER))).find((one) => one.instanceId === instanceId);
  expect(mine, "the revision waits in the general manager's queue").toBeDefined();
  expect(await decideApproval(as(MANAGER), mine!.id, decision, "Deneme kararı")).toBe(true);
  await resumeFromApproval(worker, mine!.id, runtime);
}

async function status(revisionId: string) {
  const { rows } = await admin.query(
    "select status, valid_from::text as valid_from, iam.today()::text as today from prj.project_revision where id = $1",
    [revisionId],
  );
  return rows[0] as { status: string; valid_from: string | null; today: string };
}

async function cleanUp() {
  const { rows: flows } = await admin.query("select id from wfl.flow where key like $1", [
    `${PREFIX}%`,
  ]);
  const flowIds = flows.map((row: { id: string }) => row.id);
  if (flowIds.length) {
    await admin.query(
      "delete from wfl.approval where instance_id in (select id from wfl.instance where flow_id = any($1::uuid[]))",
      [flowIds],
    );
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
      where s.subscriber = 'wfl.engine' and s.event_code = 'project_revision.submitted'
        and not exists (
          select from wfl.flow_version v join wfl.flow f on f.id = v.flow_id
           where v.status = 'published' and f.disabled_at is null
             and v.definition -> 'trigger' ->> 'event' = s.event_code)`,
  );
  const { rows } = await admin.query("select id from prj.project where code = $1", [CODE]);
  if (rows[0]) {
    const projectId = rows[0].id as string;
    const revisions = (
      await admin.query("select id from prj.project_revision where project_id = $1", [projectId])
    ).rows.map((row: { id: string }) => row.id);
    const records = [projectId, ...revisions];
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
      "select aud.purge_record_history_for_reset('prj.project_revision', $1::uuid[])",
      [revisions],
    );
    await admin.query("delete from prj.project_revision where project_id = $1", [projectId]);
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
     select u.id, 't0123f-' || u.n || '@example.test', 'Deneme akış ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  for (const [person, role] of [
    [OFFICE, "TO"],
    [MANAGER, "GM"],
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
      "insert into prj.project (code, name) values ($1, 'Deneme akış projesi') returning id",
      [CODE],
    )
  ).rows[0].id;
  const versionId = await startFromTemplate(as(DESIGNER), {
    flowKey: `${PREFIX}project-revision-approval`,
    flowName: "Deneme: proje revizyonu onayı",
    templateKey: "project-revision-approval",
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

describe("a project revision is approved by its flow (REQ-PRJ-009, D-292 rule 2)", () => {
  it("becomes valid from the day the general manager approves it", async () => {
    const revision = (
      await admin.query("select prj.start_revision($1, 'Rev.0 — deneme') as id", [project])
    ).rows[0].id as string;
    await decide(await submitted(revision), "approve");
    const after = await status(revision);
    expect(after.status).toBe("approved");
    expect(after.valid_from).toBe(after.today);
  });

  it("comes back to the technical office as a draft when it is refused", async () => {
    const revision = (
      await admin.query("select prj.start_revision($1, 'Rev.1 — deneme') as id", [project])
    ).rows[0].id as string;
    await decide(await submitted(revision), "reject");
    expect((await status(revision)).status).toBe("draft");
    expect(notified).toContain("notification.send");
  });
});
