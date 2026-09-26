import { describe, expect, it } from "vitest";

import { correctionInput, dailyTargetMessage, noTargetReason } from "./daily-target";

const frame = { businessDay: true, daysLeft: 10, endOn: "2026-12-31", revisionId: "r" };

describe("daily targets (REQ-PRJ-011)", () => {
  it("says why a day has no target, first things first", () => {
    expect(noTargetReason(frame)).toBeNull();
    expect(noTargetReason({ ...frame, revisionId: null, businessDay: false })).toMatch(/revizyon/);
    expect(noTargetReason({ ...frame, businessDay: false })).toMatch(/iş günü değil/);
    expect(noTargetReason({ ...frame, endOn: null })).toMatch(/bitiş tarihi girilmemiş/);
    expect(noTargetReason({ ...frame, daysLeft: 0 })).toMatch(/geçti/);
  });

  it("reads a Turkish decimal, takes empty as a return to the calculation, wants a reason", () => {
    const line = {
      measure: "strip_install",
      panelTypeId: null,
      stripTypeId: "0192f0c1-0123-7400-8000-000000000001",
      stripLengthM: 6,
      workItemId: null,
      reason: "Hava muhalefeti",
    };
    expect(correctionInput.parse({ ...line, corrected: "12,5" }).corrected).toBe(12.5);
    expect(correctionInput.parse({ ...line, corrected: "" }).corrected).toBeNull();
    expect(correctionInput.safeParse({ ...line, corrected: "-1" }).success).toBe(false);
    expect(correctionInput.safeParse({ ...line, corrected: "3", reason: " " }).success).toBe(false);
  });

  it("turns the database's refusals into sentences", () => {
    expect(dailyTargetMessage({ hint: "prj.past_day_target" })).toMatch(/Geçmiş/);
    expect(dailyTargetMessage({ code: "42501" })).toMatch(/yetkiniz yok/);
    expect(dailyTargetMessage({ code: "XX000" })).toBeNull();
  });
});
