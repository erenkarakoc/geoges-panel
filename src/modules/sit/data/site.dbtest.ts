/**
 * Sites against the real database (TASK-0123 step 1, migration 0064, REQ-PRJ-001, D-138, D-292).
 *
 * A site belongs to one project and never moves; a subcontracted site names its subcontractor;
 * a project-scoped coordinator opens sites in their project and sees them all, a site engineer
 * sees their own site and not its neighbour. Test data carries the ZZT-0123S code prefix and is
 * removed afterwards. `npm run test:db`.
 */
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../../scripts/db-test-people.mjs";

import { insertSite, readSites, setSiteStatus, updateSite } from "./site-store";

const id = (n: number) => `0192f0c1-0123-7200-8000-${String(n).padStart(12, "0")}`;
const COORDINATOR = id(1);
const ENGINEER = id(2);
const PEOPLE = [COORDINATOR, ENGINEER];
const PREFIX = "ZZT-0123S-";

let admin: pg.Client;
let project: string;
let otherProject: string;
let site: string;
let neighbour: string;

const as = (userId: string) => ({ userId, actingRoleId: null });

const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { hint?: string; code?: string }) => e.hint ?? e.code ?? "no code",
  );

const input = (name: string) => ({
  name,
  subcontractorPartyId: null,
  workModel: "in_house" as "in_house" | "subcontracted",
});

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

beforeAll(async () => {
  admin = await connectAdmin();
  await cleanUp();
  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id)
     select u.id, 't0123s-' || u.n || '@example.test', 'Deneme şantiye ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  const { rows } = await admin.query(
    `insert into prj.project (code, name) values ($1, 'Deneme proje bir'), ($2, 'Deneme proje iki')
     returning id`,
    [`${PREFIX}A`, `${PREFIX}B`],
  );
  [project, otherProject] = rows.map((row: { id: string }) => row.id);
  await admin.query(
    `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
     select $1, r.id, 'project', array[$2]::uuid[], iam.today() - 1 from iam.role r where r.code = 'KO'`,
    [COORDINATOR, project],
  );
});

afterAll(async () => {
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("a site belongs to one project (REQ-PRJ-001, D-138)", () => {
  it("lets a project-scoped coordinator open sites in their project, and not elsewhere", async () => {
    site = await insertSite(as(COORDINATOR), project, input("Deneme A Blok"));
    neighbour = await insertSite(as(COORDINATOR), project, input("Deneme B Blok"));
    expect(await errorOf(insertSite(as(COORDINATOR), otherProject, input("Yetkisiz")))).toBe(
      "42501",
    );
  });

  it("never moves a site to another project", async () => {
    expect(
      await errorOf(
        admin.query("update sit.site set project_id = $1 where id = $2", [otherProject, site]),
      ),
    ).toBe("sit.site_project_fixed");
  });

  it("asks a subcontracted site for its subcontractor", async () => {
    expect(
      await errorOf(
        updateSite(as(COORDINATOR), site, {
          ...input("Deneme A Blok"),
          workModel: "subcontracted",
        }),
      ),
    ).toBe("23514");
  });

  it("turns a wrongly opened site passive instead of removing it", async () => {
    expect(await setSiteStatus(as(COORDINATOR), neighbour, "passive")).toBe(true);
    const found = (await readSites(as(COORDINATOR), { projectId: project })).find(
      (one) => one.id === neighbour,
    );
    expect(found?.status).toBe("passive");
  });

  it("uses a site name once within a project", async () => {
    expect(await errorOf(insertSite(as(COORDINATOR), project, input("deneme a blok")))).toBe(
      "23505",
    );
  });
});

describe("who sees which site (scope)", () => {
  beforeAll(async () => {
    await admin.query(
      `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
       select $1, r.id, 'site', array[$2]::uuid[], iam.today() - 1 from iam.role r where r.code = 'SM'`,
      [ENGINEER, site],
    );
  });

  it("shows the coordinator every site of the project", async () => {
    const seen = (await readSites(as(COORDINATOR))).map((one) => one.id);
    expect(seen).toEqual(expect.arrayContaining([site, neighbour]));
  });

  it("shows the site engineer their own site and not its neighbour", async () => {
    const seen = (await readSites(as(ENGINEER))).map((one) => one.id);
    expect(seen).toContain(site);
    expect(seen).not.toContain(neighbour);
  });

  it("publishes the site's events", async () => {
    const { rows } = await admin.query(
      "select event_code from core.outbox where record_id = $1 order by id",
      [neighbour],
    );
    expect(rows.map((row: { event_code: string }) => row.event_code)).toEqual([
      "site.created",
      "site.changed",
    ]);
  });
});
