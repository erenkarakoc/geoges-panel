import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readRecentPaths, rememberRecentPath } from "./recent-search";
beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
});
afterEach(() => vi.unstubAllGlobals());
describe("recent record addresses", () => {
  it("keeps five unique paths in last-opened order, isolated by account", () => {
    for (let n = 0; n < 6; n++) rememberRecentPath("alice", `/sites/${n}`);
    rememberRecentPath("alice", "/sites/2");
    expect(readRecentPaths("alice")).toEqual([
      "/sites/2",
      "/sites/5",
      "/sites/4",
      "/sites/3",
      "/sites/1",
    ]);
    expect(readRecentPaths("bob")).toEqual([]);
  });
  it("ignores unsafe paths and disabled browser storage", () => {
    rememberRecentPath("alice", "//external.example");
    expect(readRecentPaths("alice")).toEqual([]);
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("disabled");
      },
      setItem: () => {
        throw new Error("disabled");
      },
    });
    expect(() => rememberRecentPath("alice", "/sites/1")).not.toThrow();
    expect(readRecentPaths("alice")).toEqual([]);
  });
});
