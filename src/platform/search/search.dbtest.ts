/**
 * Site-wide search against the real database (TASK-0110, REQ-NFR-012, ADR-017, D-247, D-266).
 *
 * A throw-away module `zzs` stands in for a module that owns records: its permissions, two test
 * roles and people are written over the admin connection and removed afterwards, together with
 * every search row they produced. `npm run test:db`.
 */
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../scripts/db-admin.mjs";
import { readDatabaseConfig } from "@/platform/db/database-config";
import { kyselyOn } from "@/platform/db/run-as-user";
import { indexSearchRow, removeSearchRow } from "@/platform/db/search-store";
import type { DeliveredEvent } from "@/platform/jobs/types";
import { searchIndexer, type SearchRegistration } from "@/platform/search/indexer";
import type { SearchProjection } from "@/platform/search/search";
import { searchFor } from "@/platform/search/service";

const id = (n: number) => `0192f0c1-0110-7000-8000-${String(n).padStart(12, "0")}`;
const VIEWER_A = id(1);
const VIEWER_B = id(2);
const FINANCE_A = id(3);
const PEOPLE = [VIEWER_A, VIEWER_B, FINANCE_A];
const SITE_A = id(101);
const SITE_B = id(102);
const ROLES = ["T0110_SITE", "T0110_FIN"];
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
    await deliver(`${P}.record.removed`, id(202));
    expect(await titlesFor(VIEWER_B, "ilgaz")).toEqual([]);
    const { rows } = await admin.query("select word from core.search_word where word = 'kuzey'");
    expect(rows).toEqual([]);
    // Putting it back brings the word back with it.
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
