import "server-only";

import { admCapabilities } from "@/modules/adm";
import { audCapabilities } from "@/modules/aud";
import { crmCapabilities } from "@/modules/crm";
import { docCapabilities } from "@/modules/doc";
import { iamCapabilities } from "@/modules/iam";
import { tskCapabilities } from "@/modules/tsk";
import { wflCapabilities } from "@/modules/wfl";
import type { ActionCapability, ModuleCapabilities } from "@/platform/capabilities";
import type { SystemDb } from "@/platform/jobs/types";

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
export const ownerRelations = {
  /** The catalog's actions, called by code; an action nobody offers is a flow that cannot run. */
  async run(db: SystemDb, code: string, input: unknown): Promise<unknown> {
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
