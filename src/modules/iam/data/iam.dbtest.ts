/**
 * Dynamic IAM against the real database (TASK-0102, PERMISSIONS.md, D-256).
 *
 * People and assignments are written over the admin connection with fixed test ids and removed
 * afterwards; the questions are asked as the restricted runtime role through `runAsUser`, exactly
 * as request code asks them. The configuration reset is simulated inside a transaction that is
 * rolled back, so the test never empties the environment's real configuration.
 * `npm run test:db`.
 */
import { sql } from "kysely";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { exportConfig } from "../../../../scripts/config-transfer.mjs";
import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import {
  SEEDS_DIR,
  emptyLayers,
  removeSampleRows,
  runSqlFolder,
} from "../../../../scripts/db-layers.mjs";
import { readDatabaseConfig } from "@/platform/db/database-config";
import { createRunAsUser } from "@/platform/db/run-as-user";

const id = (n: number) => `0192f0c1-0102-7000-8000-${String(n).padStart(12, "0")}`;
const OWNER = id(1);
const KO_A = id(2);
const SM_A = id(3);
const SM_B = id(4);
const DELEGATE = id(5);
const GONE = id(6);
const OUTSIDER = id(7);
const PEOPLE = [OWNER, KO_A, SM_A, SM_B, DELEGATE, GONE];
const SITE_A = id(101);
const SITE_B = id(102);
const PROBE = "t0102_probe";
const LIMITED_ROLE = "T0102_LIMITED";

let admin: pg.Client;
let pool: pg.Pool;
let runAsUser: ReturnType<typeof createRunAsUser>;
const role: Record<string, string> = {};

async function cleanUp() {
  for (const statement of [
    "delete from iam.user_action_role_choice where user_id = any($1)",
    "delete from iam.user_exception where user_id = any($1)",
    "delete from iam.user_manager where user_id = any($1) or manager_user_id = any($1)",
    "delete from iam.role_assignment where user_id = any($1)",
    "delete from iam.user where id = any($1)",
  ]) {
    await admin.query(statement.replaceAll("$1", "$1::uuid[]"), [PEOPLE]);
  }
  await admin.query(`
    delete from iam.role_permission
     where role_id in (select id from iam.role where code = '${LIMITED_ROLE}');
    delete from iam.role where code = '${LIMITED_ROLE}';`);
}

/** Runs one statement as a person (and acting role) through the runtime role. */
function as<T>(userId: string, query: string, actingRoleId: string | null = null) {
  return runAsUser({ userId, actingRoleId }, async (db) => {
    const { rows } = await sql.raw<T>(query).execute(db);
    return rows;
  });
}

const grantsOf = async (userId: string) =>
  (
    await as<{ permission_code: string; scope_ids: string[] }>(
      userId,
      "select permission_code, scope_ids from iam.my_grants()",
    )
  ).map((g) => `${g.permission_code}${g.scope_ids.length ? `@${g.scope_ids.join(",")}` : ""}`);

const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { hint?: string; code?: string }) => e.hint ?? e.code ?? "no code",
  );

const assign = (user: string, code: string, sites: string[] | null) =>
  admin.query(
    `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
     values ($1, $2, $3, $4, iam.today() - 10)`,
    [user, role[code], sites ? "site" : "company", sites ?? []],
  );

beforeAll(async () => {
  admin = await connectAdmin();
  pool = new pg.Pool(readDatabaseConfig());
  runAsUser = createRunAsUser(pool);
  await cleanUp();
  const { rows } = await admin.query("select code, id from iam.role");
  for (const r of rows) role[r.code] = r.id;

  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id, left_on, is_bootstrap_owner)
     select u.id, 't0102-' || u.n || '@example.test', 'Deneme ' || u.n, u.id,
            case when u.id = $2::uuid then iam.today() end, u.id = $3::uuid
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE, GONE, OWNER],
  );
  await assign(OWNER, "SAH", null);
  await assign(KO_A, "KO", [SITE_A]);
  await assign(SM_A, "SM", [SITE_A]);
  await assign(SM_B, "SM", [SITE_B]);
  await assign(GONE, "SM", [SITE_A]);

  await admin.query(`
    drop schema if exists ${PROBE} cascade;
    create schema ${PROBE};
    create table ${PROBE}.daily_log (
      id uuid primary key default core.uuid_v7(),
      site_id uuid not null,
      body text not null
    );
    alter table ${PROBE}.daily_log enable row level security;
    create policy daily_log_read on ${PROBE}.daily_log for select to geoges_app
      using ((select iam.has_company_scope('sit.module.view'))
             or site_id = any ((select iam.scope_ids('sit.module.view', 'site'))::uuid[]));
    grant usage on schema ${PROBE} to geoges_app;
    grant select on ${PROBE}.daily_log to geoges_app;
    insert into ${PROBE}.daily_log (site_id, body)
      values ('${SITE_A}', 'kavaklı-1'), ('${SITE_A}', 'kavaklı-2'), ('${SITE_B}', 'ilgaz-1');
  `);
});

afterAll(async () => {
  await pool?.end();
  if (admin) {
    await admin.query(`drop schema if exists ${PROBE} cascade`);
    await cleanUp();
    await admin.end();
  }
});

const logsSeenBy = async (userId: string) =>
  (await as<{ body: string }>(userId, `select body from ${PROBE}.daily_log order by body`)).map(
    (r) => r.body,
  );

describe("scope and row level security (REQ-IAM-012)", () => {
  it("shows each site engineer only the rows of their own site", async () => {
    expect(await logsSeenBy(SM_A)).toEqual(["kavaklı-1", "kavaklı-2"]);
    expect(await logsSeenBy(SM_B)).toEqual(["ilgaz-1"]);
  });

  it("shows the owner every row and an unknown or departed person none", async () => {
    expect(await logsSeenBy(OWNER)).toEqual(["ilgaz-1", "kavaklı-1", "kavaklı-2"]);
    expect(await logsSeenBy(OUTSIDER)).toEqual([]);
    expect(await logsSeenBy(GONE)).toEqual([]);
  });

  it("takes a departed or unknown account's access away (REQ-IAM-006, REQ-IAM-007)", async () => {
    expect(await as(GONE, "select * from iam.my_account()")).toEqual([]);
    expect(await grantsOf(GONE)).toEqual([]);
    expect(await as(SM_A, "select id from iam.my_account()")).toEqual([{ id: SM_A }]);
  });

  it("carries the matrix: the site engineer manages their site and sees no finance", async () => {
    const grants = await grantsOf(SM_A);
    expect(grants).toContain(`sit.module.manage@${SITE_A}`);
    expect(grants).toContain(`fin.module.own@${SITE_A}`);
    expect(grants.some((g) => g.startsWith("fin.module.view"))).toBe(false);
  });

  it("opens commercial data module by module and site by site (REQ-IAM-011)", async () => {
    const ask = (userId: string, module: string, site: string) =>
      as<{ yes: boolean }>(
        userId,
        `select iam.can_see('${module}', 'commercial', 'site', '${site}') as yes`,
      ).then((r) => r[0].yes);
    expect(await ask(KO_A, "fin", SITE_A)).toBe(true);
    expect(await ask(KO_A, "fin", SITE_B)).toBe(false);
    expect(await ask(SM_A, "fin", SITE_A)).toBe(false);
    expect(await ask(OWNER, "hr", SITE_B)).toBe(true);
  });
});

describe("delegation (REQ-IAM-018, REQ-IAM-019)", () => {
  it("drops a delegation after its end date without anyone acting", async () => {
    await admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on, ends_on,
                                        is_delegation, delegated_by_user_id)
       values ($1, $2, 'site', array[$3::uuid], iam.today() - 5, iam.today() - 1, true, $4)`,
      [DELEGATE, role.SM, SITE_A, SM_A],
    );
    expect(await logsSeenBy(DELEGATE)).toEqual([]);
  });

  it("lets a person delegate their own role, and the delegate stands in for them", async () => {
    await as(
      SM_A,
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on, ends_on,
                                        is_delegation, delegated_by_user_id)
       values ('${DELEGATE}', '${role.SM}', 'site', array['${SITE_A}'::uuid], iam.today(),
               iam.today() + 3, true, '${SM_A}')`,
    );
    expect(await logsSeenBy(DELEGATE)).toEqual(["kavaklı-1", "kavaklı-2"]);
    const delegates = await as<{ id: string }>(
      KO_A,
      `select iam.active_delegates('${SM_A}', 'site', '${SITE_A}') as id`,
    );
    expect(delegates).toEqual([{ id: DELEGATE }]);
  });

  it("refuses a delegation of a role the person does not hold", async () => {
    const attempt = as(
      SM_A,
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on, ends_on,
                                        is_delegation, delegated_by_user_id)
       values ('${DELEGATE}', '${role.KO}', 'site', array['${SITE_A}'::uuid], iam.today(),
               iam.today() + 3, true, '${SM_A}')`,
    );
    expect(await errorOf(attempt)).toBe("iam.delegation_not_held");
  });

  it("refuses a delegation beyond the person's own scope", async () => {
    const attempt = as(
      SM_A,
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on, ends_on,
                                        is_delegation, delegated_by_user_id)
       values ('${DELEGATE}', '${role.SM}', 'site', array['${SITE_B}'::uuid], iam.today(),
               iam.today() + 3, true, '${SM_A}')`,
    );
    expect(await errorOf(attempt)).toBe("iam.delegation_not_held");
  });
});

describe("database guards (SCHEMA-PLATFORM iam constraints)", () => {
  it("refuses flow design to a role without full visibility (D-083)", async () => {
    await admin.query(
      `insert into iam.role (code, name, level) values ('${LIMITED_ROLE}', 'Deneme kısıtlı', 10)`,
    );
    const attempt = admin.query(
      `insert into iam.role_permission (role_id, permission_id)
       select r.id, p.id from iam.role r, iam.permission p
        where r.code = '${LIMITED_ROLE}' and p.code = 'wfl.workflow.design'`,
    );
    expect(await errorOf(attempt)).toBe("iam.flow_design_needs_full_visibility");
  });

  it("never narrows the owner layer (REQ-IAM-023, REQ-IAM-024, IAM-K1)", async () => {
    expect(
      await errorOf(
        admin.query(
          `update iam.role_assignment set ends_on = iam.today() where user_id = '${OWNER}'`,
        ),
      ),
    ).toBe("iam.owner_layer_unrestricted");
    expect(
      await errorOf(
        admin.query(
          `insert into iam.role_data_class (role_id, module, can_see_commercial)
           values ('${role.SAH}', 'fin', true)`,
        ),
      ),
    ).toBe("iam.owner_layer_unrestricted");
    expect(
      await errorOf(
        admin.query(
          `update iam.role_permission set revoked_at = now() where role_id = '${role.SAH}'`,
        ),
      ),
    ).toBe("iam.owner_layer_unrestricted");
    expect(
      await errorOf(
        admin.query(
          `insert into iam.user_exception (user_id, target, effect, reason)
           values ('${OWNER}', 'fin', 'deny', 'deneme')`,
        ),
      ),
    ).toBe("iam.owner_layer_unrestricted");
    expect(
      await errorOf(admin.query(`update iam.user set status = 'disabled' where id = '${OWNER}'`)),
    ).toBe("iam.owner_layer_unrestricted");
    expect(
      await errorOf(
        admin.query(`update iam.role set has_full_visibility = false where id = '${role.SAH}'`),
      ),
    ).toBe("iam.owner_layer_unrestricted");
  });

  it("refuses overlapping dates for the same person, role and site, but not another site", async () => {
    const again = (site: string) =>
      admin.query(
        `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
         values ('${SM_A}', '${role.SM}', 'site', array['${site}'::uuid], iam.today())`,
      );
    expect(await errorOf(again(SITE_A))).toBe("iam.assignment_overlap");
    expect(await errorOf(again(SITE_B))).toBe("no error");
    await admin.query(
      `delete from iam.role_assignment where user_id = '${SM_A}' and scope_ids = array['${SITE_B}'::uuid]`,
    );
  });

  it("assigns a full-visibility role company-wide only", async () => {
    const attempt = admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids)
       values ('${SM_B}', '${role.SAH}', 'site', array['${SITE_B}'::uuid])`,
    );
    expect(await errorOf(attempt)).toBe("iam.full_visibility_company_scope");
  });
});

describe("personal exceptions (REQ-IAM-015)", () => {
  it("are written by the owner layer only", async () => {
    const write = (by: string) =>
      as(
        by,
        `insert into iam.user_exception (user_id, target, effect, reason)
         values ('${SM_A}', 'fin.module.view', 'grant', 'deneme')`,
      );
    expect(await errorOf(write(KO_A))).toBe("42501");
    expect(await errorOf(write(OWNER))).toBe("no error");
  });

  it("add a permission without a role and take a whole module away", async () => {
    expect(await grantsOf(SM_A)).toContain("fin.module.view");
    const roles = await as<{ role_id: string | null }>(
      SM_A,
      "select role_id from iam.my_grants() where permission_code = 'fin.module.view'",
    );
    expect(roles).toEqual([{ role_id: null }]);

    await as(
      OWNER,
      `insert into iam.user_exception (user_id, target, effect, reason)
       values ('${SM_A}', 'sit', 'deny', 'deneme')`,
    );
    expect(await logsSeenBy(SM_A)).toEqual([]);
    expect((await grantsOf(SM_A)).some((g) => g.startsWith("sit."))).toBe(false);
    await admin.query(
      `update iam.user_exception set revoked_at = now() where user_id = '${SM_A}' and effect = 'deny'`,
    );
    expect(await logsSeenBy(SM_A)).toEqual(["kavaklı-1", "kavaklı-2"]);
  });
});

describe("hierarchy (REQ-IAM-014)", () => {
  const managersOf = (userId: string, site: string) =>
    as<{ id: string }>(KO_A, `select iam.manager_of('${userId}', 'site', '${site}') as id`).then(
      (r) => r.map((x) => x.id),
    );

  it("finds the parent role holder in the same site", async () => {
    expect(await managersOf(SM_A, SITE_A)).toEqual([KO_A]);
  });

  it("climbs to the next level when nobody holds the parent role there", async () => {
    expect(await managersOf(SM_B, SITE_B)).toEqual([OWNER]);
  });

  it("puts a manual manager first", async () => {
    await admin.query(
      `insert into iam.user_manager (user_id, manager_user_id) values ('${SM_B}', '${KO_A}')`,
    );
    expect(await managersOf(SM_B, SITE_B)).toEqual([KO_A]);
  });
});

describe("acting role (REQ-IAM-013)", () => {
  it("accepts only a role the person holds as the acting role", async () => {
    const valid = (roleId: string) =>
      as<{ yes: boolean }>(SM_A, "select iam.acting_role_valid() as yes", roleId).then(
        (r) => r[0].yes,
      );
    expect(await valid(role.SM)).toBe(true);
    expect(await valid(role.KO)).toBe(false);
  });

  it("remembers a choice only among the person's own roles", async () => {
    const choose = (roleId: string) =>
      as(
        SM_A,
        `insert into iam.user_action_role_choice (user_id, permission_code, role_id)
         values ('${SM_A}', 'sit.module.manage', '${roleId}')`,
      );
    expect(await errorOf(choose(role.KO))).toBe("42501");
    expect(await errorOf(choose(role.SM))).toBe("no error");
  });
});

describe("resets and transfer (D-256)", () => {
  it("gives the bootstrap owner the owner role back after a configuration reset", async () => {
    await admin.query("begin");
    try {
      await emptyLayers(admin, ["config"], ["iam"]);
      await runSqlFolder(admin, SEEDS_DIR);
      const { rows } = await admin.query(
        `select u.id, r.code from iam.role_assignment a
           join iam.user u on u.id = a.user_id join iam.role r on r.id = a.role_id
          where u.id = any($1::uuid[])`,
        [PEOPLE],
      );
      expect(rows).toEqual([{ id: OWNER, code: "SAH" }]);
      const { rows: people } = await admin.query(
        "select count(*)::int as n from iam.user where id = any($1::uuid[])",
        [PEOPLE],
      );
      expect(people[0].n).toBe(PEOPLE.length);
    } finally {
      await admin.query("rollback");
    }
  });

  it("removes sample people with the rows naming them, never a real account", async () => {
    const SAMPLE = id(50);
    await admin.query("begin");
    try {
      await admin.query(
        `insert into iam.user (id, email, display_name, auth_provider_id, is_sample)
         values ($1, 't0102-sample@example.test', 'Örnek kişi', $1, true)`,
        [SAMPLE],
      );
      await admin.query(
        `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids)
         values ($1, $2, 'site', array[$3::uuid])`,
        [SAMPLE, role.SM, SITE_A],
      );
      await admin.query("insert into iam.user_manager (user_id, manager_user_id) values ($1, $2)", [
        SM_A,
        SAMPLE,
      ]);
      const { tables, removed } = await removeSampleRows(admin, ["iam"]);
      expect(tables).toEqual(["iam.user"]);
      expect(removed).toBe(3);
      const { rows } = await admin.query(
        "select count(*)::int as n from iam.user where id = any($1::uuid[])",
        [[...PEOPLE, SAMPLE]],
      );
      expect(rows[0].n).toBe(PEOPLE.length);
    } finally {
      await admin.query("rollback");
    }
  });

  it("exports roles and what they hold, never assignments or people", async () => {
    const data = await exportConfig(admin, { schemas: ["iam"] });
    expect(Object.keys(data.tables).sort()).toEqual([
      "iam.permission",
      "iam.role",
      "iam.role_data_class",
      "iam.role_permission",
    ]);
  });
});
