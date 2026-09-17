import { describe, expect, it } from "vitest";

import { sampleApprovals } from "@/modules/wfl/ui/sample-approvals";
import { sampleWorkCounts } from "@/platform/navigation/navigation-registry";

describe("sampleApprovals", () => {
  it("is as long as the rail badge says, so the queue never runs out early", () => {
    expect(sampleApprovals).toHaveLength(sampleWorkCounts.approvals);
  });

  it("keeps ids unique and every record carries facts to check", () => {
    const ids = sampleApprovals.map((record) => record.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(sampleApprovals.every((record) => record.facts.length > 0)).toBe(true);
  });
});
