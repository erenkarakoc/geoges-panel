/**
 * Production definitions against the real database (TASK-0121, migration 0061, REQ-ADM-002…007).
 *
 * The rules proved here are the ones a screen could not keep on its own: a panel's area is computed,
 * a type's code and size never move once it exists, a recipe line is never rewritten, and the recipe
 * a day is suggested from is the most specific line valid on that day. Test rows are removed
 * afterwards; recipe lines are append-only in the product, so their removal switches the guard off
 * for a moment, which only this cleanup does. `npm run test:db`.
 */
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import { releaseTestPeople } from "../../../../scripts/db-test-people.mjs";
import { kyselyOn, type PooledClient } from "@/platform/db/run-as-user";

import {
  insertPanelType,
  insertRecipeLine,
  insertStripType,
  readPanelNeighbours,
  readPanelTypes,
  readRecipeFor,
  readStripTypes,
  updatePanelType,
  updateStripType,
} from "./production-store";

const id = (n: number) => `0192f0c1-0121-7100-8000-${String(n).padStart(12, "0")}`;
const MANAGER = id(1);
const OUTSIDER = id(2);
const PEOPLE = [MANAGER, OUTSIDER];
const PROJECT = id(301);
const PREFIX = "ZZT-";

let admin: pg.Client;
let consumable: string;
let otherConsumable: string;

const as = (userId: string) => ({ userId, actingRoleId: null });

const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => "no error",
    (e: { hint?: string; code?: string }) => e.hint ?? e.code ?? "no code",
  );

async function cleanUp() {
  const { rows: panels } = await admin.query("select id from adm.panel_type where code like $1", [
    `${PREFIX}%`,
  ]);
  const { rows: strips } = await admin.query("select id from adm.strip_type where code like $1", [
    `${PREFIX}%`,
  ]);
  const { rows: items } = await admin.query(
    "select id from adm.catalog_item where code like 'zzt_%'",
  );
  const panelIds = panels.map((row: { id: string }) => row.id);
  const stripIds = strips.map((row: { id: string }) => row.id);
  const itemIds = items.map((row: { id: string }) => row.id);

  // Recipe lines are append-only in the product; removing test lines needs the guard off briefly.
  await admin.query("alter table adm.consumption_recipe disable trigger append_only");
  try {
    const { rows: lines } = await admin.query(
      `delete from adm.consumption_recipe
        where material_item_id = any($1::uuid[]) or panel_type_id = any($2::uuid[])
           or strip_type_id = any($3::uuid[])
       returning id`,
      [itemIds, panelIds, stripIds],
    );
    const lineIds = lines.map((row: { id: string }) => row.id);
    if (lineIds.length) {
      await admin.query(
        "select aud.purge_record_history_for_reset('adm.consumption_recipe', $1::uuid[])",
        [lineIds],
      );
    }
  } finally {
    await admin.query("alter table adm.consumption_recipe enable trigger append_only");
  }
  for (const [table, ids] of [
    ["adm.panel_type", panelIds],
    ["adm.strip_type", stripIds],
    ["adm.catalog_item", itemIds],
  ] as const) {
    if (!ids.length) continue;
    await admin.query("select aud.purge_record_history_for_reset($1, $2::uuid[])", [table, ids]);
    await admin.query(`delete from ${table} where id = any($1::uuid[])`, [ids]);
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
     select u.id, 't0121d-' || u.n || '@example.test', 'Deneme tanım ' || u.n, u.id
       from unnest($1::uuid[]) with ordinality as u(id, n)`,
    [PEOPLE],
  );
  const { rows } = await admin.query("select id from iam.role where code = 'SAH'");
  await admin.query(
    `insert into iam.role_assignment (user_id, role_id, scope_type, scope_ids, starts_on)
     values ($1, $2, 'company', '{}', iam.today() - 1)`,
    [MANAGER, rows[0].id],
  );
  const { rows: made } = await admin.query(
    `insert into adm.catalog_item (catalog_id, code, name)
     select c.id, v.code, v.name from adm.catalog c,
            (values ('zzt_bolt', 'Deneme cıvata'), ('zzt_oil', 'Deneme kalıp yağı')) as v(code, name)
      where c.key = 'consumable'
     returning id, code`,
  );
  consumable = made.find((row: { code: string }) => row.code === "zzt_bolt").id;
  otherConsumable = made.find((row: { code: string }) => row.code === "zzt_oil").id;
});

afterAll(async () => {
  if (admin) {
    await cleanUp();
    await admin.end();
  }
});

describe("panel types (REQ-ADM-002)", () => {
  let panel: string;

  it("computes the area from width and height, so nobody types it", async () => {
    panel = await insertPanelType(as(MANAGER), {
      code: `${PREFIX}P150`,
      name: "Deneme panel 150",
      widthM: 1.5,
      heightM: 1.5,
      series: "ZZT",
      step: 3,
    });
    const found = (await readPanelTypes(as(MANAGER))).find((one) => one.id === panel);
    expect(found?.areaM2).toBe(2.25);
  });

  it("keeps a type's code and size fixed once it exists, while its name may change", async () => {
    expect(
      await errorOf(admin.query("update adm.panel_type set width_m = 2 where id = $1", [panel])),
    ).toBe("adm.type_identity_fixed");
    expect(await updatePanelType(as(MANAGER), panel, { name: "Deneme panel 150 (yeni ad)" })).toBe(
      true,
    );
    const found = (await readPanelTypes(as(MANAGER))).find((one) => one.id === panel);
    expect(found?.name).toBe("Deneme panel 150 (yeni ad)");
    expect(found?.widthM).toBe(1.5);
  });

  it("refuses a second type with the same code", async () => {
    expect(
      await errorOf(
        insertPanelType(as(MANAGER), {
          code: `${PREFIX}P150`,
          name: "Aynı kod",
          widthM: 1,
          heightM: 1,
        }),
      ),
    ).toBe("23505");
  });

  it("finds the neighbours one step away first, then two (REQ-SIT-019)", async () => {
    const make = (code: string, step: number) =>
      insertPanelType(as(MANAGER), {
        code: `${PREFIX}${code}`,
        name: `Deneme ${code}`,
        widthM: 1.5,
        heightM: 1 + step / 10,
        series: "ZZT",
        step,
      });
    const lowest = await make("P110", 1);
    const lower = await make("P130", 2);
    const higher = await make("P170", 4);
    const neighbours = await readPanelNeighbours(kyselyOn(admin as unknown as PooledClient), panel);
    expect(neighbours).toEqual([
      { panelTypeId: lower, distance: 1 },
      { panelTypeId: higher, distance: 1 },
      { panelTypeId: lowest, distance: 2 },
    ]);
  });

  it("is written by a manager and by nobody else", async () => {
    expect(
      await errorOf(
        insertPanelType(as(OUTSIDER), {
          code: `${PREFIX}NOPE`,
          name: "Olmaz",
          widthM: 1,
          heightM: 1,
        }),
      ),
    ).toBe("42501");
  });
});

describe("strip types (REQ-ADM-003)", () => {
  it("keeps its section fixed and lets its standard lengths grow", async () => {
    const strip = await insertStripType(as(MANAGER), {
      code: `${PREFIX}40x4`,
      name: "Deneme şerit 40×4",
      widthMm: 40,
      thicknessMm: 4,
      holeCount: 2,
      standardLengthsM: [3, 6],
    });
    expect(
      await errorOf(
        admin.query("update adm.strip_type set thickness_mm = 5 where id = $1", [strip]),
      ),
    ).toBe("adm.type_identity_fixed");
    expect(await updateStripType(as(MANAGER), strip, { standardLengthsM: [3, 6, 9] })).toBe(true);
    const found = (await readStripTypes(as(MANAGER))).find((one) => one.id === strip);
    expect(found?.standardLengthsM).toEqual([3, 6, 9]);
  });
});

describe("consumption recipes (REQ-ADM-004, REQ-ADM-007)", () => {
  const db = () => kyselyOn(admin as unknown as PooledClient);
  let panel: string;

  beforeAll(async () => {
    panel = await insertPanelType(as(MANAGER), {
      code: `${PREFIX}R100`,
      name: "Deneme reçete paneli",
      widthM: 1,
      heightM: 1,
    });
  });

  it("suggests from the line valid on the day, so a change never reaches back", async () => {
    await insertRecipeLine(as(MANAGER), {
      outputKind: "casting",
      perUnit: "piece",
      materialItemId: consumable,
      qtyPerUnit: 4,
      validFrom: "2026-03-01",
      reason: "Başlangıç",
    });
    await insertRecipeLine(as(MANAGER), {
      outputKind: "casting",
      perUnit: "piece",
      materialItemId: consumable,
      qtyPerUnit: 6,
      validFrom: "2026-06-01",
      reason: "Yeni kalıp",
    });
    const march = await readRecipeFor(db(), {
      kind: "casting",
      panelTypeId: panel,
      on: "2026-04-15",
    });
    const july = await readRecipeFor(db(), {
      kind: "casting",
      panelTypeId: panel,
      on: "2026-07-01",
    });
    expect(march.find((line) => line.materialItemId === consumable)?.qtyPerUnit).toBe(4);
    expect(july.find((line) => line.materialItemId === consumable)?.qtyPerUnit).toBe(6);
  });

  it("puts a type's own line before 'every type', and a project's own before the company's", async () => {
    await insertRecipeLine(as(MANAGER), {
      outputKind: "casting",
      panelTypeId: panel,
      perUnit: "piece",
      materialItemId: consumable,
      qtyPerUnit: 8,
      validFrom: "2026-01-01",
      reason: "Bu panel daha çok ister",
    });
    const typed = await readRecipeFor(db(), {
      kind: "casting",
      panelTypeId: panel,
      on: "2026-07-01",
    });
    expect(typed.find((line) => line.materialItemId === consumable)?.qtyPerUnit).toBe(8);

    await insertRecipeLine(as(MANAGER), {
      outputKind: "casting",
      perUnit: "piece",
      materialItemId: consumable,
      qtyPerUnit: 2,
      validFrom: "2026-01-01",
      reason: "Bu projede az",
      projectId: PROJECT,
    });
    const own = await readRecipeFor(db(), {
      kind: "casting",
      panelTypeId: panel,
      projectId: PROJECT,
      on: "2026-07-01",
    });
    expect(own.find((line) => line.materialItemId === consumable)?.qtyPerUnit).toBe(2);
  });

  it("lets a material leave the recipe with a zero, and keeps every other material", async () => {
    await insertRecipeLine(as(MANAGER), {
      outputKind: "casting",
      perUnit: "m2",
      materialItemId: otherConsumable,
      qtyPerUnit: 0.3,
      validFrom: "2026-01-01",
      reason: "Kalıp yağı",
    });
    const lines = await readRecipeFor(db(), {
      kind: "casting",
      panelTypeId: panel,
      on: "2026-07-01",
    });
    // Only this test's materials: a database with the pilot's samples loaded (`npm run
    // db:sample`) also has company-wide casting lines of its own.
    const ours = [consumable, otherConsumable];
    expect(
      lines
        .map((line) => line.materialItemId)
        .filter((material) => ours.includes(material))
        .sort(),
    ).toEqual([...ours].sort());
  });

  it("is never rewritten: a change is a new line from a date", async () => {
    const { rows } = await admin.query(
      "select id from adm.consumption_recipe where material_item_id = $1 limit 1",
      [consumable],
    );
    expect(
      await errorOf(
        admin.query("update adm.consumption_recipe set qty_per_unit = 99 where id = $1", [
          rows[0].id,
        ]),
      ),
    ).toBe("adm.recipe_append_only");
  });

  it("refuses a unit that does not fit the output", async () => {
    expect(
      await errorOf(
        insertRecipeLine(as(MANAGER), {
          outputKind: "strip_installation",
          perUnit: "m2",
          materialItemId: consumable,
          qtyPerUnit: 1,
          validFrom: "2026-01-01",
          reason: "Yanlış birim",
        }),
      ),
    ).toBe("23514");
  });
});
