import { describe, expect, it } from "vitest";

import {
  assignTaskSchema,
  dueAtFromDay,
  historyLine,
  NOTIFICATION_TEMPLATES,
  notificationText,
  sortTasks,
  taskGroup,
  type TaskSummary,
} from "./tasks";

const NOW = new Date("2026-09-22T09:00:00+03:00");

function task(id: string, patch: Partial<TaskSummary>): TaskSummary {
  return {
    id,
    title: id,
    priority: "normal",
    status: "open",
    dueAt: null,
    assigneeUserId: "a",
    assigneeName: "A",
    givenByUserId: "g",
    givenByName: "G",
    sourceType: "manual",
    linkPath: `/tasks/${id}`,
    createdAt: new Date("2026-09-20T09:00:00+03:00"),
    ...patch,
  };
}

describe("task list order (REQ-TSK-007)", () => {
  it("puts late tasks first, whatever their priority", () => {
    const sorted = sortTasks(
      [
        task("critical-later", { priority: "critical", dueAt: new Date("2026-09-25T12:00:00Z") }),
        task("low-late", { priority: "low", dueAt: new Date("2026-09-21T12:00:00Z") }),
        task("today", { dueAt: new Date("2026-09-22T20:00:00+03:00") }),
        task("awaiting", { status: "reported_done" }),
        task("no-date-high", { priority: "high" }),
      ],
      NOW,
    );
    expect(sorted.map((t) => t.id)).toEqual([
      "low-late",
      "today",
      "awaiting",
      "critical-later",
      "no-date-high",
    ]);
  });

  it("orders by priority, then the nearer due date, then the newest", () => {
    const sorted = sortTasks(
      [
        task("normal-soon", { dueAt: new Date("2026-09-24T12:00:00Z") }),
        task("high-far", { priority: "high", dueAt: new Date("2026-10-30T12:00:00Z") }),
        task("normal-sooner", { dueAt: new Date("2026-09-23T12:00:00Z") }),
        task("normal-new", { createdAt: new Date("2026-09-21T12:00:00Z") }),
        task("normal-old", { createdAt: new Date("2026-09-01T12:00:00Z") }),
      ],
      NOW,
    );
    expect(sorted.map((t) => t.id)).toEqual([
      "high-far",
      "normal-sooner",
      "normal-soon",
      "normal-new",
      "normal-old",
    ]);
  });

  it("uses the Istanbul day for 'bugün'", () => {
    const lateEvening = new Date("2026-09-22T23:30:00+03:00");
    expect(taskGroup({ status: "open", dueAt: lateEvening }, NOW)).toBe("today");
    const afterMidnight = new Date("2026-09-23T00:30:00+03:00");
    expect(taskGroup({ status: "open", dueAt: afterMidnight }, NOW)).toBe("upcoming");
    expect(taskGroup({ status: "closed", dueAt: new Date(0) }, NOW)).toBe("closed");
  });
});

describe("notification words (REQ-TSK-011)", () => {
  it("come from the type's fixed template; the subject is the only variable part", () => {
    expect(notificationText("task.assigned", "  Kalıp sökümü  ")).toEqual({
      title: "Size yeni görev verildi",
      body: "Kalıp sökümü",
    });
    expect(notificationText("unknown.type", null)).toEqual({ title: "Bildirim", body: null });
    expect(notificationText("task.assigned", "x".repeat(500)).body).toHaveLength(200);
  });

  it("has no template that takes a record field", () => {
    for (const template of Object.values(NOTIFICATION_TEMPLATES)) {
      expect(template.title).not.toMatch(/[{}$]/);
    }
    // The function accepts only a type and a subject: there is no parameter for record data.
    expect(notificationText.length).toBe(2);
  });
});

describe("the Görev ver form (SCR-014)", () => {
  it("needs a title and an assignee; an empty date is no date", () => {
    const ok = assignTaskSchema.parse({
      title: " Beton dökümü ",
      assigneeId: "0192f0c1-0108-7000-8000-000000000001",
      dueOn: "",
    });
    expect(ok).toMatchObject({ title: "Beton dökümü", priority: "normal", needsApproval: false });
    expect(ok.dueOn).toBeUndefined();
    expect(assignTaskSchema.safeParse({ title: "", assigneeId: "x" }).success).toBe(false);
  });

  it("reads a due day as the end of that Istanbul day", () => {
    expect(dueAtFromDay("2026-09-30").toISOString()).toBe("2026-09-30T20:59:59.000Z");
  });
});

describe("history lines (REQ-TSK-004)", () => {
  const status = (oldValue: string, newValue: string, reason: string | null = null) =>
    historyLine({ operation: "update", field: "status", oldValue, newValue, reason });

  it("names closing, reporting, sending back and reopening", () => {
    expect(status("open", "reported_done")).toBe("Tamamladığını bildirdi");
    expect(status("open", "closed")).toBe("Görevi kapattı");
    expect(status("open", "closed", "sebebi çözüldü")).toBe("Sebebi çözüldü, görev kapandı");
    expect(status("reported_done", "open")).toBe("Görevi geri gönderdi");
    expect(status("closed", "open")).toBe("Görevi yeniden açtı");
    expect(
      historyLine({
        operation: "update",
        field: "reopened_count",
        oldValue: 0,
        newValue: 1,
        reason: null,
      }),
    ).toBeNull();
  });
});
