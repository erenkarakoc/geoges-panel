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
import { Kysely, PostgresDialect } from "kysely";
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
import { resumeFromApproval } from "@/modules/wfl/application/engine";
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
    { id: "s1", type: "task", title: "Düzelt ve yeniden gönder", next: "s2" },
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
  const keys = [BIG, SMALL, UNBUILT, APPROVING];
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
      reason: "motor bu adımı henüz yürütmüyor: task",
    });

    const stopped = await readInstance(as(DESIGNER), instanceId!);
    expect(stopped?.status).toBe("failed");
    expect(stopped?.failure).toContain("task");

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
