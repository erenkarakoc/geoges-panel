import { describe, expect, it } from "vitest";

import { lockedMessage } from "@/modules/iam/application/auth-lock-message";

describe("lockedMessage", () => {
  const now = new Date("2026-09-24T10:00:00Z");

  it("says how long the wait is, rounded up to the minute", () => {
    expect(lockedMessage(new Date("2026-09-24T10:15:00Z"), now)).toContain("15 dakika");
    expect(lockedMessage(new Date("2026-09-24T10:14:01Z"), now)).toContain("15 dakika");
  });

  it("never promises zero or a negative wait", () => {
    expect(lockedMessage(new Date("2026-09-24T10:00:00Z"), now)).toContain("1 dakika");
    expect(lockedMessage(new Date("2026-09-24T09:59:00Z"), now)).toContain("1 dakika");
  });

  it("says nothing about whether the address has an account", () => {
    const text = lockedMessage(new Date("2026-09-24T10:05:00Z"), now);
    expect(text).not.toMatch(/hesap|kullanıcı|e-posta/i);
  });
});
