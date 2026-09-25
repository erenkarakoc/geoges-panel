/**
 * Projects against the real database (TASK-0123 step 1, migration 0064, REQ-PRJ-001…003, D-292).
 *
 * What is proved here is what a screen could not keep on its own: who sees which project follows
 * the scope of their roles — a site-scoped engineer reads the project of their site and no other —
 * the contract value never reaches a person without the commercial right, the stage is a catalog
 * code and every change of it is history and an event, and a project code is used once. Test
 * projects carry codes starting ZZT-0123 and are removed afterwards. `npm run test:db`.
 */
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../../scripts/db-test-people.mjs";

import {
  insertProject,
  readProject,
  readProjects,
  saveContract,
  setProjectStage,
  updateProject,
} from "./project-store";

const id = (n: number) => `0192f0c1-0123-7100-8000-${String(n).padStart(12, "0")}`;
const OFFICE = id(1); // technical office: manages projects company-wide, sees commercial data
const COORDINATOR = id(2); // coordinator, scoped to the first project
const ENGINEER = id(3); // site engineer, scoped to one site of the first project
const PEOPLE = [OFFICE, COORDINATOR, ENGINEER];
const PREFIX = "ZZT-0123-";

let admin: pg.Client;
let first: string;
let second: string;
let firstSite: string;

const as = (userId: string) => ({ userId, actingRoleId: null });

const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { hint?: string; code?: string }) => e.hint ?? e.code ?? "no code",
  );

const card = (code: string, name: string) => ({ code: `${PREFIX}${code}`, name });

async function cleanUp() {
  const { rows } = await admin.query("select id from prj.project where code like $1", [
    `${PREFIX}%`,
  ]);
  const projects = rows.map((row: { id: string }) => row.id);
  if (projects.length) {
    const { rows: siteRows } = await admin.query(
      "select id from sit.site where project_id = any($1::uuid[])",
      [projects],
    );
    const sites = siteRows.map((row: { id: string }) => row.id);
    const { rows: contractRows } = await admin.query(
      "select id from prj.project_contract where project_id = any($1::uuid[])",
      [projects],
    );
    const contracts = contractRows.map((row: { id: string }) => row.id);
    const records = [...projects, ...sites];
    await admin.query(
      `delete from core.outbox_delivery where outbox_id in
         (select id from core.outbox where record_id = any($1::uuid[]))`,
      [records],
    );
    await admin.query("delete from core.outbox where record_id = any($1::uuid[])", [records]);
    await admin.query(
      `delete from core.search_posting where search_row_id in
         (select id from core.search_row where record_id = any($1::uuid[]))`,
      [records],
    );
    await admin.query("delete from core.search_row where record_id = any($1::uuid[])", [records]);
    await admin.query("select aud.purge_record_history_for_reset('sit.site', $1::uuid[])", [sites]);
    await admin.query("delete from sit.site where id = any($1::uuid[])", [sites]);
    await admin.query(
      "select aud.purge_record_history_for_reset('prj.project_contract', $1::uuid[])",
      [contracts],
    );
    await admin.query("delete from prj.project_contract where id = any($1::uuid[])", [contracts]);
    await admin.query("alter table prj.project_stage_change disable trigger append_only_guard");
    try {
      await admin.query("delete from prj.project_stage_change where project_id = any($1::uuid[])", [
        projects,
      ]);
    } finally {
      await admin.query("alter table prj.project_stage_change enable trigger append_only_guard");
    }
    await admin.query("select aud.purge_record_history_for_reset('prj.project', $1::uuid[])", [
      projects,
    ]);
    await admin.query("delete from prj.project where id = any($1::uuid[])", [projects]);
  }
  await admin.query("delete from iam.role_assignment where user_id = any($1::uuid[])", [PEOPLE]);
  await releaseTestPeople(admin, PEOPLE);
  await admin.query("delete from iam.user where id = any($1::uuid[])", [PEOPLE]);
}

async function assign(person: string, role: string, scopeType: string, scopeIds: string[]) {
  await admin.query(
    `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
     select $1, r.id, $3, $4::uuid[], iam.today() - 1 from iam.role r where r.code = $2`,
    [person, role, scopeType, scopeIds],
  );
}

beforeAll(async () => {
  admin = await connectAdmin();
  await cleanUp();
  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id)
     select u.id, 't0123p-' || u.n || '@example.test', 'Deneme proje ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  await assign(OFFICE, "TO", "company", []);
});

afterAll(async () => {
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("the project card (REQ-PRJ-002, REQ-PRJ-010)", () => {
  it("opens a project with its three durations typed apart, in the contract stage", async () => {
    first = await insertProject(
      as(OFFICE),
      {
        ...card("A", "Deneme Kavaklı İstinat Duvarları"),
        contractEndOn: "2027-06-30",
        managementTargetEndOn: "2027-03-31",
        theoreticalEndOn: "2027-05-15",
      },
      { contractValue: 12_500_000, currency: "TRY" },
    );
    second = await insertProject(as(OFFICE), card("B", "Deneme Ilgaz Şev Duvarı"), null);
    const found = await readProject(as(OFFICE), first);
    expect(found?.project).toMatchObject({
      contractEndOn: "2027-06-30",
      managementTargetEndOn: "2027-03-31",
      stage: "contract",
      theoreticalEndOn: "2027-05-15",
    });
    expect(found?.contract).toEqual({ contractValue: 12_500_000, currency: "TRY" });
  });

  it("uses a project code once", async () => {
    expect(
      await errorOf(insertProject(as(OFFICE), card("a", "Aynı kod, küçük harfle"), null)),
    ).toBe("23505");
  });

  it("keeps every stage the project entered, and refuses one the catalog does not know", async () => {
    expect(await setProjectStage(as(OFFICE), first, "technical_design")).toBe(true);
    expect(await errorOf(setProjectStage(as(OFFICE), first, "no_such_stage"))).toBe(
      "prj.unknown_stage",
    );
    const found = await readProject(as(OFFICE), first);
    expect(found?.stages.map((s) => [s.fromStage, s.toStage])).toEqual([
      [null, "contract"],
      ["contract", "technical_design"],
    ]);
  });

  it("publishes created, stage changed and changed — each once, and none for nothing", async () => {
    await updateProject(as(OFFICE), first, {
      ...card("A", "Deneme Kavaklı İstinat Duvarları"),
      city: "Kastamonu",
      contractEndOn: "2027-06-30",
      managementTargetEndOn: "2027-03-31",
      theoreticalEndOn: "2027-05-15",
    });
    const { rows } = await admin.query(
      "select event_code from core.outbox where record_id = $1 order by id",
      [first],
    );
    expect(rows.map((row: { event_code: string }) => row.event_code)).toEqual([
      "project.created",
      "project.stage_changed",
      "project.changed",
    ]);
  });

  it("never lets the stage history be rewritten", async () => {
    expect(
      await errorOf(
        admin.query(
          "update prj.project_stage_change set to_stage = 'closure' where project_id = $1",
          [first],
        ),
      ),
    ).not.toBe("no error");
  });
});

describe("who sees which project (D-292 rule 6, scope)", () => {
  beforeAll(async () => {
    const { rows } = await admin.query(
      `insert into sit.site (project_id, name) values ($1, 'Deneme A Blok'), ($1, 'Deneme B Blok')
       returning id`,
      [first],
    );
    // The second site is the one the engineer is not scoped to.
    firstSite = rows[0].id;
    await assign(COORDINATOR, "KO", "project", [first]);
    await assign(ENGINEER, "SM", "site", [firstSite]);
  });

  it("shows a project-scoped coordinator their project and no other, with its value", async () => {
    const seen = (await readProjects(as(COORDINATOR))).map((row) => row.id);
    expect(seen).toContain(first);
    expect(seen).not.toContain(second);
    expect((await readProject(as(COORDINATOR), first))?.contract?.contractValue).toBe(12_500_000);
  });

  it("shows a site engineer the project of their site, without the contract value", async () => {
    const seen = (await readProjects(as(ENGINEER))).map((row) => row.id);
    expect(seen).toEqual(expect.arrayContaining([first]));
    expect(seen).not.toContain(second);
    const found = await readProject(as(ENGINEER), first);
    expect(found?.project.name).toBe("Deneme Kavaklı İstinat Duvarları");
    expect(found?.contract).toBeNull();
  });

  it("refuses a contract value written without the commercial right", async () => {
    expect(
      await errorOf(saveContract(as(ENGINEER), first, { contractValue: 1, currency: "TRY" })),
    ).toBe("42501");
  });

  it("lets only a company-wide right open a new project", async () => {
    expect(await errorOf(insertProject(as(COORDINATOR), card("C", "Yetkisiz proje"), null))).toBe(
      "42501",
    );
  });
});
