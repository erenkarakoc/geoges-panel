/**
 * ADM's public surface (MODULE_BOUNDARIES section 2, TASK-0105). Other modules read rules,
 * catalogs and custom fields only through here. Server-only.
 */
export {
  addCatalogItem,
  currentCatalogItem,
  customFieldDefinitions,
  findSimilarCatalogItems,
  getRule,
  mergeCatalogItems,
} from "./application/configuration";
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
