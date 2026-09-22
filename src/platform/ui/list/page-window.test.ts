import { describe, expect, it } from "vitest";

import { pageWindow } from "./page-window";

describe("pageWindow", () => {
  it("shows every page when there are few, and a window with gaps otherwise", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(5, 20)).toEqual([1, null, 4, 5, 6, null, 20]);
    expect(pageWindow(1, 20)).toEqual([1, 2, null, 20]);
    expect(pageWindow(20, 20)).toEqual([1, null, 19, 20]);
    expect(pageWindow(3, 20)).toEqual([1, 2, 3, 4, null, 20]);
  });
});
