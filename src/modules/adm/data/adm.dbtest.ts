/**
 * Configuration against the real database (TASK-0105, CONFIGURATION.md, D-237, D-260).
 *
 * Rule rows can never be changed or deleted, and custom fields belong to reference tables that
 * do not exist yet, so those tests run inside an admin transaction that is rolled back: nothing
 * of them stays. Catalog tests commit through the runtime role and are removed afterwards.
 * `npm run test:db`.
 */
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { kyselyOn, type PooledClient } from "@/platform/db/run-as-user";

import { insertCatalogItem, mergeItems, readRule, readSimilarItems } from "./adm-store";

const id = (n: number) => `0192f0c1-0105-7000-8000-${String(n).padStart(12, "0")}`;
const OWNER = id(1);
const WORKER = id(2);
const OUTSIDER = id(3);
const PEOPLE = [OWNER, WORKER, OUTSIDER];
const SITE_A = id(101);
const PROJECT_A = id(201);
const CATALOG = "zzt_expense";
const CLOSED_CATALOG = "zzt_closed";

let admin: pg.Client;

const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { hint?: string; code?: string }) => e.hint ?? e.code ?? "no code",
  );

/** Runs `work` in an admin transaction that is always rolled back. */
async function rolledBack(work: () => Promise<void>) {
  await admin.query("begin");
  try {
    await work();
  } finally {
    await admin.query("rollback");
  }
}

/** A savepoint so an expected failure does not end the surrounding test transaction. */
async function attempt(query: string, params: unknown[] = []) {
  await admin.query("savepoint a");
  try {
    await admin.query(query, params);
    await admin.query("release savepoint a");
    return "no error";
  } catch (e) {
    await admin.query("rollback to savepoint a");
    const err = e as { hint?: string; code?: string };
    return err.hint ?? err.code ?? "no code";
  }
}

async function cleanUp() {
  const { rows } = await admin.query(
    `select i.id from adm.catalog_item i join adm.catalog c on c.id = i.catalog_id
      where c.key = any($1)`,
    [[CATALOG, CLOSED_CATALOG]],
  );
  const itemIds = rows.map((r) => r.id);
  if (itemIds.length) {
    await admin.query("select aud.purge_record_history_for_reset('adm.catalog_item', $1::uuid[])", [
      itemIds,
    ]);
    await admin.query(
      "delete from core.outbox where record_table = 'catalog_item' and record_id = any($1::uuid[])",
      [itemIds],
    );
  }
  // A merge is never undone in the product; removing test rows needs the guard off briefly.
  await admin.query("alter table adm.catalog_item disable trigger catalog_item_guard");
  try {
    await admin.query(
      `update adm.catalog_item set merged_into_item_id = null
        where catalog_id in (select id from adm.catalog where key = any($1))`,
      [[CATALOG, CLOSED_CATALOG]],
    );
  } finally {
    await admin.query("alter table adm.catalog_item enable trigger catalog_item_guard");
  }
  await admin.query(
    "delete from adm.catalog_item where catalog_id in (select id from adm.catalog where key = any($1))",
    [[CATALOG, CLOSED_CATALOG]],
  );
  await admin.query("delete from adm.catalog where key = any($1)", [[CATALOG, CLOSED_CATALOG]]);
  await admin.query("delete from iam.role_assignment where user_id = any($1::uuid[])", [PEOPLE]);
  await admin.query("delete from iam.user where id = any($1::uuid[])", [PEOPLE]);
}

beforeAll(async () => {
  admin = await connectAdmin();
  await cleanUp();
  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id)
     select u.id, 't0105-' || u.n || '@example.test', 'Deneme ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  const role = async (code: string) =>
    (await admin.query("select id from iam.role where code = $1", [code])).rows[0].id;
  await admin.query(
    `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
     values ($1, $2, 'company', '{}', iam.today() - 1),
            ($3, $4, 'site', array[$5::uuid], iam.today() - 1)`,
    [OWNER, await role("SAH"), WORKER, await role("SM"), SITE_A],
  );
  await admin.query(
    `insert into adm.catalog (key, name, allows_project_scope, allows_user_additions)
     values ($1, 'Deneme giderleri', true, true), ($2, 'Deneme kapalı', false, false)`,
    [CATALOG, CLOSED_CATALOG],
  );
});

afterAll(async () => {
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("dated rules (REQ-ADM-007, CONFIGURATION section 3 and 6)", () => {
  const db = () => kyselyOn(admin as unknown as PooledClient);

  it("picks the row valid on the event's date and never falls back to a default", async () => {
    await rolledBack(async () => {
      await admin.query(`
        insert into adm.rule_key (key, module, name, value_type, allowed_scopes)
        values ('zzr.limit', 'zzr', 'Deneme eşiği', 'number', '{company,project,site}');
        insert into adm.rule (rule_key_id, valid_from, value, reason)
        select id, v.d::date, v.val::jsonb, 'deneme' from adm.rule_key,
               (values ('2026-03-01', '10'), ('2026-06-01', '20')) as v(d, val)
         where key = 'zzr.limit';`);
      const on = async (date: string) => readRule(db(), "zzr.limit", date);
      expect(await on("2026-03-12")).toMatchObject({
        found: true,
        value: 10,
        validFrom: "2026-03-01",
      });
      expect(await on("2026-07-01")).toMatchObject({ found: true, value: 20 });
      expect(await on("2026-02-28")).toEqual({ found: false, key: "zzr.limit", on: "2026-02-28" });
      expect(await readRule(db(), "zzr.nothing", "2026-07-01")).toMatchObject({ found: false });
    });
  });

  it("lets a site rule override the company rule, and the latest correction win", async () => {
    await rolledBack(async () => {
      await admin.query(
        `insert into adm.rule_key (key, module, name, value_type, allowed_scopes)
         values ('zzr.limit', 'zzr', 'Deneme eşiği', 'number', '{company,project,site}');
         insert into adm.rule (id, rule_key_id, scope_type, scope_id, valid_from, value, reason)
         select '${id(803)}'::uuid, id, 'company', null::uuid, date '2026-01-01', '5'::jsonb, 'şirket' from adm.rule_key where key = 'zzr.limit'
         union all
         select '${id(802)}'::uuid, id, 'site', '${SITE_A}'::uuid, date '2026-01-01', '7'::jsonb, 'şantiye' from adm.rule_key where key = 'zzr.limit';`,
      );
      await admin.query(
        // Deliberately lower UUID and the same transaction timestamp: insertion order must win.
        `insert into adm.rule (id, rule_key_id, scope_type, scope_id, valid_from, value, reason)
         select '${id(801)}', id, 'site', '${SITE_A}', '2026-01-01', '8', 'düzeltme' from adm.rule_key where key = 'zzr.limit'`,
      );
      expect(await readRule(db(), "zzr.limit", "2026-05-01", { siteId: SITE_A })).toMatchObject({
        value: 8,
        scopeType: "site",
      });
      expect(
        await readRule(db(), "zzr.limit", "2026-05-01", { projectId: PROJECT_A }),
      ).toMatchObject({
        value: 5,
        scopeType: "company",
      });
    });
  });

  it("never changes or deletes a rule row, and checks its type and scope", async () => {
    await rolledBack(async () => {
      await admin.query(
        `insert into adm.rule_key (key, module, name, value_type)
         values ('zzr.limit', 'zzr', 'Deneme eşiği', 'number');
         insert into adm.rule (rule_key_id, valid_from, value, reason)
         select id, '2026-01-01', '5', 'deneme' from adm.rule_key where key = 'zzr.limit';`,
      );
      expect(await attempt("update adm.rule set value = '6'")).toBe("adm.rule_immutable");
      expect(await attempt("delete from adm.rule")).toBe("adm.rule_immutable");
      expect(
        await attempt(
          `insert into adm.rule (rule_key_id, valid_from, value, reason)
           select id, '2026-02-01', '"altı"', 'deneme' from adm.rule_key where key = 'zzr.limit'`,
        ),
      ).toBe("adm.rule_value_type");
      expect(
        await attempt(
          `insert into adm.rule (rule_key_id, scope_type, scope_id, valid_from, value, reason)
           select id, 'site', '${SITE_A}', '2026-02-01', '6', 'deneme'
             from adm.rule_key where key = 'zzr.limit'`,
        ),
      ).toBe("adm.rule_scope");
    });
  });
});

describe("catalogs (REQ-ADM-005, REQ-ADM-006)", () => {
  it("suggests similar items regardless of Turkish letters and suffixes", async () => {
    await insertCatalogItem(
      { userId: OWNER, actingRoleId: null },
      { catalogKey: CATALOG, name: "Nakliye" },
    );
    await insertCatalogItem(
      { userId: OWNER, actingRoleId: null },
      { catalogKey: CATALOG, name: "Şantiye yemeği" },
    );
    const similar = async (name: string) =>
      (await readSimilarItems({ userId: WORKER, actingRoleId: null }, CATALOG, name)).map(
        (i) => i.name,
      );
    expect(await similar("nakliye masrafı")).toEqual(["Nakliye"]);
    expect(await similar("NAKLİYELER")).toEqual(["Nakliye"]);
    expect(await similar("santiye yemegi")).toEqual(["Şantiye yemeği"]);
    expect(await similar("Kırtasiye")).toEqual([]);
  });

  it("lets anyone with a role add to an open catalog, but not to a closed one", async () => {
    expect(
      await errorOf(
        insertCatalogItem(
          { userId: WORKER, actingRoleId: null },
          { catalogKey: CATALOG, name: "Otopark" },
        ),
      ),
    ).toBe("no error");
    expect(
      await errorOf(
        insertCatalogItem(
          { userId: WORKER, actingRoleId: null },
          { catalogKey: CLOSED_CATALOG, name: "Kalem" },
        ),
      ),
    ).toBe("42501");
    expect(
      await errorOf(
        insertCatalogItem(
          { userId: OUTSIDER, actingRoleId: null },
          { catalogKey: CATALOG, name: "Kira" },
        ),
      ),
    ).toBe("42501");
  });

  it("refuses a second active item with the same name, whatever the letters", async () => {
    await insertCatalogItem(
      { userId: OWNER, actingRoleId: null },
      { catalogKey: CATALOG, name: "Yakıt" },
    );
    expect(
      await errorOf(
        insertCatalogItem(
          { userId: OWNER, actingRoleId: null },
          { catalogKey: CATALOG, name: "YAKIT" },
        ),
      ),
    ).toBe("23505");
  });

  it("merges into a redirect, publishes the merge, and needs the manage right", async () => {
    const from = await insertCatalogItem(
      { userId: OWNER, actingRoleId: null },
      { catalogKey: CATALOG, name: "Taşıma" },
    );
    const into = await insertCatalogItem(
      { userId: OWNER, actingRoleId: null },
      { catalogKey: CATALOG, name: "Sevkiyat" },
    );
    expect(
      await errorOf(mergeItems({ userId: WORKER, actingRoleId: null }, from, into, "aynı iş")),
    ).toBe("42501");
    await mergeItems({ userId: OWNER, actingRoleId: null }, from, into, "aynı iş");
    const { rows } = await admin.query(
      "select status, merged_into_item_id, adm.catalog_item_final(id) as final from adm.catalog_item where id = $1",
      [from],
    );
    expect(rows[0]).toEqual({ status: "passive", merged_into_item_id: into, final: into });
    const events = await admin.query(
      "select event_code, payload ->> 'into_item_id' as into from core.outbox where record_id = $1",
      [from],
    );
    expect(events.rows).toEqual([{ event_code: "catalog_item.merged", into }]);
    const history = await admin.query(
      `select reason from aud.record_history
        where record_table = 'catalog_item' and record_id = $1 and field = 'status'`,
      [from],
    );
    expect(history.rows).toEqual([{ reason: "aynı iş" }]);
  });

  it("keeps project-only items out of catalogs that do not allow them", async () => {
    expect(
      await errorOf(
        insertCatalogItem(
          { userId: OWNER, actingRoleId: null },
          { catalogKey: CLOSED_CATALOG, name: "Proje kalemi", projectId: PROJECT_A },
        ),
      ),
    ).toBe("adm.catalog_project_scope");
  });
});

describe("custom fields (REQ-ADM-009, D-237)", () => {
  /** A reference table of D-237 that does not exist yet; created inside the rolled-back test. */
  async function probeTable(): Promise<string | null> {
    for (const t of ["crm.lead", "qte.quote", "cmp.contract", "inv.material", "eqp.asset"]) {
      const { rows } = await admin.query("select to_regclass($1) as t", [t]);
      if (!rows[0].t) return t;
    }
    return null;
  }

  it("checks values against their definitions and records them field by field", async () => {
    const table = await probeTable();
    if (!table) return; // every reference table exists by now: its own tests cover it
    const [schema, name] = table.split(".");
    await rolledBack(async () => {
      await admin.query(`
        create schema if not exists ${schema};
        create table ${table} (
          id uuid primary key default core.uuid_v7(),
          site_id uuid,
          custom_fields jsonb not null default '{}'
        );
        create trigger check_custom_fields before insert or update on ${table}
          for each row execute function adm.check_custom_fields();
        create trigger record_history after insert or update on ${table}
          for each row execute function aud.capture_history();
        insert into adm.custom_field (record_table, code, label, field_type, options, is_required, data_class)
        values ('${table}', 'segment', 'Segment', 'select',
                '[{"value":"kamu","label":"Kamu"},{"value":"ozel","label":"Özel"}]', true, 'internal'),
               ('${table}', 'budget', 'Bütçe', 'number', null, false, 'commercial'),
               ('${table}', 'started', 'Başlangıç', 'date', null, false, 'internal');`);
      const insert = (fields: string) =>
        attempt(`insert into ${table} (site_id, custom_fields) values ('${SITE_A}', '${fields}')`);
      expect(await insert('{"segment":"kamu","budget":1000}')).toBe("no error");
      expect(await insert('{"segment":"yabanci"}')).toBe("adm.custom_field_invalid");
      expect(await insert('{"segment":"kamu","budget":"bin"}')).toBe("adm.custom_field_invalid");
      expect(await insert('{"segment":"kamu","nope":1}')).toBe("adm.custom_field_invalid");
      expect(await insert('{"budget":5}')).toBe("adm.custom_field_invalid");
      expect(await insert('{"segment":"kamu","started":"2026-13-45"}')).not.toBe("no error");

      const { rows } = await admin.query(`select id from ${table}`);
      await admin.query(
        `update ${table} set custom_fields = '{"segment":"ozel","budget":1500}' where id = $1`,
        [rows[0].id],
      );
      const history = await admin.query(
        `select field, data_class from aud.record_history
          where record_schema = $1 and record_table = $2 and record_id = $3 and operation = 'update'
          order by field`,
        [schema, name, rows[0].id],
      );
      expect(history.rows).toEqual([
        { field: "custom_fields.budget", data_class: "commercial" },
        { field: "custom_fields.segment", data_class: "internal" },
      ]);

      // Retired: the value stays, a new value is refused.
      await admin.query(
        `update adm.custom_field set retired_at = now() where record_table = '${table}' and code = 'budget'`,
      );
      expect(
        await attempt(
          `update ${table} set custom_fields = custom_fields || '{"segment":"kamu"}' where id = '${rows[0].id}'`,
        ),
      ).toBe("no error");
      expect(
        await attempt(
          `update ${table} set custom_fields = custom_fields || '{"budget":1}' where id = '${rows[0].id}'`,
        ),
      ).toBe("adm.custom_field_invalid");
      expect(
        await attempt(`update adm.custom_field set field_type = 'text' where code = 'started'`),
      ).toBe("adm.custom_field_immutable");
    });
  });

  it("refuses custom fields on ledger and approval records (D-237)", async () => {
    await rolledBack(async () => {
      expect(
        await attempt(
          `insert into adm.custom_field (record_table, code, label, field_type)
           values ('sit.daily_site_log', 'x', 'X', 'text')`,
        ),
      ).toBe("23514");
    });
  });
});
