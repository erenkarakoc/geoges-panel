import { describe, expect, it } from "vitest";

import { lockedMessage } from "@/modules/iam/application/auth-lock-message";

const minutes = (n: number) => ({ remainingMs: n * 60_000 });

describe("lockedMessage", () => {
  it("says how long the wait is, rounded up to the minute", () => {
    expect(lockedMessage(minutes(15))).toContain("15 dakika");
    expect(lockedMessage({ remainingMs: 14 * 60_000 + 1_000 })).toContain("15 dakika");
  });

  it("says the setting's own number, because the database measures it", () => {
    // The browser pass of 2026-09-24 saw "16 dakika" for a fifteen-minute lock: the remaining
    // time was measured against this machine's clock, a minute behind the database's.
    expect(lockedMessage(minutes(15))).not.toContain("16");
  });

  it("never promises zero or a negative wait", () => {
    expect(lockedMessage({ remainingMs: 0 })).toContain("1 dakika");
    expect(lockedMessage({ remainingMs: -60_000 })).toContain("1 dakika");
  });

  it("says nothing about whether the address has an account", () => {
    const text = lockedMessage(minutes(5));
    expect(text).not.toMatch(/hesap|kullanıcı|e-posta/i);
  });
});
