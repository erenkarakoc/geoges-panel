import { describe, expect, it } from "vitest";

import {
  cleanTaxNo,
  partyInput,
  roleWords,
  taxNoWarning,
  tcknLooksValid,
  vknLooksValid,
} from "./party";

describe("tax numbers", () => {
  it("drops the spaces and dots people type into a number", () => {
    expect(cleanTaxNo(" 123 456.7890 ")).toBe("1234567890");
  });

  it("accepts exactly one check digit for a tax number (VKN)", () => {
    const passing = [..."0123456789"].filter((last) => vknLooksValid(`123456789${last}`));
    expect(passing).toHaveLength(1);
  });

  it("checks a national id (TCKN) by both of its check digits", () => {
    expect(tcknLooksValid("10000000146")).toBe(true);
    expect(tcknLooksValid("10000000147")).toBe(false);
    expect(tcknLooksValid("00000000146")).toBe(false);
  });

  it("warns about a number that looks mistyped, and not about a foreign one", () => {
    const valid = [..."0123456789"].find((last) => vknLooksValid(`123456789${last}`));
    expect(taxNoWarning(`123456789${valid}`)).toBeNull();
    expect(taxNoWarning("10000000147")).toContain("hatalı");
    expect(taxNoWarning("12345")).toContain("10");
    expect(taxNoWarning("DE123456789")).toBeNull();
    expect(taxNoWarning("")).toBeNull();
  });
});

describe("the card form", () => {
  it("keeps roles in their fixed order, once each", () => {
    const parsed = partyInput.parse({
      name: "Deneme Ltd",
      roles: ["supplier", "client", "supplier"],
    });
    expect(parsed.roles).toEqual(["client", "supplier"]);
  });

  it("asks for at least one role, in Turkish", () => {
    const parsed = partyInput.safeParse({ name: "Deneme Ltd", roles: [] });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0].message).toBe("Firmanın en az bir rolü seçilmeli.");
  });

  it("turns empty optional fields into nothing and refuses a broken e-mail", () => {
    const parsed = partyInput.parse({ name: "Deneme", roles: ["client"], city: " ", taxNo: "" });
    expect(parsed.city).toBeNull();
    expect(parsed.taxNo).toBeNull();
    const broken = partyInput.safeParse({ name: "Deneme", roles: ["client"], email: "a@b" });
    expect(broken.error?.issues[0].message).toBe("E-posta adresi eksik ya da hatalı.");
  });

  it("refuses a Turkish number of the wrong length", () => {
    const parsed = partyInput.safeParse({ name: "Deneme", roles: ["client"], taxNo: "123456" });
    expect(parsed.error?.issues[0].message).toContain("10");
  });

  it("says the roles in words", () => {
    expect(roleWords(["lessor", "client"])).toBe("İşveren, Kiralayan");
  });
});
