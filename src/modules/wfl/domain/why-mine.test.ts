import { describe, expect, it } from "vitest";

import { whyDelegated, whyMine } from "@/modules/wfl/domain/why-mine";

const names = {
  people: new Map([["u1", "Ayşe Yılmaz"]]),
  permissions: new Map([["fin.payment.approve", "Ödeme onaylama"]]),
  relations: new Map([["site.coordinator", "Şantiyenin sorumlusu"]]),
  roles: new Map([["GM", "Genel Müdür"]]),
};

describe("why an approval is with this person", () => {
  it("says which role brought it", () => {
    expect(whyMine({ type: "role", role: "GM" }, names)).toBe(
      "Genel Müdür rolünü taşıdığınız için sizde.",
    );
  });

  it("says which permission or relation brought it", () => {
    expect(whyMine({ type: "permission", permission: "fin.payment.approve" }, names)).toBe(
      "Ödeme onaylama yetkiniz olduğu için sizde.",
    );
    expect(whyMine({ type: "relation", relation: "site.coordinator" }, names)).toBe(
      "Şantiyenin sorumlusu olduğunuz için sizde.",
    );
  });

  it("never shows a code, even for a name it does not know", () => {
    const said = whyMine({ type: "role", role: "ZZZ" }, names);
    expect(said).toBe("Taşıdığınız rol nedeniyle sizde.");
    expect(said).not.toContain("ZZZ");
  });

  it("says nothing technical for a rule it has never seen", () => {
    expect(whyMine({ type: "brand_new" }, names)).toBe("Akış bu adımı size verdi.");
    expect(whyMine(null)).toBe("Akış bu adımı size verdi.");
  });

  it("says whose place a delegate is standing in, and nothing more", () => {
    expect(whyDelegated("u1", names)).toBe("Ayşe Yılmaz adına vekâleten sizde.");
    expect(whyDelegated(null, names)).toBe("Vekâleten sizde.");
  });
});
