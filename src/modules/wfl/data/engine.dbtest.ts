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
import { readInstance, readRunLog, startInstanceByHand } from "@/modules/wfl/data/instance-store";
import { readDatabaseConfig } from "@/platform/db/database-config";
import type { SystemDb } from "@/platform/jobs/types";

const id = (n: number) => `0192f0c1-0147-7000-8000-${String(n).padStart(12, "0")}`;
const DESIGNER = id(1);
const PEOPLE = [DESIGNER];
const BIG = "zz-t0147-big";
const SMALL = "zz-t0147-small";
const UNBUILT = "zz-t0147-unbuilt";
const EVENT = "zzw_record.submitted";

let admin: pg.Client;
let workerPool: pg.Pool;
let worker: SystemDb;

const as = (userId: string) => ({ userId, actingRoleId: null });

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

/** The same shape, but its true branch needs a step the engine has not learned yet. */
const unbuilt = {
  trigger: { type: "event", event: `${EVENT}_other` },
  start: "s1",
  steps: [
    { id: "s1", type: "approval", title: "Koordinatör onayı", next: "s2" },
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
  const keys = [BIG, SMALL, UNBUILT];
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
     values ($1, 't0147@example.test', 'Deneme motor', $1)`,
    [DESIGNER],
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
    const started = await runEventTriggers(worker, {
      code: EVENT,
      id: id(600),
      record: { schema: "zzw", table: "record", id: id(700) },
      payload: { amount: 2500 },
    });
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
    const started = await runEventTriggers(worker, {
      code: EVENT,
      id: id(601),
      record: { schema: "zzw", table: "record", id: id(701) },
      payload: { amount: 10 },
    });
    const log = await readRunLog(as(DESIGNER), started[0]);
    expect(log.filter((line) => line.kind === "entered").map((line) => line.stepId)).toEqual([
      "s1",
      "s2",
      "s4",
    ]);
  });

  it("starts nothing for an event no published flow listens to", async () => {
    expect(await runEventTriggers(worker, { code: "zzw_record.ignored", id: id(602) })).toEqual([]);
  });
});

describe("what the engine cannot do yet, it says (REQ-WFL-025)", () => {
  it("stops with the step's name rather than pretending to take it", async () => {
    await publish(UNBUILT, unbuilt);
    const instanceId = await startInstanceByHand(as(DESIGNER), {
      flowKey: UNBUILT,
      record: { schema: "zzw", table: "record", id: id(702) },
    });
    const result = await runInstance(worker, instanceId!);
    expect(result).toEqual({
      state: "ended",
      status: "failed",
      reason: "motor bu adımı henüz yürütmüyor: approval",
    });

    const stopped = await readInstance(as(DESIGNER), instanceId!);
    expect(stopped?.status).toBe("failed");
    expect(stopped?.failure).toContain("approval");

    const log = await readRunLog(as(DESIGNER), instanceId!);
    expect(log.map((line) => line.kind)).toEqual(["started", "waiting", "ended"]);
  });

  it("runs nothing for an instance that is already over", async () => {
    const { rows } = await admin.query(
      `select i.id from wfl.instance i join wfl.flow f on f.id = i.flow_id
        where f.key = $1 and i.status <> 'running' limit 1`,
      [UNBUILT],
    );
    expect(await runInstance(worker, rows[0].id)).toBeNull();
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
    const started = await runEventTriggers(worker, {
      code: `${EVENT}_small`,
      id: eventId,
      record: { schema: "zzw", table: "record", id: id(703) },
      payload: { amount: 5000 },
    });
    expect(started).toHaveLength(1);

    // The same delivery arriving twice is the outbox's normal behaviour, and it changes nothing.
    const again = await runEventTriggers(worker, {
      code: `${EVENT}_small`,
      id: eventId,
      record: { schema: "zzw", table: "record", id: id(703) },
      payload: { amount: 5000 },
    });
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
