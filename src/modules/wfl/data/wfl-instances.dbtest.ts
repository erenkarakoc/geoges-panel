/**
 * Running flows against the real database (TASK-0117, migration 0046, REQ-WFL-007, 024, 034).
 *
 * The engine itself is not here yet; what is proved is what the engine will stand on. An instance
 * keeps the version it started on while a newer one is published over it, a single-instance flow
 * opens one run per record however many triggers arrive, the same delivery never starts a second
 * run, and a loop that will not end is stopped by the step limit rather than by luck.
 *
 * Steps run in the worker's transaction, so the test uses the worker's own connection for them —
 * the application role cannot call those functions at all, which is also asserted. `npm run test:db`.
 */
import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../../scripts/db-test-people.mjs";
import {
  endInstance,
  enterStep,
  leaveStep,
  noteWaiting,
  readInstance,
  readRunLog,
  startInstance,
  startInstanceByHand,
} from "@/modules/wfl/data/instance-store";
import { publishVersion, recordDryRun, saveDraft } from "@/modules/wfl/data/flow-store";
import { runAsUser } from "@/platform/db";
import { readDatabaseConfig } from "@/platform/db/database-config";
import type { SystemDb } from "@/platform/jobs/types";

const id = (n: number) => `0192f0c1-0146-7000-8000-${String(n).padStart(12, "0")}`;
const DESIGNER = id(1);
const OUTSIDER = id(2);
const STEP_OWNER = id(3);
const PEOPLE = [DESIGNER, OUTSIDER, STEP_OWNER];
const ROLES = ["T0146_OUTSIDER"];
const KEY = "zz-t0146-flow";
const MANY = "zz-t0146-many";
const RECORD = { schema: "zzr", table: "record", id: id(900) };

let admin: pg.Client;
let workerPool: pg.Pool;
let worker: SystemDb;

const as = (userId: string) => ({ userId, actingRoleId: null });

const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { hint?: string; code?: string }) => e.hint ?? e.code ?? "no code",
  );

const definition = (title: string) => ({
  trigger: { type: "event", event: "zzr.record.submitted" },
  steps: [{ id: "s1", type: "approval", title }],
});

/** Writes, dry-runs and publishes one version of a flow, and answers with its version id. */
async function publish(key: string, title: string, singleInstance = true) {
  const versionId = await saveDraft(as(DESIGNER), {
    key,
    name: "Deneme akış",
    definition: definition(title),
    singleInstance,
  });
  await recordDryRun(as(DESIGNER), { versionId, passed: true, summary: {} });
  await publishVersion(as(DESIGNER), versionId);
  return versionId;
}

async function cleanUp() {
  await admin.query(
    `delete from wfl.instance where flow_id in (select id from wfl.flow where key = any($1))`,
    [[KEY, MANY]],
  );
  await admin.query(
    `delete from wfl.dry_run where flow_version_id in (
       select v.id from wfl.flow_version v join wfl.flow f on f.id = v.flow_id
        where f.key = any($1))`,
    [[KEY, MANY]],
  );
  await admin.query(
    "delete from wfl.flow_version where flow_id in (select id from wfl.flow where key = any($1))",
    [[KEY, MANY]],
  );
  await admin.query("delete from wfl.flow where key = any($1)", [[KEY, MANY]]);
  await releaseTestPeople(admin, PEOPLE);
  await admin.query("delete from iam.role_assignment where user_id = any($1::uuid[])", [PEOPLE]);
  await admin.query("delete from iam.user where id = any($1::uuid[])", [PEOPLE]);
  await admin.query("delete from iam.role where code = any($1)", [ROLES]);
}

beforeAll(async () => {
  admin = await connectAdmin();
  workerPool = new pg.Pool(readDatabaseConfig(process.env, undefined, "DATABASE_WORKER_URL"));
  worker = new Kysely({ dialect: new PostgresDialect({ pool: workerPool }) });
  await cleanUp();

  await admin.query(
    "insert into iam.role (code, name, level) values ('T0146_OUTSIDER', 'Deneme akış dışı', 10)",
  );
  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id)
     select u.id, 't0146-' || u.n || '@example.test', 'Deneme örnek ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  const { rows } = await admin.query("select code, id from iam.role where code in ($1, $2)", [
    "SAH",
    "T0146_OUTSIDER",
  ]);
  const roleId = Object.fromEntries(rows.map((r: { code: string; id: string }) => [r.code, r.id]));
  const assign = (user: string, code: string) =>
    admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
       values ($1, $2, 'company', '{}', iam.today() - 1)`,
      [user, roleId[code]],
    );
  await assign(DESIGNER, "SAH");
  await assign(OUTSIDER, "T0146_OUTSIDER");
  await assign(STEP_OWNER, "T0146_OUTSIDER");
});

afterAll(async () => {
  // Kysely owns the pool it was given, so destroying it ends the pool; ending it again throws.
  await worker?.destroy();
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("starting a flow", () => {
  it("starts nothing for a flow that has no published version", async () => {
    await saveDraft(as(DESIGNER), {
      key: KEY,
      name: "Deneme akış",
      definition: definition("Taslak"),
    });
    expect(await startInstance(worker, { flowKey: KEY, kind: "event", record: RECORD })).toBeNull();
  });

  it("binds the instance to the version that was published when it started", async () => {
    const first = await publish(KEY, "Birinci sürüm");
    const instanceId = await startInstance(worker, {
      flowKey: KEY,
      kind: "event",
      record: RECORD,
      context: { reason: "deneme" },
    });
    expect(instanceId).not.toBeNull();

    const { rows } = await admin.query("select flow_version_id from wfl.instance where id = $1", [
      instanceId,
    ]);
    expect(rows[0].flow_version_id).toBe(first);

    // A newer definition goes live; the running instance keeps the one it started on.
    await publish(KEY, "İkinci sürüm");
    const still = await readInstance(as(DESIGNER), instanceId!);
    expect(still?.version).toBe(1);
    expect(still?.status).toBe("running");
  });

  it("returns the run that is already going instead of opening a second one", async () => {
    const again = await startInstance(worker, { flowKey: KEY, kind: "event", record: RECORD });
    const { rows } = await admin.query(
      `select count(*)::int as n from wfl.instance i join wfl.flow f on f.id = i.flow_id
        where f.key = $1 and i.status = 'running'`,
      [KEY],
    );
    expect(rows[0].n).toBe(1);
    expect(again).not.toBeNull();
  });

  it("never starts the same flow twice for the same delivery", async () => {
    const eventId = id(500);
    const one = await startInstance(worker, {
      flowKey: MANY,
      kind: "event",
      record: { ...RECORD, id: id(901) },
      eventId,
    });
    expect(one).toBeNull(); // nothing published for this flow yet

    await publish(MANY, "Çok örnekli", false);
    const first = await startInstance(worker, {
      flowKey: MANY,
      kind: "event",
      record: { ...RECORD, id: id(901) },
      eventId,
    });
    const second = await startInstance(worker, {
      flowKey: MANY,
      kind: "event",
      record: { ...RECORD, id: id(901) },
      eventId,
    });
    expect(second).toBe(first);
  });

  it("opens a second run for the same record when the flow is not single-instance", async () => {
    const other = await startInstance(worker, {
      flowKey: MANY,
      kind: "event",
      record: { ...RECORD, id: id(901) },
    });
    const { rows } = await admin.query(
      `select count(*)::int as n from wfl.instance i join wfl.flow f on f.id = i.flow_id
        where f.key = $1 and i.status = 'running'`,
      [MANY],
    );
    expect(rows[0].n).toBe(2);
    expect(other).not.toBeNull();
  });

  it("lets a person with the design permission start one by hand, and nobody else", async () => {
    const byHand = await startInstanceByHand(as(DESIGNER), {
      flowKey: MANY,
      record: { ...RECORD, id: id(902) },
    });
    expect(byHand).not.toBeNull();
    const { rows } = await admin.query("select trigger_kind from wfl.instance where id = $1", [
      byHand,
    ]);
    expect(rows[0].trigger_kind).toBe("manual");

    expect(
      await errorOf(startInstanceByHand(as(OUTSIDER), { flowKey: MANY, record: RECORD })),
    ).toBe("wfl.design_permission");
  });
});

describe("stepping through it", () => {
  let instanceId: string;

  beforeAll(async () => {
    instanceId = (await startInstance(worker, {
      flowKey: MANY,
      kind: "event",
      record: { ...RECORD, id: id(903) },
    }))!;
  });

  it("enters a step, leaves it, and can enter it again through a back edge", async () => {
    const first = await enterStep(worker, {
      instanceId,
      stepId: "s1",
      stepType: "approval",
      ownerUserId: STEP_OWNER,
    });
    expect(await leaveStep(worker, { stateId: first!, status: "done", outcome: "return" })).toBe(
      true,
    );
    const second = await enterStep(worker, { instanceId, stepId: "s1", stepType: "approval" });
    expect(second).not.toBe(first);
    expect(await leaveStep(worker, { stateId: second!, status: "done", outcome: "approve" })).toBe(
      true,
    );
  });

  it("will not be inside the same step twice at once", async () => {
    const open = await enterStep(worker, { instanceId, stepId: "s2", stepType: "task" });
    expect(await errorOf(enterStep(worker, { instanceId, stepId: "s2", stepType: "task" }))).toBe(
      "23505",
    );
    await leaveStep(worker, { stateId: open!, status: "done" });
  });

  it("writes what happened, in order", async () => {
    await noteWaiting(worker, { instanceId, stepId: "s2", detail: { until: "event" } });
    const log = await readRunLog(as(DESIGNER), instanceId);
    expect(log.map((l) => l.kind)).toEqual([
      "started",
      "entered",
      "left",
      "entered",
      "left",
      "entered",
      "left",
      "waiting",
    ]);
  });

  it("stops a loop that will not end, and says so in the log", async () => {
    const small = (await startInstance(worker, {
      flowKey: MANY,
      kind: "event",
      record: { ...RECORD, id: id(904) },
    }))!;
    // The limit is the engine's own setting; three is this test's, and the rule is the same one.
    for (let i = 0; i < 3; i += 1) {
      const state = await enterStep(
        worker,
        { instanceId: small, stepId: "loop", stepType: "condition" },
        3,
      );
      await leaveStep(worker, { stateId: state!, status: "done" });
    }
    // The fourth try is not an error to retry: the instance is over, and the log says why.
    expect(
      await enterStep(worker, { instanceId: small, stepId: "loop", stepType: "condition" }, 3),
    ).toBeNull();
    const log = await readRunLog(as(DESIGNER), small);
    expect(log.filter((l) => l.kind === "limit")).toHaveLength(1);
    const stopped = await readInstance(as(DESIGNER), small);
    expect(stopped?.status).toBe("failed");
    expect(stopped?.failure).toContain("3");
  });

  it("ends, closes whatever was still open, and announces it", async () => {
    const open = await enterStep(worker, { instanceId, stepId: "s3", stepType: "task" });
    expect(await endInstance(worker, { instanceId, status: "done" })).toBe(true);

    const { rows: steps } = await admin.query("select status from wfl.step_state where id = $1", [
      open,
    ]);
    expect(steps[0].status).toBe("skipped");

    const finished = await readInstance(as(DESIGNER), instanceId);
    expect(finished?.status).toBe("done");
    expect(finished?.endedAt).not.toBeNull();

    const { rows: events } = await admin.query(
      "select event_code from core.outbox where record_id = $1 order by occurred_at, id",
      [instanceId],
    );
    expect(events.map((e: { event_code: string }) => e.event_code)).toEqual([
      "workflow_instance.started",
      "workflow_instance.completed",
    ]);

    // An instance ends once; a second attempt changes nothing.
    expect(await endInstance(worker, { instanceId, status: "failed", failure: "olmaz" })).toBe(
      false,
    );
  });

  it("says which step failed when it fails", async () => {
    const failing = (await startInstance(worker, {
      flowKey: MANY,
      kind: "event",
      record: { ...RECORD, id: id(905) },
    }))!;
    await endInstance(worker, {
      instanceId: failing,
      status: "failed",
      failure: "koşul süre sınırını aştı",
      stepId: "c1",
    });
    const failed = await readInstance(as(DESIGNER), failing);
    expect(failed?.status).toBe("failed");
    expect(failed?.failure).toBe("koşul süre sınırını aştı");
    const { rows } = await admin.query(
      "select event_code from core.outbox where record_id = $1 order by occurred_at desc limit 1",
      [failing],
    );
    expect(rows[0].event_code).toBe("workflow_instance.failed");
  });

  it("will not let the run log be rewritten", async () => {
    expect(
      await errorOf(admin.query("update wfl.run_log set kind = 'ended' where kind = 'started'")),
    ).toBe("wfl.run_log_append_only");
  });
});

describe("who sees a run", () => {
  it("shows nothing to somebody with neither the permission nor a step", async () => {
    const { rows } = await admin.query(
      `select i.id from wfl.instance i join wfl.flow f on f.id = i.flow_id where f.key = $1 limit 1`,
      [MANY],
    );
    expect(await readInstance(as(OUTSIDER), rows[0].id)).toBeNull();
    expect(await readRunLog(as(OUTSIDER), rows[0].id)).toEqual([]);
  });

  it("shows the run to the person a step is waiting on", async () => {
    const { rows } = await admin.query(
      `select s.instance_id from wfl.step_state s where s.owner_user_id = $1 limit 1`,
      [STEP_OWNER],
    );
    expect(await readInstance(as(STEP_OWNER), rows[0].instance_id)).not.toBeNull();
  });

  it("keeps the engine's own steps away from the application role", async () => {
    // Stepping an instance is the engine's, and the engine is the worker. The application role
    // holds no privilege on these functions at all, which is stronger than a policy.
    const { rows } = await admin.query(
      `select i.id from wfl.instance i join wfl.flow f on f.id = i.flow_id where f.key = $1 limit 1`,
      [MANY],
    );
    const refused = await errorOf(
      runAsUser(as(DESIGNER), (db) =>
        sql`select wfl.enter_step(${rows[0].id}::uuid, 's1', 'task')`.execute(db),
      ),
    );
    expect(refused).toBe("42501");
  });
});
