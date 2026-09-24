/**
 * The mandatory trio, against the database that exists (TASK-0116, D-277, OQ-037;
 * `docs/database/COVERAGE.md` section 3). `npm run test:db`.
 *
 * The rule is read from the register rather than from column names: each table declares where its
 * scope comes from, and the test holds it to the declaration. That is the point of the declaration
 * — `adm.rule_key` has a column called `unit` that means "gün" or "TL", and a test reading names
 * would have called it scoped.
 *
 * Nothing here is written; every query reads catalogs.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "./db-admin.mjs";

let client;
let tables;

beforeAll(async () => {
  client = await connectAdmin();
  const { rows } = await client.query(`
    select l.schema_name || '.' || l.table_name as name, l.layer, l.scope_source, l.history,
           c.relrowsecurity as rls,
           (select count(*)::int from pg_policy p where p.polrelid = c.oid) as policies,
           has_table_privilege('geoges_app', l.schema_name || '.' || l.table_name, 'SELECT')
             or has_table_privilege('geoges_app', l.schema_name || '.' || l.table_name, 'INSERT')
             or has_table_privilege('geoges_app', l.schema_name || '.' || l.table_name, 'UPDATE')
             or has_table_privilege('geoges_app', l.schema_name || '.' || l.table_name, 'DELETE')
             as reachable,
           exists (select 1 from information_schema.columns col
                    where col.table_schema = l.schema_name and col.table_name = l.table_name
                      and col.column_name in ('scope_type', 'site_id', 'project_id', 'unit'))
             as carries_scope
      from core.table_layer l
      join pg_class c on c.oid = (l.schema_name || '.' || l.table_name)::regclass
     order by 1`);
  tables = rows;
});

afterAll(async () => {
  await client?.end();
});

const names = (rows) => rows.map((r) => r.name).sort();

const PROBE = "zz_trio_probe";

/** The same query as above, for one throw-away table. */
async function judge(table) {
  const { rows } = await client.query(
    `select l.schema_name || '.' || l.table_name as name, l.scope_source,
            c.relrowsecurity as rls,
            (select count(*)::int from pg_policy p where p.polrelid = c.oid) as policies,
            has_table_privilege('geoges_app', l.schema_name || '.' || l.table_name, 'SELECT')
              as reachable,
            exists (select 1 from information_schema.columns col
                     where col.table_schema = l.schema_name and col.table_name = l.table_name
                       and col.column_name in ('scope_type', 'site_id', 'project_id', 'unit'))
              as carries_scope
       from core.table_layer l
       join pg_class c on c.oid = (l.schema_name || '.' || l.table_name)::regclass
      where l.schema_name = $1 and l.table_name = $2`,
    [PROBE, table],
  );
  return rows[0];
}

describe("the mandatory trio (COVERAGE.md section 3, D-277)", () => {
  it("has tables to judge", () => {
    expect(tables.length).toBeGreaterThan(40);
  });

  it("every registered table says where its scope comes from", () => {
    const undeclared = tables.filter(
      (t) => !["own", "parent", "person", "company"].includes(t.scope_source),
    );
    expect(names(undeclared)).toEqual([]);
  });

  it("a table that declares its own scope carries one", () => {
    const lying = tables.filter((t) => t.scope_source === "own" && !t.carries_scope);
    expect(names(lying)).toEqual([]);
  });

  it("every table the application can touch has row level security and a policy", () => {
    const open = tables.filter((t) => t.reachable && (!t.rls || t.policies === 0));
    expect(names(open)).toEqual([]);
  });

  /**
   * The inverse is the stronger fact and the reason two tables have no policy at all: the
   * application has no privilege on `iam.login_attempt` or `iam.recovery_code`, so there is
   * nothing for a policy to narrow (D-272). A grant appearing there is what this catches.
   */
  it("a table without a policy is one the application cannot reach", () => {
    const unguarded = tables.filter((t) => t.policies === 0 && t.reachable);
    expect(names(unguarded)).toEqual([]);
  });

  it("a business or configuration record that carries its own scope keeps a history", () => {
    const untracked = tables.filter(
      (t) =>
        ["business", "config"].includes(t.layer) &&
        t.scope_source === "own" &&
        t.history !== "tracked",
    );
    expect(names(untracked)).toEqual([]);
  });
});

/**
 * The checks above pass, which is only worth something if they can fail. Two throw-away tables
 * break the rules on purpose in a schema of their own; nothing outside it is touched, and both
 * the tables and their register rows go away again.
 */
describe("the checks can fail", () => {
  beforeAll(async () => {
    await client.query(`
      drop schema if exists ${PROBE} cascade;
      delete from core.table_layer where schema_name = '${PROBE}';
      create schema ${PROBE};
      create table ${PROBE}.claims_a_scope (id uuid primary key default core.uuid_v7());
      create table ${PROBE}.open_to_everyone (id uuid primary key default core.uuid_v7());
      grant select on ${PROBE}.open_to_everyone to geoges_app;
      insert into core.table_layer (schema_name, table_name, layer, scope_source, history) values
        ('${PROBE}', 'claims_a_scope', 'business', 'own', 'none'),
        ('${PROBE}', 'open_to_everyone', 'business', 'company', 'none');`);
  });

  afterAll(async () => {
    await client.query(`
      drop schema if exists ${PROBE} cascade;
      delete from core.table_layer where schema_name = '${PROBE}';`);
  });

  it("catches a table that declares a scope it does not carry", async () => {
    const row = await judge("claims_a_scope");
    expect(row.scope_source).toBe("own");
    expect(row.carries_scope).toBe(false);
  });

  it("catches a table the application can read with no policy in front of it", async () => {
    const row = await judge("open_to_everyone");
    expect(row.reachable).toBe(true);
    expect(row.rls === false || row.policies === 0).toBe(true);
  });
});
