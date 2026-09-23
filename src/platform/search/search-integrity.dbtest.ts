/** Operational source-derived integrity, isolated corruption rolled back (TASK-0110). */
import { readFileSync } from "node:fs";
import pg from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { connectAdmin } from "../../../scripts/db-admin.mjs";
import { functionsOf, restoreNewer } from "../../../scripts/db-replay.mjs";
import { readDatabaseConfig } from "@/platform/db/database-config";
import { kyselyOn } from "@/platform/db/run-as-user";
import { assertSearchIntegrity, type SearchIntegrity } from "@/platform/db/search-integrity";
import { rebuildSearch } from "./rebuild";
import type { SearchRegistration } from "./indexer";

const id = (n: number) => `0192f0c1-0110-7002-8000-${String(n).padStart(12, "0")}`;
const TYPE = "zzi.record";
let admin: pg.Client;
let workerPool: pg.Pool;
let appPool: pg.Pool;
const clean = {
  row_mismatches: "0",
  posting_mismatches: "0",
  bucket_mismatches: "0",
  vocabulary_mismatches: "0",
};
const registration: SearchRegistration = {
  record: { schema: "zzi", table: "record" },
  events: ["zzi.record.changed"],
  project: async () => ({ recordType: TYPE, title: "Söğüt", text: "Söğüt", linkPath: "/today" }),
  scan: async (_db, after) =>
    after
      ? []
      : [
          {
            id: id(1),
            projection: {
              recordType: TYPE,
              title: "Söğüt",
              text: "Söğüt",
              linkPath: "/today",
            },
          },
        ],
};
const adminDb = () =>
  kyselyOn({ query: (text, values) => admin.query(text, values), release() {} });
const report = async () =>
  (await admin.query<SearchIntegrity>("select * from core.search_integrity()")).rows[0];

beforeAll(async () => {
  admin = await connectAdmin();
  workerPool = new pg.Pool(readDatabaseConfig(process.env, undefined, "DATABASE_WORKER_URL"));
  appPool = new pg.Pool(readDatabaseConfig());
});
beforeEach(async () => {
  await admin.query("begin");
  await admin.query("set local statement_timeout='20s'");
  for (const [n, text] of [
    [1, "Söğüt duvarı"],
    [2, "Söğüt paneli"],
    [3, ""],
  ] as const) {
    await admin.query(
      `select core.index_search_row('zzi','record',$1,$2,$3,null,$3,'/today',
      null,null,null,'internal',null,7)`,
      [id(n), TYPE, text || "Tek harf a"],
    );
  }
  expect(await report()).toMatchObject(clean);
});
afterEach(async () => {
  await admin.query("rollback");
});
afterAll(async () => {
  await workerPool.end();
  await appPool.end();
  await admin.end();
});

describe("source-derived search integrity", () => {
  it("allows the actual worker but denies the application role", async () => {
    const worker = await workerPool.connect();
    const app = await appPool.connect();
    try {
      await worker.query("begin read only");
      expect(await assertSearchIntegrity(kyselyOn(worker))).toMatchObject(clean);
      await expect(app.query("select * from core.search_integrity()")).rejects.toMatchObject({
        code: "42501",
      });
      const access =
        await admin.query(`select has_function_privilege('anon','core.search_integrity()','execute') as anon,
        has_function_privilege('authenticated','core.search_integrity()','execute') as authenticated,
        prosecdef, proconfig from pg_proc where oid='core.search_integrity()'::regprocedure`);
      expect(access.rows[0]).toMatchObject({ anon: false, authenticated: false, prosecdef: false });
      expect(access.rows[0].proconfig).toContain("row_security=off");
    } finally {
      await worker.query("rollback");
      worker.release();
      app.release();
    }
  });

  it("detects matching missing words in all three helpers", async () => {
    await admin.query("delete from core.search_posting where record_type=$1 and word='sogut'", [
      TYPE,
    ]);
    await admin.query("delete from core.search_word_bucket where record_type=$1 and word='sogut'", [
      TYPE,
    ]);
    await admin.query("delete from core.search_word where record_type=$1 and word='sogut'", [TYPE]);
    expect(await report()).toMatchObject({
      row_mismatches: "0",
      posting_mismatches: "2",
      bucket_mismatches: "1",
      vocabulary_mismatches: "1",
    });
    await expect(assertSearchIntegrity(adminDb())).rejects.toThrow(
      "Search helpers differ from indexed source rows",
    );
  });

  it("detects an invented word even when all helpers agree", async () => {
    await admin.query(
      `insert into core.search_posting (search_row_id, word, record_type, site_id, project_id,
        record_owner_user_id, data_class, normalization_version, projection_version)
      select r.id, 'invented', r.record_type, r.site_id, r.project_id, r.record_owner_user_id,
        r.data_class, r.normalization_version, r.projection_version
      from core.search_row r where r.record_type=$1 and r.record_id=$2`,
      [TYPE, id(1)],
    );
    await admin.query(
      `insert into core.search_word_bucket(word,record_type,scope_key,data_class,search_document_ids)
      select 'invented',record_type,'company',data_class,array[search_document_id]
      from core.search_row where record_type=$1 and record_id=$2`,
      [TYPE, id(1)],
    );
    await admin.query(
      "insert into core.search_word(word,record_type,record_count) values('invented',$1,1)",
      [TYPE],
    );
    expect(await report()).toMatchObject({
      posting_mismatches: "1",
      bucket_mismatches: "1",
      vocabulary_mismatches: "1",
    });
  });

  it.each([
    "site_id",
    "project_id",
    "record_owner_user_id",
    "record_type",
    "data_class",
    "normalization_version",
    "projection_version",
  ])("detects posting %s drift independently of its word", async (column) => {
    const value = column.endsWith("version")
      ? "99"
      : column.endsWith("_id")
        ? `'${id(99)}'`
        : column === "record_type"
          ? "'zzi.other'"
          : "'commercial'";
    // Column/value come exclusively from the fixed test cases, never external input.
    await admin.query(
      `update core.search_posting set ${column}=${value} where record_type=$1 and word='sogut'`,
      [TYPE],
    );
    expect((await report()).posting_mismatches).toBe("2");
  });

  it.each(["reverse", "duplicate", "missing", "orphan"])("detects %s bucket ids", async (fault) => {
    const { rows } = await admin.query(
      "select search_document_ids as ids from core.search_word_bucket where record_type=$1 and word='sogut'",
      [TYPE],
    );
    const ids: number[] = rows[0].ids;
    const broken =
      fault === "reverse"
        ? [...ids].reverse()
        : fault === "duplicate"
          ? [...ids, ids[0]]
          : fault === "missing"
            ? ids.slice(1)
            : [...ids, 2147483647];
    await admin.query(
      "update core.search_word_bucket set search_document_ids=$2 where record_type=$1 and word='sogut'",
      [TYPE, broken],
    );
    expect(await report()).toMatchObject({ ...clean, bucket_mismatches: "1" });
  });

  it("detects wrong vocabulary counts without changing rows or postings", async () => {
    await admin.query(
      "update core.search_word set record_count=record_count+1 where record_type=$1 and word='sogut'",
      [TYPE],
    );
    expect(await report()).toMatchObject({ ...clean, vocabulary_mismatches: "1" });
  });

  it("detects stale normalization and unfolded text in indexed rows", async () => {
    await admin.query(
      "update core.search_row set normalization_version=99 where record_type=$1 and record_id=$2",
      [TYPE, id(1)],
    );
    await admin.query(
      "update core.search_row set search_text='SÖĞÜT PANELİ' where record_type=$1 and record_id=$2",
      [TYPE, id(2)],
    );
    expect((await report()).row_mismatches).toBe("2");
  });

  it("accepts no-word rows and returns to the baseline after removal", async () => {
    await admin.query(
      "select core.index_search_row('zzi','record',$1,$2,'Başlık',null,'a','/today')",
      [id(4), TYPE],
    );
    expect(await report()).toMatchObject(clean);
    await admin.query("select core.remove_search_row('zzi','record',x) from unnest($1::uuid[]) x", [
      [id(1), id(2), id(3), id(4)],
    ]);
    expect(await report()).toMatchObject(clean);
    expect(
      (
        await admin.query("select count(*)::int as n from core.search_row where record_type=$1", [
          TYPE,
        ])
      ).rows[0].n,
    ).toBe(0);
  });

  it("refuses publication of corrupt helper output and rolls back the attempt", async () => {
    const previous = await admin.query(
      "select id,title,projection_version from core.search_row where record_type=$1 order by id",
      [TYPE],
    );
    await admin.query("savepoint before_corrupt_publication");
    try {
      await admin.query(`create function pg_temp.corrupt_search_bucket() returns trigger language plpgsql as $$
        begin if new.record_type='zzi.record' then new.search_document_ids='{}'; end if; return new; end $$;
        create trigger test_corrupt_search_bucket before insert on core.search_word_bucket
          for each row execute function pg_temp.corrupt_search_bucket()`);
      await expect(rebuildSearch(adminDb(), [registration])).rejects.toThrow(
        "Search helpers differ from indexed source rows",
      );
    } finally {
      await admin.query("rollback to savepoint before_corrupt_publication");
    }
    expect(
      (
        await admin.query(
          "select id,title,projection_version from core.search_row where record_type=$1 order by id",
          [TYPE],
        )
      ).rows,
    ).toEqual(previous.rows);
    expect(await report()).toMatchObject(clean);
  });

  it("rolls the function back and reapplies without touching indexed data", async () => {
    const before = await report();
    const migration = (suffix: string) =>
      readFileSync(
        new URL(`../../../db/migrations/0028_search_integrity${suffix}.sql`, import.meta.url),
        "utf8",
      );
    await admin.query(migration(".down"));
    expect(
      (await admin.query("select to_regprocedure('core.search_integrity()') as f")).rows[0].f,
    ).toBeNull();
    await admin.query(migration(""));
    await restoreNewer(admin, "0028", functionsOf(migration("")));
    expect(await report()).toEqual(before);
  });
});
