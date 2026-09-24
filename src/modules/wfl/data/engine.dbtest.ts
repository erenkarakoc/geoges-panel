/**
 * The engine, end to end against the real database (TASK-0117, REQ-WFL-007/008/011, D-279).
 *
 * A flow is written, dry-run, published and then triggered by a real event going through the real
 * outbox: the delivery is claimed by the worker, the engine takes the steps it knows, and the run
 * log says afterwards exactly which way the flow went. The record type it is about is a throw-away
 * one that lives only in this test, which is what D-279 asks for — the engine is proved before the
 * modules whose records it will work on exist. `npm run test:db`.
 *
 * It sits in `data/` although it exercises the application layer: opening a connection of its own
 * is a data-layer thing to do, and the boundary rule is enforced by path (PORTS_AND_SERVICES
 * section 2).
 */
import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../../scripts/db-test-people.mjs";
import { runEventTriggers, runInstance } from "@/modules/wfl/application/engine";
import { publishVersion, recordDryRun, saveDraft } from "@/modules/wfl/data/flow-store";
import {
  decideApproval,
  readInstance,
  readMyApprovals,
  readRunLog,
  startInstanceByHand,
} from "@/modules/wfl/data/instance-store";
import {
  dryRunVersion,
  resumeFromApproval,
  resumeFromTask,
} from "@/modules/wfl/application/engine";
import { runAsUser } from "@/platform/db";
import { readDatabaseConfig } from "@/platform/db/database-config";
import type { SystemDb } from "@/platform/jobs/types";

const id = (n: number) => `0192f0c1-0147-7000-8000-${String(n).padStart(12, "0")}`;
const DESIGNER = id(1);
const APPROVER = id(2);
const BYSTANDER = id(3);
const PEOPLE = [DESIGNER, APPROVER, BYSTANDER];
const BIG = "zz-t0147-big";
const SMALL = "zz-t0147-small";
const UNBUILT = "zz-t0147-unbuilt";
const APPROVING = "zz-t0147-approving";
const TASKING = "zz-t0147-tasking";
const DRY = "zz-t0147-dry";
const EVENT = "zzw_record.submitted";

let admin: pg.Client;
let workerPool: pg.Pool;
let worker: SystemDb;

const as = (userId: string) => ({ userId, actingRoleId: null });

const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { hint?: string; code?: string }) => e.hint ?? e.code ?? "no code",
  );

/**
 * What the composition root gives the engine (`relations` in `src/records`). A module's test
 * may not import the composition root, so this stands in for it and answers the one relation these
 * flows use; the real wiring — IAM declaring `role.holder` — is checked where the catalogs are
 * joined.
 */
const relations = {
  resolve: async (_db: SystemDb, code: string, argument: string | null) => {
    if (code !== "role.holder" || !argument) return null;
    const { rows } = await admin.query(
      `select a.user_id from iam.role_assignment a join iam.role r on r.id = a.role_id
        where r.code = $1 order by a.starts_on, a.user_id limit 1`,
      [argument],
    );
    return rows[0]?.user_id ?? null;
  },
};

/** A flow that asks how big the record is and only then decides where to go. */
const branching = {
  trigger: { type: "event", event: EVENT },
  start: "s1",
  steps: [
    { id: "s1", type: "start", next: "s2" },
    {
      id: "s2",
      type: "condition",
      test: { field: "record.amount", op: ">", value: 1000 },
      whenTrue: "s3",
      whenFalse: "s4",
    },
    { id: "s3", type: "end" },
    { id: "s4", type: "end" },
  ],
};

/** A flow whose first step is one the engine has not learned yet. */
const unbuilt = {
  trigger: { type: "event", event: `${EVENT}_other` },
  start: "s1",
  steps: [
    { id: "s1", type: "notify", title: "Haber ver", next: "s2" },
    { id: "s2", type: "end" },
  ],
};

async function publish(key: string, definition: unknown) {
  const versionId = await saveDraft(as(DESIGNER), { key, name: "Deneme motor", definition });
  await recordDryRun(as(DESIGNER), { versionId, passed: true, summary: {} });
  await publishVersion(as(DESIGNER), versionId);
  return versionId;
}

async function cleanUp() {
  // A task is never deleted (REQ-TSK-001); a reset says so explicitly, which is how the other
  // tests clear theirs too.
  const { rows: tasks } = await admin.query(
    `select t.id from tsk.task t
       join wfl.step_state s on s.id = t.source_step_run_id
       join wfl.instance i on i.id = s.instance_id
       join wfl.flow f on f.id = i.flow_id
      where f.key like 'zz-t0147-%'`,
  );
  const taskIds = tasks.map((row: { id: string }) => row.id);
  if (taskIds.length) {
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
  const keys = [BIG, SMALL, UNBUILT, APPROVING, TASKING, DRY];
  await admin.query(
    "delete from wfl.instance where flow_id in (select id from wfl.flow where key = any($1))",
    [keys],
  );
  await admin.query(
    `delete from wfl.dry_run where flow_version_id in (
       select v.id from wfl.flow_version v join wfl.flow f on f.id = v.flow_id
        where f.key = any($1))`,
    [keys],
  );
  await admin.query(
    "delete from wfl.flow_version where flow_id in (select id from wfl.flow where key = any($1))",
    [keys],
  );
  await admin.query("delete from wfl.flow where key = any($1)", [keys]);
  await admin.query("delete from core.event_subscription where event_code like 'zzw_%'");
  await admin.query(
    "delete from core.outbox_delivery where outbox_id in (select id from core.outbox where event_code like 'zzw_%')",
  );
  await admin.query("delete from core.outbox where event_code like 'zzw_%'");
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
     select u.id, 't0147-' || u.n || '@example.test', 'Deneme motor ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  const { rows } = await admin.query("select id from iam.role where code = 'SAH'");
  await admin.query(
    `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
     values ($1, $2, 'company', '{}', iam.today() - 1)`,
    [DESIGNER, rows[0].id],
  );
});

afterAll(async () => {
  await worker?.destroy();
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("a published flow starts listening (REQ-WFL-007)", () => {
  it("writes the engine's subscription when it is published, and not before", async () => {
    const before = await admin.query(
      "select count(*)::int as n from core.event_subscription where event_code = $1",
      [EVENT],
    );
    expect(before.rows[0].n).toBe(0);

    await publish(BIG, branching);

    const after = await admin.query(
      "select subscriber, replayable from core.event_subscription where event_code = $1",
      [EVENT],
    );
    expect(after.rows).toEqual([{ subscriber: "wfl.engine", replayable: false }]);
  });

  it("runs the flow the event asks for, and takes the branch the record deserves", async () => {
    const started = await runEventTriggers(
      worker,
      {
        code: EVENT,
        id: id(600),
        record: { schema: "zzw", table: "record", id: id(700) },
        payload: { amount: 2500 },
      },
      relations,
    );
    expect(started).toHaveLength(1);

    const finished = await readInstance(as(DESIGNER), started[0]);
    expect(finished?.status).toBe("done");
    expect(finished?.stepsTaken).toBe(3);

    const log = await readRunLog(as(DESIGNER), started[0]);
    expect(log.map((line) => [line.kind, line.stepId])).toEqual([
      ["started", null],
      ["entered", "s1"],
      ["left", "s1"],
      ["entered", "s2"],
      ["left", "s2"],
      ["entered", "s3"],
      ["left", "s3"],
      ["ended", null],
    ]);
    // The condition's own answer is in the log, which is what "why did it go this way" reads.
    expect(log.find((line) => line.stepId === "s2" && line.kind === "left")?.detail).toMatchObject({
      status: "done",
      outcome: "true",
    });
  });

  it("takes the other branch for a record the condition refuses", async () => {
    const started = await runEventTriggers(
      worker,
      {
        code: EVENT,
        id: id(601),
        record: { schema: "zzw", table: "record", id: id(701) },
        payload: { amount: 10 },
      },
      relations,
    );
    const log = await readRunLog(as(DESIGNER), started[0]);
    expect(log.filter((line) => line.kind === "entered").map((line) => line.stepId)).toEqual([
      "s1",
      "s2",
      "s4",
    ]);
  });

  it("starts nothing for an event no published flow listens to", async () => {
    expect(
      await runEventTriggers(worker, { code: "zzw_record.ignored", id: id(602) }, relations),
    ).toEqual([]);
  });
});

describe("what the engine cannot do yet, it says (REQ-WFL-025)", () => {
  it("stops with the step's name rather than pretending to take it", async () => {
    await publish(UNBUILT, unbuilt);
    const instanceId = await startInstanceByHand(as(DESIGNER), {
      flowKey: UNBUILT,
      record: { schema: "zzw", table: "record", id: id(702) },
    });
    const result = await runInstance(worker, instanceId!, relations);
    expect(result).toEqual({
      state: "ended",
      status: "failed",
      reason: "motor bu adımı henüz yürütmüyor: notify",
    });

    const stopped = await readInstance(as(DESIGNER), instanceId!);
    expect(stopped?.status).toBe("failed");
    expect(stopped?.failure).toContain("notify");

    const log = await readRunLog(as(DESIGNER), instanceId!);
    expect(log.map((line) => line.kind)).toEqual(["started", "waiting", "ended"]);
  });

  it("runs nothing for an instance that is already over", async () => {
    const { rows } = await admin.query(
      `select i.id from wfl.instance i join wfl.flow f on f.id = i.flow_id
        where f.key = $1 and i.status <> 'running' limit 1`,
      [UNBUILT],
    );
    expect(await runInstance(worker, rows[0].id, relations)).toBeNull();
  });
});

describe("the whole way round: a real event through the real outbox", () => {
  it("delivers to the engine and the flow runs", async () => {
    await publish(SMALL, { ...branching, trigger: { type: "event", event: `${EVENT}_small` } });

    // Published exactly as a module would publish it, in its own transaction.
    const { rows: published } = await admin.query(
      `select core.publish_event($1, 'zzw', 'zzw', 'record', $2, $3::jsonb) as event_id`,
      [`${EVENT}_small`, id(703), JSON.stringify({ amount: 5000 })],
    );
    const eventId = published[0].event_id;

    const { rows: delivery } = await admin.query(
      `select d.id, d.subscriber, d.status from core.outbox_delivery d
         join core.outbox o on o.id = d.outbox_id where o.event_id = $1`,
      [eventId],
    );
    expect(delivery.map((d: { subscriber: string }) => d.subscriber)).toContain("wfl.engine");

    // What the worker does with that delivery, in the worker's own transaction.
    const started = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_small`,
        id: eventId,
        record: { schema: "zzw", table: "record", id: id(703) },
        payload: { amount: 5000 },
      },
      relations,
    );
    expect(started).toHaveLength(1);

    // The same delivery arriving twice is the outbox's normal behaviour, and it changes nothing.
    const again = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_small`,
        id: eventId,
        record: { schema: "zzw", table: "record", id: id(703) },
        payload: { amount: 5000 },
      },
      relations,
    );
    expect(again).toEqual(started);

    const { rows: instances } = await admin.query(
      `select count(*)::int as n from wfl.instance i join wfl.flow f on f.id = i.flow_id
        where f.key = $1`,
      [SMALL],
    );
    expect(instances[0].n).toBe(1);
  });

  it("leaves the instance carrying what the event said", async () => {
    const { rows } = await admin.query(
      `select i.context from wfl.instance i join wfl.flow f on f.id = i.flow_id
        where f.key = $1`,
      [SMALL],
    );
    expect(rows[0].context).toMatchObject({ record: { amount: 5000 } });
  });
});

describe("the approval step (REQ-WFL-012…016, D-099)", () => {
  /** Waits on a named person, and sends each of the three answers somewhere different. */
  const approving = {
    trigger: { type: "event", event: `${EVENT}_approve` },
    start: "a1",
    steps: [
      {
        id: "a1",
        type: "approval",
        title: "Deneme onayı",
        owner: { type: "user", userId: APPROVER },
        outcomes: { approve: "a2", reject: "a3", return: "a1" },
      },
      { id: "a2", type: "end" },
      { id: "a3", type: "end" },
    ],
  };

  let instanceId: string;

  it("stops at the approval and puts it in front of the person who must decide", async () => {
    await publish(APPROVING, approving);
    const started = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_approve`,
        id: id(610),
        record: { schema: "zzw", table: "record", id: id(710) },
        payload: { amount: 42 },
      },
      relations,
    );
    instanceId = started[0];

    const running = await readInstance(as(DESIGNER), instanceId);
    expect(running?.status).toBe("running");

    const waiting = await readMyApprovals(as(APPROVER));
    expect(waiting).toHaveLength(1);
    expect(waiting[0].title).toBe("Deneme onayı");
    expect(waiting[0].record).toEqual({ schema: "zzw", table: "record", id: id(710) });

    // Nobody else is being asked anything.
    expect(await readMyApprovals(as(BYSTANDER))).toEqual([]);
    const log = await readRunLog(as(DESIGNER), instanceId);
    expect(log.at(-1)?.kind).toBe("waiting");
  });

  it("refuses a decision from somebody it does not belong to", async () => {
    const [waiting] = await readMyApprovals(as(APPROVER));
    expect(await errorOf(decideApproval(as(BYSTANDER), waiting.id, "approve"))).toBe(
      "wfl.not_your_approval",
    );
  });

  it("refuses a refusal with no reason (REQ-WFL-015)", async () => {
    const [waiting] = await readMyApprovals(as(APPROVER));
    expect(await errorOf(decideApproval(as(APPROVER), waiting.id, "reject"))).toBe(
      "wfl.reason_required",
    );
    expect(await errorOf(decideApproval(as(APPROVER), waiting.id, "return", "  "))).toBe(
      "wfl.reason_required",
    );
  });

  it("carries on down the path the answer names, once it is answered", async () => {
    const [waiting] = await readMyApprovals(as(APPROVER));
    expect(await decideApproval(as(APPROVER), waiting.id, "approve")).toBe(true);

    // The decision is published; the engine hears it like any other event.
    const resumed = await resumeFromApproval(worker, waiting.id, relations);
    expect(resumed).toEqual({ state: "ended", status: "done" });

    const finished = await readInstance(as(DESIGNER), instanceId);
    expect(finished?.status).toBe("done");

    const log = await readRunLog(as(DESIGNER), instanceId);
    expect(log.filter((line) => line.kind === "entered").map((line) => line.stepId)).toEqual([
      "a1",
      "a2",
    ]);
    expect(log.find((line) => line.stepId === "a1" && line.kind === "left")?.detail).toMatchObject({
      outcome: "approve",
    });
  });

  it("decides once; the same decision arriving again changes nothing", async () => {
    const { rows } = await admin.query("select id from wfl.approval where instance_id = $1", [
      instanceId,
    ]);
    expect(await decideApproval(as(APPROVER), rows[0].id, "reject", "fikrim değişti")).toBe(false);
    expect(await resumeFromApproval(worker, rows[0].id, relations)).toBeNull();
    expect((await readInstance(as(DESIGNER), instanceId))?.status).toBe("done");
  });

  it("sends the flow back to the same step when the answer is a send-back", async () => {
    const started = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_approve`,
        id: id(611),
        record: { schema: "zzw", table: "record", id: id(711) },
        payload: {},
      },
      relations,
    );
    const [waiting] = await readMyApprovals(as(APPROVER));
    expect(await decideApproval(as(APPROVER), waiting.id, "return", "eksik belge")).toBe(true);
    expect(await resumeFromApproval(worker, waiting.id, relations)).toEqual({
      state: "waiting",
      stepId: "a1",
    });

    // The same step is open again, and the person is being asked a second time.
    const again = await readMyApprovals(as(APPROVER));
    expect(again).toHaveLength(1);
    expect(again[0].id).not.toBe(waiting.id);
    expect((await readInstance(as(DESIGNER), started[0]))?.status).toBe("running");
  });
});

describe("the task step (REQ-WFL-005, REQ-TSK-001)", () => {
  /** Waits on a task, and carries on when the task is closed. */
  const tasking = {
    trigger: { type: "event", event: `${EVENT}_task` },
    start: "t1",
    steps: [
      {
        id: "t1",
        type: "task",
        title: "Eksik belgeyi tamamla",
        owner: { type: "user", userId: APPROVER },
        priority: "high",
        next: "t2",
      },
      { id: "t2", type: "end" },
    ],
  };

  /**
   * What the composition root gives the engine: the catalog's actions, called by code. A module's
   * test may not import another module, so the one action these flows use is called here the way
   * TSK's declaration calls it — through the function TSK granted the worker.
   */
  const runtime = {
    ...relations,
    run: async (db: SystemDb, code: string, input: unknown) => {
      if (code !== "task.open") throw new Error(`unexpected action ${code}`);
      const task = input as {
        stepRunId: string;
        title: string;
        assigneeUserId: string;
        priority: string;
      };
      const { rows } = await sql<{ id: string }>`
        select tsk.open_flow_task(${task.stepRunId}::uuid, ${task.title},
                                  ${task.assigneeUserId}::uuid, ${task.priority}) as id`.execute(
        db,
      );
      return rows[0].id;
    },
  };

  let instanceId: string;
  let taskId: string;

  it("opens the task through the catalog's action and waits for it", async () => {
    await publish(TASKING, tasking);
    const started = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_task`,
        id: id(620),
        record: { schema: "zzw", table: "record", id: id(720) },
        payload: {},
      },
      runtime,
    );
    expect(started).toHaveLength(1);
    instanceId = started[0];

    const { rows } = await admin.query(
      `select t.id, t.title, t.assignee_user_id, t.source_type, t.priority
         from tsk.task t join wfl.step_state s on s.id = t.source_step_run_id
         where s.instance_id = $1`,
      [instanceId],
    );
    expect(rows).toHaveLength(1);
    taskId = rows[0].id;
    expect(rows[0].title).toBe("Eksik belgeyi tamamla");
    expect(rows[0].assignee_user_id).toBe(APPROVER);
    expect(rows[0].source_type).toBe("workflow");
    expect(rows[0].priority).toBe("high");

    expect((await readInstance(as(DESIGNER), instanceId))?.status).toBe("running");
    expect((await readRunLog(as(DESIGNER), instanceId)).at(-1)?.detail).toMatchObject({
      waitingFor: "task",
    });
  });

  it("opens one task however often the delivery arrives", async () => {
    await runEventTriggers(
      worker,
      {
        code: `${EVENT}_task`,
        id: id(620),
        record: { schema: "zzw", table: "record", id: id(720) },
        payload: {},
      },
      runtime,
    );
    const { rows } = await admin.query(
      `select count(*)::int as n from tsk.task t join wfl.step_state s on s.id = t.source_step_run_id
        where s.instance_id = $1`,
      [instanceId],
    );
    expect(rows[0].n).toBe(1);
  });

  it("carries on when the task is closed, and says so in the log", async () => {
    // Closed the way a person closes it, as the person it was given to.
    await runAsUser(as(APPROVER), (db) =>
      sql`select tsk.complete_task(${taskId}::uuid)`.execute(db),
    );

    const { rows } = await admin.query(
      "select payload from core.outbox where event_code = 'task.completed' and record_id = $1",
      [taskId],
    );
    const stepRun = rows[0].payload.step_run_id;
    expect(stepRun).toBeTruthy();

    const resumed = await resumeFromTask(worker, stepRun, runtime);
    expect(resumed).toEqual({ state: "ended", status: "done" });
    expect((await readInstance(as(DESIGNER), instanceId))?.status).toBe("done");

    const log = await readRunLog(as(DESIGNER), instanceId);
    expect(log.filter((line) => line.kind === "entered").map((line) => line.stepId)).toEqual([
      "t1",
      "t2",
    ]);
    expect(log.find((line) => line.stepId === "t1" && line.kind === "left")?.detail).toMatchObject({
      outcome: "completed",
    });
  });

  it("does nothing for a task that belongs to no flow", async () => {
    expect(await resumeFromTask(worker, id(999), runtime)).toBeNull();
  });
});

describe("the dry run a publish needs (REQ-WFL-025, SPIKE-05)", () => {
  /** A flow with a branch and a step that waits, so the run has something to report. */
  const draft = {
    trigger: { type: "manual" },
    start: "d1",
    steps: [
      {
        id: "d1",
        type: "condition",
        test: { field: "record.amount", op: ">", value: 1000 },
        whenTrue: "d2",
        whenFalse: "d3",
      },
      {
        id: "d2",
        type: "approval",
        title: "Büyük tutar onayı",
        owner: { type: "user", userId: APPROVER },
        outcomes: { approve: "d3" },
      },
      { id: "d3", type: "end" },
    ],
  };

  let versionId: string;

  it("walks the flow with real data and reports the path it would take", async () => {
    versionId = await saveDraft(as(DESIGNER), { key: DRY, name: "Deneme kuru", definition: draft });

    const report = await dryRunVersion(worker, versionId, { record: { amount: 5000 } }, relations);
    expect(report.passed).toBe(true);
    expect(report.ends).toBe("waiting");
    expect(report.steps).toEqual([
      { stepId: "d1", type: "condition", outcome: "true" },
      { stepId: "d2", type: "approval", outcome: "waiting", owner: APPROVER },
    ]);
  });

  it("takes the other branch for other data, which is what makes it a dry run and not a check", async () => {
    const report = await dryRunVersion(worker, versionId, { record: { amount: 5 } }, relations);
    expect(report.ends).toBe("done");
    expect(report.steps.map((step) => step.stepId)).toEqual(["d1", "d3"]);
  });

  it("writes nothing at all: no instance, no approval, no task", async () => {
    const counts = await admin.query(
      `select
         (select count(*)::int from wfl.instance i join wfl.flow f on f.id = i.flow_id
           where f.key = $1) as instances,
         (select count(*)::int from wfl.approval a join wfl.instance i on i.id = a.instance_id
           join wfl.flow f on f.id = i.flow_id where f.key = $1) as approvals,
         (select count(*)::int from tsk.task t where t.title = 'Büyük tutar onayı') as tasks`,
      [DRY],
    );
    expect(counts.rows[0]).toEqual({ instances: 0, approvals: 0, tasks: 0 });
  });

  it("leaves the evidence a publish looks for", async () => {
    const { rows } = await admin.query(
      `select passed, summary from wfl.dry_run where flow_version_id = $1 order by ran_at`,
      [versionId],
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].passed).toBe(true);
    expect(rows[0].summary.ends).toBe("waiting");
    expect(rows[0].summary.steps).toHaveLength(2);
  });

  it("opens the publish once it has run, and not before", async () => {
    // The evidence above is about this very definition, so the publish is allowed.
    expect(await publishVersion(as(DESIGNER), versionId)).toBe(true);
  });

  it("fails on a step the engine cannot take, and the publish stays shut", async () => {
    const broken = await saveDraft(as(DESIGNER), {
      key: DRY,
      name: "Deneme kuru",
      definition: {
        trigger: { type: "manual" },
        start: "b1",
        steps: [
          { id: "b1", type: "notify", title: "Haber ver", next: "b2" },
          { id: "b2", type: "end" },
        ],
      },
    });
    const report = await dryRunVersion(worker, broken, {}, relations);
    expect(report.passed).toBe(false);
    expect(report.failure).toContain("notify");
    expect(await errorOf(publishVersion(as(DESIGNER), broken))).toBe("wfl.dry_run_required");
  });

  it("fails on a definition that will not parse, instead of throwing", async () => {
    const nonsense = await saveDraft(as(DESIGNER), {
      key: DRY,
      name: "Deneme kuru",
      definition: { trigger: { type: "manual" }, start: "x", steps: [] },
    });
    const report = await dryRunVersion(worker, nonsense, {}, relations);
    expect(report.passed).toBe(false);
    expect(report.ends).toBe("failed");
  });
});
