/**
 * WFL's public surface (MODULE_BOUNDARIES section 2, TASK-0117). Code outside the module imports
 * only from here, apart from the `ui/` screens that routes render. Server-only.
 */
export {
  disableFlow,
  publishVersion,
  readPublished,
  readVersions,
  recordDryRun,
  saveDraft,
  type FlowVersion,
  type FlowVersionStatus,
} from "@/modules/wfl/data/flow-store";

export {
  endInstance,
  enterStep,
  leaveStep,
  noteWaiting,
  readInstance,
  readRunLog,
  startInstance,
  startInstanceByHand,
  type FlowTrigger,
  type InstanceRow,
  type TriggerKind,
} from "@/modules/wfl/data/instance-store";

// The module's capability catalog, read by the flow engine (TASK-0118).
export { wflCapabilities } from "@/modules/wfl/capabilities";
