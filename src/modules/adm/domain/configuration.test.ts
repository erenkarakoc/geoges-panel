import { describe, expect, it } from "vitest";

import {
  admRuleMessage,
  ruleNumber,
  visibleCustomFields,
  type CustomFieldDefinition,
} from "./configuration";

const field = (over: Partial<CustomFieldDefinition>): CustomFieldDefinition => ({
  id: over.code ?? "x",
  recordTable: "sit.site",
  code: "x",
  label: "X",
  type: "text",
  options: null,
  isRequired: false,
  isSearchable: false,
  dataClass: "internal",
  orderNo: 0,
  retired: false,
  ...over,
});

describe("rule results (CONFIGURATION section 6)", () => {
  it("reads a numeric rule and never invents one", () => {
    expect(
      ruleNumber({
        found: true,
        ruleId: "r",
        value: 12.5,
        validFrom: "2026-01-01",
        scopeType: "site",
      }),
    ).toBe(12.5);
    expect(ruleNumber({ found: false, key: "inv.critical-stock", on: "2026-09-22" })).toBeNull();
    expect(
      ruleNumber({
        found: true,
        ruleId: "r",
        value: "12",
        validFrom: "2026-01-01",
        scopeType: "company",
      }),
    ).toBeNull();
  });
});

describe("custom fields shown to a person (REQ-ADM-009, REQ-IAM-011)", () => {
  const definitions = [
    field({ code: "price", label: "Birim fiyat", dataClass: "commercial", orderNo: 2 }),
    field({ code: "crane", label: "Vinç tipi", orderNo: 1 }),
    field({ code: "old", label: "Eski alan", retired: true }),
  ];
  const values = { price: 120, crane: "Kule", old: "kalır" };

  it("leaves out classes the person may not see and retired fields, in order", () => {
    const shown = visibleCustomFields(definitions, values, (c) => c !== "commercial");
    expect(shown.map((s) => [s.definition.code, s.value])).toEqual([["crane", "Kule"]]);
  });

  it("shows every open field to someone who may see all classes", () => {
    const shown = visibleCustomFields(definitions, values, () => true);
    expect(shown.map((s) => s.definition.code)).toEqual(["crane", "price"]);
  });
});

describe("configuration rule messages", () => {
  it("turns a database hint into Turkish", () => {
    expect(admRuleMessage({ hint: "adm.rule_immutable" })).toMatch(/değiştirilmez/);
    expect(admRuleMessage({})).toBeNull();
  });
});
