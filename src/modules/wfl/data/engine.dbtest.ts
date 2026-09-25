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
import { parseDefinition } from "@/modules/wfl/domain/definition";
import { publishVersion, recordDryRun, saveDraft } from "@/modules/wfl/data/flow-store";
import {
  ConditionTimeout,
  decideApproval,
  locksOn,
  overrideLock,
  readInstance,
  readMyApprovalCount,
  readMyApprovals,
  readRunLog,
  startInstanceByHand,
} from "@/modules/wfl/data/instance-store";
import {
  clockSlot,
  dryRun,
  escalateWaitingApproval,
  dryRunVersion,
  runClockTriggers,
  resumeFromApproval,
  resumeFromTask,
  resumeFromWait,
} from "@/modules/wfl/application/engine";
import { RUNNABLE_STEP_TYPES, STEP_TYPES } from "@/modules/wfl/domain/definition";
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
const APPROVING = "zz-t0147-approving";
const TASKING = "zz-t0147-tasking";
const DRY = "zz-t0147-dry";
const SLEEPY = "zz-t0147-sleepy";
const NIGHTLY = "zz-t0147-nightly";
const PATIENT = "zz-t0147-patient";
const REPEATING = "zz-t0147-repeating";
const BIG_CHANGE = "zz-t0147-bigchange";
const HOLDING = "zz-t0147-holding";
const RAISING = "zz-t0147-raising";
const GROUPED = "zz-t0147-grouped";
const PERSONAL = "zz-t0147-personal";
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

async function publish(key: string, definition: unknown) {
  const versionId = await saveDraft(as(DESIGNER), { key, name: "Deneme motor", definition });
  await recordDryRun(as(DESIGNER), { versionId, passed: true, summary: {} });
  await publishVersion(as(DESIGNER), versionId);
  return versionId;
}

async function cleanUp() {
  await admin.query(
    `delete from wfl.record_lock where instance_id in (
       select i.id from wfl.instance i join wfl.flow f on f.id = i.flow_id
        where f.key like 'zz-t0147-%')`,
  );
  await admin.query(
    "delete from core.scheduled_job where idempotency_key like 'wfl.wake:%' or idempotency_key like 'wfl.escalate:%'",
  );
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
  // Every flow this suite makes, by its shared prefix: a list written by hand forgets the flow
  // somebody adds next, and a run that stays behind makes the event-id guard hand the old run
  // back instead of starting the new one (2026-09-25).
  const keyLike = "zz-t0147-%";
  await admin.query(
    "delete from wfl.instance where flow_id in (select id from wfl.flow where key like $1)",
    [keyLike],
  );
  await admin.query(
    `delete from wfl.dry_run where flow_version_id in (
       select v.id from wfl.flow_version v join wfl.flow f on f.id = v.flow_id
        where f.key like $1)`,
    [keyLike],
  );
  await admin.query(
    "delete from wfl.flow_version where flow_id in (select id from wfl.flow where key like $1)",
    [keyLike],
  );
  await admin.query("delete from wfl.flow where key like $1", [keyLike]);
  await admin.query("delete from core.event_subscription where event_code like 'zzw_%'");
  await admin.query(
    "delete from core.outbox_delivery where outbox_id in (select id from core.outbox where event_code like 'zzw_%')",
  );
  await admin.query("delete from core.outbox where event_code like 'zzw_%'");
  await releaseTestPeople(admin, PEOPLE);
  await admin.query("delete from iam.role_assignment where user_id = any($1::uuid[])", [PEOPLE]);
  await admin.query("delete from iam.user where id = any($1::uuid[])", [PEOPLE]);
  await admin.query("delete from iam.role where code = 'T0147_BACKUP'");
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
  // A role only this test's people hold, so an escalation to it cannot find the panel's real owner.
  await admin.query(
    "insert into iam.role (code, name, level) values ('T0147_BACKUP', 'Deneme yedek onaycı', 10)",
  );
  const { rows: backup } = await admin.query("select id from iam.role where code = 'T0147_BACKUP'");
  await admin.query(
    `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
     values ($1, $2, 'company', '{}', iam.today() - 1)`,
    [BYSTANDER, backup[0].id],
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

/**
 * The engine used to stop at a step it had not learned, and these tests proved it by giving it
 * one. As of D-282 there is no such step: every one of the palette's fourteen is implemented. The
 * guard stays in the engine for the day a fifteenth is added to the palette before it is built —
 * a flow must stop with that step's name rather than skip it quietly — and what is checked here is
 * the state that makes the guard idle, because that is the thing that can change.
 */
describe("every step the palette offers, the engine can take", () => {
  it("leaves nothing in the palette the engine would refuse", () => {
    expect(STEP_TYPES.filter((type) => !RUNNABLE_STEP_TYPES.includes(type))).toEqual([]);
  });

  it("runs nothing for an instance that is already over", async () => {
    const { rows } = await admin.query(
      `select i.id from wfl.instance i join wfl.flow f on f.id = i.flow_id
        where i.status <> 'running' and f.key like 'zz-t0147-%' limit 1`,
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
      { stepId: "d1", type: "condition", outcome: "true", status: "done", about: undefined },
      { stepId: "d2", type: "approval", outcome: "waiting", status: "waiting", owner: APPROVER },
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

describe("waiting for a time, and telling somebody (REQ-WFL-005)", () => {
  /** Tells the person, waits half an hour, then ends. */
  const sleepy = {
    trigger: { type: "event", event: `${EVENT}_sleep` },
    start: "n1",
    steps: [
      {
        id: "n1",
        type: "notify",
        owner: { type: "user", userId: APPROVER },
        subject: "Kayıt incelemeye alındı",
        next: "w1",
      },
      { id: "w1", type: "wait", after: "PT30M", next: "e1" },
      { id: "e1", type: "end" },
    ],
  };

  /** The one action these steps use, as the composition root would call it. */
  const runtime = {
    ...relations,
    run: async (db: SystemDb, code: string, input: unknown) => {
      if (code !== "notification.send") throw new Error(`unexpected action ${code}`);
      const n = input as {
        userId: string;
        type: string;
        subject: string;
        linkPath: string;
        sourceKey: string;
      };
      const { rows } = await sql<{ id: string | null }>`
        select tsk.notify(${n.userId}::uuid, ${n.type}, ${n.subject}, ${n.linkPath},
                          ${n.sourceKey}) as id`.execute(db);
      return rows[0].id;
    },
  };

  let instanceId: string;

  it("sends the notice through the catalog and then goes to sleep", async () => {
    await publish(SLEEPY, sleepy);
    const started = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_sleep`,
        id: id(630),
        record: { schema: "zzw", table: "record", id: id(730) },
        payload: {},
      },
      runtime,
    );
    instanceId = started[0];

    const { rows: notices } = await admin.query(
      "select subject, user_id from tsk.notification where source_key like $1",
      ["wfl:%"],
    );
    expect(notices).toHaveLength(1);
    expect(notices[0].subject).toBe("Kayıt incelemeye alındı");
    expect(notices[0].user_id).toBe(APPROVER);

    const log = await readRunLog(as(DESIGNER), instanceId);
    expect(log.filter((line) => line.kind === "entered").map((line) => line.stepId)).toEqual([
      "n1",
      "w1",
    ]);
    expect(log.at(-1)?.detail).toMatchObject({ waitingFor: "time" });
    expect((await readInstance(as(DESIGNER), instanceId))?.status).toBe("running");
  });

  it("leaves the wake-up in the database, not in anybody's memory", async () => {
    const { rows } = await admin.query(
      `select j.job_type, j.status, j.run_at, j.payload
         from core.scheduled_job j where j.idempotency_key like 'wfl.wake:%'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].job_type).toBe("wfl.wake");
    expect(rows[0].status).toBe("pending");
    // Half an hour from now, give or take the time these assertions took.
    const minutes = (new Date(rows[0].run_at).getTime() - Date.now()) / 60_000;
    expect(minutes).toBeGreaterThan(25);
    expect(minutes).toBeLessThan(31);
  });

  it("carries on when it is woken, and only once", async () => {
    const { rows } = await admin.query(
      "select payload from core.scheduled_job where idempotency_key like 'wfl.wake:%'",
    );
    const stepRunId = rows[0].payload.stepRunId;

    expect(await resumeFromWait(worker, stepRunId, runtime)).toEqual({
      state: "ended",
      status: "done",
    });
    expect((await readInstance(as(DESIGNER), instanceId))?.status).toBe("done");

    // A wake-up that arrives twice finds the step already left.
    expect(await resumeFromWait(worker, stepRunId, runtime)).toBeNull();
  });

  it("says in a dry run how long it would sleep, without scheduling anything", async () => {
    const versionId = await saveDraft(as(DESIGNER), {
      key: SLEEPY,
      name: "Deneme uyku",
      definition: sleepy,
    });
    const before = await admin.query(
      "select count(*)::int as n from core.scheduled_job where idempotency_key like 'wfl.wake:%'",
    );
    const report = await dryRunVersion(worker, versionId, {}, runtime);
    const after = await admin.query(
      "select count(*)::int as n from core.scheduled_job where idempotency_key like 'wfl.wake:%'",
    );

    expect(report.passed).toBe(true);
    expect(report.steps.map((step) => step.stepId)).toEqual(["n1", "w1"]);
    // The report says *that* it would wait and *when*; how that reads is the screen's business.
    expect(report.steps.at(-1)?.outcome).toBe("would_wait");
    expect(report.steps.at(-1)?.at).toBeInstanceOf(Date);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });
});

describe("the flows the clock starts (REQ-WFL-007)", () => {
  const nightly = {
    trigger: { type: "clock", dailyAt: "00:05" },
    start: "c1",
    steps: [{ id: "c1", type: "end" }],
  };

  it("names one slot a day for a daily flow, and one per period for a repeating one", () => {
    const noon = new Date("2026-09-25T09:00:00Z"); // 12:00 in Istanbul
    expect(clockSlot({ dailyAt: "07:30", everyMinutes: null }, noon)).toBe("2026-09-25@07:30");
    // Before its hour, the day has no slot yet.
    expect(clockSlot({ dailyAt: "23:30", everyMinutes: null }, noon)).toBeNull();
    expect(clockSlot({ dailyAt: null, everyMinutes: 30 }, noon)).toBe("2026-09-25#0720");
    expect(clockSlot({ dailyAt: null, everyMinutes: null }, noon)).toBeNull();
  });

  it("names one slot a month for a monthly flow, and none on the other days", () => {
    const monthly = { dailyAt: "06:00", everyMinutes: null, monthlyOn: 25 };
    // The 25th, after six in the morning: this month's slot.
    expect(clockSlot(monthly, new Date("2026-09-25T09:00:00Z"))).toBe("2026-09/2026-09-25@06:00");
    // The same day earlier than its hour, and any other day: nothing to start.
    expect(clockSlot(monthly, new Date("2026-09-25T02:00:00Z"))).toBeNull();
    expect(clockSlot(monthly, new Date("2026-09-24T09:00:00Z"))).toBeNull();
    // Next month is a slot of its own, so the flow runs again then and only then.
    expect(clockSlot(monthly, new Date("2026-10-25T09:00:00Z"))).toBe("2026-10/2026-10-25@06:00");
  });

  it("starts the flow whose moment has come, once for that slot", async () => {
    await publish(NIGHTLY, nightly);
    const now = new Date();
    const started = await runClockTriggers(worker, now, relations);
    expect(started).toHaveLength(1);

    const { rows } = await admin.query(
      `select i.trigger_kind, i.clock_key, i.status from wfl.instance i
         join wfl.flow f on f.id = i.flow_id where f.key = $1`,
      [NIGHTLY],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].trigger_kind).toBe("clock");
    expect(rows[0].status).toBe("done");
    expect(rows[0].clock_key).toContain("@00:05");
  });

  it("starts nothing when the round runs again in the same slot", async () => {
    await runClockTriggers(worker, new Date(), relations);
    const { rows } = await admin.query(
      `select count(*)::int as n from wfl.instance i join wfl.flow f on f.id = i.flow_id
        where f.key = $1`,
      [NIGHTLY],
    );
    expect(rows[0].n).toBe(1);
  });

  it("stops driving a flow that has been turned off", async () => {
    const { rows } = await admin.query("select id from wfl.flow where key = $1", [NIGHTLY]);
    await admin.query(
      "update wfl.flow set disabled_at = now(), disabled_by_user_id = $2 where id = $1",
      [rows[0].id, DESIGNER],
    );
    // A different day would be a different slot; the flow is simply not asked any more.
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(await runClockTriggers(worker, tomorrow, relations)).toEqual([]);
  });
});

describe("an approval that waits too long (REQ-WFL-005, REQ-IAM-020)", () => {
  /** Waits on one person for half an hour, then moves to whoever holds the owner role. */
  const patient = {
    trigger: { type: "event", event: `${EVENT}_patient` },
    start: "p1",
    steps: [
      {
        id: "p1",
        type: "approval",
        title: "Sabırlı onay",
        owner: { type: "user", userId: APPROVER },
        escalation: { after: "PT30M", to: { type: "role", role: "T0147_BACKUP" } },
        outcomes: { approve: "p2" },
      },
      { id: "p2", type: "end" },
    ],
  };

  let approvalId: string;

  it("sets the timer when it opens the approval, once", async () => {
    await publish(PATIENT, patient);
    const started = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_patient`,
        id: id(640),
        record: { schema: "zzw", table: "record", id: id(740) },
        payload: {},
      },
      relations,
    );

    const { rows: approvals } = await admin.query(
      "select id, owner_user_id from wfl.approval where instance_id = $1",
      [started[0]],
    );
    approvalId = approvals[0].id;
    expect(approvals[0].owner_user_id).toBe(APPROVER);

    const { rows: timers } = await admin.query(
      "select job_type, run_at, payload from core.scheduled_job where idempotency_key = $1",
      [`wfl.escalate:${approvalId}`],
    );
    expect(timers).toHaveLength(1);
    expect(timers[0].job_type).toBe("wfl.escalate");
    expect(timers[0].payload.to).toEqual({ type: "role", role: "T0147_BACKUP" });
    const minutes = (new Date(timers[0].run_at).getTime() - Date.now()) / 60_000;
    expect(minutes).toBeGreaterThan(25);
  });

  it("moves the approval to whoever holds the role when the time comes", async () => {
    expect(
      await escalateWaitingApproval(
        worker,
        approvalId,
        { type: "role", role: "T0147_BACKUP" },
        relations,
      ),
    ).toBe(true);

    // It moved, it was not copied: one approval, one person who must answer it.
    expect((await readMyApprovals(as(APPROVER))).map((a) => a.id)).not.toContain(approvalId);
    expect((await readMyApprovals(as(BYSTANDER))).map((a) => a.id)).toContain(approvalId);

    const { rows } = await admin.query(
      `select detail from wfl.run_log where instance_id =
         (select instance_id from wfl.approval where id = $1) and kind = 'waiting'
        order by at desc limit 1`,
      [approvalId],
    );
    expect(rows[0].detail).toMatchObject({ escalated_from: APPROVER, escalated_to: BYSTANDER });
  });

  it("does nothing to an approval that was answered before the timer fired", async () => {
    expect(await decideApproval(as(BYSTANDER), approvalId, "approve")).toBe(true);
    expect(
      await escalateWaitingApproval(
        worker,
        approvalId,
        { type: "role", role: "T0147_BACKUP" },
        relations,
      ),
    ).toBe(false);
  });

  it("says in a dry run when the approval would move, and schedules nothing", async () => {
    const versionId = await saveDraft(as(DESIGNER), {
      key: PATIENT,
      name: "Deneme sabır",
      definition: patient,
    });
    const before = await admin.query(
      "select count(*)::int as n from core.scheduled_job where idempotency_key like 'wfl.escalate:%'",
    );
    const report = await dryRunVersion(worker, versionId, {}, relations);
    const after = await admin.query(
      "select count(*)::int as n from core.scheduled_job where idempotency_key like 'wfl.escalate:%'",
    );

    expect(report.passed).toBe(true);
    expect(report.steps.some((step) => step.outcome === "would_escalate" && step.at)).toBe(true);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });
});

describe("a condition that looks back (REQ-WFL-008, D-100, SPIKE-06)", () => {
  /** Ends quietly the first two times for a record, and takes the other branch after that. */
  const repeating = {
    trigger: { type: "event", event: `${EVENT}_repeat` },
    start: "r1",
    steps: [
      {
        id: "r1",
        type: "condition",
        test: { countOf: "flow_runs", withinDays: 30, op: ">", value: 2 },
        whenTrue: "r2",
        whenFalse: "r3",
      },
      { id: "r2", type: "end" },
      { id: "r3", type: "end" },
    ],
  };

  const trigger = (n: number) =>
    runEventTriggers(
      worker,
      {
        code: `${EVENT}_repeat`,
        id: id(650 + n),
        record: { schema: "zzw", table: "record", id: id(750) },
        payload: {},
      },
      relations,
    );

  it("counts the flow's own history for this record, and takes the branch that count deserves", async () => {
    await publish(REPEATING, repeating);

    // The flow allows many runs for one record, so each trigger opens its own.
    const first = await trigger(1);
    const second = await trigger(2);
    const third = await trigger(3);

    const pathOf = async (instanceId: string) =>
      (await readRunLog(as(DESIGNER), instanceId))
        .filter((line) => line.kind === "entered")
        .map((line) => line.stepId);

    // The first two runs see one and two runs in the window; the third sees three.
    expect(await pathOf(first[0])).toEqual(["r1", "r3"]);
    expect(await pathOf(second[0])).toEqual(["r1", "r3"]);
    expect(await pathOf(third[0])).toEqual(["r1", "r2"]);
  });

  it("writes the number it counted, so the answer can be read afterwards", async () => {
    const { rows } = await admin.query(
      `select l.detail from wfl.run_log l
         join wfl.instance i on i.id = l.instance_id
         join wfl.flow f on f.id = i.flow_id
        where f.key = $1 and l.kind = 'left' and l.step_id = 'r1'
        order by l.at`,
      [REPEATING],
    );
    expect(rows.map((row: { detail: { count: number } }) => row.detail.count)).toEqual([1, 2, 3]);
    expect(rows[0].detail).toMatchObject({ countOf: "flow_runs", withinDays: 30 });
  });

  it("is given a limit of its own, and the database cancels past it (REQ-WFL-008)", async () => {
    // What the engine relies on: past the limit the database stops the statement with 57014, and
    // that is the case it turns into a stopped flow with a reason rather than a quiet "no".
    // Forcing a real timeout on this count would need a table big enough to make counting four
    // rows slow, which this suite does not build; what is checked here is the contract it rests on.
    const cancelled = await errorOf(
      runAsUser(as(DESIGNER), async (db) => {
        await sql.raw("set local statement_timeout = 1").execute(db);
        await sql`select pg_sleep(0.05)`.execute(db);
      }),
    );
    expect(cancelled).toBe("57014");
  });

  it("names the limit when it gives up, so the run log can say why", () => {
    expect(new ConditionTimeout(2000).message).toContain("2000");
  });

  it("says in a dry run that it cannot count a history the run does not have", async () => {
    const versionId = await saveDraft(as(DESIGNER), {
      key: REPEATING,
      name: "Deneme tekrar",
      definition: repeating,
    });
    const report = await dryRunVersion(worker, versionId, {}, relations);
    expect(report.passed).toBe(true);
    expect(report.steps[0]).toMatchObject({ stepId: "r1", outcome: "unknown" });
  });
});

describe("the threshold trigger (REQ-WFL-007, D-103)", () => {
  /** Starts only when the event says the change was bigger than ten per cent. */
  const bigChange = {
    trigger: {
      type: "threshold",
      event: `${EVENT}_price`,
      test: { field: "record.changePercent", op: ">", value: 10 },
    },
    start: "b1",
    steps: [{ id: "b1", type: "end" }],
  };

  const priceChanged = (n: number, changePercent: number) =>
    runEventTriggers(
      worker,
      {
        code: `${EVENT}_price`,
        id: id(660 + n),
        record: { schema: "zzw", table: "record", id: id(760 + n) },
        payload: { changePercent },
      },
      relations,
    );

  it("starts nothing for an event that does not cross the threshold", async () => {
    await publish(BIG_CHANGE, bigChange);
    expect(await priceChanged(1, 4)).toEqual([]);
  });

  it("starts when the event crosses it, carrying what the event said", async () => {
    const started = await priceChanged(2, 25);
    expect(started).toHaveLength(1);

    const { rows } = await admin.query(
      "select trigger_kind, context from wfl.instance where id = $1",
      [started[0]],
    );
    // The trigger kind is still `event`: a threshold flow hears an event like anybody else and
    // then decides. What makes it a threshold is the question it asked, and the answer is the
    // context it carries.
    expect(rows[0].trigger_kind).toBe("event");
    expect(rows[0].context).toMatchObject({ record: { changePercent: 25 } });
  });

  it("asks nothing of an event with nothing to measure, rather than guessing", async () => {
    expect(await priceChanged(3, Number.NaN)).toEqual([]);
  });
});

describe("the lock step (REQ-WFL-029, REQ-WFL-030, D-084)", () => {
  /** Holds one transition shut and carries on; the record stays where it is. */
  const holding = {
    trigger: { type: "event", event: `${EVENT}_hold` },
    start: "h1",
    steps: [
      {
        id: "h1",
        type: "lock",
        transition: "handover.complete",
        reason: "Zimmet kapanmadan çıkış tamamlanamaz",
        next: "h2",
      },
      { id: "h2", type: "end" },
    ],
  };

  const record = { schema: "zzw", table: "record", id: id(770) };
  let lockId: string;

  it("holds the transition and says why, then carries on", async () => {
    await publish(HOLDING, holding);
    const started = await runEventTriggers(
      worker,
      { code: `${EVENT}_hold`, id: id(670), record, payload: {} },
      relations,
    );
    expect((await readInstance(as(DESIGNER), started[0]))?.status).toBe("done");

    const locks = await locksOn(as(DESIGNER), record);
    expect(locks).toHaveLength(1);
    lockId = locks[0].id;
    expect(locks[0].transition).toBe("handover.complete");
    expect(locks[0].reason).toBe("Zimmet kapanmadan çıkış tamamlanamaz");
    expect(locks[0].flowKey).toBe(HOLDING);
  });

  it("holds one lock however often the flow runs", async () => {
    await runEventTriggers(
      worker,
      { code: `${EVENT}_hold`, id: id(671), record, payload: {} },
      relations,
    );
    expect(await locksOn(as(DESIGNER), record)).toHaveLength(1);
  });

  it("refuses to be passed by somebody who is neither the owner layer nor the GM", async () => {
    expect(await errorOf(overrideLock(as(BYSTANDER), lockId, "acelem var"))).toBe(
      "wfl.override_not_allowed",
    );
    expect(await locksOn(as(DESIGNER), record)).toHaveLength(1);
  });

  it("refuses to be passed without a reason, even by the owner", async () => {
    expect(await errorOf(overrideLock(as(DESIGNER), lockId, "  "))).toBe(
      "wfl.override_reason_required",
    );
  });

  it("is passed by the owner with a reason, and the reason is written down", async () => {
    expect(await overrideLock(as(DESIGNER), lockId, "Zimmet elden kapatıldı")).toBe(true);
    expect(await locksOn(as(DESIGNER), record)).toEqual([]);

    const { rows: audit } = await admin.query(
      "select payload from aud.audit_log where event_type = 'lock.overridden' and target_id = $1",
      [lockId],
    );
    expect(audit).toHaveLength(1);
    expect(audit[0].payload).toMatchObject({
      reason: "Zimmet elden kapatıldı",
      transition: "handover.complete",
      flow: HOLDING,
    });

    const { rows: events } = await admin.query(
      "select event_code from core.outbox where record_id = $1",
      [lockId],
    );
    expect(events.map((e: { event_code: string }) => e.event_code)).toContain("lock.overridden");

    // Passed once; a second attempt changes nothing.
    expect(await overrideLock(as(DESIGNER), lockId, "yine")).toBe(false);
  });

  it("stops the flow that asks for a lock without a record, rather than doing nothing", async () => {
    const versionId = await saveDraft(as(DESIGNER), {
      key: HOLDING,
      name: "Deneme kilit",
      definition: { ...holding, trigger: { type: "manual" } },
    });
    await recordDryRun(as(DESIGNER), { versionId, passed: true, summary: {} });
    await publishVersion(as(DESIGNER), versionId);

    const instanceId = await startInstanceByHand(as(DESIGNER), { flowKey: HOLDING });
    const result = await runInstance(worker, instanceId!, relations);
    expect(result?.state).toBe("ended");
    expect((await readInstance(as(DESIGNER), instanceId!))?.failure).toContain("kilit adımı");
  });

  it("says in a dry run what it would hold, and holds nothing", async () => {
    const before = await admin.query("select count(*)::int as n from wfl.record_lock");
    const versionId = await saveDraft(as(DESIGNER), {
      key: HOLDING,
      name: "Deneme kilit",
      definition: holding,
    });
    const report = await dryRunVersion(worker, versionId, {}, relations);
    const after = await admin.query("select count(*)::int as n from wfl.record_lock");

    expect(report.passed).toBe(true);
    expect(report.steps[0]).toMatchObject({
      about: "handover.complete",
      outcome: "would_hold",
      stepId: "h1",
    });
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });
});

describe("parallel paths and the join (REQ-WFL-006, REQ-WFL-011)", () => {
  /** Two paths at once: one only notifies, the other waits on a task. */
  const together = {
    trigger: { type: "event", event: `${EVENT}_split` },
    start: "p1",
    steps: [
      { id: "p1", type: "parallel", paths: ["pa", "pb"], next: "pj" },
      {
        id: "pa",
        type: "notify",
        owner: { type: "user", userId: APPROVER },
        subject: "Sol dal",
      },
      {
        id: "pb",
        type: "task",
        owner: { type: "user", userId: APPROVER },
        title: "Sağ dalın işi",
      },
      { id: "pj", type: "join", next: "pe" },
      { id: "pe", type: "end" },
    ],
  };

  /** A path that cannot find its owner fails, and the run it belongs to must fail with it. */
  const broken = {
    trigger: { type: "event", event: `${EVENT}_broken` },
    start: "b1",
    steps: [
      { id: "b1", type: "parallel", paths: ["ba", "bb"], next: "bj" },
      { id: "ba", type: "notify", owner: { type: "user", userId: APPROVER }, subject: "İyi dal" },
      {
        id: "bb",
        type: "notify",
        owner: { type: "relation", relation: "nobody" },
        subject: "Kötü",
      },
      { id: "bj", type: "join", next: "be" },
      { id: "be", type: "end" },
    ],
  };

  const SPLIT = "zz-t0147-split";
  const BROKEN = "zz-t0147-broken";
  let parentId: string;

  /** One path notifies and the other opens a task, so this run needs both actions. */
  const runtime = {
    ...relations,
    run: async (db: SystemDb, code: string, input: unknown) => {
      if (code === "notification.send") {
        const n = input as {
          userId: string;
          type: string;
          subject: string;
          linkPath: string;
          sourceKey: string;
        };
        await sql`select tsk.notify(${n.userId}::uuid, ${n.type}, ${n.subject}, ${n.linkPath},
                                    ${n.sourceKey})`.execute(db);
        return;
      }
      if (code === "task.open") {
        const t = input as {
          stepRunId: string;
          title: string;
          assigneeUserId: string;
          priority: string;
        };
        await sql`select tsk.open_flow_task(${t.stepRunId}::uuid, ${t.title},
                                            ${t.assigneeUserId}::uuid, ${t.priority})`.execute(db);
        return;
      }
      throw new Error(`unexpected action ${code}`);
    },
  };

  const branchesOf = async (instanceId: string) =>
    (
      await admin.query(
        `select branch_label, status, start_step_id, depth from wfl.instance
          where parent_instance_id = $1 order by branch_label`,
        [instanceId],
      )
    ).rows;

  it("opens a run for every path and waits inside the step until they are done", async () => {
    await publish(SPLIT, together);
    const started = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_split`,
        id: id(680),
        record: { schema: "zzw", table: "record", id: id(780) },
        payload: {},
      },
      runtime,
    );
    parentId = started[0];

    const branches = await branchesOf(parentId);
    expect(branches.map((b) => b.branch_label)).toEqual(["pa", "pb"]);
    expect(branches.map((b) => b.start_step_id)).toEqual(["pa", "pb"]);
    expect(branches.map((b) => b.depth)).toEqual([1, 1]);
    // The notifying path is finished; the one waiting on a task is not, and neither is the parent.
    expect(branches.map((b) => b.status)).toEqual(["done", "running"]);
    expect((await readInstance(as(DESIGNER), parentId))?.status).toBe("running");

    const log = await readRunLog(as(DESIGNER), parentId);
    expect(log.filter((line) => line.kind === "branch_opened")).toHaveLength(2);
    expect(log.at(-1)?.detail).toMatchObject({ waitingFor: "branches", opened: 2 });
  });

  it("carries the parent on when the last path finishes", async () => {
    const { rows } = await admin.query(
      `select t.id from tsk.task t join wfl.step_state s on s.id = t.source_step_run_id
         join wfl.instance i on i.id = s.instance_id where i.parent_instance_id = $1`,
      [parentId],
    );
    expect(rows).toHaveLength(1);
    await runAsUser(as(APPROVER), (db) =>
      sql`select tsk.complete_task(${rows[0].id}::uuid)`.execute(db),
    );
    const { rows: done } = await admin.query(
      "select payload from core.outbox where event_code = 'task.completed' and record_id = $1",
      [rows[0].id],
    );
    await resumeFromTask(worker, done[0].payload.step_run_id, runtime);

    expect((await branchesOf(parentId)).map((b) => b.status)).toEqual(["done", "done"]);
    expect((await readInstance(as(DESIGNER), parentId))?.status).toBe("done");

    const log = await readRunLog(as(DESIGNER), parentId);
    // The parent walked on through the join to the end, once, after the branches came back.
    expect(log.filter((line) => line.kind === "entered").map((line) => line.stepId)).toEqual([
      "p1",
      "pj",
      "pe",
    ]);
    expect(log.find((line) => line.stepId === "p1" && line.kind === "left")?.detail).toMatchObject({
      outcome: "joined",
    });
  });

  it("stops the parent with the branch's own reason when a path fails", async () => {
    await publish(BROKEN, broken);
    const started = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_broken`,
        id: id(681),
        record: { schema: "zzw", table: "record", id: id(781) },
        payload: {},
      },
      runtime,
    );
    const instance = await readInstance(as(DESIGNER), started[0]);
    expect(instance?.status).toBe("failed");
    expect(instance?.failure).toContain("kime düşeceği bulunamadı");
    // The path that worked still ran: a branch is a run of its own and keeps what it did.
    expect((await branchesOf(started[0])).map((b) => b.status)).toEqual(["done", "failed"]);
  });

  it("shows both paths in a dry run and opens no run at all", async () => {
    const before = (
      await admin.query("select count(*)::int as n from wfl.instance where flow_key = $1", [SPLIT])
    ).rows[0].n;
    const report = await dryRun(worker, parseDefinition(together), {}, runtime);
    // The join and the end are not shown: the right-hand path waits on a task, and nothing past
    // it happens until somebody answers (REQ-WFL-025).
    expect(report.steps.map((step) => step.stepId)).toEqual(["p1", "pa", "pb"]);
    expect(report.ends).toBe("waiting");
    expect(
      (
        await admin.query("select count(*)::int as n from wfl.instance where flow_key = $1", [
          SPLIT,
        ])
      ).rows[0].n,
    ).toBe(before);
  });
});

describe("the for-each step (REQ-WFL-009, D-096, D-222)", () => {
  /** One check per item of the module's list; the loop carries on when the last one is done. */
  const eachOne = {
    trigger: { type: "event", event: `${EVENT}_each` },
    start: "f1",
    steps: [
      { id: "f1", type: "for_each", list: "zzw.open_handovers", body: "fb", limit: 5, next: "fe" },
      {
        id: "fb",
        type: "notify",
        owner: { type: "user", userId: APPROVER },
        subject: "Zimmeti kapat",
      },
      { id: "fe", type: "end" },
    ],
  };

  const EACH = "zz-t0147-each";
  /** What the module would answer; the test plays the module the engine never knows about. */
  let handovers: { id: string; label?: string; item?: Record<string, unknown> }[] = [];
  let listAsked: { code: string; recordId: string | null; limitMs: number } | null = null;

  const runtime = {
    ...relations,
    list: async (
      _db: SystemDb,
      code: string,
      ask: { record: { schema: string; table: string; id: string } | null; limitMs: number },
    ) => {
      listAsked = { code, recordId: ask.record?.id ?? null, limitMs: ask.limitMs };
      return handovers;
    },
    run: async (db: SystemDb, code: string, input: unknown) => {
      if (code !== "notification.send") throw new Error(`unexpected action ${code}`);
      const n = input as {
        userId: string;
        type: string;
        subject: string;
        linkPath: string;
        sourceKey: string;
      };
      await sql`select tsk.notify(${n.userId}::uuid, ${n.type}, ${n.subject}, ${n.linkPath},
                                  ${n.sourceKey})`.execute(db);
      return null;
    },
  };

  const branchesOf = async (instanceId: string) =>
    (
      await admin.query(
        `select branch_label, status, start_step_id, context from wfl.instance
          where parent_instance_id = $1 order by branch_label`,
        [instanceId],
      )
    ).rows;

  it("runs the body once for each item, carrying the item into the branch", async () => {
    handovers = [
      { id: "h-1", label: "Matkap", item: { asset: "Matkap" } },
      { id: "h-2", label: "Kask", item: { asset: "Kask" } },
    ];
    await publish(EACH, eachOne);
    const started = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_each`,
        id: id(690),
        record: { schema: "zzw", table: "record", id: id(790) },
        payload: {},
      },
      runtime,
    );

    // The module was asked for its own list, about the record the flow is about, with a limit.
    expect(listAsked).toMatchObject({ code: "zzw.open_handovers", recordId: id(790) });
    expect(listAsked?.limitMs).toBeGreaterThan(0);

    const branches = await branchesOf(started[0]);
    expect(branches.map((b) => b.branch_label)).toEqual(["Kask", "Matkap"]);
    expect(branches.map((b) => b.start_step_id)).toEqual(["fb", "fb"]);
    expect(branches.map((b) => b.context.item.asset)).toEqual(["Kask", "Matkap"]);
    // Both branches only notify, so they are done and the loop has carried the run to its end.
    expect(branches.every((b) => b.status === "done")).toBe(true);
    expect((await readInstance(as(DESIGNER), started[0]))?.status).toBe("done");
  });

  it("carries on without branching when the list is empty", async () => {
    handovers = [];
    const started = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_each`,
        id: id(691),
        record: { schema: "zzw", table: "record", id: id(791) },
        payload: {},
      },
      runtime,
    );
    expect(await branchesOf(started[0])).toHaveLength(0);
    expect((await readInstance(as(DESIGNER), started[0]))?.status).toBe("done");
    expect(
      (await readRunLog(as(DESIGNER), started[0])).find(
        (line) => line.stepId === "f1" && line.kind === "left",
      )?.detail,
    ).toMatchObject({ outcome: "empty" });
  });

  it("stops rather than doing part of the work when the list is longer than the step allows", async () => {
    handovers = Array.from({ length: 6 }, (_, n) => ({ id: `h-${n}` }));
    const started = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_each`,
        id: id(692),
        record: { schema: "zzw", table: "record", id: id(792) },
        payload: {},
      },
      runtime,
    );
    const instance = await readInstance(as(DESIGNER), started[0]);
    expect(instance?.status).toBe("failed");
    expect(instance?.failure).toContain("izin verilenden uzun");
    expect(await branchesOf(started[0])).toHaveLength(0);
  });

  it("refuses a definition that puts one for-each inside another", () => {
    expect(() =>
      parseDefinition({
        trigger: { type: "event", event: `${EVENT}_nested` },
        start: "n1",
        steps: [
          { id: "n1", type: "for_each", list: "zzw.a", body: "n2", next: "n4" },
          { id: "n2", type: "for_each", list: "zzw.b", body: "n3", next: null },
          { id: "n3", type: "end" },
          { id: "n4", type: "end" },
        ],
      }),
    ).toThrow(/her biri için/);
  });
});

describe("a flow inside a flow (REQ-WFL-011, REQ-WFL-018)", () => {
  const INNER = "zz-t0147-inner";
  const OUTER = "zz-t0147-outer";

  /** The ready-made piece: somebody of ours carries the outside party's answer back. */
  const inner = {
    trigger: { type: "manual" },
    start: "i1",
    steps: [
      { id: "i1", type: "task", owner: { type: "user", userId: APPROVER }, title: "Cevabı al" },
      { id: "i2", type: "end" },
    ],
  };

  /** The process that hands that piece the work and waits for it. */
  const outer = {
    trigger: { type: "event", event: `${EVENT}_outer` },
    start: "o1",
    steps: [
      { id: "o1", type: "subflow", flow: INNER, next: "o2" },
      { id: "o2", type: "end" },
    ],
  };

  const runtime = {
    ...relations,
    run: async (db: SystemDb, code: string, input: unknown) => {
      if (code !== "task.open") throw new Error(`unexpected action ${code}`);
      const t = input as {
        stepRunId: string;
        title: string;
        assigneeUserId: string;
        priority: string;
      };
      await sql`select tsk.open_flow_task(${t.stepRunId}::uuid, ${t.title},
                                          ${t.assigneeUserId}::uuid, ${t.priority})`.execute(db);
      return null;
    },
  };

  let outerId: string;

  it("starts the other flow as a child and waits inside the step", async () => {
    await publish(INNER, inner);
    await publish(OUTER, outer);
    const started = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_outer`,
        id: id(700),
        record: { schema: "zzw", table: "record", id: id(800) },
        payload: {},
      },
      runtime,
    );
    outerId = started[0];

    const { rows } = await admin.query(
      `select flow_key, status, depth, record_id from wfl.instance where parent_instance_id = $1`,
      [outerId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].flow_key).toBe(INNER);
    expect(rows[0].depth).toBe(1);
    // The child is about the same record: it is doing part of the same piece of work.
    expect(rows[0].record_id).toBe(id(800));
    expect(rows[0].status).toBe("running");
    expect((await readInstance(as(DESIGNER), outerId))?.status).toBe("running");
  });

  it("carries the parent on when the inner flow ends", async () => {
    const { rows } = await admin.query(
      `select t.id from tsk.task t join wfl.step_state s on s.id = t.source_step_run_id
         join wfl.instance i on i.id = s.instance_id where i.parent_instance_id = $1`,
      [outerId],
    );
    await runAsUser(as(APPROVER), (db) =>
      sql`select tsk.complete_task(${rows[0].id}::uuid)`.execute(db),
    );
    const { rows: done } = await admin.query(
      "select payload from core.outbox where event_code = 'task.completed' and record_id = $1",
      [rows[0].id],
    );
    await resumeFromTask(worker, done[0].payload.step_run_id, runtime);

    expect((await readInstance(as(DESIGNER), outerId))?.status).toBe("done");
    const log = await readRunLog(as(DESIGNER), outerId);
    expect(log.filter((line) => line.kind === "entered").map((line) => line.stepId)).toEqual([
      "o1",
      "o2",
    ]);
    expect(log.find((line) => line.kind === "branch_opened")?.detail).toMatchObject({
      subflow: INNER,
    });
  });

  it("stops the run when the flow it hands the work to is not published", async () => {
    const lonely = {
      trigger: { type: "event", event: `${EVENT}_lonely` },
      start: "l1",
      steps: [
        { id: "l1", type: "subflow", flow: "zz-t0147-missing", next: "l2" },
        { id: "l2", type: "end" },
      ],
    };
    await publish("zz-t0147-lonely", lonely);
    const started = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_lonely`,
        id: id(701),
        record: { schema: "zzw", table: "record", id: id(801) },
        payload: {},
      },
      runtime,
    );
    const instance = await readInstance(as(DESIGNER), started[0]);
    expect(instance?.status).toBe("failed");
    expect(instance?.failure).toContain("çalıştıracağı akış yayımlanmamış");
  });
});

describe("the record step (REQ-WFL-010, D-095, D-080)", () => {
  const MAKING = "zz-t0147-making";
  const CLOSING = "zz-t0147-closing";

  const making = {
    trigger: { type: "event", event: `${EVENT}_make` },
    start: "m1",
    steps: [
      {
        id: "m1",
        type: "record",
        action: "create",
        recordType: "zzw.checklist",
        values: { title: "Çıkış kontrol listesi" },
        next: "m2",
      },
      { id: "m2", type: "end" },
    ],
  };

  const closing = {
    trigger: { type: "event", event: `${EVENT}_close` },
    start: "c1",
    steps: [
      { id: "c1", type: "record", action: "set_status", status: "kesinlesti", next: "c2" },
      { id: "c2", type: "end" },
    ],
  };

  /** The module the engine never knows about: it writes the draft and refuses to finalise. */
  let asked: { code: string; input: Record<string, unknown> }[] = [];
  const runtime = {
    ...relations,
    run: async (_db: SystemDb, code: string, input: unknown) => {
      asked.push({ code, input: input as Record<string, unknown> });
      if (code === "record.set_status" && (input as { status?: string }).status === "kesinlesti") {
        throw new Error("defter yazan kayıt akışla kesinleştirilemez");
      }
      return { id: "zzw-checklist-1", status: "draft" };
    },
  };

  it("makes the draft and carries what wrote it into the module's hands", async () => {
    asked = [];
    await publish(MAKING, making);
    const started = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_make`,
        id: id(710),
        record: { schema: "zzw", table: "record", id: id(810) },
        payload: {},
      },
      runtime,
    );
    expect((await readInstance(as(DESIGNER), started[0]))?.status).toBe("done");

    expect(asked).toHaveLength(1);
    expect(asked[0].code).toBe("record.create");
    expect(asked[0].input).toMatchObject({
      recordType: "zzw.checklist",
      values: { title: "Çıkış kontrol listesi" },
      record: { schema: "zzw", table: "record", id: id(810) },
      // What the new record's own history has to show (REQ-WFL-010).
      flow: { key: MAKING, version: 1, stepId: "m1" },
    });

    const log = await readRunLog(as(DESIGNER), started[0]);
    expect(log.find((line) => line.stepId === "m1" && line.kind === "left")?.detail).toMatchObject({
      outcome: "create",
      written: { id: "zzw-checklist-1", status: "draft" },
    });
  });

  it("stops with the module's own words when it refuses to finalise a ledger", async () => {
    asked = [];
    await publish(CLOSING, closing);
    const started = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_close`,
        id: id(711),
        record: { schema: "zzw", table: "record", id: id(811) },
        payload: {},
      },
      runtime,
    );
    const instance = await readInstance(as(DESIGNER), started[0]);
    expect(instance?.status).toBe("failed");
    expect(instance?.failure).toContain("defter yazan kayıt akışla kesinleştirilemez");
  });

  it("refuses a definition that asks to create without saying what", () => {
    expect(() =>
      parseDefinition({
        trigger: { type: "manual" },
        start: "r1",
        steps: [{ id: "r1", type: "record", action: "create" }],
      }),
    ).toThrow(/tür ister/);
    expect(() =>
      parseDefinition({
        trigger: { type: "manual" },
        start: "r1",
        steps: [{ id: "r1", type: "record", action: "set_status" }],
      }),
    ).toThrow(/durum ister/);
  });
});

describe("the escalation step (REQ-WFL-006, D-282)", () => {
  /** Raises the matter to the person above and carries on; nothing waits on it. */
  const raising = {
    trigger: { type: "event", event: `${EVENT}_raise` },
    start: "e1",
    steps: [
      {
        id: "e1",
        type: "escalate",
        to: { type: "user", userId: BYSTANDER },
        subject: "Şantiye kaydı üç gündür girilmedi",
        next: "e2",
      },
      { id: "e2", type: "end" },
    ],
  };

  /** Both actions this step uses, called the way the modules' declarations call them. */
  const runtime = {
    ...relations,
    run: async (db: SystemDb, code: string, input: unknown) => {
      if (code === "task.open") {
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
      }
      if (code === "notification.send") {
        const note = input as {
          userId: string;
          type: string;
          subject: string;
          linkPath: string;
          sourceKey: string;
        };
        const { rows } = await sql<{ id: string | null }>`
          select tsk.notify(${note.userId}::uuid, ${note.type}, ${note.subject}, ${note.linkPath},
                            ${note.sourceKey}) as id`.execute(db);
        return rows[0].id;
      }
      throw new Error(`unexpected action ${code}`);
    },
  };

  let instanceId: string;

  it("tells the person above and carries on, rather than waiting on them", async () => {
    await publish(RAISING, raising);
    const started = await runEventTriggers(
      worker,
      {
        code: `${EVENT}_raise`,
        id: id(680),
        record: { schema: "zzw", table: "record", id: id(780) },
        payload: {},
      },
      runtime,
    );
    instanceId = started[0];

    // The flow finished; raising something is not waiting for it.
    expect((await readInstance(as(DESIGNER), instanceId))?.status).toBe("done");

    const { rows: tasks } = await admin.query(
      `select t.title, t.assignee_user_id, t.priority from tsk.task t
         join wfl.step_state s on s.id = t.source_step_run_id
        where s.instance_id = $1`,
      [instanceId],
    );
    expect(tasks).toHaveLength(1);
    expect(tasks[0].assignee_user_id).toBe(BYSTANDER);
    expect(tasks[0].priority).toBe("high");
    expect(tasks[0].title).toBe("Şantiye kaydı üç gündür girilmedi");

    const { rows: notices } = await admin.query(
      "select user_id, subject from tsk.notification where source_key like 'wfl:escalate:%'",
    );
    expect(notices).toHaveLength(1);
    expect(notices[0].user_id).toBe(BYSTANDER);
  });

  it("writes in the log who it was raised to", async () => {
    const log = await readRunLog(as(DESIGNER), instanceId);
    const raised = log.find((line) => line.stepId === "e1" && line.kind === "left");
    expect(raised?.detail).toMatchObject({ outcome: "raised", to: BYSTANDER });
  });

  it("stops the run when there is nobody above to tell", async () => {
    const versionId = await saveDraft(as(DESIGNER), {
      key: RAISING,
      name: "Deneme eskalasyon",
      definition: {
        ...raising,
        trigger: { type: "manual" },
        steps: [
          { ...raising.steps[0], to: { type: "role", role: "T0147_NOBODY" } },
          { id: "e2", type: "end" },
        ],
      },
    });
    await recordDryRun(as(DESIGNER), { versionId, passed: true, summary: {} });
    await publishVersion(as(DESIGNER), versionId);

    const orphan = await startInstanceByHand(as(DESIGNER), { flowKey: RAISING });
    await runInstance(worker, orphan!, runtime);
    const stopped = await readInstance(as(DESIGNER), orphan!);
    expect(stopped?.status).toBe("failed");
    expect(stopped?.failure).toContain("haber verilecek kişi bulunamadı");
  });

  it("says in a dry run that it would raise it, and opens nothing", async () => {
    const before = await admin.query(
      "select count(*)::int as n from tsk.notification where source_key like 'wfl:escalate:%'",
    );
    const versionId = await saveDraft(as(DESIGNER), {
      key: RAISING,
      name: "Deneme eskalasyon",
      definition: raising,
    });
    const report = await dryRunVersion(worker, versionId, {}, runtime);
    const after = await admin.query(
      "select count(*)::int as n from tsk.notification where source_key like 'wfl:escalate:%'",
    );

    expect(report.passed).toBe(true);
    expect(report.steps.map((step) => step.stepId)).toEqual(["e1", "e2"]);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });
});

/**
 * Who an approval belongs to (TASK-0120, migration 0057, REQ-WFL-013, REQ-WFL-017, REQ-IAM-020,
 * REQ-IAM-025, REQ-IAM-026).
 *
 * An approval addressed by role belongs to whoever holds that role — not to one of them chosen when
 * the step ran — and any one of them answers it. A delegate sees what the person they stand in for
 * sees. Both are the database's answers, asked from live assignments on every read, so a person
 * leaving or changing role needs no repair anywhere.
 */
describe("an approval addressed to a group", () => {
  const grouped = {
    trigger: { type: "manual" },
    start: "g1",
    steps: [
      {
        id: "g1",
        type: "approval",
        title: "Yedek onaycı kararı",
        owner: { type: "role", role: "T0147_BACKUP" },
        outcomes: { approve: "g2", reject: "g2", return: "g1" },
      },
      { id: "g2", type: "end" },
    ],
  };

  const personal = {
    trigger: { type: "manual" },
    start: "q1",
    steps: [
      {
        id: "q1",
        type: "approval",
        title: "Kişiye düşen karar",
        owner: { type: "user", userId: BYSTANDER },
        outcomes: { approve: "q2" },
      },
      { id: "q2", type: "end" },
    ],
  };

  let groupedInstance: string;

  it("waits for whoever holds the role, and nobody in particular", async () => {
    await publish(GROUPED, grouped);
    groupedInstance = (await startInstanceByHand(as(DESIGNER), { flowKey: GROUPED }))!;
    await runInstance(worker, groupedInstance, relations);

    const { rows } = await admin.query(
      "select owner_user_id, owner_rule from wfl.approval where instance_id = $1",
      [groupedInstance],
    );
    if (!rows.length) {
      const state = await admin.query("select status, failure from wfl.instance where id = $1", [
        groupedInstance,
      ]);
      throw new Error(
        `no approval row; instance ${groupedInstance}: ${JSON.stringify(state.rows)}`,
      );
    }
    // Nobody's row: the rule is what says who, and it is asked again on every read.
    expect(rows[0].owner_user_id).toBeNull();
    expect(rows[0].owner_rule).toEqual({ type: "role", role: "T0147_BACKUP" });
  });

  it("is in the queue of a holder and nowhere else", async () => {
    const holder = await readMyApprovals(as(BYSTANDER));
    const mine = holder.find((one) => one.instanceId === groupedInstance);
    expect(mine?.title).toBe("Yedek onaycı kararı");
    expect(mine?.ownerRule).toEqual({ type: "role", role: "T0147_BACKUP" });
    expect(mine?.delegated).toBe(false);
    // The queue can say where it came from without reading the definition.
    expect(mine?.flowKey).toBe(GROUPED);
    expect(mine?.flowVersion).toBe(1);

    const stranger = await readMyApprovals(as(APPROVER));
    expect(stranger.some((one) => one.instanceId === groupedInstance)).toBe(false);
  });

  it("is answered by a holder, and refused to everybody else", async () => {
    const holder = await readMyApprovals(as(BYSTANDER));
    const mine = holder.find((one) => one.instanceId === groupedInstance);
    expect(await errorOf(decideApproval(as(APPROVER), mine!.id, "approve"))).toBe(
      "wfl.not_your_approval",
    );
    expect(await decideApproval(as(BYSTANDER), mine!.id, "approve")).toBe(true);
  });

  it("counts the same thing the list shows", async () => {
    const list = await readMyApprovals(as(BYSTANDER));
    expect(await readMyApprovalCount(as(BYSTANDER))).toBe(list.length);
  });

  it("lets a delegate see and answer what the person they stand in for would", async () => {
    await publish(PERSONAL, personal);
    const instanceId = (await startInstanceByHand(as(DESIGNER), { flowKey: PERSONAL }))!;
    await runInstance(worker, instanceId, relations);

    // Before the delegation there is nothing to see.
    expect((await readMyApprovals(as(APPROVER))).some((one) => one.instanceId === instanceId)).toBe(
      false,
    );

    const { rows: backup } = await admin.query(
      "select id from iam.role where code = 'T0147_BACKUP'",
    );
    await admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on, ends_on,
                                        is_delegation, delegated_by_user_id)
       values ($1, $2, 'company', '{}', iam.today() - 1, iam.today() + 1, true, $3)`,
      [APPROVER, backup[0].id, BYSTANDER],
    );

    const standing = await readMyApprovals(as(APPROVER));
    const theirs = standing.find((one) => one.instanceId === instanceId);
    expect(theirs?.title).toBe("Kişiye düşen karar");
    // The queue says it is here through a delegation rather than through this person's own place.
    expect(theirs?.delegated).toBe(true);
    expect(await decideApproval(as(APPROVER), theirs!.id, "approve")).toBe(true);
  });
});
