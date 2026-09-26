/**
 * The two project templates against the real modules (TASK-0123 step 5, REQ-PRJ-003, REQ-WFL-010).
 *
 * "Kazanılan işin başlatılması" starts on a new project, opens its two tasks in parallel and, once
 * both are done, moves the project to technical design through the record step. "Kurum onayı
 * takibi" starts on that move, walks the project's authority approvals, opens "open the site" for
 * the coordinator and moves the project to mobilisation — and, from its third version, does not
 * start again on its own move. Both are copied, dry-run and published the way a person does it;
 * the record step and the list are answered by PRJ through the composition root. Tasks are
 * recorded rather than written (TSK proves its own). The flows, the project and the people are this
 * test's own and are removed afterwards.
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

const id = (n: number) => `0192f0c1-0123-7700-8000-${String(n).padStart(12, "0")}`;
const MANAGER = id(1);
const OFFICE = id(2);
const COORDINATOR = id(3);
const DESIGNER = id(4);
const PEOPLE = [MANAGER, OFFICE, COORDINATOR, DESIGNER];
const PREFIX = "zz-t0123p-";
const CODE = "ZZT-0123PF-A";

let admin: pg.Client;
let workerPool: pg.Pool;
let worker: SystemDb;
let project: string;
/** The authority run of the move to technical design. */
let authorityRun: string;

const as = (userId: string) => ({ userId, actingRoleId: null });

/** Roles resolve among this test's people only; tasks are recorded; the rest is the real thing. */
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
  run: async (db: SystemDb, code: string, input: unknown) => {
    if (code === "task.open") {
      opened.push(input as { assigneeUserId: string; title: string });
      return null;
    }
    return ownerRelations.run(db, code, input);
  },
  list: ownerRelations.list,
};

/** The last event of one kind about this test's project, handed to the flows. */
async function deliver(eventCode: string) {
  const { rows } = await admin.query(
    `select event_id, payload from core.outbox
      where record_id = $1 and event_code = $2 order by id desc limit 1`,
    [project, eventCode],
  );
  expect(rows).toHaveLength(1);
  const started = await runEventTriggers(
    worker,
    {
      code: eventCode,
      id: rows[0].event_id,
      payload: rows[0].payload,
      record: { id: project, schema: "prj", table: "project" },
    },
    runtime,
  );
  const ours: string[] = [];
  for (const instanceId of started) {
    const row = await readInstance(as(DESIGNER), instanceId);
    if (row?.flowKey.startsWith(PREFIX)) ours.push(instanceId);
  }
  return { payload: rows[0].payload as Record<string, unknown>, ours };
}

async function stageOf(): Promise<string> {
  return (await admin.query("select stage from prj.project where id = $1", [project])).rows[0]
    .stage;
}

async function copyAndPublish(templateKey: string) {
  const versionId = await startFromTemplate(as(DESIGNER), {
    flowKey: `${PREFIX}${templateKey}`,
    flowName: `Deneme: ${templateKey}`,
    templateKey,
  });
  const report = await dryRunVersion(worker, versionId, { record: {} }, runtime);
  expect({ templateKey, passed: report.passed, failure: report.failure }).toEqual({
    templateKey,
    passed: true,
    failure: undefined,
  });
  expect(await publishVersion(as(DESIGNER), versionId)).toBe(true);
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
      where s.subscriber = 'wfl.engine'
        and s.event_code in ('project.created', 'project.stage_changed')
        and not exists (
          select from wfl.flow_version v join wfl.flow f on f.id = v.flow_id
           where v.status = 'published' and f.disabled_at is null
             and v.definition -> 'trigger' ->> 'event' = s.event_code)`,
  );
  const { rows } = await admin.query("select id from prj.project where code = $1", [CODE]);
  if (rows[0]) {
    const projectId = rows[0].id as string;
    await admin.query(
      `delete from core.outbox_delivery where outbox_id in
         (select id from core.outbox where record_id = $1)`,
      [projectId],
    );
    await admin.query("delete from core.outbox where record_id = $1", [projectId]);
    await admin.query(
      `delete from core.search_posting where search_row_id in
         (select id from core.search_row where record_id = $1)`,
      [projectId],
    );
    await admin.query("delete from core.search_row where record_id = $1", [projectId]);
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
     select u.id, 't0123pf-' || u.n || '@example.test', 'Deneme proje akışı ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  for (const [person, role] of [
    [MANAGER, "GM"],
    [OFFICE, "TO"],
    [COORDINATOR, "KO"],
    [DESIGNER, "SAH"],
  ]) {
    await admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
       select $1, r.id, 'company', '{}', iam.today() - 1 from iam.role r where r.code = $2`,
      [person, role],
    );
  }
  await copyAndPublish("project-kickoff");
  await copyAndPublish("authority-approvals");
});

afterAll(async () => {
  await worker?.destroy();
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("a won job starts itself (Kazanılan işin başlatılması)", () => {
  it("opens the contract and the project details in parallel when a project is opened", async () => {
    project = (
      await admin.query(
        `insert into prj.project (code, name, stage, contract_end_on)
         values ($1, 'Deneme proje akışı', 'contract', iam.today() + 100) returning id`,
        [CODE],
      )
    ).rows[0].id;
    opened.length = 0;
    const { payload, ours } = await deliver("project.created");
    // The event now carries what a condition may read about the project (migration 0072).
    expect(payload).toMatchObject({ stage: "contract", days_to_contract_end: 100 });
    expect(ours).toHaveLength(1);
    expect(opened.map((task) => [task.title, task.assigneeUserId]).sort()).toEqual(
      [
        ["Proje bilgilerini tamamla", OFFICE],
        ["Sözleşmeyi ve yükümlülüklerini kaydet", MANAGER],
      ].sort(),
    );
  });

  it("moves the project to technical design through the record step", async () => {
    // What the flow's last step does once both tasks are closed, asked the way the engine asks.
    await runtime.run(worker, "record.set_status", {
      record: { schema: "prj", table: "project", id: project },
      status: "technical_design",
    });
    expect(await stageOf()).toBe("technical_design");
  });
});

describe("authority approvals follow (Kurum onayı takibi)", () => {
  it("starts on the move to technical design and hands the site to the coordinator", async () => {
    opened.length = 0;
    const { payload, ours } = await deliver("project.stage_changed");
    expect(payload).toMatchObject({ from_stage: "contract", stage: "technical_design" });
    expect(ours).toHaveLength(1);
    authorityRun = ours[0];
    // No authority approval is open on this project, so the list is empty and the flow goes on.
    expect(opened).toEqual([
      expect.objectContaining({
        assigneeUserId: COORDINATOR,
        title: "Şantiyeyi aç, mobilizasyonu başlat",
      }),
    ]);
  });

  it("does not start again on its own move to mobilisation", async () => {
    // In the panel the run's own last step makes this move and the run ends there; the event
    // reaches the flows afterwards. Here the run is waiting on its task, so it is ended by hand —
    // otherwise the single-instance rule would simply hand back the running one.
    await admin.query("update wfl.instance set status = 'done', ended_at = now() where id = $1", [
      authorityRun,
    ]);
    await runtime.run(worker, "record.set_status", {
      record: { schema: "prj", table: "project", id: project },
      status: "mobilisation",
    });
    expect(await stageOf()).toBe("mobilisation");
    opened.length = 0;
    const { ours } = await deliver("project.stage_changed");
    expect(ours).toHaveLength(1);
    expect(ours[0]).not.toBe(authorityRun);
    // The new run looked at the stage, found mobilisation and ended without a task.
    expect((await readInstance(as(DESIGNER), ours[0]))?.status).toBe("done");
    expect(opened).toEqual([]);
  });
});
