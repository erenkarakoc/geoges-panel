import { describe, expect, it } from "vitest";

import { decimalOrNull, targetInput, wallInput } from "./revision";

// The pilot's samples and the seeds give rows md5-derived ids: not RFC version UUIDs.
const SEEDED = "0badf7ca-25ea-1334-095a-4f5276a1b7e9";

describe("walls and targets as they are typed", () => {
  it("takes a seeded site id and a size typed with a comma", () => {
    const parsed = wallInput.parse({
      code: "S-D1",
      heightM: "4,5",
      lengthM: "120",
      name: "Sarıyar Duvar 1",
      siteId: SEEDED,
    });
    expect(parsed).toMatchObject({ heightM: 4.5, lengthM: 120, siteId: SEEDED });
  });

  it("asks for the site in Turkish", () => {
    const parsed = wallInput.safeParse({ code: "D1", name: "Duvar", siteId: "" });
    expect(parsed.error?.issues[0].message).toBe("Duvarın şantiyesi seçilmeli.");
  });

  it("reads each kind of target with its own amount", () => {
    expect(
      targetInput.parse({ kind: "panel", panelTypeId: SEEDED, qty: "120", wallId: SEEDED }),
    ).toMatchObject({ qty: 120 });
    expect(
      targetInput.parse({
        kind: "strip",
        lengthM: "7.560",
        stripLengthM: "6",
        stripTypeId: SEEDED,
        wallId: SEEDED,
      }),
    ).toMatchObject({ lengthM: 7.56, stripLengthM: 6 });
    const missing = targetInput.safeParse({
      kind: "strip",
      lengthM: "10",
      stripTypeId: SEEDED,
      wallId: SEEDED,
    });
    expect(missing.success).toBe(false);
  });

  it("refuses a negative amount", () => {
    const parsed = targetInput.safeParse({
      kind: "panel",
      panelTypeId: SEEDED,
      qty: "-1",
      wallId: SEEDED,
    });
    expect(parsed.error?.issues[0].message).toContain("sıfır");
  });

  it("reads numbers the way they are typed here", () => {
    expect(decimalOrNull("1,5")).toBe(1.5);
    expect(decimalOrNull("")).toBeNull();
    expect(Number.isNaN(decimalOrNull("abc"))).toBe(true);
  });
});
