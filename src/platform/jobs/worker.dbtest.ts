/**
 * The event backbone against the real database (TASK-0104, ADR-014, SPIKE-03, SPIKE-14, D-259).
 *
 * A throw-away module schema `zzj` holds a source table and the effects written by test
 * subscribers; the worker runs as `geoges_worker` with a test registry, events are published as a
 * signed-in person through `runAsUser`. A dev server's worker may run at the same time: it only
 * takes deliveries and jobs of its own registry, so it never touches these. Probe rows in the
 * core tables are removed afterwards over the admin connection. `npm run test:db`.
 */
import { sql } from "kysely";
import pg from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../scripts/db-admin.mjs";
import { requestRebuild, retryDeadLetter } from "../../../scripts/jobs-cli.mjs";
import { readDatabaseConfig } from "@/platform/db/database-config";
import { publishEvent, scheduleJob } from "@/platform/db/events";
import { createRunAsUser } from "@/platform/db/run-as-user";

import type { DeliveredEvent, JobRegistry, SystemDb } from "./types";
import { createWorker, type Worker } from "./worker";

const P = "zzj";
const PERSON = "0192f0c1-0104-7000-8000-000000000001";

let admin: pg.Client;
let appPool: pg.Pool;
let workerPool: pg.Pool;
let runAsUser: ReturnType<typeof createRunAsUser>;
let worker: Worker;

/** Failure switches the tests flip; the handlers read them. */
const failing = new Set<string>();

const write = (db: SystemDb, subscriber: string, event: DeliveredEvent) =>
  sql`insert into zzj.effect (subscriber, event_id, record_id, seq)
      values (${subscriber}, ${event.id}::uuid, ${event.record?.id ?? null}::uuid,
              ${Number(event.payload.seq ?? 0)})`.execute(db);

const registry: JobRegistry = {
  subscribers: [
    {
      name: "zzj.first",
      events: ["zzj_thing.changed"],
      replayable: false,
      async handle(db, event) {
        await write(db, "zzj.first", event);
        if (failing.has("zzj.first")) throw new Error("first failed on purpose");
      },
    },
    {
      name: "zzj.second",
      events: ["zzj_thing.changed"],
      replayable: false,
      async handle(db, event) {
        await write(db, "zzj.second", event);
      },
    },
    {
      // Keeps the read model live; replayable, so a rebuild may run its logic again.
      name: "zzj.summary",
      events: ["zzj_thing.named"],
      replayable: true,
      async handle(db, event, context) {
        const version = await context.readModelVersion("zzj.summary");
        await applyNames(db, version, [event]);
      },
    },
    {
      // Stands for a notifier: never replayable, must not run during a rebuild.
      name: "zzj.notify",
      events: ["zzj_thing.named"],
      replayable: false,
      async handle(db, event) {
        await write(db, "zzj.notify", event);
      },
    },
  ],
  jobs: [
    {
      type: "zzj.tick",
      async run(db, job) {
        await sql`insert into zzj.effect (subscriber, seq) values ('zzj.tick', ${Number(job.payload.seq ?? 0)})`.execute(
          db,
        );
        if (failing.has("zzj.tick")) throw new Error("tick failed on purpose");
      },
    },
  ],
  readModels: [
    {
      name: "zzj.summary",
      table: "zzj.summary",
      events: ["zzj_thing.named"],
      replay: (db, version, events) => applyNames(db, version, events),
      async compare(db, version) {
        const { rows } = await sql<{ n: number }>`
          select count(*)::int as n from zzj.source s
            full join (select * from zzj.summary where model_version = ${version}) m
              on m.source_id = s.id
           where m.name is distinct from s.name`.execute(db);
        return rows[0].n;
      },
      async clear(db, version) {
        await sql`delete from zzj.summary where model_version = ${version}`.execute(db);
      },
    },
  ],
};

/** Per source record, only a newer event changes the row (SPIKE-14). */
async function applyNames(db: SystemDb, version: number, events: readonly DeliveredEvent[]) {
  for (const e of events) {
    await sql`
      insert into zzj.summary (model_version, source_id, name, event_at)
      values (${version}, ${e.record!.id}::uuid, ${String(e.payload.name)}, ${e.occurredAt})
      on conflict (model_version, source_id) do update
        set name = excluded.name, event_at = excluded.event_at
        where zzj.summary.event_at <= excluded.event_at`.execute(db);
  }
}

async function publish(
  code: string,
  recordId: string,
  payload: Record<string, unknown>,
  { fail = false } = {},
) {
  await runAsUser({ userId: PERSON, actingRoleId: null }, async (db) => {
    await publishEvent(db, {
      code,
      module: P,
      record: { schema: P, table: "source", id: recordId },
      payload,
    });
    if (fail) throw new Error("the source change failed");
  });
}

const effects = async (subscriber: string) =>
  (
    await admin.query(`select record_id, seq from zzj.effect where subscriber = $1 order by id`, [
      subscriber,
    ])
  ).rows as { record_id: string; seq: number }[];

const deliveries = async (subscriber: string) =>
  (
    await admin.query(
      `select d.status, d.attempts, o.payload ->> 'seq' as seq from core.outbox_delivery d
         join core.outbox o on o.id = d.outbox_id
        where d.subscriber = $1 order by d.outbox_id`,
      [subscriber],
    )
  ).rows as { status: string; attempts: number; seq: string }[];

/** Delivers until nothing of this registry is deliverable. */
async function drain() {
  for (let i = 0; i < 100 && (await worker.deliverOne()); i++);
}

const makeDue = () =>
  admin.query(
    `update core.outbox_delivery set available_at = now() where subscriber like 'zzj.%' and status = 'pending';
     update core.scheduled_job set available_at = now() where job_type like 'zzj.%' and status = 'pending';`,
  );

async function cleanUp() {
  await admin.query(`
    delete from core.dead_letter where handler like 'zzj.%';
    delete from core.outbox_delivery where subscriber like 'zzj.%'
       or outbox_id in (select id from core.outbox where publisher_module = '${P}');
    delete from core.outbox where publisher_module = '${P}';
    delete from core.event_subscription where subscriber like 'zzj.%';
    delete from core.dead_letter where scheduled_job_id in
      (select id from core.scheduled_job where job_type like 'zzj.%'
          or (job_type = 'core.read-model-rebuild' and payload ->> 'name' like 'zzj.%'));
    delete from core.scheduled_job where job_type like 'zzj.%'
       or (job_type = 'core.read-model-rebuild' and payload ->> 'name' like 'zzj.%');
    delete from core.read_model where name like 'zzj.%';
    drop schema if exists ${P} cascade;
    delete from core.table_layer where schema_name = '${P}';`);
}

beforeAll(async () => {
  admin = await connectAdmin();
  appPool = new pg.Pool(readDatabaseConfig());
  workerPool = new pg.Pool(readDatabaseConfig(process.env, undefined, "DATABASE_WORKER_URL"));
  runAsUser = createRunAsUser(appPool);
  await cleanUp();
  await admin.query(`
    create schema ${P};
    grant usage on schema ${P} to geoges_app, geoges_worker;
    create table ${P}.source (id uuid primary key, name text not null);
    create table ${P}.effect (
      id bigint generated always as identity primary key,
      subscriber text not null,
      event_id uuid,
      record_id uuid,
      seq integer not null
    );
    create table ${P}.summary (
      model_version integer not null,
      source_id uuid not null,
      name text not null,
      event_at timestamptz not null,
      primary key (model_version, source_id)
    );
    grant select, insert, update on ${P}.source, ${P}.effect, ${P}.summary to geoges_worker;
    grant delete on ${P}.summary to geoges_worker;
    insert into core.table_layer (schema_name, table_name, layer, scope_source) values
      ('${P}', 'source', 'business', 'company'), ('${P}', 'effect', 'business', 'parent'),
      ('${P}', 'summary', 'business', 'company');
  `);
  worker = createWorker({ pool: workerPool, registry });
  await worker.syncRegistry();
});

afterAll(async () => {
  await appPool?.end();
  await workerPool?.end();
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

beforeEach(async () => {
  failing.clear();
  await admin.query(`
    delete from core.dead_letter where handler like 'zzj.%';
    delete from core.outbox_delivery where subscriber like 'zzj.%';
    delete from core.outbox where publisher_module = '${P}';
    truncate ${P}.effect, ${P}.source, ${P}.summary;`);
});

const A = "0192f0c1-0104-7000-8000-00000000000a";
const B = "0192f0c1-0104-7000-8000-00000000000b";

describe("publishing (ADR-014)", () => {
  it("writes nothing when the change that published the event rolls back", async () => {
    await expect(publish("zzj_thing.changed", A, { seq: 1 }, { fail: true })).rejects.toThrow();
    const { rows } = await admin.query(
      `select count(*)::int as n from core.outbox where publisher_module = '${P}'`,
    );
    expect(rows[0].n).toBe(0);
  });

  it("creates one delivery per subscriber in the publishing transaction", async () => {
    await publish("zzj_thing.changed", A, { seq: 1 });
    expect((await deliveries("zzj.first")).map((d) => d.status)).toEqual(["pending"]);
    expect((await deliveries("zzj.second")).map((d) => d.status)).toEqual(["pending"]);
  });

  it("gives the runtime role no direct way into the outbox", async () => {
    const attempt = runAsUser({ userId: PERSON, actingRoleId: null }, (db) =>
      sql`select * from core.outbox`.execute(db),
    );
    await expect(attempt).rejects.toMatchObject({ code: "42501" });
  });
});

describe("delivery (SPIKE-03)", () => {
  it("keeps a record's order while its first delivery is held, and serves other records", async () => {
    await publish("zzj_thing.changed", A, { seq: 1 });
    await publish("zzj_thing.changed", A, { seq: 2 });
    await publish("zzj_thing.changed", B, { seq: 1 });
    const holder = await connectAdmin();
    try {
      await holder.query("begin");
      await holder.query(
        `select d.id from core.outbox_delivery d join core.outbox o on o.id = d.outbox_id
          where d.subscriber = 'zzj.first' and o.record_id = $1 and o.payload ->> 'seq' = '1'
          for update`,
        [A],
      );
      await drain();
      const first = await effects("zzj.first");
      expect(first).toEqual([{ record_id: B, seq: 1 }]);
      await holder.query("rollback");
    } finally {
      await holder.end();
    }
    await drain();
    expect(
      (await effects("zzj.first")).map((e) => `${e.record_id === A ? "A" : "B"}${e.seq}`),
    ).toEqual(["B1", "A1", "A2"]);
  });

  it("rolls the effect back with a failed delivery and waits before trying again", async () => {
    failing.add("zzj.first");
    await publish("zzj_thing.changed", A, { seq: 1 });
    await drain();
    expect(await effects("zzj.first")).toEqual([]);
    const [d] = await deliveries("zzj.first");
    expect([d.status, d.attempts]).toEqual(["pending", 1]);
    const { rows } = await admin.query(
      `select available_at > now() + interval '50 seconds' as later from core.outbox_delivery
        where subscriber = 'zzj.first'`,
    );
    expect(rows[0].later).toBe(true);
  });

  it("does not let one subscriber's failure stop another", async () => {
    failing.add("zzj.first");
    await publish("zzj_thing.changed", A, { seq: 1 });
    await drain();
    expect(await effects("zzj.second")).toEqual([{ record_id: A, seq: 1 }]);
  });

  it("dead-letters after five failures, parks the record, and resumes after a retry by hand", async () => {
    failing.add("zzj.first");
    await publish("zzj_thing.changed", A, { seq: 1 });
    await publish("zzj_thing.changed", A, { seq: 2 });
    for (let i = 0; i < 5; i++) {
      await makeDue();
      await drain();
    }
    expect((await deliveries("zzj.first")).map((d) => [d.status, d.attempts, d.seq])).toEqual([
      ["dead", 5, "1"],
      ["pending", 0, "2"],
    ]);
    const dead = await admin.query(
      "select id from core.dead_letter where handler = 'zzj.first' and resolved_at is null",
    );
    expect(dead.rowCount).toBe(1);
    const alarm = await admin.query(
      `select count(*)::int as n from aud.audit_log where event_type = 'system.dead_letter'
          and payload ->> 'subscriber' = 'zzj.first' and occurred_at > now() - interval '5 minutes'`,
    );
    expect(alarm.rows[0].n).toBeGreaterThanOrEqual(1);

    failing.clear();
    await retryDeadLetter(admin, dead.rows[0].id);
    await drain();
    expect((await effects("zzj.first")).map((e) => e.seq)).toEqual([1, 2]);
  });

  it("never runs a done delivery again and refuses a second delivery row", async () => {
    await publish("zzj_thing.changed", A, { seq: 1 });
    await drain();
    await drain();
    expect(await effects("zzj.second")).toHaveLength(1);
    const again = admin.query(
      `insert into core.outbox_delivery (outbox_id, subscriber, sequence_key)
       select outbox_id, subscriber, sequence_key from core.outbox_delivery
        where subscriber = 'zzj.second'`,
    );
    await expect(again).rejects.toMatchObject({ code: "23505" });
  });

  it("leaves deliveries of subscribers it does not know to other workers", async () => {
    await admin.query(
      "insert into core.event_subscription (subscriber, event_code, replayable) values ('zzj.elsewhere', 'zzj_thing.changed', false)",
    );
    try {
      await publish("zzj_thing.changed", A, { seq: 1 });
      await drain();
      expect((await deliveries("zzj.elsewhere")).map((d) => [d.status, d.attempts])).toEqual([
        ["pending", 0],
      ]);
    } finally {
      await admin.query("delete from core.event_subscription where subscriber = 'zzj.elsewhere'");
    }
  });
});

describe("scheduled jobs", () => {
  it("runs a job once per key and retries a failed one later", async () => {
    const runAt = new Date(Date.now() - 1000);
    await runAsUser({ userId: PERSON, actingRoleId: null }, async (db) => {
      expect(
        await scheduleJob(db, { type: "zzj.tick", runAt, key: "zzj.tick@1", payload: { seq: 1 } }),
      ).toBe(true);
      expect(
        await scheduleJob(db, { type: "zzj.tick", runAt, key: "zzj.tick@1", payload: { seq: 9 } }),
      ).toBe(false);
    });
    for (let i = 0; i < 5 && (await worker.runOneJob()); i++);
    expect((await effects("zzj.tick")).map((e) => e.seq)).toEqual([1]);

    failing.add("zzj.tick");
    await runAsUser({ userId: PERSON, actingRoleId: null }, (db) =>
      scheduleJob(db, { type: "zzj.tick", runAt, key: "zzj.tick@2", payload: { seq: 2 } }),
    );
    await worker.runOneJob();
    const { rows } = await admin.query(
      "select status, attempts from core.scheduled_job where idempotency_key = 'zzj.tick@2'",
    );
    expect(rows[0]).toEqual({ status: "pending", attempts: 1 });
    expect((await effects("zzj.tick")).map((e) => e.seq)).toEqual([1]);
  });
});

describe("read model rebuild (D-233, SPIKE-14)", () => {
  it("replays into a new version, compares, switches, and never runs the notifier again", async () => {
    await admin.query(`insert into ${P}.source values ($1, 'Kavaklı'), ($2, 'Ilgaz')`, [A, B]);
    await publish("zzj_thing.named", A, { name: "Kavak" });
    await publish("zzj_thing.named", A, { name: "Kavaklı" });
    await publish("zzj_thing.named", B, { name: "Ilgaz" });
    await drain();
    expect(await effects("zzj.notify")).toHaveLength(3);

    const result = await worker.rebuildReadModel("zzj.summary");
    expect(result).toEqual({ version: 2, difference: 0 });
    expect(await effects("zzj.notify")).toHaveLength(3);
    const { rows } = await admin.query(
      `select model_version, name from ${P}.summary order by name`,
    );
    expect(rows).toEqual([
      { model_version: 2, name: "Ilgaz" },
      { model_version: 2, name: "Kavaklı" },
    ]);
  });

  it("writes a difference with its sources to the audit log", async () => {
    await admin.query(`insert into ${P}.source values ($1, 'Sarıyar')`, [A]);
    await publish("zzj_thing.named", A, { name: "Sariyar" });
    await drain();
    const { difference, version } = await worker.rebuildReadModel("zzj.summary");
    expect(difference).toBe(1);
    const audit = await admin.query(
      `select payload from aud.audit_log where event_type = 'read_model.rebuilt'
          and payload ->> 'name' = 'zzj.summary' order by occurred_at desc limit 1`,
    );
    expect(audit.rows[0].payload).toEqual({ name: "zzj.summary", version, difference: 1 });
  });

  it("runs a rebuild requested from the command line through the job queue", async () => {
    await requestRebuild(admin, "zzj.summary");
    expect(await worker.runOneJob()).toBe(true);
    const { rows } = await admin.query(
      "select status from core.scheduled_job where job_type = 'core.read-model-rebuild' and payload ->> 'name' = 'zzj.summary'",
    );
    expect(rows.map((r) => r.status)).toEqual(["done"]);
  });
});

describe("the worker role (D-259)", () => {
  it("cannot delete events or create tables", async () => {
    const client = await workerPool.connect();
    try {
      await expect(client.query("delete from core.outbox where false")).rejects.toMatchObject({
        code: "42501",
      });
      await expect(client.query("create table core.x (id int)")).rejects.toMatchObject({
        code: "42501",
      });
    } finally {
      client.release();
    }
  });
});
