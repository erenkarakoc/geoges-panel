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
  type ProjectResult,
} from "./application/projects";
export {
  CURRENCIES,
  money,
  targetEndDate,
  type ContractInput,
  type ProjectInput,
} from "./domain/project";
export type { Project, ProjectContract, ProjectRow, StageChange } from "./data/project-store";

// Site-wide search (TASK-0110) and other modules' search lines, registered in src/records.
export {
  projectProjectForSearch,
  readProjectNamesAsSystem,
  scanProjectsForSearch,
} from "./data/project-store";

// The module's capability catalog, read by the flow engine (TASK-0118).
export { prjCapabilities } from "@/modules/prj/capabilities";
