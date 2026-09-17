import { describe, expect, it } from "vitest";

import { sampleTasks } from "@/modules/tsk/ui/sample-tasks";
import { sampleWorkCounts } from "@/platform/navigation/navigation-registry";

describe("sampleTasks", () => {
  it("is as long as the rail badge says, so the badge never disagrees with the screen", () => {
    expect(sampleTasks).toHaveLength(sampleWorkCounts.tasks);
  });

  it("keeps ids unique", () => {
    const ids = sampleTasks.map((task) => task.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("sends every task to a screen where it can be done", () => {
    for (const task of sampleTasks) {
      expect(task.href).toMatch(/^\/[a-z0-9/-]+$/);
    }
  });
});
