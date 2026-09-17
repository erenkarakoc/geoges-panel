import { describe, expect, it } from "vitest";

import { parseOpenGroups, resolveOpenGroups } from "@/platform/navigation/sidebar-group-preference";

describe("parseOpenGroups", () => {
  it("reads the stored ids and ignores empty entries", () => {
    expect(parseOpenGroups("site-daily,commercial")).toEqual(["site-daily", "commercial"]);
    expect(parseOpenGroups("site-daily%2Ccommercial")).toEqual(["site-daily", "commercial"]);
    expect(parseOpenGroups("")).toEqual([]);
    expect(parseOpenGroups(undefined)).toEqual([]);
  });
});

describe("resolveOpenGroups", () => {
  it("opens the first group for someone who has never touched the menu", () => {
    expect(resolveOpenGroups(undefined, "site-daily")).toEqual(["site-daily"]);
  });

  it("respects a remembered choice, including closing everything", () => {
    expect(resolveOpenGroups("commercial", "site-daily")).toEqual(["commercial"]);
    expect(resolveOpenGroups("", "site-daily")).toEqual([]);
  });

  it("opens nothing when the seat sees no group at all", () => {
    expect(resolveOpenGroups(undefined, undefined)).toEqual([]);
  });
});
