/**
 * Phase 08's own acceptance, against the real database (MASTER_ROADMAP Phase 08, D-279).
 *
 * The roadmap asks for three default company flows — daily log approval, material issue, payment
 * approval — to be **defined and executed through the engine**, and for the approval screen to show
 * the engine's real queue. This test does exactly that, the way a person would: each flow is copied
 * from the template the panel ships, dry-run by the engine, published through the same gate a person
 * uses, triggered by the event its module will publish, and answered from the queue of whoever holds
 * the role it addresses. The records are a throw-away type that lives only here — the modules that
 * will publish these events arrive in their own slices, and D-279 is why this does not wait for them.
 *
 * The flows it publishes are this test's own copies and are closed and removed afterwards, so a
 * development database does not keep listening to real event codes on the test's behalf.
 * `npm run test:db` (with `next dev` stopped: `docs/infrastructure/CI.md`).
 */
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../../scripts/db-test-people.mjs";
import {
  dryRunVersion,
  resumeFromApproval,
  runEventTriggers,
} from "@/modules/wfl/application/engine";
import {
  publishVersion,
  readFlowForDesigner,
  startFromTemplate,
} from "@/modules/wfl/data/flow-store";
import {
  decideApproval,
  readInstance,
  readMyApprovalCount,
  readMyApprovals,
} from "@/modules/wfl/data/instance-store";
import { readDatabaseConfig } from "@/platform/db/database-config";
import type { SystemDb } from "@/platform/jobs/types";

const id = (n: number) => `0192f0c1-0121-7000-8000-${String(n).padStart(12, "0")}`;
const DESIGNER = id(1);
const COORDINATOR = id(2);
const MANAGER = id(3);
const BUYER = id(4);
const PEOPLE = [DESIGNER, COORDINATOR, MANAGER, BUYER];
const PREFIX = "zz-t0121-";

/** The events these flows listen to; their subscriptions are this test's to take back. */
const EVENTS = [
  "daily_site_log.submitted",
  "material_issue_request.submitted",
  "payment.submitted_for_approval",
];

let admin: pg.Client;
let workerPool: pg.Pool;
let worker: SystemDb;

const as = (userId: string) => ({ userId, actingRoleId: null });

/** What the engine asked the catalog to do, so a task step can be seen without TSK's tables. */
const actions: { code: string; input: Record<string, unknown> }[] = [];

/**
 * What the composition root gives the engine: the one relation these flows need — whoever holds a
 * role — and the catalog's actions, recorded rather than performed, because TSK's own tests prove
 * what `task.open` does and this test proves that the flow asks for it.
 */
const runtime = {
  resolve: async (_db: SystemDb, code: string, argument: string | null) => {
    if (code !== "role.holder" || !argument) return null;
    const { rows } = await admin.query(
      `select a.user_id from iam.role_assignment a join iam.role r on r.id = a.role_id
        where r.code = $1 and a.user_id = any($2::uuid[])
        order by a.starts_on, a.user_id limit 1`,
      [argument, PEOPLE],
    );
    return rows[0]?.user_id ?? null;
  },
  run: async (_db: SystemDb, code: string, input: unknown) => {
    actions.push({ code, input: input as Record<string, unknown> });
    return null;
  },
};

/** Copies a shipped template, dry-runs it and publishes it: what a person does in the designer. */
async function adopt(templateKey: string) {
  const flowKey = `${PREFIX}${templateKey}`;
  const versionId = await startFromTemplate(as(DESIGNER), {
    templateKey,
    flowKey,
    flowName: `Kabul: ${templateKey}`,
  });
  const report = await dryRunVersion(worker, versionId, { record: {} }, runtime);
  expect(report.passed).toBe(true);
  expect(await publishVersion(as(DESIGNER), versionId)).toBe(true);
  return flowKey;
}

/** The event a module will publish, with a throw-away record the flow is about. */
async function trigger(code: string, n: number, payload: Record<string, unknown>) {
  const started = await runEventTriggers(
    worker,
    { code, id: id(500 + n), record: { schema: "zzq", table: "record", id: id(600 + n) }, payload },
    runtime,
  );
  // Only this test's copies listen: whatever else the database holds is not started by this event.
  const ours = [];
  for (const instanceId of started) {
    const row = await readInstance(as(DESIGNER), instanceId);
    if (row?.flowKey.startsWith(PREFIX)) ours.push(instanceId);
  }
  expect(ours).toHaveLength(1);
  return ours[0];
}

/** Answers the approval waiting on this person for this run, the way the queue screen does. */
async function answer(userId: string, instanceId: string, decision: "approve" | "reject") {
  const waiting = await readMyApprovals(as(userId));
  const mine = waiting.find((one) => one.instanceId === instanceId);
  expect(mine, "the approval is in this person's queue").toBeDefined();
  expect(await decideApproval(as(userId), mine!.id, decision, "Kabul testi")).toBe(true);
  // What the engine's subscriber does when it hears `approval.decided`.
  await resumeFromApproval(worker, mine!.id, runtime);
  return mine!;
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
  // A subscription is taken back only when no other published flow still listens to its event.
  await admin.query(
    `delete from core.event_subscription s
      where s.subscriber = 'wfl.engine' and s.event_code = any($1)
        and not exists (
          select from wfl.flow_version v join wfl.flow f on f.id = v.flow_id
           where v.status = 'published' and f.disabled_at is null
             and v.definition -> 'trigger' ->> 'event' = s.event_code)`,
    [EVENTS],
  );
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
     select u.id, 't0121-' || u.n || '@example.test', 'Kabul ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  const assign = async (user: string, code: string) => {
    const { rows } = await admin.query("select id from iam.role where code = $1", [code]);
    await admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
       values ($1, $2, 'company', '{}', iam.today() - 1)`,
      [user, rows[0].id],
    );
  };
  // The designer may design flows; the others hold the seats these three flows address.
  await assign(DESIGNER, "SAH");
  await assign(COORDINATOR, "KO");
  await assign(MANAGER, "GM");
  await assign(BUYER, "SAL");
});

afterAll(async () => {
  await worker?.destroy();
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("Phase 08 acceptance: the default flows run through the engine", () => {
  it("daily site log approval: the coordinator's queue, and a quiet day ends there", async () => {
    await adopt("daily-site-log-approval");
    const run = await trigger("daily_site_log.submitted", 1, { expense_total: 800 });

    // It waits on whoever holds the coordinator's seat, and nobody else sees it as theirs.
    expect((await readMyApprovals(as(MANAGER))).some((one) => one.instanceId === run)).toBe(false);
    expect(await readMyApprovalCount(as(COORDINATOR))).toBeGreaterThan(0);

    const decided = await answer(COORDINATOR, run, "approve");
    // The queue says why it was theirs: the rule the flow used, not a person picked at random.
    expect(decided.ownerRule).toEqual({ type: "role", role: "KO" });

    // Spending under the threshold needs no second approval, so the flow is finished.
    expect((await readInstance(as(DESIGNER), run))?.status).toBe("done");
  });

  it("daily site log approval: a costly day goes on to the general manager", async () => {
    const run = await trigger("daily_site_log.submitted", 2, { expense_total: 9000 });
    await answer(COORDINATOR, run, "approve");
    expect((await readInstance(as(DESIGNER), run))?.status).toBe("running");

    await answer(MANAGER, run, "approve");
    expect((await readInstance(as(DESIGNER), run))?.status).toBe("done");
  });

  it("payment approval: the amount decides whose queue it lands in", async () => {
    await adopt("payment-approval");

    const large = await trigger("payment.submitted_for_approval", 3, { amount: 80000 });
    expect((await readMyApprovals(as(COORDINATOR))).some((one) => one.instanceId === large)).toBe(
      false,
    );
    await answer(MANAGER, large, "approve");
    expect((await readInstance(as(DESIGNER), large))?.status).toBe("done");

    const small = await trigger("payment.submitted_for_approval", 4, { amount: 1200 });
    await answer(COORDINATOR, small, "approve");
    expect((await readInstance(as(DESIGNER), small))?.status).toBe("done");
  });

  it("material issue: an approval, then a task for whoever holds purchasing", async () => {
    await adopt("material-issue-request");
    actions.length = 0;

    const run = await trigger("material_issue_request.submitted", 5, {});
    await answer(COORDINATOR, run, "approve");

    // The engine wrote nobody's task itself: it asked the catalog for one, for the buyer (D-280).
    const opened = actions.filter((action) => action.code === "task.open");
    expect(opened).toHaveLength(1);
    expect(opened[0].input).toMatchObject({ assigneeUserId: BUYER, title: "Sevk et" });

    // And it now waits for that task to be closed, which is the task module's event to send.
    expect((await readInstance(as(DESIGNER), run))?.status).toBe("running");
  });

  it("material issue: a refusal ends the flow without opening any work", async () => {
    actions.length = 0;
    const run = await trigger("material_issue_request.submitted", 6, {});
    await answer(COORDINATOR, run, "reject");

    expect(actions.filter((action) => action.code === "task.open")).toHaveLength(0);
    expect((await readInstance(as(DESIGNER), run))?.status).toBe("done");
  });

  it("each flow is a copy that remembers the template it came from", async () => {
    const flow = await readFlowForDesigner(as(DESIGNER), `${PREFIX}payment-approval`);
    expect(flow?.sourceTemplateKey).toBe("payment-approval");
    expect(flow?.status).toBe("published");
  });
});
