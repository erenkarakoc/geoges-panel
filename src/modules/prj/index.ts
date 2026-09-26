/**
 * PRJ's public surface (MODULE_BOUNDARIES section 2). Other modules and routes reach projects
 * only through here. Server-only. The project card is built first (TASK-0123 step 1).
 */
export {
  changeContract,
  changeProject,
  listProjects,
  mayEnterContractValue,
  mayOpenNewProject,
  mayOpenProjects,
  moveProjectStage,
  openProject,
  projectCard,
  projectNames,
  projectStages,
  siteWallProgress,
  type ProjectResult,
} from "./application/projects";
export {
  currentTargets,
  dropTarget,
  dropWall,
  markWall,
  mayEditRevisions,
  mayMarkWalls,
  openRevision,
  projectRevisions,
  putTarget,
  putWall,
  reviseWall,
  revisionView,
  sendRevision,
  takeBackRevision,
  targetChoices,
  type RevisionResult,
} from "./application/revisions";
export {
  correctDailyTarget,
  siteDailyTargets,
  type DailyTargetResult,
} from "./application/daily-targets";
export {
  DAILY_MEASURE_LABELS,
  TARGET_END_BASES,
  TARGET_END_BASIS_LABELS,
  noTargetReason,
  type DailyMeasure,
  type TargetEndBasis,
} from "./domain/daily-target";
export type { DailyTargetFrame, DailyTargetLine } from "./data/daily-target-store";
export {
  REVISION_STATUS_LABELS,
  TARGET_KIND_LABELS,
  WALL_STATUS_LABELS,
  WALL_STATUSES,
} from "./domain/revision";
export type {
  DiffLine,
  Revision,
  RevisionStatus,
  RevisionWall,
  TargetKind,
  WallStatus,
  WallTarget,
} from "./data/revision-store";
export {
  CURRENCIES,
  money,
  targetEndDate,
  type ContractInput,
  type ProjectInput,
} from "./domain/project";
export type { Project, ProjectContract, ProjectRow, StageChange } from "./data/project-store";

// For the flow's record step (REQ-WFL-010), wired in src/records, and for the daily site log's
// over-casting rule (TASK-0127), inside its own transaction.
export { setProjectStageAsSystem } from "./data/project-store";
export { readPanelTargets, setRevisionStatusAsSystem } from "./data/revision-store";

// Site-wide search (TASK-0110) and other modules' search lines, registered in src/records.
export {
  projectProjectForSearch,
  readProjectNamesAsSystem,
  scanProjectsForSearch,
} from "./data/project-store";

// The module's capability catalog, read by the flow engine (TASK-0118).
export { prjCapabilities } from "@/modules/prj/capabilities";

// The daily look for late technical office items (TASK-0123 step 4), registered in src/jobs.
export { technicalOfficeOverdueJob } from "./data/technical-office-store";
export {
  addOfficeItem,
  addSupplyRow,
  changeOfficeItem,
  countRevision,
  moveOfficeItem,
  projectOffice,
  type OfficeResult,
} from "./application/technical-office";
export {
  OFFICE_STATUS_LABELS,
  OFFICE_STATUSES,
  RESPONSIBILITIES,
  RESPONSIBILITY_LABELS,
  isOverdue,
  type OfficeStatus,
  type Responsibility,
} from "./domain/technical-office";
export type { OfficeItem, SupplyRow } from "./data/technical-office-store";
