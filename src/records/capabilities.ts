import "server-only";

import { admCapabilities } from "@/modules/adm";
import { audCapabilities } from "@/modules/aud";
import { docCapabilities } from "@/modules/doc";
import { iamCapabilities } from "@/modules/iam";
import { tskCapabilities } from "@/modules/tsk";
import type { ActionCapability, ModuleCapabilities } from "@/platform/capabilities";

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
  docCapabilities,
  iamCapabilities,
  tskCapabilities,
];

/** One action by its code, or null when nothing offers it — which is a flow that cannot run. */
export function actionCapability(code: string): ActionCapability | null {
  for (const catalog of moduleCapabilities) {
    const action = catalog.actions.find((a) => a.code === code);
    if (action) return action;
  }
  return null;
}
