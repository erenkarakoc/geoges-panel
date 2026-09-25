/**
 * SIT's public surface (MODULE_BOUNDARIES section 2). Other modules and routes reach sites only
 * through here. Server-only. The site card is built first (TASK-0123 step 1); the daily site log
 * arrives with TASK-0127.
 */
export {
  changeSite,
  changeSiteStatus,
  listSites,
  mayManageSites,
  openSite,
  siteCard,
  type SiteResult,
} from "./application/sites";
export { WORK_MODEL_LABELS, WORK_MODELS, type WorkModel } from "./domain/site";
export type { Site } from "./data/site-store";

// Site-wide search (TASK-0110), registered in src/records with PRJ's project names.
export { siteSearch } from "./data/site-store";

// The module's capability catalog, read by the flow engine (TASK-0118).
export { sitCapabilities } from "@/modules/sit/capabilities";
