import "server-only";

import { listCatalogItems, listCatalogs } from "@/modules/adm";
import { projectStages, WALL_STATUS_LABELS } from "@/modules/prj";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/modules/tsk";
import { APPROVAL_DECISIONS, valueShapeOf, type ValueOption, type ValueShape } from "@/modules/wfl";
import { moduleCapabilities } from "@/records/capabilities";
import capabilityNameRows from "@/records/capability-names.json";

/**
 * What a flow condition may compare a field with, answered by the modules that own the values
 * (owner 2026-09-26: "completion gibi olası değerler seçilebilenler arasından seçilmeli").
 *
 * Each list is the field's own vocabulary under the code the record stores — a project's stage
 * codes, a task's status codes, a catalog's key — with the Turkish name the owning module already
 * shows. The lists are joined here because the designer (WFL) may not reach into the modules that
 * own them (ADR-001). A field whose module is not built yet has no list: the designer says so
 * instead of asking for a code.
 */
export async function conditionValueChoices(): Promise<Record<string, readonly ValueOption[]>> {
  const [stages, catalogs, documentTypes] = await Promise.all([
    projectStages().catch(() => []),
    listCatalogs().catch(() => []),
    listCatalogItems("document_type").catch(() => []),
  ]);
  const labels = (record: Readonly<Record<string, string>>): ValueOption[] =>
    Object.entries(record).map(([code, name]) => ({ code, name }));

  return {
    "approval.decision": APPROVAL_DECISIONS,
    "catalog_item.list": catalogs.map((one) => ({ code: one.key, name: one.name })),
    "document.type": documentTypes
      .filter((one) => one.status === "active" && one.code)
      .map((one) => ({ code: one.code as string, name: one.name })),
    "project.stage": stages,
    "task.priority": labels(PRIORITY_LABELS),
    "task.status": labels(STATUS_LABELS),
    "wall.status": labels(WALL_STATUS_LABELS),
  };
}

/**
 * The kind of value each condition field holds, by code: the code catalog's type for what is
 * built, the requirements' written type for what is not.
 */
export function conditionFieldShapes(): Record<string, ValueShape> {
  const shapes: Record<string, ValueShape> = {};
  for (const row of capabilityNameRows as { kind: string; code: string; type?: string }[]) {
    if (row.kind === "condition") shapes[row.code] = valueShapeOf(row.type);
  }
  for (const catalog of moduleCapabilities) {
    for (const field of catalog.conditions) shapes[field.code] = valueShapeOf(field.type);
  }
  return shapes;
}
