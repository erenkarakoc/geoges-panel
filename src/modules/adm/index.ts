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
