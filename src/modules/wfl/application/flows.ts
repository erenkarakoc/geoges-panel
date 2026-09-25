import "server-only";

import {
  readFlowForDesigner,
  readFlows,
  saveDraft,
  type DbIdentity,
  type FlowSummary,
} from "@/modules/wfl/data/flow-store";

/**
 * What the flow screens ask for (TASK-0119, SCR-195, SCR-196).
 *
 * The person asking arrives as an argument rather than being looked up here: MODULE_MAP draws no
 * arrow from WFL to IAM, and the route is where modules are joined. The database answers nothing
 * at all to somebody without the design permission, so these read plainly and the screen shows its
 * permission-denied state when the answer is empty.
 */

/** Every flow, for SCR-195. */
export function listFlows(identity: DbIdentity): Promise<FlowSummary[]> {
  return readFlows(identity);
}

/** One flow with the version a designer opens (SCR-196); null when there is none to open. */
export function openFlow(identity: DbIdentity, flowKey: string) {
  return readFlowForDesigner(identity, flowKey);
}

/** Writes the working copy back into the open draft; the designer calls this as it edits. */
export function writeDraft(
  identity: DbIdentity,
  flow: { key: string; name: string; definition: unknown; singleInstance?: boolean },
): Promise<string> {
  return saveDraft(identity, flow);
}
