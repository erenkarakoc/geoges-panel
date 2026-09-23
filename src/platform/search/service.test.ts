import { afterEach, describe, expect, it, vi } from "vitest";
import { searchFor, recentSearchFor } from "./service";
import { searchPalette, readRecentSearchRecords } from "@/platform/db/search-store";
vi.mock("@/platform/db/search-store", () => ({
  searchPalette: vi.fn(),
  readRecentSearchRecords: vi.fn(),
}));
const identity = { userId: "user", actingRoleId: null };
const types = [
  { type: "sit.site", label: "Şantiyeler", listPath: "/sites" },
  { type: "prj.project", label: "Projeler", listPath: "/projects" },
];
const hit = (recordType: string, n: number) => ({
  recordSchema: recordType.split(".")[0],
  recordTable: "record",
  recordId: String(n),
  recordType,
  title: `Deneme ${n}`,
  secondary: null,
  linkPath: "/today",
  rank: 1,
});
afterEach(() => vi.resetAllMocks());
describe("permission-aware palette orchestration", () => {
  it("shows five per kind with the owning list route, using one data-layer request", async () => {
    vi.mocked(searchPalette).mockResolvedValue({
      hits: types.flatMap((entry) => Array.from({ length: 6 }, (_, n) => hit(entry.type, n))),
      corrected: null,
      failedTypes: [],
    });
    const result = await searchFor(identity, "söğüt", types);
    expect(result.groups).toHaveLength(2);
    expect(result.groups.every((group) => group.hits.length === 5 && group.hasMore)).toBe(true);
    expect(result.groups[0].listHref).toBe("/sites?q=s%C3%B6%C4%9F%C3%BCt");
    expect(searchPalette).toHaveBeenCalledExactlyOnceWith(identity, "söğüt", [
      "sit.site",
      "prj.project",
    ]);
  });
  it("keeps successful groups when one query fails", async () => {
    vi.mocked(searchPalette).mockResolvedValue({
      hits: [hit("sit.site", 1)],
      corrected: null,
      failedTypes: ["prj.project"],
    });
    const result = await searchFor(identity, "sogut", types);
    expect(result.groups).toHaveLength(1);
    expect(result.failedGroups).toEqual([{ type: "prj.project", label: "Projeler" }]);
  });
  it("does not query when no record type is registered", async () => {
    expect(await searchFor(identity, "sogut", [])).toEqual({
      groups: [],
      corrected: null,
      failedGroups: [],
    });
    expect(searchPalette).not.toHaveBeenCalled();
  });
  it("only returns recent records re-read under the caller's identity", async () => {
    vi.mocked(readRecentSearchRecords).mockResolvedValue([hit("sit.site", 1)]);
    const result = await recentSearchFor(
      identity,
      ["javascript:alert(1)", "//other", "/sites/1", "/sites/1"],
      types,
    );
    expect(readRecentSearchRecords).toHaveBeenCalledWith(
      identity,
      ["/sites/1"],
      ["sit.site", "prj.project"],
    );
    expect(result.groups[0].label).toBe("Son açılanlar");
  });
});
