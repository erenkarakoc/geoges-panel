/**
 * ADM's public surface (MODULE_BOUNDARIES section 2, TASK-0105). Other modules read rules,
 * catalogs and custom fields only through here. Server-only.
 */
export {
  addBusinessDays,
  addCatalogItem,
  currentCatalogItem,
  customFieldDefinitions,
  enterManualRate,
  findSimilarCatalogItems,
  getRule,
  isBusinessDay,
  mergeCatalogItems,
  rateFor,
} from "./application/configuration";
export {
  addPanelType,
  addRecipeLine,
  addStripType,
  changeCatalogItemStatus,
  changePanelType,
  changeStripType,
  listCatalogItems,
  listCatalogs,
  listPanelTypes,
  listRecipeLines,
  listStripTypes,
  mayManageDefinitions,
  mayViewDefinitions,
  type DefinitionResult,
} from "./application/production";
// For the daily site log, inside its own transaction (TASK-0127).
export {
  readPanelNeighbours,
  readRecipeFor,
  type AppliedRecipeLine,
  type CatalogInfo,
  type PanelType,
  type RecipeLine,
  type StripType,
} from "./data/production-store";
export {
  OUTPUT_KINDS,
  OUTPUT_LABELS,
  UNIT_LABELS,
  UNITS_FOR,
  decimal,
  panelArea,
  stripLength,
  type OutputKind,
  type PerUnit,
} from "./domain/production";
export { readRateFor, type RateForDay } from "./data/calendar-and-rates";
export { admJobs } from "./data/adm-jobs";
// For calculations inside a module's own transaction (request or worker handler).
export { readRule } from "./data/adm-store";
export {
  CUSTOM_FIELD_TABLES,
  admRuleMessage,
  ruleNumber,
  visibleCustomFields,
  type CustomFieldDefinition,
  type CustomFieldTable,
  type RuleResult,
  type RuleScope,
} from "./domain/configuration";

// The module's capability catalog, read by the flow engine (TASK-0118).
export { admCapabilities } from "@/modules/adm/capabilities";
