import "server-only";

import { z } from "zod";

import { admCapabilities } from "@/modules/adm";
import { audCapabilities } from "@/modules/aud";
import { crmCapabilities } from "@/modules/crm";
import { docCapabilities } from "@/modules/doc";
import { iamCapabilities } from "@/modules/iam";
import {
  prjCapabilities,
  projectStages,
  REVISION_STATUS_LABELS,
  setProjectStageAsSystem,
  setRevisionStatusAsSystem,
} from "@/modules/prj";
import { sitCapabilities } from "@/modules/sit";
import { tskCapabilities } from "@/modules/tsk";
import { wflCapabilities } from "@/modules/wfl";
import type { ActionCapability, ModuleCapabilities } from "@/platform/capabilities";
import type { SystemDb } from "@/platform/jobs/types";
import capabilityNameRows from "@/records/capability-names.json";

/**
 * Every module's capability catalog, joined here and nowhere else (TASK-0118, D-280).
 *
 * The engine reads this one list: it does not know the modules, and no module reads another's
 * catalog, so the arrows of MODULE_MAP stay as they are (ADR-001). A slice adds its module's
 * catalog to this array and nothing else changes.
 */
export const moduleCapabilities: readonly ModuleCapabilities[] = [
  admCapabilities,
  audCapabilities,
  crmCapabilities,
  docCapabilities,
  iamCapabilities,
  prjCapabilities,
  sitCapabilities,
  tskCapabilities,
  wflCapabilities,
];

/** One action by its code, or null when nothing offers it — which is a flow that cannot run. */
export function actionCapability(code: string): ActionCapability | null {
  for (const catalog of moduleCapabilities) {
    const action = catalog.actions.find((a) => a.code === code);
    if (action) return action;
  }
  return null;
}

/**
 * Who a flow step's owner rule points at, answered by the module that declared the relation
 * (D-097). The engine holds this and nothing else: it never learns that roles are IAM's.
 */
/**
 * A flow's "change the record's status" step (REQ-WFL-010, D-095, D-292), answered by the module
 * that owns the record, by record type — the same shape as the document and revision registers in
 * `src/records`. The status is the module's own word: a project's stage code, a revision's
 * `approved` or `draft`. A record type with no entry cannot be moved by a flow, and says so.
 */
type StatusApplier = (db: SystemDb, id: string, status: string) => Promise<boolean>;

const stageFailure = (error: unknown, status: string): never => {
  if ((error as { hint?: string }).hint === "prj.unknown_stage")
    throw new Error(`"${status}" adında bir proje aşaması tanımlı değil.`);
  throw error;
};

export const recordStatusAppliers: Readonly<Record<string, StatusApplier>> = {
  "prj.project": (db, id, status) =>
    setProjectStageAsSystem(db, id, status).catch((error) => stageFailure(error, status)),
  "prj.project_revision": async (db, id, status) => {
    if (status !== "approved" && status !== "draft")
      throw new Error("Proje revizyonu yalnız onaylanır ya da taslağa geri döner.");
    return setRevisionStatusAsSystem(db, id, status);
  },
};

/**
 * The states the appliers above accept, with their Turkish names, by the record's own name — the
 * part before the dot of the events it publishes (`project.stage_changed` → `project`). The
 * designer offers these for the step instead of asking for a code (owner 2026-09-26).
 */
export async function recordStatusChoices(): Promise<
  Record<string, readonly { code: string; name: string }[]>
> {
  return {
    project: await projectStages().catch(() => []),
    project_revision: [
      { code: "approved", name: REVISION_STATUS_LABELS.approved },
      { code: "draft", name: REVISION_STATUS_LABELS.draft },
    ],
  };
}

const recordStep = z.object({
  record: z.object({ schema: z.string(), table: z.string(), id: z.string() }).nullable(),
  status: z.string().nullable(),
});

async function setRecordStatus(db: SystemDb, input: unknown): Promise<unknown> {
  const { record, status } = recordStep.parse(input);
  if (!record) throw new Error("Bu akışın bağlı olduğu bir kayıt yok.");
  if (!status) throw new Error("Adımda yeni durum seçilmemiş.");
  const applier = recordStatusAppliers[`${record.schema}.${record.table}`];
  if (!applier) throw new Error("Bu kayıt türünün durumu akışla değiştirilemez.");
  if (!(await applier(db, record.id, status)))
    throw new Error("Kayıt bulunamadı ya da bu duruma geçemiyor.");
  return { record, status };
}

export const ownerRelations = {
  /** The catalog's actions, called by code; an action nobody offers is a flow that cannot run. */
  async run(db: SystemDb, code: string, input: unknown): Promise<unknown> {
    if (code === "record.set_status") return setRecordStatus(db, input);
    if (code === "record.create")
      throw new Error("Bu kayıt türü için akışın taslak açması henüz kurulmadı.");
    const action = actionCapability(code);
    if (!action) throw new Error(`no module offers the action ${code}`);
    return action.run({ db, userId: null }, input);
  },

  async resolve(db: SystemDb, code: string, argument: string | null): Promise<string | null> {
    for (const catalog of moduleCapabilities) {
      const relation = catalog.relations.find((r) => r.code === code);
      if (relation) return relation.resolve({ db, userId: null }, argument);
    }
    return null;
  },
};

/**
 * The Turkish name of every capability the requirements define, built or not, by code
 * (`scripts/capability-names.mjs`). A screen reads a name from here when a stored choice belongs
 * to a module that is not built yet, so the code never reaches a person (owner 2026-09-26).
 */
export const writtenCapabilityNames: Readonly<Record<string, string>> = Object.fromEntries(
  capabilityNameRows.map((row) => [row.code, row.name]),
);
