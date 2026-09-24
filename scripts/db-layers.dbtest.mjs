/**
 * Reset commands and configuration transfer against a real database (TASK-0076, D-246).
 *
 * Works in a throw-away schema whose tables are registered in every layer; resets and exports
 * are limited to that schema, so the test never touches real sample data. The real-data lock is
 * set and cleared around one test; if that test dies half-way, clear it with
 * `update core.environment set real_data_started_at = null, real_data_marked_by = null`.
 * `npm run test:db`.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { exportConfig, importConfig } from "./config-transfer.mjs";
import { connectAdmin } from "./db-admin.mjs";
import { checkLayers } from "./db-layers.mjs";
import { reset } from "./db-reset.mjs";
import { loadSamples } from "./db-sample.mjs";

const P = "t0076_probe";
const schemas = [P];
let client;
let seedsDir;

const count = async (table) =>
  (await client.query(`select count(*)::int as n from ${P}.${table}`)).rows[0].n;

beforeAll(async () => {
  client = await connectAdmin();
  seedsDir = mkdtempSync(join(tmpdir(), "seeds-"));
  writeFileSync(
    join(seedsDir, "0001_catalog.sql"),
    `insert into ${P}.catalog (id, name) values (1, 'factory')
       on conflict (id) do update set name = excluded.name;`,
  );
  await client.query(`
    drop schema if exists ${P} cascade;
    delete from core.table_layer where schema_name = '${P}';
    create schema ${P};
    grant usage on schema ${P} to geoges_worker;
    create table ${P}.catalog (id int primary key, name text not null);
    create table ${P}.flow (
      id uuid primary key default core.uuid_v7(),
      catalog_id int not null references ${P}.catalog,
      name text not null,
      label text generated always as (name || ' (akış)') stored
    );
    create table ${P}.rule (
      id int generated always as identity primary key,
      flow_id uuid not null references ${P}.flow,
      limit_value numeric(18,2) not null
    );
    create table ${P}.site (
      id uuid primary key default core.uuid_v7(),
      flow_id uuid references ${P}.flow,
      name text not null
    );
    insert into core.table_layer (schema_name, table_name, layer, portable, scope_source) values
      ('${P}', 'catalog', 'seed', false, 'company'), ('${P}', 'flow', 'config', true, 'company'),
      ('${P}', 'rule', 'config', true, 'company'), ('${P}', 'site', 'business', false, 'company');
  `);
});

afterAll(async () => {
  await client?.query(`
    drop schema if exists ${P} cascade;
    delete from core.table_layer where schema_name = '${P}';
    update core.environment set real_data_started_at = null, real_data_marked_by = null;
  `);
  await client?.end();
  if (seedsDir) rmSync(seedsDir, { recursive: true, force: true });
});

async function fill() {
  await client.query(`
    truncate ${P}.site, ${P}.rule, ${P}.flow, ${P}.catalog restart identity;
    insert into ${P}.catalog values (1, 'factory'), (2, 'owner added');
    insert into ${P}.flow (id, catalog_id, name) values
      ('0192f0c1-0000-7000-8000-0000000000f1', 1, 'Satınalma onayı'),
      ('0192f0c1-0000-7000-8000-0000000000f2', 2, 'Hakediş onayı');
    insert into ${P}.rule (flow_id, limit_value) values
      ('0192f0c1-0000-7000-8000-0000000000f1', 150000.25),
      ('0192f0c1-0000-7000-8000-0000000000f2', 99.10);
    insert into ${P}.site (flow_id, name) values ('0192f0c1-0000-7000-8000-0000000000f1', 'Örnek şantiye');
  `);
}

describe("layer rules on the real catalogue", () => {
  it("accept the registered probe tables", async () => {
    await expect(checkLayers(client)).resolves.toBeUndefined();
  });

  it.each([
    ["an unregistered table", `create table ${P}.stray (id int primary key)`, /stray has no layer/],
    [
      "configuration pointing at business data",
      `alter table ${P}.flow add column site_id uuid references ${P}.site`,
      /flow \(config\) must not reference t0076_probe.site \(business\)/,
    ],
  ])("refuse %s", async (_label, change, message) => {
    await client.query("begin");
    try {
      await client.query(change);
      await expect(checkLayers(client)).rejects.toThrow(message);
    } finally {
      await client.query("rollback");
    }
  });
});

describe("resets", () => {
  beforeEach(fill);

  it("db:reset:data empties business data, keeps configuration, rebuilds factory data", async () => {
    await client.query(`update ${P}.catalog set name = 'edited' where id = 1`);
    const { emptied, seeded } = await reset(client, "data", { schemas, seedsDir });
    expect(emptied).toEqual([`${P}.site`]);
    expect(seeded).toEqual(["0001_catalog.sql"]);
    expect(await count("site")).toBe(0);
    expect([await count("flow"), await count("rule"), await count("catalog")]).toEqual([2, 2, 2]);
    const { rows } = await client.query(`select name from ${P}.catalog where id = 1`);
    expect(rows[0].name).toBe("factory");
  });

  it("db:reset:config returns configuration and factory data to factory state", async () => {
    const { emptied } = await reset(client, "config", { schemas, seedsDir });
    expect(emptied.sort()).toEqual([`${P}.catalog`, `${P}.flow`, `${P}.rule`, `${P}.site`]);
    expect([await count("site"), await count("flow"), await count("rule")]).toEqual([0, 0, 0]);
    const { rows } = await client.query(`select id, name from ${P}.catalog`);
    expect(rows).toEqual([{ id: 1, name: "factory" }]);
  });

  it("both refuse, like the sample loader, once the environment holds real data", async () => {
    await client.query("update core.environment set real_data_started_at = now()");
    try {
      await expect(reset(client, "data", { schemas, seedsDir })).rejects.toThrow(/gerçek veri/);
      await expect(reset(client, "config", { schemas, seedsDir })).rejects.toThrow(/gerçek veri/);
      await expect(loadSamples(client, seedsDir)).rejects.toThrow(/gerçek veri/);
      expect(await count("site")).toBe(1);
    } finally {
      await client.query("update core.environment set real_data_started_at = null");
    }
  });
});

describe("configuration transfer", () => {
  let exported;

  beforeAll(async () => {
    await fill();
    exported = await exportConfig(client, { schemas });
  });

  it("exports configuration tables only, without generated columns", () => {
    expect(Object.keys(exported.tables).sort()).toEqual([`${P}.flow`, `${P}.rule`]);
    expect(exported.tables[`${P}.flow`]).toHaveLength(2);
    expect(Object.keys(exported.tables[`${P}.flow`][0]).sort()).toEqual([
      "catalog_id",
      "id",
      "name",
    ]);
    expect(exported.tables[`${P}.rule`].map((r) => r.limit_value)).toEqual([150000.25, 99.1]);
    expect(exported.migration_head).toMatch(/^\d{4}_/);
  });

  it("loads into an empty target unchanged, identity values included", async () => {
    await reset(client, "config", { schemas, seedsDir });
    await client.query(`insert into ${P}.catalog values (2, 'owner added')`);
    const dry = await importConfig(client, exported, { dryRun: true, schemas });
    expect(dry).toEqual([
      { table: `${P}.flow`, add: 2, same: 0 },
      { table: `${P}.rule`, add: 2, same: 0 },
    ]);
    expect(await count("flow")).toBe(0);

    await importConfig(client, exported, { schemas });
    const again = await exportConfig(client, { schemas });
    expect(again.tables).toEqual(exported.tables);
    const next = await client.query(
      `insert into ${P}.rule (flow_id, limit_value) values ('0192f0c1-0000-7000-8000-0000000000f1', 1) returning id`,
    );
    expect(next.rows[0].id).toBe(3);
    await client.query(`delete from ${P}.rule where id = $1`, [next.rows[0].id]);
  });

  it("skips everything on a second load", async () => {
    const report = await importConfig(client, exported, { schemas });
    expect(report.every((r) => r.add === 0 && r.same === 2)).toBe(true);
  });

  it("reports a differing row and writes nothing at all", async () => {
    await client.query(
      `update ${P}.flow set name = 'Yerelde değişti' where id = '0192f0c1-0000-7000-8000-0000000000f2'`,
    );
    await client.query(`delete from ${P}.rule where limit_value = 99.10`);
    await expect(importConfig(client, exported, { schemas })).rejects.toThrow(
      /1 çakışma; hiçbir şey yazılmadı:\n {2}t0076_probe.flow \["0192f0c1-0000-7000-8000-0000000000f2"\]/,
    );
    expect(await count("rule")).toBe(1);
    const { rows } = await client.query(
      `select name from ${P}.flow where id = '0192f0c1-0000-7000-8000-0000000000f2'`,
    );
    expect(rows[0].name).toBe("Yerelde değişti");
  });

  it("refuses a file from another migration", async () => {
    await expect(
      importConfig(client, { ...exported, migration_head: "0000_other.sql" }, { schemas }),
    ).rejects.toThrow(/göçünde, dosya 0000_other.sql/);
  });
});
