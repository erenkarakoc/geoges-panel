/**
 * WFL's public surface (MODULE_BOUNDARIES section 2, TASK-0117). Code outside the module imports
 * only from here, apart from the `ui/` screens that routes render. Server-only.
 */
export {
  disableFlow,
  publishVersion,
  readCopiesBehindTemplate,
  readLastDryRun,
  readPublished,
  readPublishSummary,
  readVersions,
  recordDryRun,
  readTemplates,
  requestDryRun,
  resetToTemplate,
  saveDraft,
  startFromTemplate,
  type DryRunEvidence,
  type FlowSummary,
  type FlowTemplate,
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
  readMyApprovalCount,
  readMyApprovals,
  readRecentlyPublished,
  readRuns,
  readStepVisits,
  readRunLog,
  startInstance,
  startInstanceByHand,
  type ApprovalDecision,
  type FlowTrigger,
  type InstanceRow,
  type RecentlyPublished,
  type RecordLock,
  type RunRow,
  type StepVisit,
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
export {
  askDryRun,
  closeFlow,
  copyFlow,
  copyOfTemplate,
  flowVersions,
  lastDryRun,
  listFlows,
  listTemplates,
  openFlow,
  publishFlow,
  publishSummary,
  removeFlow,
  removeTemplate,
  reopenFlow,
  resetFlowToTemplate,
  restoreFlow,
  startFlow,
  writeDraft,
} from "@/modules/wfl/application/flows";
export { flowWakeJob } from "@/modules/wfl/application/wake-job";
export { flowClockJob } from "@/modules/wfl/application/clock-job";
export { flowDryRunJob } from "@/modules/wfl/application/dry-run-job";
export { flowEscalationJob } from "@/modules/wfl/application/escalation-job";
export { flowTemplateWatch } from "@/modules/wfl/application/template-watch";
// The pure helpers a screen needs to say things in Turkish: what a step is called, what a step
// visit did. Routes reach them through here, like everything else a module offers.
export { asDraft, stepNames, stepTypeLabel, type DrawableStep } from "@/modules/wfl/domain/graph";
export { reportEndText, reportStepText } from "@/modules/wfl/domain/report-text";
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
