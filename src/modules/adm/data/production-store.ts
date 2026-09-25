import { sql, type Kysely } from "kysely";

import { runAsUser, type DbIdentity, type DbTransaction } from "@/platform/db";

import type {
  OutputKind,
  PanelTypeInput,
  PerUnit,
  RecipeLineInput,
  StripTypeInput,
} from "@/modules/adm/domain/production";

/**
 * Production definitions in the database (TASK-0121, migration 0061). The rules — a panel's area,
 * a type's fixed size, a recipe that is never rewritten — are the database's; this layer asks.
 */

type Tx = DbTransaction<unknown>;

export type PanelType = {
  id: string;
  code: string;
  name: string;
  widthM: number;
  heightM: number;
  areaM2: number;
  series: string | null;
  step: number | null;
  projectId: string | null;
  status: "active" | "passive";
};

export type StripType = {
  id: string;
  code: string;
  name: string;
  widthMm: number;
  thicknessMm: number;
  holeCount: number;
  standardLengthsM: number[];
  projectId: string | null;
  status: "active" | "passive";
};

export type RecipeLine = {
  id: string;
  outputKind: OutputKind;
  panelTypeId: string | null;
  stripTypeId: string | null;
  perUnit: PerUnit;
  materialItemId: string;
  materialName: string;
  qtyPerUnit: number;
  validFrom: string;
  projectId: string | null;
  reason: string;
  createdAt: Date;
};

const num = (value: unknown) => Number(value);

export function readPanelTypes(identity: DbIdentity) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{
      id: string;
      code: string;
      name: string;
      width_m: string;
      height_m: string;
      area_m2: string;
      series: string | null;
      step: number | null;
      project_id: string | null;
      status: "active" | "passive";
    }>`select id, code, name, width_m, height_m, area_m2, series, step, project_id, status
         from adm.panel_type
        order by status, series nulls last, step nulls last, code`.execute(db);
    return rows.map((row): PanelType => ({
      areaM2: num(row.area_m2),
      code: row.code,
      heightM: num(row.height_m),
      id: row.id,
      name: row.name,
      projectId: row.project_id,
      series: row.series,
      status: row.status,
      step: row.step === null ? null : num(row.step),
      widthM: num(row.width_m),
    }));
  });
}

export function insertPanelType(
  identity: DbIdentity,
  panel: PanelTypeInput & { projectId?: string | null },
) {
  return runAsUser(identity, async (db: Tx) => {
    const series = panel.series ? panel.series : null;
    const { rows } = await sql<{ id: string }>`
      insert into adm.panel_type (code, name, width_m, height_m, series, step, project_id)
      values (${panel.code}, ${panel.name}, ${panel.widthM}, ${panel.heightM}, ${series},
              ${series ? (panel.step ?? null) : null}, ${panel.projectId ?? null}::uuid)
      returning id`.execute(db);
    return rows[0].id;
  });
}

/** Changes what may change about a type — its name, its place in a series, its status. */
export function updatePanelType(
  identity: DbIdentity,
  id: string,
  change: {
    name?: string;
    series?: string | null;
    step?: number | null;
    status?: "active" | "passive";
  },
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update adm.panel_type
         set name = coalesce(${change.name ?? null}, name),
             series = case when ${change.series !== undefined} then ${change.series ?? null} else series end,
             step = case when ${change.series !== undefined} then ${change.step ?? null}::integer else step end,
             status = coalesce(${change.status ?? null}, status)
       where id = ${id}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

export function readStripTypes(identity: DbIdentity) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{
      id: string;
      code: string;
      name: string;
      width_mm: string;
      thickness_mm: string;
      hole_count: number;
      standard_lengths_m: string[] | null;
      project_id: string | null;
      status: "active" | "passive";
    }>`select id, code, name, width_mm, thickness_mm, hole_count, standard_lengths_m,
              project_id, status
         from adm.strip_type
        order by status, width_mm, thickness_mm, code`.execute(db);
    return rows.map((row): StripType => ({
      code: row.code,
      holeCount: num(row.hole_count),
      id: row.id,
      name: row.name,
      projectId: row.project_id,
      standardLengthsM: (row.standard_lengths_m ?? []).map(num),
      status: row.status,
      thicknessMm: num(row.thickness_mm),
      widthMm: num(row.width_mm),
    }));
  });
}

export function insertStripType(
  identity: DbIdentity,
  strip: StripTypeInput & { projectId?: string | null },
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      insert into adm.strip_type (code, name, width_mm, thickness_mm, hole_count,
                                  standard_lengths_m, project_id)
      values (${strip.code}, ${strip.name}, ${strip.widthMm}, ${strip.thicknessMm},
              ${strip.holeCount}, ${strip.standardLengthsM}::numeric[],
              ${strip.projectId ?? null}::uuid)
      returning id`.execute(db);
    return rows[0].id;
  });
}

/** Changes what may change about a strip type — its name, its standard lengths, its status. */
export function updateStripType(
  identity: DbIdentity,
  id: string,
  change: { name?: string; standardLengthsM?: number[]; status?: "active" | "passive" },
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      update adm.strip_type
         set name = coalesce(${change.name ?? null}, name),
             standard_lengths_m = coalesce(${change.standardLengthsM ?? null}::numeric[],
                                           standard_lengths_m),
             status = coalesce(${change.status ?? null}, status)
       where id = ${id}::uuid
      returning id`.execute(db);
    return rows.length === 1;
  });
}

/** Every recipe line ever written, newest first — the recipe's own history (REQ-ADM-007). */
export function readRecipeLines(identity: DbIdentity) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{
      id: string;
      output_kind: OutputKind;
      panel_type_id: string | null;
      strip_type_id: string | null;
      per_unit: PerUnit;
      material_item_id: string;
      material_name: string;
      qty_per_unit: string;
      valid_from: string;
      project_id: string | null;
      reason: string;
      created_at: Date;
    }>`select r.id, r.output_kind, r.panel_type_id, r.strip_type_id, r.per_unit,
              r.material_item_id, i.name as material_name, r.qty_per_unit,
              r.valid_from::text as valid_from, r.project_id, r.reason, r.created_at
         from adm.consumption_recipe r
         join adm.catalog_item i on i.id = r.material_item_id
        order by r.valid_from desc, r.created_at desc`.execute(db);
    return rows.map((row): RecipeLine => ({
      createdAt: row.created_at,
      id: row.id,
      materialItemId: row.material_item_id,
      materialName: row.material_name,
      outputKind: row.output_kind,
      panelTypeId: row.panel_type_id,
      perUnit: row.per_unit,
      projectId: row.project_id,
      qtyPerUnit: num(row.qty_per_unit),
      reason: row.reason,
      stripTypeId: row.strip_type_id,
      validFrom: row.valid_from,
    }));
  });
}

export function insertRecipeLine(
  identity: DbIdentity,
  line: RecipeLineInput & { projectId?: string | null },
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      insert into adm.consumption_recipe (output_kind, panel_type_id, strip_type_id, per_unit,
                                          material_item_id, qty_per_unit, valid_from, project_id,
                                          reason)
      values (${line.outputKind}, ${line.panelTypeId ?? null}::uuid,
              ${line.stripTypeId ?? null}::uuid, ${line.perUnit}, ${line.materialItemId}::uuid,
              ${line.qtyPerUnit}, ${line.validFrom}::date, ${line.projectId ?? null}::uuid,
              ${line.reason})
      returning id`.execute(db);
    return rows[0].id;
  });
}

export type AppliedRecipeLine = {
  materialItemId: string;
  perUnit: PerUnit;
  qtyPerUnit: number;
  recipeId: string;
};

/**
 * The recipe one output is suggested from on one day (REQ-SIT-029), inside any transaction — the
 * daily log reads it in the same transaction it writes its suggestion in.
 */
export async function readRecipeFor<DB>(
  db: Kysely<DB>,
  output: {
    kind: OutputKind;
    panelTypeId?: string | null;
    stripTypeId?: string | null;
    projectId?: string | null;
    on: string;
  },
): Promise<AppliedRecipeLine[]> {
  const { rows } = await sql<{
    material_item_id: string;
    per_unit: PerUnit;
    qty_per_unit: string;
    recipe_id: string;
  }>`select material_item_id, per_unit, qty_per_unit, recipe_id
       from adm.recipe_lines(${output.kind}, ${output.panelTypeId ?? null}::uuid,
                             ${output.stripTypeId ?? null}::uuid, ${output.projectId ?? null}::uuid,
                             ${output.on}::date)`.execute(db);
  return rows.map((row) => ({
    materialItemId: row.material_item_id,
    perUnit: row.per_unit,
    qtyPerUnit: num(row.qty_per_unit),
    recipeId: row.recipe_id,
  }));
}

/** The panel types one or two steps away in the same series (REQ-SIT-019). */
export async function readPanelNeighbours<DB>(db: Kysely<DB>, panelTypeId: string) {
  const { rows } = await sql<{ panel_type_id: string; distance: number }>`
    select panel_type_id, distance from adm.panel_neighbours(${panelTypeId}::uuid)`.execute(db);
  return rows.map((row) => ({ panelTypeId: row.panel_type_id, distance: num(row.distance) }));
}

/** The items of one catalog, for pickers: the consumables a recipe names, the no-work reasons. */
export function readCatalogItems(identity: DbIdentity, catalogKey: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{
      id: string;
      code: string | null;
      name: string;
      status: "active" | "passive";
    }>`select i.id, i.code, i.name, i.status
         from adm.catalog_item i
         join adm.catalog c on c.id = i.catalog_id
        where c.key = ${catalogKey} and i.merged_into_item_id is null
        order by i.status, i.name`.execute(db);
    return rows;
  });
}
