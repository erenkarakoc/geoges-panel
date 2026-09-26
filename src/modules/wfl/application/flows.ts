import "server-only";

import { flowKeyOf, starterDefinition } from "@/modules/wfl/domain/flow-key";
import {
  disableFlow,
  publishVersion,
  readTemplates,
  readFlowForDesigner,
  readFlows,
  readLastDryRun,
  readPublishSummary,
  readVersions,
  removeFlow as removeFlowRow,
  reopenFlow as reopenFlowRow,
  requestDryRun,
  resetToTemplate,
  restoreFlow as restoreFlowRow,
  saveDraft,
  setTemplateRemoved,
  startFromTemplate,
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

/**
 * Asks for a dry run and says what is known now (REQ-WFL-025, D-284). The worker runs it, so what
 * comes back is either the evidence that already exists for this definition or nothing yet, and the
 * screen watches for it.
 */
export async function askDryRun(identity: DbIdentity, versionId: string) {
  const asked = await requestDryRun(identity, versionId);
  if (!asked) return null;
  return { ...asked, evidence: await readLastDryRun(identity, versionId) };
}

/** What the last dry run of this version found, for a screen that is waiting for one. */
export function lastDryRun(identity: DbIdentity, versionId: string) {
  return readLastDryRun(identity, versionId);
}

/** What the publish confirmation says before it is pressed (REQ-WFL-023, REQ-WFL-024). */
export function publishSummary(identity: DbIdentity, versionId: string) {
  return readPublishSummary(identity, versionId);
}

/** Publishes the draft. The database refuses it without a passed dry run of this definition. */
export function publishFlow(identity: DbIdentity, versionId: string) {
  return publishVersion(identity, versionId);
}

/**
 * Starts a flow (SCR-195). The owner types a name; the address comes from the name and the flow
 * begins as a start and an end with nothing between them, which is a definition the schema accepts —
 * so the designer opens on something whole rather than on an error.
 */
export async function startFlow(identity: DbIdentity, name: string): Promise<string> {
  const existing = await readFlows(identity);
  const key = flowKeyOf(
    name,
    existing.map((flow) => flow.key),
  );
  await saveDraft(identity, { key, name: name.trim(), definition: starterDefinition() });
  return key;
}

/** Every version of this flow, newest first, for the designer's version history. */
export function flowVersions(identity: DbIdentity, flowKey: string) {
  return readVersions(identity, flowKey);
}

/**
 * A copy of this flow to work on (ADMINISTRATION section 3). The copy carries the definition as it
 * stands and starts as a draft of its own: a flow is copied to be changed, and changing the original
 * is exactly what the copy is there to avoid.
 */
export async function copyFlow(identity: DbIdentity, flowKey: string): Promise<string | null> {
  const flow = await readFlowForDesigner(identity, flowKey);
  if (!flow) return null;
  const existing = await readFlows(identity);
  const name = `${flow.name} kopyası`;
  const key = flowKeyOf(
    name,
    existing.map((one) => one.key),
  );
  await saveDraft(identity, {
    key,
    name,
    definition: flow.definition,
    singleInstance: flow.singleInstance,
  });
  return key;
}

/** Stops the flow from starting anything new; what is already running finishes (REQ-WFL-024). */
export async function closeFlow(
  identity: DbIdentity,
  flowKey: string,
  reason: string,
): Promise<boolean> {
  const flow = await readFlowForDesigner(identity, flowKey);
  if (!flow) return false;
  return disableFlow(identity, flow.flowId, reason);
}

/**
 * Removes a flow (D-293): deleted when it never ran, closed and archived when it had. Says which, or
 * null when there is no such flow to remove.
 */
export async function removeFlow(identity: DbIdentity, flowKey: string, reason: string) {
  const flow = await readFlowForDesigner(identity, flowKey);
  if (!flow) return null;
  return removeFlowRow(identity, flow.flowId, reason);
}

/** Brings an archived flow back to the list, still closed (D-293). */
export async function restoreFlow(identity: DbIdentity, flowKey: string) {
  const flow = await readFlowForDesigner(identity, flowKey);
  return flow ? restoreFlowRow(identity, flow.flowId) : false;
}

/** Opens a closed flow again; it starts on its trigger from now on. */
export async function reopenFlow(identity: DbIdentity, flowKey: string) {
  const flow = await readFlowForDesigner(identity, flowKey);
  return flow ? reopenFlowRow(identity, flow.flowId) : false;
}

/** The templates the panel ships, for SCR-195's "Şablonlar" tab; the removed ones when asked. */
export function listTemplates(identity: DbIdentity, removed = false) {
  return readTemplates(identity, removed);
}

/** Takes a template off the list for good, or brings it back (D-293). */
export function removeTemplate(identity: DbIdentity, templateKey: string, removed = true) {
  return setTemplateRemoved(identity, templateKey, removed);
}

/**
 * A flow of your own from a template (REQ-WFL-027). The copy's name is the template's and its
 * address is derived from that name, exactly as a new flow's is; the template it came from is
 * remembered so a later update can announce itself.
 */
export async function copyOfTemplate(
  identity: DbIdentity,
  templateKey: string,
): Promise<string | null> {
  const templates = await readTemplates(identity);
  const template = templates.find((one) => one.key === templateKey);
  if (!template) return null;

  const existing = await readFlows(identity);
  const key = flowKeyOf(
    template.name,
    existing.map((flow) => flow.key),
  );
  await startFromTemplate(identity, { templateKey, flowKey: key, flowName: template.name });
  return key;
}

/** Puts a copy back to what its template says, as a new draft (REQ-WFL-027). */
export function resetFlowToTemplate(identity: DbIdentity, flowKey: string) {
  return resetToTemplate(identity, flowKey);
}
