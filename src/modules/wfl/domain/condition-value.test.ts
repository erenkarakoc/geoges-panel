import { describe, expect, it } from "vitest";

import { comparisonsFor, resolveFieldCode, valueShapeOf } from "./condition-value";

describe("how a condition asks for its value", () => {
  it("reads the code catalog's type and the requirements' Turkish type alike", () => {
    expect(valueShapeOf("choice")).toEqual({ kind: "choice" });
    expect(valueShapeOf("seçim")).toEqual({ kind: "choice" });
    expect(valueShapeOf("seçim: onayla / reddet / geri gönder")).toEqual({ kind: "choice" });
    expect(valueShapeOf("evet/hayır")).toEqual({ kind: "boolean" });
    expect(valueShapeOf("kişi")).toEqual({ kind: "person" });
    expect(valueShapeOf("tutar")).toEqual({ kind: "number", unit: "TL" });
    expect(valueShapeOf("sayı (%)")).toEqual({ kind: "number", unit: "%" });
    expect(valueShapeOf("sayı (gün)")).toEqual({ kind: "number", unit: "gün" });
    expect(valueShapeOf("sayı")).toEqual({ kind: "number" });
    expect(valueShapeOf(undefined)).toEqual({ kind: "text" });
  });

  it("offers only the comparisons that mean something", () => {
    expect(comparisonsFor("choice")).toEqual(["=", "!="]);
    expect(comparisonsFor("number")).toContain(">");
    expect(comparisonsFor("boolean")).not.toContain(">");
  });

  it("reads record.stage in a flow about a project as the project's stage", () => {
    const known = (code: string) =>
      ["project.stage", "weighbridge.difference_percent"].includes(code);
    expect(resolveFieldCode("record.stage", known, "project")).toBe("project.stage");
    expect(resolveFieldCode("record.difference_percent", known, "weighbridge_difference")).toBe(
      "weighbridge.difference_percent",
    );
    expect(resolveFieldCode("project.stage", known, undefined)).toBe("project.stage");
    expect(resolveFieldCode("record.nothing", known, "project")).toBeUndefined();
  });
});
