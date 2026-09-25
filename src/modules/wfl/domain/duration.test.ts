import { describe, expect, it } from "vitest";

import { DURATION } from "@/modules/wfl/domain/definition";
import { durationToParts, partsToDuration } from "@/modules/wfl/domain/duration";

describe("a waiting time as a person would say it", () => {
  it("reads a stored duration in the largest whole unit", () => {
    expect(durationToParts("PT8H")).toEqual({ amount: 8, unit: "hour" });
    expect(durationToParts("PT30M")).toEqual({ amount: 30, unit: "minute" });
    expect(durationToParts("P2D")).toEqual({ amount: 2, unit: "day" });
    // Ninety minutes is ninety minutes, not one and a half of anything.
    expect(durationToParts("PT1H30M")).toEqual({ amount: 90, unit: "minute" });
  });

  it("falls back to something sensible rather than showing nothing", () => {
    expect(durationToParts(undefined)).toEqual({ amount: 8, unit: "hour" });
    expect(durationToParts("yarın sabah")).toEqual({ amount: 8, unit: "hour" });
  });

  it("writes back a duration the engine reads", () => {
    for (const parts of [
      { amount: 45, unit: "minute" as const },
      { amount: 8, unit: "hour" as const },
      { amount: 3, unit: "day" as const },
      { amount: 90, unit: "minute" as const },
    ]) {
      const written = partsToDuration(parts);
      expect(DURATION.test(written)).toBe(true);
      expect(durationToParts(written)).toEqual(durationToParts(partsToDuration(parts)));
    }
    expect(partsToDuration({ amount: 90, unit: "minute" })).toBe("PT90M");
    expect(partsToDuration({ amount: 0, unit: "hour" })).toBe("PT1H");
  });
});
