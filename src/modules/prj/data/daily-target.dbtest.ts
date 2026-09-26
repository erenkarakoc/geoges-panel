/**
 * Daily targets against the real database (TASK-0123 step 3, migration 0068, REQ-PRJ-011, D-137,
 * D-292 rule 4).
 *
 * What is proved here: the target is the work left divided by the working days left, the day
 * included; a day off has no target and cannot be given one; the end date is the site's choice,
 * else management → theoretical → contract; a correction keeps the calculated value the database
 * worked out, whatever the insert said; the latest correction wins and an empty one returns the
 * line to its calculation; a past day is not corrected; somebody who does not manage the site
 * cannot correct it; before a revision is valid there is no target.
 * Test data carries the ZZT-0123D prefix and is removed afterwards. `npm run test:db`.
 */
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../../scripts/db-test-people.mjs";
import { kyselyOn, type PooledClient } from "@/platform/db/run-as-user";

import { insertCorrection, readDailyTargets } from "./daily-target-store";
import {
  addWall,
  setRevisionStatusAsSystem,
  setTarget,
  startRevision,
  submitRevision,
} from "./revision-store";

const id = (n: number) => `0192f0c1-0123-7400-8000-${String(n).padStart(12, "0")}`;
const OFFICE = id(1);
const STRANGER = id(2);
const PEOPLE = [OFFICE, STRANGER];
const PREFIX = "ZZT-0123D-";

let admin: pg.Client;
let project: string;
let site: string;
let panel: string;
let workDay: string;
let dayOff: string;
let managementEnd: string;
let contractEnd: string;

const as = (userId: string) => ({ userId, actingRoleId: null });
const db = () => kyselyOn(admin as unknown as PooledClient);
const here = () => ({ projectId: project, siteId: site });

const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { hint?: string; code?: string }) => e.hint ?? e.code ?? "no code",
  );

const one = async (query: string, values: unknown[] = []) =>
  (await admin.query(query, values)).rows[0];

const panelLine = (measure: "panel_cast" | "panel_install" = "panel_cast") => ({
  measure,
  panelTypeId: panel,
  reason: "Vinç arızası nedeniyle",
  stripLengthM: null,
  stripTypeId: null,
  workItemId: null,
});

async function cleanUp() {
  const { rows } = await admin.query("select id from prj.project where code like $1", [
    `${PREFIX}%`,
  ]);
  const projects = rows.map((row: { id: string }) => row.id);
  if (projects.length) {
    await admin.query("alter table prj.daily_target_correction disable trigger append_only_guard");
    try {
      await admin.query(
        "delete from prj.daily_target_correction where project_id = any($1::uuid[])",
        [projects],
      );
    } finally {
      await admin.query("alter table prj.daily_target_correction enable trigger append_only_guard");
    }
    const tables = ["prj.revision_wall", "prj.wall", "prj.project_revision", "sit.site"];
    const ids: Record<string, string[]> = {};
    ids["prj.wall_target"] = (
      await admin.query(
        `select t.id from prj.wall_target t join prj.project_revision r on r.id = t.revision_id
          where r.project_id = any($1::uuid[])`,
        [projects],
      )
    ).rows.map((row: { id: string }) => row.id);
    for (const table of tables) {
      ids[table] = (
        await admin.query(`select id from ${table} where project_id = any($1::uuid[])`, [projects])
      ).rows.map((row: { id: string }) => row.id);
    }
    const records = [...projects, ...Object.values(ids).flat()];
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
    await admin.query("alter table prj.wall_target disable trigger guard_draft");
    await admin.query("alter table prj.revision_wall disable trigger guard_draft");
    try {
      for (const table of ["prj.wall_target", ...tables]) {
        await admin.query("select aud.purge_record_history_for_reset($1, $2::uuid[])", [
          table,
          ids[table],
        ]);
        await admin.query(`delete from ${table} where id = any($1::uuid[])`, [ids[table]]);
      }
    } finally {
      await admin.query("alter table prj.wall_target enable trigger guard_draft");
      await admin.query("alter table prj.revision_wall enable trigger guard_draft");
    }
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
  const { rows: types } = await admin.query("select id from adm.panel_type where code like $1", [
    `${PREFIX}%`,
  ]);
  const typeIds = types.map((row: { id: string }) => row.id);
  await admin.query("select aud.purge_record_history_for_reset('adm.panel_type', $1::uuid[])", [
    typeIds,
  ]);
  await admin.query("delete from adm.panel_type where id = any($1::uuid[])", [typeIds]);
  await admin.query("delete from iam.role_assignment where user_id = any($1::uuid[])", [PEOPLE]);
  await releaseTestPeople(admin, PEOPLE);
  await admin.query("delete from iam.user where id = any($1::uuid[])", [PEOPLE]);
}

beforeAll(async () => {
  admin = await connectAdmin();
  await cleanUp();
  await admin.query(
    `insert into iam.user (id, email, display_name, auth_provider_id)
     values ($1, 't0123d-1@example.test', 'Deneme teknik ofis', $1),
            ($2, 't0123d-2@example.test', 'Deneme yabancı', $2)`,
    [OFFICE, STRANGER],
  );
  await admin.query(
    `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
     select $1, r.id, 'company', '{}', iam.today() - 1 from iam.role r where r.code = 'TO'`,
    [OFFICE],
  );

  // The next working day, ten working days to the management end (the day included), and a day
  // off after it; the contract ends twenty working days out.
  workDay = (await one("select adm.add_business_days(iam.today(), 1)::text as d")).d;
  managementEnd = (await one("select adm.add_business_days($1::date, 9)::text as d", [workDay])).d;
  contractEnd = (await one("select adm.add_business_days($1::date, 19)::text as d", [workDay])).d;
  dayOff = (
    await one(
      `select d::date::text as d from generate_series($1::date, $1::date + 14, interval '1 day') d
        where not adm.is_business_day(d::date) order by d limit 1`,
      [workDay],
    )
  ).d;

  project = (
    await one(
      `insert into prj.project (code, name, management_target_end_on, contract_end_on)
       values ($1, 'Deneme günlük hedef', $2, $3) returning id`,
      [`${PREFIX}A`, managementEnd, contractEnd],
    )
  ).id;
  site = (
    await one("insert into sit.site (project_id, name) values ($1, 'Deneme saha') returning id", [
      project,
    ])
  ).id;
  panel = (
    await one(
      `insert into adm.panel_type (code, name, width_m, height_m)
       values ($1, 'Deneme 150', 1.5, 1.5) returning id`,
      [`${PREFIX}P150`],
    )
  ).id;
});

afterAll(async () => {
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("daily targets (REQ-PRJ-011)", () => {
  it("has no target before a revision is valid", async () => {
    const found = await readDailyTargets(as(OFFICE), site, workDay);
    expect(found?.frame.revisionId).toBeNull();
    expect(found?.lines).toEqual([]);
  });

  it("divides the work left by the working days left, the day included", async () => {
    const rev = await startRevision(as(OFFICE), project, "İlk hedefler");
    const wall = (await addWall(as(OFFICE), rev, {
      code: "D1",
      heightM: 6,
      lengthM: 120,
      name: "Duvar 1",
      siteId: site,
    })) as string;
    await setTarget(as(OFFICE), rev, { kind: "panel", panelTypeId: panel, qty: 95, wallId: wall });
    await submitRevision(as(OFFICE), rev);
    expect(await setRevisionStatusAsSystem(db(), rev, "approved")).toBe(true);

    const found = await readDailyTargets(as(OFFICE), site, workDay);
    expect(found?.frame).toMatchObject({
      basis: "management",
      businessDay: true,
      daysLeft: 10,
      endOn: managementEnd,
    });
    const cast = found?.lines.find((line) => line.measure === "panel_cast");
    const install = found?.lines.find((line) => line.measure === "panel_install");
    // 95 pieces over 10 days is 9.5: rounded up, so the work finishes by the end date.
    expect(cast).toMatchObject({ calculated: 10, isCorrected: false, remaining: 95 });
    expect(cast?.unitAreaM2).toBe(2.25);
    expect(install?.calculated).toBe(10);
  });

  it("gives a day off no target, and refuses to correct one", async () => {
    const found = await readDailyTargets(as(OFFICE), site, dayOff);
    expect(found?.frame.businessDay).toBe(false);
    expect(found?.lines.every((line) => line.calculated === null)).toBe(true);
    expect(
      await errorOf(insertCorrection(as(OFFICE), here(), dayOff, { ...panelLine(), corrected: 3 })),
    ).toBe("prj.not_a_business_day");
  });

  it("runs to the site's chosen end, and falls back when that one is not typed", async () => {
    await admin.query("update sit.site set target_end_basis = 'contract' where id = $1", [site]);
    let found = await readDailyTargets(as(OFFICE), site, workDay);
    expect(found?.frame).toMatchObject({ basis: "contract", daysLeft: 20 });
    expect(found?.lines.find((line) => line.measure === "panel_cast")?.calculated).toBe(5);

    await admin.query("update sit.site set target_end_basis = 'theoretical' where id = $1", [site]);
    found = await readDailyTargets(as(OFFICE), site, workDay);
    expect(found?.frame).toMatchObject({ basis: "management", chosenBasis: "theoretical" });

    await admin.query("update sit.site set target_end_basis = null where id = $1", [site]);
  });

  it("keeps the calculated value next to the corrected one, worked out by the database", async () => {
    await insertCorrection(as(OFFICE), here(), workDay, { ...panelLine(), corrected: 7 });
    // Written straight into the table with a made-up calculation: the database replaces it.
    await admin.query(
      `insert into prj.daily_target_correction (project_id, site_id, target_on, measure,
                                                panel_type_id, calculated, corrected, reason)
       values ($1, $2, $3, 'panel_install', $4, 999, 12, 'Ek ekip geldi')`,
      [project, site, workDay, panel],
    );
    const stored = await admin.query(
      `select measure, calculated::float, corrected::float, created_by_user_id
         from prj.daily_target_correction where site_id = $1 order by measure`,
      [site],
    );
    expect(stored.rows).toEqual([
      { calculated: 10, corrected: 7, created_by_user_id: OFFICE, measure: "panel_cast" },
      { calculated: 10, corrected: 12, created_by_user_id: null, measure: "panel_install" },
    ]);

    const found = await readDailyTargets(as(OFFICE), site, workDay);
    const cast = found?.lines.find((line) => line.measure === "panel_cast");
    expect(cast).toMatchObject({
      calculated: 10,
      corrected: 7,
      correctedByUserId: OFFICE,
      correctionReason: "Vinç arızası nedeniyle",
      isCorrected: true,
    });
  });

  it("lets the latest correction win, and an empty one return to the calculation", async () => {
    await insertCorrection(as(OFFICE), here(), workDay, { ...panelLine(), corrected: null });
    const found = await readDailyTargets(as(OFFICE), site, workDay);
    expect(found?.lines.find((line) => line.measure === "panel_cast")).toMatchObject({
      calculated: 10,
      isCorrected: false,
    });
    expect(
      (
        await one("select count(*)::int as n from prj.daily_target_correction where site_id = $1", [
          site,
        ])
      ).n,
    ).toBe(3);
    expect(
      await errorOf(
        admin.query("update prj.daily_target_correction set corrected = 1 where site_id = $1", [
          site,
        ]),
      ),
    ).not.toBe("no error");
  });

  it("does not correct a past day, a line the day lacks, or a site the person does not manage", async () => {
    const yesterday = (await one("select (iam.today() - 1)::text as d")).d;
    expect(
      await errorOf(
        insertCorrection(as(OFFICE), here(), yesterday, { ...panelLine(), corrected: 1 }),
      ),
    ).toBe("prj.past_day_target");
    expect(
      await errorOf(
        insertCorrection(as(OFFICE), here(), workDay, {
          ...panelLine(),
          corrected: 1,
          measure: "work_item",
          panelTypeId: null,
          workItemId: panel,
        }),
      ),
    ).not.toBe("no error");
    expect(await readDailyTargets(as(STRANGER), site, workDay)).toBeNull();
    expect(
      await errorOf(
        insertCorrection(as(STRANGER), here(), workDay, { ...panelLine(), corrected: 1 }),
      ),
    ).toBe("prj.site_not_visible");
  });
});
