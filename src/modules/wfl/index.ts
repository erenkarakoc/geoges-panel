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
  type FlowSummary,
  type FlowVersion,
  type FlowVersionStatus,
} from "@/modules/wfl/data/flow-store";

export {
  decideApproval,
  holdLock,
  locksOn,
  overrideLock,
  releaseLock,
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
  type RecordLock,
  type WaitingApproval,
  type TriggerKind,
} from "@/modules/wfl/data/instance-store";

export {
  clockSlot,
  escalateWaitingApproval,
  dryRun,
  dryRunVersion,
  runClockTriggers,
  resumeFromApproval,
  resumeFromWait,
  runEventTriggers,
  runInstance,
  type DryRunReport,
  type DryRunStep,
  type FlowRuntime,
  type OwnerRule,
  type RunResult,
} from "@/modules/wfl/application/engine";
export { flowEngine } from "@/modules/wfl/application/engine-subscriber";
export { listFlows, openFlow, writeDraft } from "@/modules/wfl/application/flows";
export { flowWakeJob } from "@/modules/wfl/application/wake-job";
export { flowClockJob } from "@/modules/wfl/application/clock-job";
export { flowEscalationJob } from "@/modules/wfl/application/escalation-job";
export {
  countPasses,
  isWindowTest,
  parseDefinition,
  RUNNABLE_STEP_TYPES,
  STEP_TYPES,
  type FlowDefinition,
  type FlowStep,
  type WindowTest,
} from "@/modules/wfl/domain/definition";

// The module's capability catalog, read by the flow engine (TASK-0118).
export { wflCapabilities } from "@/modules/wfl/capabilities";
