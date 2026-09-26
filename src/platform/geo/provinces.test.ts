import { describe, expect, it } from "vitest";

import { PROVINCES, optionalProvince } from "./provinces";

describe("provinces", () => {
  it("lists all 81 once, in Turkish alphabetical order", () => {
    expect(PROVINCES).toHaveLength(81);
    expect(new Set(PROVINCES).size).toBe(81);
    expect([...PROVINCES].sort((a, b) => a.localeCompare(b, "tr"))).toEqual([...PROVINCES]);
  });

  it("accepts a listed name or nothing, and refuses anything else", () => {
    expect(optionalProvince.parse(" İstanbul ")).toBe("İstanbul");
    expect(optionalProvince.parse("")).toBeNull();
    expect(optionalProvince.parse(undefined)).toBeUndefined();
    expect(optionalProvince.safeParse("istanbul").success).toBe(false);
  });
});
