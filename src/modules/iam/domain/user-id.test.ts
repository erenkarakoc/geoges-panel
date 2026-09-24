import { describe, expect, it } from "vitest";

import { looksLikeUserId } from "@/modules/iam/domain/user-id";

describe("looksLikeUserId", () => {
  it("accepts a uuid in either case", () => {
    expect(looksLikeUserId("0b2b1d3e-4c5a-4b6d-8e9f-0a1b2c3d4e5f")).toBe(true);
    expect(looksLikeUserId("0B2B1D3E-4C5A-4B6D-8E9F-0A1B2C3D4E5F")).toBe(true);
  });

  it("refuses everything else, including the shapes a hand-made request would send", () => {
    for (const value of [
      "",
      " ",
      "0b2b1d3e4c5a4b6d8e9f0a1b2c3d4e5f",
      "0b2b1d3e-4c5a-4b6d-8e9f-0a1b2c3d4e5",
      "0b2b1d3e-4c5a-4b6d-8e9f-0a1b2c3d4e5f ",
      "'; select 1 --",
      "geoges-admin",
    ]) {
      expect(looksLikeUserId(value)).toBe(false);
    }
  });
});
