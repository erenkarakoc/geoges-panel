import { describe, expect, it } from "vitest";

import { occurrences, retryAt, runKey } from "./timing";

const at = (iso: string) => new Date(iso);

describe("retry schedule (EVENT_BACKBONE section 4)", () => {
  it("waits 1, 5, 15 and 60 minutes, then gives up at the fifth failure", () => {
    const now = at("2026-09-22T10:00:00Z");
    const minutes = [0, 1, 2, 3].map((n) => (retryAt(n, now)!.getTime() - now.getTime()) / 60_000);
    expect(minutes).toEqual([1, 5, 15, 60]);
    expect(retryAt(4, now)).toBeNull();
    expect(retryAt(9, now)).toBeNull();
  });
});

describe("recurring jobs (Istanbul time, UTC+3)", () => {
  it("finds the latest and next 00:05 run in Istanbul", () => {
    // 2026-09-22 00:07 in Istanbul is 21:07 UTC the day before.
    expect(occurrences({ dailyAt: "00:05" }, at("2026-09-21T21:07:00Z"))).toEqual({
      previous: at("2026-09-21T21:05:00Z"),
      next: at("2026-09-22T21:05:00Z"),
    });
    // 00:03 Istanbul: the latest run was yesterday's.
    expect(occurrences({ dailyAt: "00:05" }, at("2026-09-21T21:03:00Z")).previous).toEqual(
      at("2026-09-20T21:05:00Z"),
    );
  });

  it("counts exactly on the minute as the latest run", () => {
    expect(occurrences({ dailyAt: "16:00" }, at("2026-09-22T13:00:00Z")).previous).toEqual(
      at("2026-09-22T13:00:00Z"),
    );
  });

  it("steps every N minutes from the hour", () => {
    expect(occurrences({ everyMinutes: 15 }, at("2026-09-22T10:37:12Z"))).toEqual({
      previous: at("2026-09-22T10:30:00Z"),
      next: at("2026-09-22T10:45:00Z"),
    });
  });

  it("refuses malformed schedules", () => {
    expect(() => occurrences({ dailyAt: "24:00" }, new Date())).toThrow(/HH:MM/);
    expect(() => occurrences({ everyMinutes: 0 }, new Date())).toThrow(/positive/);
  });

  it("keys one run by type and time", () => {
    expect(runKey("iam.deactivate-departed", at("2026-09-21T21:05:00Z"))).toBe(
      "iam.deactivate-departed@2026-09-21T21:05:00.000Z",
    );
  });
});
