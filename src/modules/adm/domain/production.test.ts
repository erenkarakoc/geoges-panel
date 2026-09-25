import { describe, expect, it } from "vitest";

import {
  decimal,
  panelArea,
  panelTypeInput,
  productionMessage,
  recipeLineInput,
  stripLength,
} from "@/modules/adm/domain/production";

describe("production definitions, as a form checks them before the database does", () => {
  it("computes a panel's area the way the database does", () => {
    expect(panelArea(1.5, 1.5)).toBe(2.25);
    expect(panelArea(1.2, 0.95)).toBe(1.14);
  });

  it("reads a number the way it is typed in Türkiye", () => {
    expect(decimal("1,5")).toBe(1.5);
    expect(decimal(" 2.25 ")).toBe(2.25);
    expect(Number.isNaN(decimal(""))).toBe(true);
    expect(Number.isNaN(decimal("bir buçuk"))).toBe(true);
  });

  it("computes a strip's total length from its piece length and count", () => {
    expect(stripLength(6, 12)).toBe(72);
    expect(stripLength(2.75, 3)).toBe(8.25);
  });

  it("asks for a step when a series is given", () => {
    const said = panelTypeInput.safeParse({
      code: "P1",
      name: "Panel",
      widthM: 1,
      heightM: 1,
      series: "A",
    });
    expect(said.success).toBe(false);
    expect(said.error?.issues[0].message).toBe("Seri verildiyse kademe de verilmeli.");
  });

  it("refuses a unit that does not fit the output, in Turkish", () => {
    const said = recipeLineInput.safeParse({
      outputKind: "strip_installation",
      perUnit: "m2",
      materialItemId: "0192f0c1-0000-7000-8000-000000000001",
      qtyPerUnit: 1,
      validFrom: "2026-01-01",
      reason: "Deneme",
    });
    expect(said.success).toBe(false);
    expect(said.error?.issues.map((issue) => issue.message)).toContain(
      "Bu üretim türü bu birimle sayılmaz.",
    );
  });

  it("turns the database's refusals into sentences", () => {
    expect(productionMessage("adm.type_identity_fixed")).toContain("yeni tip ekleyin");
    expect(productionMessage("adm.recipe_append_only")).toContain("yeni satır ekleyin");
    expect(productionMessage("something.else")).toBeNull();
  });
});
