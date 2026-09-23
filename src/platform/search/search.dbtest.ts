/**
 * Site-wide search against the real database (TASK-0110, REQ-NFR-012, ADR-017, D-247, D-266).
 *
 * A throw-away module `zzs` stands in for a module that owns records: its permissions, two test
 * roles and people are written over the admin connection and removed afterwards, together with
 * every search row they produced. `npm run test:db`.
 */
import { readFileSync } from "node:fs";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../scripts/db-test-people.mjs";
import { readDatabaseConfig } from "@/platform/db/database-config";
import { kyselyOn } from "@/platform/db/run-as-user";
import { createRunSearchAsUser } from "@/platform/db/run-search-as-user";
import {
  indexSearchRow,
  removeSearchRow,
  searchRecords,
  suggestWord,
} from "@/platform/db/search-store";
import type { DeliveredEvent } from "@/platform/jobs/types";
import { searchIndexer, type SearchRegistration } from "@/platform/search/indexer";
import type { SearchProjection } from "@/platform/search/search";
import { searchFor } from "@/platform/search/service";
import { recentSearchFor } from "@/platform/search/service";
import { rebuildSearch } from "@/platform/search/rebuild";

const id = (n: number) => `0192f0c1-0110-7000-8000-${String(n).padStart(12, "0")}`;
const VIEWER_A = id(1);
const VIEWER_B = id(2);
const FINANCE_A = id(3);
const PEOPLE = [VIEWER_A, VIEWER_B, FINANCE_A];
const SITE_A = id(101);
const SITE_B = id(102);
const ROLES = ["T0110_SITE", "T0110_FIN", "T0110_OWN"];
const P = "zzs";

let admin: pg.Client;
let workerPool: pg.Pool;
let appPool: pg.Pool;
const role: Record<string, string> = {};

const as = (userId: string) => ({ userId, actingRoleId: null });

/** The records the throw-away module owns, as its projection would read them. */
const records: Record<string, SearchProjection & { site: string }> = {
  [id(201)]: {
    site: SITE_A,
    recordType: `${P}.site`,
    title: "Söğüt Şantiyesi",
    secondary: "Kavaklı projesi",
    text: "Söğüt Şantiyesi Kavaklı istinat duvarı",
    linkPath: "/today",
    siteId: SITE_A,
    dataClass: "internal",
  },
  [id(202)]: {
    site: SITE_B,
    recordType: `${P}.site`,
    title: "Ilgaz Şantiyesi",
    secondary: "Ilgaz projesi",
    text: "Ilgaz Şantiyesi kuzey dolgu",
    linkPath: "/today",
    siteId: SITE_B,
    dataClass: "internal",
  },
  [id(203)]: {
    site: SITE_A,
    recordType: `${P}.quote`,
    title: "Teklif 2026-118",
    secondary: "Söğüt İnşaat",
    text: "Teklif 2026-118 Söğüt İnşaat",
    linkPath: "/today",
    siteId: SITE_A,
    dataClass: "commercial",
  },
};

const registration: SearchRegistration = {
  record: { schema: P, table: "record" },
  events: [`${P}.record.saved`],
  removedBy: [`${P}.record.removed`],
  project: async (_db, recordId) => records[recordId] ?? null,
  scan: async (_db, afterId, limit) =>
    Object.keys(records)
      .sort()
      .filter((id) => !afterId || id > afterId)
      .slice(0, limit)
      .map((id) => ({ id, projection: records[id] })),
};

/** Runs one event through the indexer, as the worker would. */
async function deliver(code: string, recordId: string, occurredAt = new Date()) {
  const client = await workerPool.connect();
  try {
    await client.query("begin");
    await searchIndexer([registration]).handle(
      kyselyOn(client),
      { code, payload: { record_id: recordId }, occurredAt } as unknown as DeliveredEvent,
      { readModelVersion: async () => 1 },
    );
    await client.query("commit");
  } finally {
    client.release();
  }
}

const titlesFor = async (userId: string, query: string) => {
  const answer = await searchFor(as(userId), query);
  return answer.groups.flatMap((group) => group.hits.map((hit) => hit.title));
};

async function cleanUp() {
  await admin.query(
    `select core.clear_search_buckets(search_document_id) from core.search_row
      where record_schema = $1`,
    [P],
  );
  await admin.query("delete from core.search_row where record_schema = $1", [P]);
  await admin.query(
    `delete from core.search_word w
      where not exists (select from core.search_posting p
                         where p.word = w.word and p.record_type = w.record_type)`,
  );
  const { rows } = await admin.query(
    `select 'iam.role_assignment' as t, id from iam.role_assignment where user_id = any($1)
     union all select 'iam.user', id from iam.user where id = any($1)
     union all select 'iam.role', id from iam.role where code = any($2)
     union all select 'iam.permission', id from iam.permission where module = '${P}'`,
    [PEOPLE, ROLES],
  );
  for (const table of new Set(rows.map((r) => r.t as string))) {
    await admin.query("select aud.purge_record_history_for_reset($1, $2::uuid[])", [
      table,
      rows.filter((r) => r.t === table).map((r) => r.id),
    ]);
  }
  await releaseTestPeople(admin, PEOPLE);
  await admin.query("delete from iam.role_assignment where user_id = any($1)", [PEOPLE]);
  await admin.query("delete from iam.user where id = any($1)", [PEOPLE]);
  await admin.query(
    `delete from iam.role_permission where role_id in (select id from iam.role where code = any($1))
        or permission_id in (select id from iam.permission where module = '${P}')`,
    [ROLES],
  );
  await admin.query(
    "delete from iam.role_data_class where role_id in (select id from iam.role where code = any($1))",
    [ROLES],
  );
  await admin.query("delete from iam.role where code = any($1)", [ROLES]);
  await admin.query(`delete from iam.permission where module = '${P}'`);
}

beforeAll(async () => {
  admin = await connectAdmin();
  workerPool = new pg.Pool(readDatabaseConfig(process.env, undefined, "DATABASE_WORKER_URL"));
  appPool = new pg.Pool(readDatabaseConfig());
  await cleanUp();
  await admin.query(`
    insert into iam.permission (code, module, name, created_from) values
      ('${P}.module.view', '${P}', 'Deneme: görür', 'seed');
    insert into iam.role (code, name, level) values
      ('T0110_SITE', 'Deneme şantiye', 10), ('T0110_FIN', 'Deneme finans', 20);
    insert into iam.role_permission (role_id, permission_id)
      select r.id, p.id from iam.role r, iam.permission p
       where r.code = any(array['T0110_SITE', 'T0110_FIN']) and p.module = '${P}';
    insert into iam.role_data_class (role_id, module, can_see_commercial)
      select id, '${P}', true from iam.role where code = 'T0110_FIN';
  `);
  const { rows } = await admin.query("select code, id from iam.role where code = any($1)", [ROLES]);
  for (const r of rows) role[r.code] = r.id;
  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id)
     select u.id, 't0110-' || u.n || '@example.test', 'Deneme arama ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  const assign = (user: string, code: string, site: string) =>
    admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
       values ($1, $2, 'site', $3, iam.today() - 1)`,
      [user, role[code], [site]],
    );
  await assign(VIEWER_A, "T0110_SITE", SITE_A);
  await assign(VIEWER_B, "T0110_SITE", SITE_B);
  await assign(FINANCE_A, "T0110_FIN", SITE_A);

  for (const recordId of Object.keys(records)) {
    await deliver(`${P}.record.saved`, recordId);
  }
});

afterAll(async () => {
  await workerPool?.end();
  await appPool?.end();
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("who finds what (REQ-NFR-012)", () => {
  it("shows a record only to people who may see it, in no count either", async () => {
    expect(await titlesFor(VIEWER_A, "söğüt şantiyesi")).toEqual(["Söğüt Şantiyesi"]);
    expect(await titlesFor(VIEWER_B, "söğüt şantiyesi")).toEqual([]);
    const { rows } = await admin.query(
      `select count(*)::int as n from core.search_row where record_schema = $1`,
      [P],
    );
    expect(rows[0].n).toBe(3);
  });

  it("keeps a commercial record away from somebody without that class", async () => {
    expect(await titlesFor(VIEWER_A, "teklif 2026-118")).toEqual([]);
    expect(await titlesFor(FINANCE_A, "teklif 2026-118")).toEqual(["Teklif 2026-118"]);
  });
});

describe("how words match (ADR-017, D-247)", () => {
  it("ignores Turkish letter differences in both directions", async () => {
    expect(await titlesFor(VIEWER_A, "sogut")).toEqual(["Söğüt Şantiyesi"]);
    expect(await titlesFor(VIEWER_A, "ŞANTIYESI KAVAKLI")).toEqual(["Söğüt Şantiyesi"]);
  });

  it("asks for every word in the same record, whatever their order", async () => {
    expect(await titlesFor(VIEWER_A, "kavaklı söğüt")).toEqual(["Söğüt Şantiyesi"]);
    // "istinat" belongs to the first record and "kuzey" to the second: no record holds both.
    expect(await titlesFor(VIEWER_A, "istinat kuzey")).toEqual([]);
  });

  it("corrects a misspelled word from what the person's own records use", async () => {
    // "sogud" is nobody's word; "kavakli" is written exactly as the record holds it.
    const answer = await searchFor(as(VIEWER_A), "sogud kavakli");
    expect(answer.corrected).toBe("sogut kavakli");
    expect(answer.groups[0]?.hits[0]?.title).toBe("Söğüt Şantiyesi");
    // Somebody who cannot see that record is corrected towards nothing they may not see.
    expect((await searchFor(as(VIEWER_B), "sogud kavakli")).groups).toEqual([]);
  });

  it("leaves a word the person can already find alone (0031)", async () => {
    // The short circuit answers from the index before the trigram comparison runs; a word that
    // exists must come back as itself, even beside a similar word other records use more often.
    expect(await suggestWord(as(VIEWER_A), "istinat")).toBe("istinat");
    expect(await suggestWord(as(VIEWER_A), "Söğüt")).toBe("sogut");
    // A word that exists only where this person may not look is still not "found" for them.
    expect(await suggestWord(as(VIEWER_B), "istinat")).not.toBe("istinat");
  });
});

describe("the word buckets (D-247, OQ-033)", () => {
  const bucketsFor = async (word: string) =>
    (
      await admin.query(
        `select scope_key, data_class, cardinality(search_document_ids) as n
           from core.search_word_bucket where word = $1 and record_type like $2
          order by scope_key, data_class`,
        [word, `${P}.%`],
      )
    ).rows as { scope_key: string; data_class: string; n: number }[];

  it("keeps one bucket per place and class, and agrees with the words", async () => {
    const expected = [
      { scope_key: `site:${SITE_A}`, data_class: "commercial", n: 1 },
      { scope_key: `site:${SITE_A}`, data_class: "internal", n: 1 },
    ];
    expect(await bucketsFor("sogut")).toEqual(expected);
    // Rebuilding from the words changes nothing: the upkeep and the rebuild agree.
    const { rows } = await admin.query("select core.rebuild_search_buckets() as n");
    expect(rows[0].n).toBeGreaterThan(0);
    expect(await bucketsFor("sogut")).toEqual(expected);
  });

  it("is read only by people who may see what is in it", async () => {
    // The worker sees every bucket; a person sees only those of their own place and class.
    const all = await workerPool.query(
      "select count(*)::int as n from core.search_word_bucket where word = 'sogut'",
    );
    expect(all.rows[0].n).toBeGreaterThanOrEqual(2);
    const countFor = async (userId: string) => {
      const client = await appPool.connect();
      try {
        await client.query("begin");
        await client.query("select set_config('app.user_id', $1, true)", [userId]);
        const { rows } = await client.query(
          "select count(*)::int as n from core.search_word_bucket where word = 'sogut'",
        );
        await client.query("rollback");
        return rows[0].n;
      } finally {
        client.release();
      }
    };
    expect(await countFor(VIEWER_A)).toBe(1); // the internal one only
    expect(await countFor(FINANCE_A)).toBe(2); // and the commercial one as well
    expect(await countFor(VIEWER_B)).toBe(0); // another site: nothing at all
  });

  it("follows a record that moves to another place", async () => {
    records[id(202)].siteId = SITE_A;
    await deliver(`${P}.record.saved`, id(202));
    expect((await bucketsFor("ilgaz")).map((b) => b.scope_key)).toEqual([`site:${SITE_A}`]);
    records[id(202)].siteId = SITE_B;
    await deliver(`${P}.record.saved`, id(202));
    expect((await bucketsFor("ilgaz")).map((b) => b.scope_key)).toEqual([`site:${SITE_B}`]);
  });
});

describe("keeping the index honest (D-266)", () => {
  it("takes a record out when it goes, and leaves no word behind", async () => {
    const saved = records[id(202)];
    delete records[id(202)];
    await deliver(`${P}.record.removed`, id(202));
    expect(await titlesFor(VIEWER_B, "ilgaz")).toEqual([]);
    const { rows } = await admin.query("select word from core.search_word where word = 'kuzey'");
    expect(rows).toEqual([]);
    // Putting it back brings the word back with it.
    records[id(202)] = saved;
    await deliver(`${P}.record.saved`, id(202));
    expect(await titlesFor(VIEWER_B, "kuzey")).toEqual(["Ilgaz Şantiyesi"]);
  });

  it("never lets an older event overwrite a newer index", async () => {
    const newer = new Date();
    const older = new Date(newer.getTime() - 60_000);
    records[id(201)].title = "Söğüt Şantiyesi (yeni ad)";
    await deliver(`${P}.record.saved`, id(201), newer);
    records[id(201)].title = "Söğüt Şantiyesi (eski ad)";
    await deliver(`${P}.record.saved`, id(201), older);
    expect(await titlesFor(VIEWER_A, "sogut")).toEqual(["Söğüt Şantiyesi (yeni ad)"]);
  });

  it("writes and removes a row directly as the worker does", async () => {
    const client = await workerPool.connect();
    try {
      await client.query("begin");
      const db = kyselyOn(client);
      const record = { schema: P, table: "record", id: id(204) };
      await indexSearchRow(
        db,
        record,
        {
          recordType: `${P}.site`,
          title: "Deneme Şantiyesi",
          text: "Deneme Şantiyesi",
          linkPath: "/today",
          siteId: SITE_A,
        },
        new Date(),
      );
      await client.query("commit");
      expect(await titlesFor(VIEWER_A, "deneme santiyesi")).toEqual(["Deneme Şantiyesi"]);
      await client.query("begin");
      expect(await removeSearchRow(db, record)).toBe(true);
      await client.query("commit");
      expect(await titlesFor(VIEWER_A, "deneme santiyesi")).toEqual([]);
    } finally {
      client.release();
    }
  });
});

describe("source publication and current visibility", () => {
  it("cleans the search identity on success and cancellation on the same connection", async () => {
    const client = await appPool.connect();
    let cancelAfterSearch = false;
    const run = createRunSearchAsUser({
      connect: async () => ({
        async query(statement, params) {
          const result = await client.query(statement, params);
          if (statement.startsWith("begin")) {
            const settings = await client.query(
              "select current_setting('transaction_read_only') as readonly, current_setting('statement_timeout') as timeout",
            );
            expect(settings.rows[0]).toEqual({ readonly: "on", timeout: "15s" });
          }
          if (cancelAfterSearch && statement.startsWith("select core.search_request")) {
            await client.query("set local statement_timeout = '50ms'");
            await client.query("select pg_sleep(1)");
          }
          return result;
        },
        release() {},
      }),
    });
    const clean = async () => {
      const result = await client.query(
        "select core.current_user_id() as person, core.current_role_id() as role, current_setting('transaction_read_only') as readonly",
      );
      expect(result.rows[0]).toEqual({ person: null, role: null, readonly: "off" });
    };
    try {
      for (const [person, expected] of [
        [VIEWER_A, id(201)],
        [VIEWER_B, id(202)],
      ]) {
        const answer = await run<{ hits: { record_id: string }[] }>(
          { userId: person, actingRoleId: role.T0110_SITE },
          "santiyesi",
        );
        expect(answer.hits.map((hit) => hit.record_id)).toEqual([expected]);
        await clean();
      }
      cancelAfterSearch = true;
      await expect(run(as(VIEWER_A), "sogut")).rejects.toMatchObject({ code: "57014" });
      await clean();
      cancelAfterSearch = false;
      expect((await run<{ hits: unknown[] }>(as(VIEWER_B), "sogut")).hits).toEqual([]);
      await clean();
      await expect(
        admin.query("select core.search_request($1, null, 'sogut', null)", [VIEWER_A]),
      ).rejects.toMatchObject({ code: "42501" });
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it("matches the original visibility predicate and refreshes identity on a reused connection", async () => {
    const client = await appPool.connect();
    try {
      await client.query("begin");
      for (const person of [FINANCE_A, VIEWER_B, VIEWER_A]) {
        await client.query("select set_config('app.user_id', $1, true)", [person]);
        const comparison = await client.query(
          `with cases as (
            select s.site, p.project, o.owner, c.class
            from unnest(array[null, $1::uuid, $2::uuid]) s(site)
            cross join unnest(array[null, $1::uuid]) p(project)
            cross join unnest(array[null, $3::uuid, $4::uuid]) o(owner)
            cross join unnest(array['general','internal','commercial','sensitive','unknown']) c(class)
          ) select count(*) filter (where
            core.can_see_record('zzs', site, project, owner, class) is distinct from
            core.search_access_allows((select core.search_access_snapshot()),
              'zzs', site, project, owner, class))::int as differences from cases`,
          [SITE_A, SITE_B, VIEWER_A, VIEWER_B],
        );
        expect(comparison.rows[0].differences).toBe(0);
        const visible = await client.query(
          "select record_id from core.search_row where record_schema = 'zzs' order by record_id",
        );
        expect(visible.rows.map((row) => row.record_id)).toEqual(
          person === FINANCE_A ? [id(201), id(203)] : [person === VIEWER_A ? id(201) : id(202)],
        );
      }
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it("stages sources, preserves internal ids, and leaves old readers untouched until commit", async () => {
    const client = await workerPool.connect();
    const source = { ...records[id(201)] };
    try {
      await client.query("begin");
      const before = await client.query(
        "select search_document_id, title from core.search_row where record_id = $1",
        [id(201)],
      );
      records[id(201)] = {
        ...source,
        title: "Kaynakta yenilenen başlık",
        text: "kaynakta yenilenen başlık",
      };
      const result = await rebuildSearch(kyselyOn(client), [registration]);
      const metadata = await client.query(
        `select count(*)::int as n from core.search_posting p
         join core.search_row r on r.id = p.search_row_id where r.record_schema = $1
         and (r.normalization_version <> core.search_normalization_version()
           or p.normalization_version <> r.normalization_version
           or p.projection_version <> r.projection_version)`,
        [P],
      );
      expect(metadata.rows[0].n).toBe(0);
      expect(result).toMatchObject({ count: 3, difference: 0 });
      const inside = await client.query(
        "select search_document_id, title, projection_version from core.search_row where record_id = $1",
        [id(201)],
      );
      expect(inside.rows[0]).toMatchObject({
        search_document_id: before.rows[0].search_document_id,
        title: "Kaynakta yenilenen başlık",
        projection_version: result.version,
      });
      expect(await titlesFor(VIEWER_A, "sogut")).toEqual([before.rows[0].title]);
      expect(await titlesFor(VIEWER_A, "kaynakta")).toEqual([]);
    } finally {
      records[id(201)] = source;
      await client.query("rollback");
      client.release();
    }
  });

  it("leaves the old version intact if a source scanner fails", async () => {
    const client = await workerPool.connect();
    const before = await admin.query(
      "select id, title, projection_version from core.search_row where record_schema = $1 order by id",
      [P],
    );
    try {
      await client.query("begin");
      await expect(
        rebuildSearch(kyselyOn(client), [
          {
            ...registration,
            scan: async () => {
              throw new Error("source unavailable");
            },
          },
        ]),
      ).rejects.toThrow("source unavailable");
    } finally {
      await client.query("rollback");
      client.release();
    }
    expect(
      (
        await admin.query(
          "select id, title, projection_version from core.search_row where record_schema = $1 order by id",
          [P],
        )
      ).rows,
    ).toEqual(before.rows);
  });

  it("does not remove a live source when a stale removal event arrives", async () => {
    await deliver(`${P}.record.removed`, id(202), new Date(0));
    expect(await titlesFor(VIEWER_B, "ilgaz")).toEqual(["Ilgaz Şantiyesi"]);
  });

  it("revalidates saved addresses instead of returning another site's title", async () => {
    const definitions = [{ type: `${P}.site`, label: "Şantiyeler", listPath: "/sites" }];
    // Both fixture sites use /today; only the caller's visible row may return.
    const answer = await recentSearchFor(as(VIEWER_A), ["/today"], definitions);
    expect(answer.groups.flatMap((group) => group.hits.map((hit) => hit.recordId))).toEqual([
      id(201),
    ]);
    records[id(201)].siteId = SITE_B;
    try {
      await deliver(`${P}.record.saved`, id(201));
      expect((await recentSearchFor(as(VIEWER_A), ["/today"], definitions)).groups).toEqual([]);
    } finally {
      records[id(201)].siteId = SITE_A;
      await deliver(`${P}.record.saved`, id(201));
    }
  });

  it("gives each type five places even when another type has more than fifty matches", async () => {
    const ids = Array.from({ length: 56 }, (_, n) => id(401 + n));
    const client = await workerPool.connect();
    try {
      await client.query("begin");
      await client.query(
        `select core.index_search_row('zzs', 'record', x.id,
        case when x.n = 56 then 'zzs.quote' else 'zzs.site' end,
        'Denemepalet ' || x.n, null, 'denemepalet', '/today', $2::uuid)
        from unnest($1::uuid[]) with ordinality as x(id, n)`,
        [ids, SITE_A],
      );
      await client.query("commit");
      const answer = await searchFor(as(FINANCE_A), "denemepalet");
      expect(answer.groups.find((group) => group.type === "zzs.site")).toMatchObject({
        hasMore: true,
      });
      expect(answer.groups.find((group) => group.type === "zzs.site")?.hits).toHaveLength(5);
      expect(answer.groups.find((group) => group.type === "zzs.quote")?.hits).toHaveLength(1);
      if (process.env.SEARCH_PROFILE === "1") {
        const probe = await appPool.connect();
        try {
          await probe.query("begin");
          await probe.query("select set_config('app.user_id', $1, true)", [FINANCE_A]);
          for (const statement of [
            "select distinct record_type from core.search_row",
            "select core.search_suggest('denemepalet', array['zzs.site','zzs.quote'])",
            "select * from core.search_records('denemepalet', array['zzs.site'], 6)",
            "select core.search_palette('denemepalet')",
          ]) {
            const plan = await probe.query(`explain (analyze, buffers, format json) ${statement}`);
            console.info(JSON.stringify({ statement, plan: plan.rows[0]["QUERY PLAN"] }));
          }
        } finally {
          await probe.query("rollback");
          probe.release();
        }
      }
      const timings: number[] = [];
      for (let n = 0; n < 20; n++) {
        const started = performance.now();
        await searchFor(as(FINANCE_A), "denemepalet");
        timings.push(performance.now() - started);
      }
      timings.sort((a, b) => a - b);
      process.stdout.write(
        `Search warm smoke (56 synthetic rows, 20 samples): p95=${Math.round(timings[18])}ms max=${Math.round(timings[19])}ms\n`,
      );
    } finally {
      await client.query("rollback");
      await client.query(
        `select core.remove_search_row('zzs', 'record', x) from unnest($1::uuid[]) x`,
        [ids],
      );
      client.release();
    }
  });

  it("retains own records in another scope even when a readable bucket covers the same word", async () => {
    await admin.query(`
      insert into iam.permission (code, module, name, created_from) values ('zzs.module.own', 'zzs', 'Deneme: kendisi', 'seed');
      insert into iam.role (code, name, level) values ('T0110_OWN', 'Deneme kişisel', 10);
      insert into iam.role_permission (role_id, permission_id) select r.id, p.id from iam.role r, iam.permission p where r.code = 'T0110_OWN' and p.code = 'zzs.module.own';
    `);
    await admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, starts_on)
      select $1, id, 'company', iam.today() - 1 from iam.role where code = 'T0110_OWN'`,
      [VIEWER_A],
    );
    records[id(301)] = {
      ...records[id(202)],
      ownerUserId: VIEWER_A,
      text: "Söğüt kişisel",
      title: "Kişisel Söğüt",
    };
    try {
      await deliver(`${P}.record.saved`, id(301));
      expect(await titlesFor(VIEWER_A, "sogut")).toContain("Kişisel Söğüt");
    } finally {
      delete records[id(301)];
      await deliver(`${P}.record.removed`, id(301));
    }
  });
});

describe("normalization versions (TASK-0110)", () => {
  it("backfills posting versions from their own rows after rollback and reapply", async () => {
    const migration = (suffix: string) =>
      readFileSync(
        new URL(`../../../db/migrations/0027_search_normalization${suffix}.sql`, import.meta.url),
        "utf8",
      );
    await admin.query("begin");
    try {
      await admin.query(migration(".down"));
      await admin.query(
        "update core.search_row set projection_version = 77 where record_schema = $1 and record_id = $2",
        [P, id(201)],
      );
      await admin.query(migration(""));
      const postings = await admin.query(
        `select p.normalization_version, p.projection_version from core.search_posting p
         join core.search_row r on r.id = p.search_row_id
         where r.record_schema = $1 and r.record_id = $2`,
        [P, id(201)],
      );
      expect(postings.rows.length).toBeGreaterThan(0);
      for (const posting of postings.rows) {
        expect(posting).toEqual({ normalization_version: 1, projection_version: 77 });
      }
    } finally {
      await admin.query("rollback");
    }
  });

  it("stamps initial rows and postings, including their projection version", async () => {
    const result = await admin.query(
      `select r.normalization_version as row_version, p.normalization_version as posting_version,
        r.projection_version as row_projection, p.projection_version as posting_projection
       from core.search_row r join core.search_posting p on p.search_row_id = r.id
       where r.record_schema = $1`,
      [P],
    );
    expect(result.rows.length).toBeGreaterThan(0);
    for (const row of result.rows) {
      expect(row.row_version).toBe(1);
      expect(row.posting_version).toBe(1);
      expect(row.posting_projection).toBe(row.row_projection);
    }
  });

  it("rejects stale visible rows without disclosing a hidden row's mismatch", async () => {
    await admin.query(
      "update core.search_row set normalization_version = 2 where record_schema = $1 and record_id = $2",
      [P, id(202)],
    );
    try {
      expect(await titlesFor(VIEWER_A, "sogut")).not.toEqual([]);
      await expect(titlesFor(VIEWER_B, "ilgaz")).rejects.toMatchObject({
        code: "P0001",
        message: "search_normalization_mismatch",
      });
      await expect(searchRecords(as(VIEWER_B), "ilgaz")).rejects.toThrow(
        "search_normalization_mismatch",
      );
      await expect(suggestWord(as(VIEWER_B), "ilgaz")).rejects.toThrow(
        "search_normalization_mismatch",
      );
      // An older event must neither rewrite text nor pretend to upgrade the version.
      await deliver(`${P}.record.saved`, id(202), new Date(0));
      const stale = await admin.query(
        "select normalization_version from core.search_row where record_schema = $1 and record_id = $2",
        [P, id(202)],
      );
      expect(stale.rows[0].normalization_version).toBe(2);
    } finally {
      await deliver(`${P}.record.saved`, id(202));
    }
    expect(await titlesFor(VIEWER_B, "ilgaz")).toEqual([records[id(202)].title]);
  });

  it("rejects stale visible postings but respects a requested type filter", async () => {
    await admin.query(
      `update core.search_posting p set normalization_version = 2 from core.search_row r
       where r.id = p.search_row_id and r.record_schema = $1 and r.record_id = $2`,
      [P, id(201)],
    );
    try {
      await expect(titlesFor(VIEWER_A, "sogut")).rejects.toThrow("search_normalization_mismatch");
      expect(await titlesFor(VIEWER_B, "ilgaz")).not.toEqual([]);
      const quoteOnly = await searchFor(as(FINANCE_A), "teklif", [
        { type: `${P}.quote`, label: "Teklifler", listPath: "/today" },
      ]);
      expect(quoteOnly.groups.flatMap((group) => group.hits.map((hit) => hit.recordId))).toEqual([
        id(203),
      ]);
    } finally {
      await deliver(`${P}.record.saved`, id(201));
    }
    expect(await titlesFor(VIEWER_A, "sogut")).not.toEqual([]);
  });
});

describe("helper versions (TASK-0110, D-247)", () => {
  const SITE_TYPE = `${P}.site`;
  const version = async () =>
    (await admin.query("select core.search_normalization_version() as v")).rows[0].v as number;
  /** How many buckets and vocabulary entries the throw-away module has at one version. */
  const helperRows = async (at: number) =>
    (
      await admin.query(
        `select count(*)::int as n from (
           select normalization_version from core.search_word where record_type like $1
           union all
           select normalization_version from core.search_word_bucket where record_type like $1
         ) h where h.normalization_version = $2`,
        [`${P}.%`, at],
      )
    ).rows[0].n as number;
  const wordCount = async (at: number) =>
    (
      await admin.query(
        `select coalesce(sum(record_count), 0)::int as n from core.search_word
          where word = 'sogut' and record_type = $1 and normalization_version = $2`,
        [SITE_TYPE, at],
      )
    ).rows[0].n as number;
  const dropOtherVersions = () =>
    admin.query(`delete from core.search_word_bucket
        where normalization_version <> core.search_normalization_version();
      delete from core.search_word
        where normalization_version <> core.search_normalization_version()`);

  it("stamps every bucket and vocabulary entry with the normalizer in force", async () => {
    const now = await version();
    expect(await helperRows(now)).toBeGreaterThan(0);
    expect(await helperRows(now + 1)).toBe(0);
  });

  it("never narrows an answer with a bucket another normalizer wrote", async () => {
    // A bucket from another generation may hold other ids. If the narrowing trusted it, a record
    // whose postings hold every asked word would disappear from the answer.
    await admin.query(
      `update core.search_word_bucket set normalization_version = $2,
         search_document_ids = array[2147483647]
       where word = 'kavakli' and record_type = $1`,
      [SITE_TYPE, (await version()) + 1],
    );
    try {
      expect(await titlesFor(VIEWER_A, "sogut kavakli")).toEqual([records[id(201)].title]);
    } finally {
      await dropOtherVersions();
      await deliver(`${P}.record.saved`, id(201));
    }
  });

  it("takes a record out of the bucket another normalizer wrote for it", async () => {
    await admin.query(
      `insert into core.search_word_bucket (word, record_type, scope_key, data_class,
         normalization_version, search_document_ids)
       select b.word, b.record_type, b.scope_key, b.data_class, $2, b.search_document_ids
         from core.search_word_bucket b
        where b.word = 'sogut' and b.record_type = $1
          and b.normalization_version = core.search_normalization_version()`,
      [SITE_TYPE, (await version()) + 1],
    );
    try {
      expect(await helperRows((await version()) + 1)).toBeGreaterThan(0);
      await deliver(`${P}.record.saved`, id(201));
      const left = await admin.query(
        `select count(*)::int as n from core.search_word_bucket
          where record_type = $1 and normalization_version <> core.search_normalization_version()`,
        [SITE_TYPE],
      );
      expect(left.rows[0].n).toBe(0);
    } finally {
      await dropOtherVersions();
    }
  });

  it("counts a word for one normalizer without reading another's count", async () => {
    const now = await version();
    const before = await wordCount(now);
    const foreign = () =>
      admin.query(
        `insert into core.search_word (word, record_type, normalization_version, record_count)
         values ('sogut', $1, $2, 99)`,
        [SITE_TYPE, now + 1],
      );
    records[id(302)] = { ...records[id(201)], title: "Söğüt Kavaklı ikinci" };
    try {
      await foreign();
      await deliver(`${P}.record.saved`, id(302));
      // The count in force is exact, never the other generation's 99 added to it. The foreign
      // entry itself goes: no posting of that version is behind it any more.
      expect(await wordCount(now)).toBe(before + 1);
      expect(await wordCount(now + 1)).toBe(0);

      await foreign();
      delete records[id(302)];
      await deliver(`${P}.record.removed`, id(302));
      expect(await wordCount(now)).toBe(before);
      // Removing a record of this generation leaves the other generation's count alone.
      expect(await wordCount(now + 1)).toBe(99);
    } finally {
      delete records[id(302)];
      await deliver(`${P}.record.removed`, id(302));
      await dropOtherVersions();
    }
  });

  it("rolls the helper versions back and reapplies without changing what is indexed", async () => {
    const migration = (suffix: string) =>
      readFileSync(
        new URL(`../../../db/migrations/0029_search_helper_versions${suffix}.sql`, import.meta.url),
        "utf8",
      );
    const buckets = async () =>
      (
        await admin.query(
          `select word, record_type, scope_key, data_class, search_document_ids
             from core.search_word_bucket where record_type like $1
            order by word, record_type, scope_key, data_class`,
          [`${P}.%`],
        )
      ).rows;
    const integrity = async () =>
      (await admin.query("select * from core.search_integrity()")).rows[0];
    const before = await buckets();
    const reportBefore = await integrity();
    await admin.query(migration(".down"));
    const column = await admin.query(
      `select count(*)::int as n from information_schema.columns
        where table_schema = 'core' and table_name = 'search_word'
          and column_name = 'normalization_version'`,
    );
    expect(column.rows[0].n).toBe(0);
    await admin.query(migration(""));
    expect(await buckets()).toEqual(before);
    expect(await integrity()).toEqual(reportBefore);
  });
});

describe("read-time helper check (TASK-0110, 0030)", () => {
  const SITE_TYPE = `${P}.site`;
  type Palette = { hits: { title: string }[]; helper_mismatch: boolean };
  /** The answer as the palette builds it, including the operational flag the app never shows. */
  const paletteFor = async (userId: string, query: string) => {
    const client = await appPool.connect();
    try {
      await client.query("begin");
      await client.query("select set_config('app.user_id', $1, true)", [userId]);
      const { rows } = await client.query("select core.search_palette($1) as answer", [query]);
      await client.query("rollback");
      return rows[0].answer as Palette;
    } finally {
      client.release();
    }
  };

  it("says nothing is wrong while the helpers agree", async () => {
    const answer = await paletteFor(VIEWER_A, "sogut kavakli");
    expect(answer.hits.map((hit) => hit.title)).toEqual([records[id(201)].title]);
    expect(answer.helper_mismatch).toBe(false);
  });

  it("reports a missing bucket without taking the record out of the answer", async () => {
    await admin.query(
      "delete from core.search_word_bucket where word = 'kavakli' and record_type = $1",
      [SITE_TYPE],
    );
    try {
      const answer = await paletteFor(VIEWER_A, "sogut kavakli");
      // The postings still decide, so the person's answer is whole; only the flag changes.
      expect(answer.hits.map((hit) => hit.title)).toEqual([records[id(201)].title]);
      expect(answer.helper_mismatch).toBe(true);
    } finally {
      await deliver(`${P}.record.saved`, id(201));
    }
    expect((await paletteFor(VIEWER_A, "sogut kavakli")).helper_mismatch).toBe(false);
  });

  it("does not judge a record the person sees only as its owner", async () => {
    await admin.query(`
      insert into iam.permission (code, module, name, created_from) values ('${P}.module.own', '${P}', 'Deneme: kendisi', 'seed') on conflict do nothing;
      insert into iam.role (code, name, level) values ('T0110_OWN', 'Deneme kişisel', 10) on conflict do nothing;
      insert into iam.role_permission (role_id, permission_id) select r.id, p.id from iam.role r, iam.permission p
        where r.code = 'T0110_OWN' and p.code = '${P}.module.own' on conflict do nothing;
    `);
    await admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, starts_on)
       select $1, r.id, 'company', iam.today() - 1 from iam.role r where r.code = 'T0110_OWN'
        and not exists (select from iam.role_assignment a where a.user_id = $1 and a.role_id = r.id)`,
      [VIEWER_A],
    );
    records[id(303)] = {
      ...records[id(202)],
      ownerUserId: VIEWER_A,
      text: "Söğüt kisisel kaydi",
      title: "Kişisel Söğüt",
    };
    try {
      await deliver(`${P}.record.saved`, id(303));
      // The bucket belongs to a place and class this person has no broad access to, so its
      // absence from their view proves nothing and must not raise an alarm.
      const answer = await paletteFor(VIEWER_A, "kisisel");
      expect(answer.hits.map((hit) => hit.title)).toEqual(["Kişisel Söğüt"]);
      expect(answer.helper_mismatch).toBe(false);
    } finally {
      delete records[id(303)];
      await deliver(`${P}.record.removed`, id(303));
    }
  });

  it("ignores a bucket another normalizer left behind", async () => {
    await admin.query(
      `insert into core.search_word_bucket (word, record_type, scope_key, data_class,
         normalization_version, search_document_ids)
       select b.word, b.record_type, b.scope_key, b.data_class,
              core.search_normalization_version() + 1, array[2147483647]
         from core.search_word_bucket b
        where b.record_type = $1 and b.normalization_version = core.search_normalization_version()`,
      [SITE_TYPE],
    );
    try {
      expect((await paletteFor(VIEWER_A, "sogut kavakli")).helper_mismatch).toBe(false);
    } finally {
      await admin.query(
        "delete from core.search_word_bucket where normalization_version <> core.search_normalization_version()",
      );
    }
  });

  it("rolls the check back and reapplies it without changing the answer", async () => {
    const migration = (suffix: string) =>
      readFileSync(
        new URL(`../../../db/migrations/0030_search_read_time_check${suffix}.sql`, import.meta.url),
        "utf8",
      );
    const before = await paletteFor(VIEWER_A, "sogut kavakli");
    await admin.query(migration(".down"));
    const without = await paletteFor(VIEWER_A, "sogut kavakli");
    expect(without.hits.map((hit) => hit.title)).toEqual(before.hits.map((hit) => hit.title));
    expect(without.helper_mismatch).toBeUndefined();
    await admin.query(migration(""));
    expect(await paletteFor(VIEWER_A, "sogut kavakli")).toEqual(before);
  });
});
