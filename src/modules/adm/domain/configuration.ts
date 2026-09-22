/**
 * ADM's configuration vocabulary (TASK-0105, CONFIGURATION.md, D-237, D-260). Pure: the database
 * stores and checks, these types and helpers describe the answers.
 */

/** Where a rule is asked for; the most specific place that has a rule wins (site first). */
export type RuleScope = { siteId?: string; projectId?: string; unitId?: string };

/**
 * A rule lookup never falls back to a default (CONFIGURATION section 6): a missing rule is a
 * result of its own, and the caller marks its figure "could not be calculated".
 */
export type RuleResult =
  | {
      found: true;
      /** Stored by an approved record, so its figure is read back later (REQ-ADM-015). */
      ruleId: string;
      value: unknown;
      validFrom: string;
      scopeType: "company" | "unit" | "project" | "site";
    }
  | { found: false; key: string; on: string };

/** The number of a numeric rule, or null when missing or not a number. */
export function ruleNumber(result: RuleResult): number | null {
  return result.found && typeof result.value === "number" ? result.value : null;
}

export type CustomFieldType = "text" | "number" | "date" | "select" | "boolean";
export type FieldDataClass = "general" | "internal" | "commercial" | "sensitive";

/** The nine reference record types that take custom fields (D-237). */
export const CUSTOM_FIELD_TABLES = [
  "prj.project",
  "sit.site",
  "crm.party",
  "hr.employee",
  "eqp.asset",
  "inv.material",
  "cmp.contract",
  "qte.quote",
  "crm.lead",
] as const;
export type CustomFieldTable = (typeof CUSTOM_FIELD_TABLES)[number];

export type CustomFieldDefinition = {
  id: string;
  recordTable: CustomFieldTable;
  code: string;
  label: string;
  type: CustomFieldType;
  options: readonly { value: string; label: string }[] | null;
  isRequired: boolean;
  isSearchable: boolean;
  dataClass: FieldDataClass;
  orderNo: number;
  retired: boolean;
};

/**
 * The custom values a person may see (REQ-ADM-009, REQ-IAM-011): fields of a class the person may
 * not see are left out, not blanked; retired fields are not shown on screens (their values stay).
 * `canSee` answers for the record's module and place, e.g. from IAM's snapshot.
 */
export function visibleCustomFields(
  definitions: readonly CustomFieldDefinition[],
  values: Readonly<Record<string, unknown>>,
  canSee: (dataClass: FieldDataClass) => boolean,
): { definition: CustomFieldDefinition; value: unknown }[] {
  return definitions
    .filter((d) => !d.retired && canSee(d.dataClass))
    .sort((a, b) => a.orderNo - b.orderNo || a.label.localeCompare(b.label, "tr"))
    .map((definition) => ({ definition, value: values[definition.code] ?? null }));
}

/** Turkish messages for the configuration rules the database enforces (migration 0007). */
export const ADM_RULE_MESSAGES: Readonly<Record<string, string>> = {
  "adm.rule_immutable": "Bir kural satırı değiştirilmez; yeni bir geçerlilik tarihiyle ekleyin.",
  "adm.rule_value_type": "Değer bu kuralın tipine uymuyor.",
  "adm.rule_scope": "Bu kural bu kapsam için tanımlanamaz.",
  "adm.merge_invalid": "Yalnız aynı katalogdaki iki etkin kalem birleştirilebilir.",
  "adm.reason_required": "Birleştirme için gerekçe yazın.",
  "adm.catalog_project_scope": "Bu katalogda projeye özel kalem tanımlanamaz.",
  "adm.custom_field_invalid": "Özel alan değeri tanımına uymuyor.",
  "adm.custom_field_immutable":
    "Özel alanın türü ve kodu değiştirilemez, emekli alan geri alınamaz; yeni alan ekleyin.",
};

export function admRuleMessage(error: unknown): string | null {
  const hint = (error as { hint?: unknown } | null)?.hint;
  return typeof hint === "string" ? (ADM_RULE_MESSAGES[hint] ?? null) : null;
}
