import { describe, expect, it } from "vitest";

import {
  minimumPasswordLength,
  signInSchema,
  twoFactorCodeSchema,
  updatePasswordSchema,
} from "@/modules/iam/application/auth-schemas";

describe("signInSchema", () => {
  it("accepts an e-mail and a password", () => {
    const result = signInSchema.safeParse({ email: "eren@example.com", password: "parola123" });

    expect(result.success).toBe(true);
  });

  it("rejects a malformed e-mail", () => {
    expect(signInSchema.safeParse({ email: "eren@", password: "parola123" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(signInSchema.safeParse({ email: "eren@example.com", password: "" }).success).toBe(false);
  });
});

describe("updatePasswordSchema", () => {
  it("requires both passwords to match", () => {
    const result = updatePasswordSchema.safeParse({
      password: "yeniparola1",
      passwordConfirmation: "baskaparola1",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["passwordConfirmation"]);
  });

  it("rejects a password below the minimum length", () => {
    const short = "a".repeat(minimumPasswordLength - 1);

    expect(
      updatePasswordSchema.safeParse({ password: short, passwordConfirmation: short }).success,
    ).toBe(false);
  });

  it("accepts a long enough, matching password", () => {
    const password = "a".repeat(minimumPasswordLength);

    expect(
      updatePasswordSchema.safeParse({ password, passwordConfirmation: password }).success,
    ).toBe(true);
  });
});

describe("twoFactorCodeSchema", () => {
  it("accepts exactly six digits", () => {
    expect(twoFactorCodeSchema.safeParse({ code: "123456" }).success).toBe(true);
  });

  it("rejects short or non-numeric codes", () => {
    expect(twoFactorCodeSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(twoFactorCodeSchema.safeParse({ code: "12345a" }).success).toBe(false);
  });
});
