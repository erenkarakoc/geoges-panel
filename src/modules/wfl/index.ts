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
  decideApproval,
  endInstance,
  enterStep,
  leaveStep,
  noteWaiting,
  readInstance,
  readMyApprovals,
  readRunLog,
  startInstance,
  startInstanceByHand,
  type ApprovalDecision,
  type FlowTrigger,
  type InstanceRow,
  type WaitingApproval,
  type TriggerKind,
} from "@/modules/wfl/data/instance-store";

export {
  resumeFromApproval,
  runEventTriggers,
  runInstance,
  type RunResult,
} from "@/modules/wfl/application/engine";
export { flowEngine } from "@/modules/wfl/application/engine-subscriber";
export {
  parseDefinition,
  RUNNABLE_STEP_TYPES,
  STEP_TYPES,
  type FlowDefinition,
  type FlowStep,
} from "@/modules/wfl/domain/definition";

// The module's capability catalog, read by the flow engine (TASK-0118).
export { wflCapabilities } from "@/modules/wfl/capabilities";
