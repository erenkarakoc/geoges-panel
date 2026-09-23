/** Real source transactions racing with search publication (TASK-0110, ADR-014, ADR-017). */
import { sql } from "kysely";
import pg from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { connectAdmin } from "../../../scripts/db-admin.mjs";
import { readDatabaseConfig } from "@/platform/db/database-config";
import { publishEvent } from "@/platform/db/events";
import { readSearchChanges } from "@/platform/db/search-rebuild-store";
import { createRunAsUser, kyselyOn } from "@/platform/db/run-as-user";
import type { SystemDb } from "@/platform/jobs/types";
import { createWorker, type Worker } from "@/platform/jobs/worker";
import { searchIndexer, type SearchRegistration } from "./indexer";
import { rebuildSearch } from "./rebuild";
import type { SearchProjection } from "./search";

const P = "zsr";
const MARKER = "TASK-0110 search concurrency test fixture";
const SUBSCRIBER = "zsr.search-test";
const EVENT = "zsr_record.changed";
const REMOVED = "zsr_record.removed";
const id = (n: number) => `0192f0c1-0110-7001-8000-${String(n).padStart(12, "0")}`;
const PERSON = id(1);
const SITE_A = id(10);
const SITE_B = id(11);
const ROLE = "T0110_CONCURRENCY";
let admin: pg.Client;
let workerPool: pg.Pool;
let deliveryPool: pg.Pool;
let appPool: pg.Pool;
let worker: Worker;
let runAsUser: ReturnType<typeof createRunAsUser>;

type Source = { id: string; title: string; site_id: string };
const project = (row: Source): SearchProjection => ({
  recordType: "zsr.record",
  title: row.title,
  text: row.title,
  linkPath: "/today",
  siteId: row.site_id,
  dataClass: "internal",
});
const registration: SearchRegistration = {
  record: { schema: P, table: "source" },
  events: [EVENT],
  removedBy: [REMOVED],
  async project(db, recordId) {
    const result = await sql<Source>`select * from zsr.source where id = ${recordId}::uuid`.execute(
      db as SystemDb,
    );
    return result.rows[0] ? project(result.rows[0]) : null;
  },
  async scan(db, afterId) {
    // One row per page deliberately exposes an insertion behind the UUID cursor.
    const result = await sql<Source>`select * from zsr.source
      where ${afterId}::uuid is null or id > ${afterId}::uuid order by id limit 1`.execute(db);
    return result.rows.map((row) => ({ id: row.id, projection: project(row) }));
  },
};

async function assertFixtureOwnership() {
  const result = await admin.query(
    "select obj_description(oid, 'pg_namespace') as marker from pg_namespace where nspname = $1",
    [P],
  );
  if (result.rows.length && result.rows[0].marker !== MARKER)
    throw new Error("Refusing to clean an unmarked search test schema");
}
async function cleanData() {
  await admin.query(`
    select core.clear_search_buckets(search_document_id) from core.search_row where record_schema = 'zsr';
    delete from core.search_row where record_schema = 'zsr';
    delete from core.search_word where record_type = 'zsr.record';
    delete from core.dead_letter where handler = 'zsr.search-test';
    delete from core.outbox_delivery where outbox_id in (select id from core.outbox where publisher_module = 'zsr');
    delete from core.outbox where publisher_module = 'zsr';
  `);
}
async function cleanUp() {
  await assertFixtureOwnership();
  await cleanData();
  const history = await admin.query(
    `
    select 'iam.user' as t, id from iam.user where id = $1
    union all select 'iam.role_assignment', id from iam.role_assignment where user_id = $1
    union all select 'iam.role', id from iam.role where code = $2
    union all select 'iam.permission', id from iam.permission where module = 'zsr'`,
    [PERSON, ROLE],
  );
  for (const table of new Set(history.rows.map((r) => r.t as string))) {
    await admin.query("select aud.purge_record_history_for_reset($1, $2::uuid[])", [
      table,
      history.rows.filter((r) => r.t === table).map((r) => r.id),
    ]);
  }
  await admin.query("delete from iam.role_assignment where user_id = $1", [PERSON]);
  await admin.query("delete from iam.user where id = $1", [PERSON]);
  await admin.query(
    "delete from iam.role_permission where role_id in (select id from iam.role where code = $1)",
    [ROLE],
  );
  await admin.query("delete from iam.role where code = $1", [ROLE]);
  await admin.query(`delete from iam.permission where module = 'zsr';
    delete from core.event_subscription where subscriber = 'zsr.search-test';
    delete from core.table_layer where schema_name = 'zsr';
    drop schema if exists zsr cascade;`);
}

async function emit(recordId: string, client = admin, code = EVENT) {
  const db = kyselyOn({ query: (text, values) => client.query(text, values), release() {} });
  return publishEvent(db, {
    code,
    module: P,
    record: { schema: P, table: "source", id: recordId },
    payload: { record_id: recordId },
  });
}
async function sourceTransaction(change: () => Promise<void>) {
  await admin.query("begin");
  try {
    await change();
    await admin.query("commit");
  } catch (error) {
    await admin.query("rollback");
    throw error;
  }
}
async function drain() {
  for (let n = 0; n < 12; n++) if (!(await worker.deliverOne())) return;
  throw new Error("Search fixture deliveries did not drain");
}
const activeVersion = async () =>
  Number(
    (
      await admin.query(
        "select coalesce((select version from core.read_model where name = 'core.search'), 1) as version",
      )
    ).rows[0].version,
  );

/** One statement observes rows, postings and buckets under the real application role's RLS. */
function visibleSnapshot() {
  return runAsUser(
    { userId: PERSON, actingRoleId: null },
    async (db) =>
      (
        await sql<{
          record_id: string;
          title: string;
          search_document_id: number;
          projection_version: number;
          words: string[];
          bucket_words: string[];
        }>`
      select r.record_id, r.title, r.search_document_id, r.projection_version,
        array(select p.word from core.search_posting p where p.search_row_id = r.id order by p.word) as words,
        array(select b.word from core.search_word_bucket b where b.record_type = r.record_type
          and r.search_document_id = any(b.search_document_ids) order by b.word) as bucket_words
      from core.search_row r where record_schema = 'zsr' order by record_id`.execute(db)
      ).rows,
  );
}
async function expectConsistent(
  version: number,
  client: pg.Client | pg.PoolClient = admin,
  checkDeliveries = true,
) {
  const diff = await client.query(
    `select count(*)::int as n from zsr.source s full join
    (select * from core.search_row where record_schema = 'zsr') r on r.record_id = s.id
    where s.id is null or r.id is null or r.title <> s.title or r.site_id <> s.site_id
      or r.projection_version <> $1 or r.normalization_version <> core.search_normalization_version()`,
    [version],
  );
  expect(diff.rows[0].n).toBe(0);
  const helpers = await client.query(`with wanted as (
    select r.id, r.search_document_id, r.projection_version, w.word
    from zsr.source s join core.search_row r on r.record_schema = 'zsr' and r.record_id = s.id
    cross join lateral core.search_words(s.title) w(word)
  ) select count(*)::int as n from wanted w full join
    (select * from core.search_posting where record_type = 'zsr.record') p on p.search_row_id = w.id and p.word = w.word
    where w.id is null or p.search_row_id is null or p.projection_version <> w.projection_version
      or p.normalization_version <> core.search_normalization_version()`);
  expect(helpers.rows[0].n).toBe(0);
  const buckets = await client.query(`with wanted as (
    select p.word, core.search_scope_key(r.site_id,r.project_id) as scope_key,
      array_agg(r.search_document_id order by r.search_document_id) as ids
    from core.search_posting p join core.search_row r on r.id=p.search_row_id
    where r.record_schema='zsr' group by 1,2
  ) select count(*)::int as n from wanted w full join
    (select * from core.search_word_bucket where record_type='zsr.record') b using(word,scope_key)
    where w.ids is distinct from b.search_document_ids`);
  expect(buckets.rows[0].n).toBe(0);
  const vocabulary = await client.query(`with wanted as (
    select word, count(*)::int as n from core.search_posting
    where record_type='zsr.record' group by word
  ) select count(*)::int as n from wanted w full join
    (select * from core.search_word where record_type='zsr.record') v using(word)
    where w.n is distinct from v.record_count`);
  expect(vocabulary.rows[0].n).toBe(0);
  if (!checkDeliveries) return;
  const deliveries = await admin.query(
    "select status from core.outbox_delivery where subscriber = $1",
    [SUBSCRIBER],
  );
  expect(deliveries.rows.length).toBeGreaterThan(0);
  expect(deliveries.rows.every((row) => row.status === "done")).toBe(true);
}

function signal() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
async function bounded<T>(promise: Promise<T>, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), 10_000);
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}
async function expectBlocked(waiter: number, holder: number) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const result = await admin.query("select $1::int = any(pg_blocking_pids($2::int)) as blocked", [
      holder,
      waiter,
    ]);
    if (result.rows[0].blocked) return;
    await new Promise((done) => setTimeout(done, 40));
  }
  throw new Error("Search delivery never waited on the publication transaction");
}

beforeAll(async () => {
  admin = await connectAdmin();
  await cleanUp();
  await admin.query(`create schema zsr;
    comment on schema zsr is 'TASK-0110 search concurrency test fixture';
    create table zsr.source (id uuid primary key, title text not null, site_id uuid not null);
    grant usage on schema zsr to geoges_worker;
    grant select on zsr.source to geoges_worker;
    insert into core.table_layer(schema_name,table_name,layer,history) values ('zsr','source','system','none');
    insert into iam.permission(code,module,name,created_from) values ('zsr.module.view','zsr','Deneme arama eşzamanlılığı','seed');
    insert into iam.role(code,name,level) values ('T0110_CONCURRENCY','Deneme arama eşzamanlılığı',10);
    insert into iam.role_permission(role_id,permission_id) select r.id,p.id from iam.role r,iam.permission p
      where r.code='T0110_CONCURRENCY' and p.code='zsr.module.view';`);
  await admin.query(
    "insert into iam.user(id,email,display_name,auth_provider_id) values($1,'search-race@example.test','Deneme arama',$1)",
    [PERSON],
  );
  await admin.query(
    `insert into iam.role_assignment(user_id,role_id,scope_type,scope_ids,starts_on)
    select $1,id,'site',$2,iam.today()-1 from iam.role where code=$3`,
    [PERSON, [SITE_A], ROLE],
  );
  const config = readDatabaseConfig(process.env, undefined, "DATABASE_WORKER_URL");
  workerPool = new pg.Pool({ ...config, max: 2 });
  deliveryPool = new pg.Pool({ ...config, max: 1 });
  appPool = new pg.Pool(readDatabaseConfig());
  runAsUser = createRunAsUser(appPool);
  worker = createWorker({
    pool: deliveryPool,
    registry: {
      subscribers: [{ ...searchIndexer([registration]), name: SUBSCRIBER }],
      jobs: [],
      readModels: [],
    },
  });
  await worker.syncRegistry();
});
beforeEach(async () => {
  await cleanData();
  await sourceTransaction(async () => {
    await admin.query("delete from zsr.source");
    await admin.query("insert into zsr.source values ($1,'İlk kayıt',$3),($2,'Son kayıt',$3)", [
      id(200),
      id(400),
      SITE_A,
    ]);
    await emit(id(200));
    await emit(id(400));
  });
  await drain();
});
afterAll(async () => {
  await workerPool?.end();
  await deliveryPool?.end();
  await appPool?.end();
  if (admin) {
    try {
      await cleanUp();
    } finally {
      await admin.end();
    }
  }
});

describe("search publication with concurrent durable source changes", () => {
  it("pages captured bigint ids numerically across digit and safe-integer boundaries", async () => {
    const holder = await workerPool.connect();
    try {
      await holder.query("begin");
      await holder.query(`create temporary table geoges_search_changes (
        id bigint primary key, event_code text not null, record_id uuid, payload jsonb not null
      ) on commit drop`);
      const ids = ["9", "10", "11", "9007199254740992", "9007199254740993"];
      await holder.query(
        `insert into pg_temp.geoges_search_changes
         select n, $2, null, '{}'::jsonb from unnest($1::bigint[]) n`,
        [ids, EVENT],
      );
      const db = kyselyOn(holder);
      const first = await readSearchChanges(db, "0", 2);
      expect(first.map((event) => event.id)).toEqual(ids.slice(0, 2));
      const second = await readSearchChanges(db, first[1].id, 2);
      expect(second.map((event) => event.id)).toEqual(ids.slice(2, 4));
      const third = await readSearchChanges(db, second[1].id, 2);
      expect(third.map((event) => event.id)).toEqual(ids.slice(4));
      expect(await readSearchChanges(db, third[0].id, 2)).toEqual([]);
    } finally {
      await holder.query("rollback");
      holder.release();
    }
  });

  it.each(["commit", "rollback", "catchup-failure"] as const)(
    "catches changes before publication and preserves delivery after %s",
    async (outcome) => {
      const previousVersion = await activeVersion();
      const previous = await visibleSnapshot();
      expect(previous.map((row) => row.record_id)).toEqual([id(200), id(400)]);
      const holder = await workerPool.connect();
      const reached = signal(),
        resume = signal();
      let building: ReturnType<typeof rebuildSearch> | undefined;
      let delivery: Promise<boolean> | undefined;
      try {
        await holder.query("begin");
        await holder.query("set local statement_timeout='20s'");
        const holderPid = Number(
          (await holder.query("select pg_backend_pid() as pid")).rows[0].pid,
        );
        const deliveryPid = Number(
          (await deliveryPool.query("select pg_backend_pid() as pid")).rows[0].pid,
        );
        let first = true;
        let projected = 0;
        building = rebuildSearch(kyselyOn(holder), [
          {
            ...registration,
            async project(db, recordId) {
              if (outcome === "catchup-failure" && ++projected === 2)
                throw new Error("Catch-up source failed");
              return registration.project(db, recordId);
            },
            async scan(db, after, limit) {
              const page = await registration.scan(db, after, limit);
              if (first) {
                first = false;
                reached.resolve();
                await resume.promise;
              }
              return page;
            },
          },
        ]);
        void building.catch(() => {});
        await bounded(reached.promise, "Source scan did not reach the barrier");
        await sourceTransaction(async () => {
          await admin.query("update zsr.source set title='Taşınan kayıt',site_id=$1 where id=$2", [
            SITE_B,
            id(200),
          ]);
          await emit(id(200));
          await admin.query("delete from zsr.source where id=$1", [id(400)]);
          await emit(id(400), admin, REMOVED);
          await admin.query("insert into zsr.source values($1,'Yeni kayıt',$2)", [id(100), SITE_A]);
          await emit(id(100));
        });
        delivery = worker.deliverOne();
        void delivery.catch(() => {});
        await expectBlocked(deliveryPid, holderPid);
        expect(await visibleSnapshot()).toEqual(previous);
        resume.resolve();
        let published: Awaited<ReturnType<typeof rebuildSearch>> | undefined;
        if (outcome === "catchup-failure") {
          await expect(building).rejects.toThrow("Catch-up source failed");
        } else {
          published = await building;
          expect(published.count).toBe(2);
          expect(published.catchup.events).toBe(3);
          // No delivery has escaped the lock: the publication candidate itself must be current.
          await expectConsistent(published.version, holder, false);
        }
        // Even after writes and helper rebuilding, another transaction sees the old complete index.
        expect(await visibleSnapshot()).toEqual(previous);
        expect(await activeVersion()).toBe(previousVersion);
        await holder.query(outcome === "commit" ? "commit" : "rollback");
        expect(await bounded(delivery, "Blocked delivery did not resume")).toBe(true);
        await drain();
        const version = outcome === "commit" ? published!.version : previousVersion;
        expect(await activeVersion()).toBe(version);
        await expectConsistent(version);
        const visible = await visibleSnapshot();
        expect(visible.map((row) => row.record_id)).toEqual([id(100)]);
        expect(visible[0].words).toEqual(visible[0].bucket_words);
        const moved = await admin.query(
          "select search_document_id from core.search_row where record_schema='zsr' and record_id=$1",
          [id(200)],
        );
        expect(moved.rows[0].search_document_id).toBe(previous[0].search_document_id);
        // The rebuild itself must publish no business events / create notification deliveries.
        expect(
          Number(
            (
              await admin.query(
                "select count(*) as n from core.outbox where publisher_module='zsr'",
              )
            ).rows[0].n,
          ),
        ).toBe(5);
        expect(
          Number(
            (
              await admin.query(
                "select count(*) as n from core.outbox_delivery d join core.outbox o on o.id=d.outbox_id where o.publisher_module='zsr'",
              )
            ).rows[0].n,
          ),
        ).toBe(5);
        const beforeDuplicate = await visibleSnapshot();
        await admin.query(
          "update core.outbox_delivery set status='pending',available_at=now() where subscriber=$1",
          [SUBSCRIBER],
        );
        await drain();
        expect(await visibleSnapshot()).toEqual(beforeDuplicate);
        await expectConsistent(version);
      } finally {
        resume.resolve();
        await building?.catch(() => {});
        await holder.query("rollback");
        await delivery?.catch(() => {});
        holder.release();
      }
    },
  );

  it("includes a late commit whose event id is below the starting high watermark", async () => {
    const late = await connectAdmin();
    const holder = await workerPool.connect();
    const reached = signal(),
      resume = signal();
    let building: ReturnType<typeof rebuildSearch> | undefined;
    try {
      await late.query("begin");
      await late.query("insert into zsr.source values($1,'Geç tamamlanan kayıt',$2)", [
        id(100),
        SITE_A,
      ]);
      const lateEvent = await emit(id(100), late);
      // This larger id commits first, so max(id) alone cannot discover the late event.
      await sourceTransaction(async () => {
        await emit(id(400));
      });
      const initialMax = String(
        (
          await admin.query(
            "select max(id)::text as id from core.outbox where publisher_module='zsr'",
          )
        ).rows[0].id,
      );
      const lateId = String(
        (await late.query("select id::text from core.outbox where event_id=$1", [lateEvent]))
          .rows[0].id,
      );
      expect(BigInt(lateId)).toBeLessThan(BigInt(initialMax));
      await holder.query("begin");
      await holder.query("set local statement_timeout='20s'");
      let first = true;
      building = rebuildSearch(kyselyOn(holder), [
        {
          ...registration,
          async scan(db, after, limit) {
            const page = await registration.scan(db, after, limit);
            if (first) {
              first = false;
              reached.resolve();
              await resume.promise;
            }
            return page;
          },
        },
      ]);
      void building.catch(() => {});
      await bounded(reached.promise, "Source scan did not reach the late-commit barrier");
      await late.query("commit");
      resume.resolve();
      const result = await building;
      expect(result.catchup).toEqual({ events: 1, highWatermark: initialMax });
      expect(result.count).toBe(3);
      await expectConsistent(result.version, holder, false);
      expect((await visibleSnapshot()).map((row) => row.record_id)).toEqual([id(200), id(400)]);
      await holder.query("commit");
      // Verify the published state before any event worker catches up.
      expect((await visibleSnapshot()).map((row) => row.record_id)).toEqual([
        id(100),
        id(200),
        id(400),
      ]);
      await drain();
      await expectConsistent(result.version);
    } finally {
      resume.resolve();
      await building?.catch(() => {});
      await holder.query("rollback");
      holder.release();
      await late.query("rollback");
      await late.end();
    }
  });

  it("leaves events after the captured cut to normal delivery without extending the cut", async () => {
    const holder = await workerPool.connect();
    const scanned = signal(),
      continueScan = signal(),
      captured = signal(),
      continueCatchup = signal();
    let building: ReturnType<typeof rebuildSearch> | undefined;
    try {
      await holder.query("begin");
      await holder.query("set local statement_timeout='20s'");
      let first = true;
      building = rebuildSearch(kyselyOn(holder), [
        {
          ...registration,
          async scan(db, after, limit) {
            const page = await registration.scan(db, after, limit);
            if (first) {
              first = false;
              scanned.resolve();
              await continueScan.promise;
            }
            return page;
          },
          async project(db, recordId) {
            captured.resolve();
            await continueCatchup.promise;
            return registration.project(db, recordId);
          },
        },
      ]);
      void building.catch(() => {});
      await bounded(scanned.promise, "Source scan did not pause");
      await sourceTransaction(async () => {
        await admin.query("update zsr.source set title='Yakalanan kayıt' where id=$1", [id(200)]);
        await emit(id(200));
      });
      continueScan.resolve();
      await bounded(captured.promise, "Catch-up projection did not pause");
      await sourceTransaction(async () => {
        await admin.query("insert into zsr.source values($1,'Sınırdan sonraki kayıt',$2)", [
          id(100),
          SITE_A,
        ]);
        await emit(id(100));
      });
      continueCatchup.resolve();
      const result = await building;
      expect(result.catchup.events).toBe(1);
      expect(result.count).toBe(2);
      await holder.query("commit");
      const published = await visibleSnapshot();
      expect(published.map((row) => row.record_id)).toEqual([id(200), id(400)]);
      expect(published[0].title).toBe("Yakalanan kayıt");
      await drain();
      expect((await visibleSnapshot()).map((row) => row.record_id)).toEqual([
        id(100),
        id(200),
        id(400),
      ]);
      await expectConsistent(result.version);
    } finally {
      continueScan.resolve();
      continueCatchup.resolve();
      await building?.catch(() => {});
      await holder.query("rollback");
      holder.release();
    }
  });

  it("rejects a frozen transaction snapshot before staging any publication", async () => {
    const before = await visibleSnapshot();
    const version = await activeVersion();
    const holder = await workerPool.connect();
    try {
      await holder.query("begin isolation level repeatable read");
      await expect(rebuildSearch(kyselyOn(holder), [registration])).rejects.toThrow(
        "requires READ COMMITTED",
      );
    } finally {
      await holder.query("rollback");
      holder.release();
    }
    expect(await visibleSnapshot()).toEqual(before);
    expect(await activeVersion()).toBe(version);
  });

  it("removes a scanned source through its removal event before publication", async () => {
    const holder = await workerPool.connect();
    const scanned = signal(),
      resume = signal();
    let building: ReturnType<typeof rebuildSearch> | undefined;
    try {
      await holder.query("begin");
      await holder.query("set local statement_timeout='20s'");
      let first = true;
      building = rebuildSearch(kyselyOn(holder), [
        {
          ...registration,
          async scan(db, after, limit) {
            const page = await registration.scan(db, after, limit);
            if (first) {
              first = false;
              scanned.resolve();
              await resume.promise;
            }
            return page;
          },
        },
      ]);
      void building.catch(() => {});
      await bounded(scanned.promise, "Source scan did not pause before deletion");
      await sourceTransaction(async () => {
        await admin.query("delete from zsr.source where id=$1", [id(200)]);
        await emit(id(200), admin, REMOVED);
      });
      resume.resolve();
      const result = await building;
      expect(result.count).toBe(1);
      expect(result.catchup.events).toBe(1);
      await expectConsistent(result.version, holder, false);
      await holder.query("commit");
      expect((await visibleSnapshot()).map((row) => row.record_id)).toEqual([id(400)]);
      await drain();
      await expectConsistent(result.version);
    } finally {
      resume.resolve();
      await building?.catch(() => {});
      await holder.query("rollback");
      holder.release();
    }
  });

  it("does not deliver a rolled-back source change", async () => {
    const before = await visibleSnapshot();
    await admin.query("begin");
    try {
      await admin.query("update zsr.source set title='Geri alınan kayıt' where id=$1", [id(200)]);
      await emit(id(200));
    } finally {
      await admin.query("rollback");
    }
    expect(await worker.deliverOne()).toBe(false);
    expect(await visibleSnapshot()).toEqual(before);
    await expectConsistent(await activeVersion());
  });
});
