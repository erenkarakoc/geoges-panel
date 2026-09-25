/**
 * Revisions, walls and targets against the real database (TASK-0123 step 2, migration 0065,
 * REQ-PRJ-006…009, D-136, D-292 rules 1 and 2).
 *
 * What is proved here: targets change only through a revision; a draft starts as a copy of the
 * last approved one; only the flow approves; an approved revision is valid from its approval day
 * and never changes; a past day is judged by the revision valid then; the project target is the
 * sum of its walls; a wall stands on its own project's site; one revision is open at a time.
 * Test data carries the ZZT-0123R prefix and is removed afterwards. `npm run test:db`.
 */
import { sql } from "kysely";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../../scripts/db-test-people.mjs";
import { runAsUser } from "@/platform/db";
import { kyselyOn, type PooledClient } from "@/platform/db/run-as-user";

import {
  addWall,
  readPanelTargets,
  readRevision,
  readRevisionDiff,
  recallRevision,
  setRevisionStatusAsSystem,
  setTarget,
  setWallStatus,
  startRevision,
  submitRevision,
} from "./revision-store";

const id = (n: number) => `0192f0c1-0123-7300-8000-${String(n).padStart(12, "0")}`;
const OFFICE = id(1);
const PEOPLE = [OFFICE];
const PREFIX = "ZZT-0123R-";

let admin: pg.Client;
let project: string;
let otherProject: string;
let site: string;
let otherSite: string;
let panel: string;
let bigPanel: string;
let foreignPanel: string;
let rev0: string;
let rev1: string;
let wallA: string;
let wallB: string;

const as = (userId: string) => ({ userId, actingRoleId: null });
const db = () => kyselyOn(admin as unknown as PooledClient);

const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { hint?: string; code?: string }) => e.hint ?? e.code ?? "no code",
  );

const today = async () => (await admin.query("select iam.today()::text as d")).rows[0].d as string;
const daysAgo = async (n: number) =>
  (await admin.query("select (iam.today() - $1::int)::text as d", [n])).rows[0].d as string;

async function cleanUp() {
  const { rows } = await admin.query("select id from prj.project where code like $1", [
    `${PREFIX}%`,
  ]);
  const projects = rows.map((row: { id: string }) => row.id);
  if (projects.length) {
    const tables = [
      "prj.wall_target",
      "prj.revision_wall",
      "prj.wall",
      "prj.project_revision",
      "sit.site",
    ];
    const ids: Record<string, string[]> = {};
    ids["prj.wall_target"] = (
      await admin.query(
        `select t.id from prj.wall_target t join prj.project_revision r on r.id = t.revision_id
          where r.project_id = any($1::uuid[])`,
        [projects],
      )
    ).rows.map((row: { id: string }) => row.id);
    for (const table of tables.slice(1)) {
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
      for (const table of tables) {
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
     values ($1, 't0123r-1@example.test', 'Deneme teknik ofis', $1)`,
    [OFFICE],
  );
  await admin.query(
    `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
     select $1, r.id, 'company', '{}', iam.today() - 1 from iam.role r where r.code = 'TO'`,
    [OFFICE],
  );
  const { rows } = await admin.query(
    `insert into prj.project (code, name) values ($1, 'Deneme revizyon bir'), ($2, 'Deneme revizyon iki')
     returning id`,
    [`${PREFIX}A`, `${PREFIX}B`],
  );
  [project, otherProject] = rows.map((row: { id: string }) => row.id);
  site = (
    await admin.query(
      "insert into sit.site (project_id, name) values ($1, 'Deneme saha') returning id",
      [project],
    )
  ).rows[0].id;
  otherSite = (
    await admin.query(
      "insert into sit.site (project_id, name) values ($1, 'Başka saha') returning id",
      [otherProject],
    )
  ).rows[0].id;
  const { rows: made } = await admin.query(
    `insert into adm.panel_type (code, name, width_m, height_m, project_id)
     values ($1, 'Deneme 150', 1.5, 1.5, null), ($2, 'Deneme 200', 2, 1.5, null),
            ($3, 'Başka projenin tipi', 1, 1, $4)
     returning id, code`,
    [`${PREFIX}P150`, `${PREFIX}P200`, `${PREFIX}PX`, otherProject],
  );
  const code = (c: string) => made.find((row: { code: string }) => row.code === `${PREFIX}${c}`).id;
  panel = code("P150");
  bigPanel = code("P200");
  foreignPanel = code("PX");
});

afterAll(async () => {
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("the first revision (REQ-PRJ-006, REQ-PRJ-007)", () => {
  it("opens Rev.0 and takes walls on the project's own sites only", async () => {
    rev0 = await startRevision(as(OFFICE), project, "İlk proje hedefleri");
    wallA = (await addWall(as(OFFICE), rev0, {
      code: "D1",
      heightM: 6,
      lengthM: 120,
      name: "Duvar 1 Sağ",
      siteId: site,
    })) as string;
    wallB = (await addWall(as(OFFICE), rev0, {
      code: "D2",
      heightM: 4.5,
      lengthM: 80,
      name: "Duvar 2 Sol",
      siteId: site,
    })) as string;
    expect(
      await errorOf(
        addWall(as(OFFICE), rev0, {
          code: "D9",
          heightM: null,
          lengthM: null,
          name: "Başka projenin sahasında",
          siteId: otherSite,
        }),
      ),
    ).toBe("23503");
  });

  it("refuses a panel type made for another project (REQ-ADM-005)", async () => {
    expect(
      await errorOf(
        setTarget(as(OFFICE), rev0, {
          kind: "panel",
          panelTypeId: foreignPanel,
          qty: 1,
          wallId: wallA,
        }),
      ),
    ).toBe("prj.type_of_other_project");
  });

  it("keeps one open revision at a time", async () => {
    expect(await errorOf(startRevision(as(OFFICE), project, "İkinci taslak"))).toBe("23505");
  });

  it("is approved by its flow, never by a person writing the status", async () => {
    await setTarget(as(OFFICE), rev0, {
      kind: "panel",
      panelTypeId: panel,
      qty: 100,
      wallId: wallA,
    });
    await setTarget(as(OFFICE), rev0, {
      kind: "panel",
      panelTypeId: panel,
      qty: 40,
      wallId: wallB,
    });
    expect(await submitRevision(as(OFFICE), rev0)).toBe(true);
    expect(
      await errorOf(
        runAsUser(as(OFFICE), (tx) =>
          sql`update prj.project_revision set status = 'approved' where id = ${rev0}::uuid`.execute(
            tx,
          ),
        ),
      ),
    ).toBe("prj.revision_approved_by_flow");
    expect(await setRevisionStatusAsSystem(db(), rev0, "approved")).toBe(true);
    const found = await readRevision(as(OFFICE), rev0);
    expect(found?.revision.validFrom).toBe(await today());
  });

  it("makes the project target the sum of its walls, with the area from the type", async () => {
    const targets = await readPanelTargets(db(), project, await today());
    expect(targets).toEqual([{ areaM2: 315, panelTypeId: panel, qty: 140 }]);
    const onSite = await readPanelTargets(db(), project, await today(), site);
    expect(onSite[0]?.qty).toBe(140);
  });

  it("never lets an approved revision change", async () => {
    expect(
      await errorOf(
        setTarget(as(OFFICE), rev0, { kind: "panel", panelTypeId: panel, qty: 999, wallId: wallA }),
      ),
    ).toBe("prj.revision_frozen");
  });
});

describe("the next revision (REQ-PRJ-009, D-136, D-292 rule 1)", () => {
  it("starts as a copy of the approved one", async () => {
    rev1 = await startRevision(as(OFFICE), project, "Rev.1 — kurum onayı sonrası");
    const found = await readRevision(as(OFFICE), rev1);
    expect(found?.revision.revisionNo).toBe(1);
    expect(found?.revision.basedOnRevisionId).toBe(rev0);
    expect(found?.walls.map((w) => w.code)).toEqual(["D1", "D2"]);
    expect(found?.targets.filter((t) => t.kind === "panel").map((t) => t.qty)).toEqual([100, 40]);
  });

  it("shows what it changes, line by line", async () => {
    await setTarget(as(OFFICE), rev1, {
      kind: "panel",
      panelTypeId: panel,
      qty: 120,
      wallId: wallA,
    });
    await setTarget(as(OFFICE), rev1, {
      kind: "panel",
      panelTypeId: bigPanel,
      qty: 10,
      wallId: wallB,
    });
    const diff = await readRevisionDiff(as(OFFICE), rev0, rev1);
    expect(
      diff
        .map((d) => [d.wallId, d.panelTypeId, d.before, d.after])
        .sort((a, b) => String(a[1]).localeCompare(String(b[1]))),
    ).toEqual(
      [
        [wallA, panel, 100, 120],
        [wallB, bigPanel, null, 10],
      ].sort((a, b) => String(a[1]).localeCompare(String(b[1]))),
    );
  });

  it("does not count until it is approved", async () => {
    expect((await readPanelTargets(db(), project, await today()))[0]?.qty).toBe(140);
  });

  it("can be recalled before it is decided, and returned by the flow", async () => {
    expect(await submitRevision(as(OFFICE), rev1)).toBe(true);
    expect(await recallRevision(as(OFFICE), rev1)).toBe(true);
    expect(await submitRevision(as(OFFICE), rev1)).toBe(true);
    expect(await setRevisionStatusAsSystem(db(), rev1, "draft")).toBe(true);
    expect((await readRevision(as(OFFICE), rev1))?.revision.returnedNote).toContain("geri");
  });

  it("judges a past day by the revision valid then, today by the newest", async () => {
    // Rev.0 is made valid from ten days ago, as if approved then; only this test backdates.
    await admin.query("alter table prj.project_revision disable trigger guard_status");
    try {
      await admin.query(
        "update prj.project_revision set valid_from = iam.today() - 10 where id = $1",
        [rev0],
      );
    } finally {
      await admin.query("alter table prj.project_revision enable trigger guard_status");
    }
    await submitRevision(as(OFFICE), rev1);
    await setRevisionStatusAsSystem(db(), rev1, "approved");
    const past = await readPanelTargets(db(), project, await daysAgo(5));
    expect(past).toEqual([{ areaM2: 315, panelTypeId: panel, qty: 140 }]);
    const now = (await readPanelTargets(db(), project, await today())).sort((a, b) =>
      a.panelTypeId.localeCompare(b.panelTypeId),
    );
    expect(now.map((t) => t.qty).sort()).toEqual([10, 160].sort());
    expect(await readPanelTargets(db(), project, await daysAgo(11))).toEqual([]);
  });

  it("publishes submitted and approved", async () => {
    const { rows } = await admin.query(
      "select event_code from core.outbox where record_id = $1 order by id",
      [rev0],
    );
    expect(rows.map((row: { event_code: string }) => row.event_code)).toEqual([
      "project_revision.submitted",
      "project_revision.approved",
    ]);
  });
});

describe("walls (REQ-PRJ-006)", () => {
  it("publishes wall.completed when a wall is done", async () => {
    expect(await setWallStatus(as(OFFICE), wallB, "completed")).toBe(true);
    const { rows } = await admin.query("select event_code from core.outbox where record_id = $1", [
      wallB,
    ]);
    expect(rows.map((row: { event_code: string }) => row.event_code)).toEqual(["wall.completed"]);
  });
});
