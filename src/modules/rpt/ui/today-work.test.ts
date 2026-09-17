import { describe, expect, it } from "vitest";

import { todayWorkBySeat } from "@/modules/rpt/ui/today-work";
import { previewRoles } from "@/platform/access/preview-roles";

describe("todayWorkBySeat", () => {
  it("gives every seat a work block, so no role opens an empty entry screen", () => {
    for (const role of previewRoles) {
      expect(todayWorkBySeat[role.id]).toBeDefined();
    }
  });

  it("keeps row ids unique inside a block", () => {
    for (const work of Object.values(todayWorkBySeat)) {
      const ids = work.rows.map((row) => row.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("lets every row and action reach a source (§3.3)", () => {
    for (const work of Object.values(todayWorkBySeat)) {
      for (const row of work.rows) {
        expect(row.href).toMatch(/^\/[a-z0-9/-]+$/);
      }
      expect(work.action.href).toMatch(/^\/[a-z0-9/-]+$/);
    }
  });
});
