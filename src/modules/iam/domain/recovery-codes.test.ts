import { describe, expect, it } from "vitest";

import {
  RECOVERY_CODE_COUNT,
  hashRecoveryCode,
  looksLikeRecoveryCode,
  newRecoveryCodes,
} from "@/modules/iam/domain/recovery-codes";

describe("newRecoveryCodes", () => {
  it("makes ten different codes, all in the same readable shape", () => {
    const codes = newRecoveryCodes();
    expect(codes).toHaveLength(RECOVERY_CODE_COUNT);
    expect(new Set(codes).size).toBe(RECOVERY_CODE_COUNT);
    for (const code of codes) expect(code).toMatch(/^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/);
  });

  it("leaves out the characters people read wrong", () => {
    const letters = new Set(newRecoveryCodes().join("").replaceAll("-", ""));
    for (const confusing of ["O", "0", "I", "L", "1"]) expect(letters.has(confusing)).toBe(false);
  });

  it("does not repeat itself between two sets", () => {
    const first = new Set(newRecoveryCodes());
    expect(newRecoveryCodes().some((code) => first.has(code))).toBe(false);
  });
});

describe("hashRecoveryCode", () => {
  it("is the shape the database accepts", () => {
    expect(hashRecoveryCode("A7K2M-P9XQ4")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("forgives case, spaces and dashes", () => {
    const one = hashRecoveryCode("A7K2M-P9XQ4");
    expect(hashRecoveryCode("a7k2m-p9xq4")).toBe(one);
    expect(hashRecoveryCode(" A7K2M P9XQ4 ")).toBe(one);
    expect(hashRecoveryCode("A7K2MP9XQ4")).toBe(one);
  });

  it("tells two codes apart", () => {
    expect(hashRecoveryCode("A7K2M-P9XQ4")).not.toBe(hashRecoveryCode("A7K2M-P9XQ5"));
  });
});

describe("looksLikeRecoveryCode", () => {
  it("accepts a code however it was typed", () => {
    expect(looksLikeRecoveryCode("A7K2M-P9XQ4")).toBe(true);
    expect(looksLikeRecoveryCode("a7k2m p9xq4")).toBe(true);
  });

  it("refuses what cannot be one", () => {
    expect(looksLikeRecoveryCode("")).toBe(false);
    expect(looksLikeRecoveryCode("123456")).toBe(false);
    expect(looksLikeRecoveryCode("A7K2M-P9XQ44")).toBe(false);
  });
});
