import { describe, expect, it } from "vitest";

import { definitionSchema } from "@/modules/wfl/domain/definition";
import {
  appendStep,
  blankStep,
  freeStepId,
  insertAfter,
  removeStep,
  withStep,
  type Draft,
} from "@/modules/wfl/domain/edit";

/** A three-step flow: start, an approval, an end. */
function draft(): Draft {
  return {
    trigger: { type: "manual" },
    start: "start_1",
    steps: [
      { id: "start_1", type: "start", next: "approval_1" },
      {
        id: "approval_1",
        type: "approval",
        owner: { type: "role", role: "GM" },
        outcomes: { approve: "end_1", reject: "end_1" },
      },
      { id: "end_1", type: "end" },
    ],
  };
}

describe("editing a draft definition (SCR-196)", () => {
  it("gives a new step an id that says what it is", () => {
    expect(freeStepId(draft(), "approval")).toBe("approval_2");
    expect(freeStepId(draft(), "wait")).toBe("wait_1");
  });

  it("answers only what it can answer, and leaves the rest to be asked", () => {
    expect(blankStep("wait", "wait_1")).toEqual({ id: "wait_1", type: "wait", after: "PT8H" });
    // An approval without an owner is not a valid definition, and that is the point: the schema
    // asks for the owner and the designer shows the question on the box.
    const step = blankStep("approval", "approval_9");
    expect(step.owner).toBeUndefined();
  });

  it("puts a new step on the arrow, so what followed now follows the new step", () => {
    const { draft: next, id } = insertAfter(draft(), "start_1", "next", "notify");
    expect(id).toBe("notify_1");
    expect(next.steps.find((step) => step.id === "start_1")?.next).toBe("notify_1");
    expect(next.steps.find((step) => step.id === "notify_1")?.next).toBe("approval_1");
  });

  it("puts a step on one answer of an approval without touching the others", () => {
    const { draft: next, id } = insertAfter(draft(), "approval_1", "reject", "notify");
    const approval = next.steps.find((step) => step.id === "approval_1");
    expect(approval?.outcomes).toEqual({ approve: "end_1", reject: id });
    expect(next.steps.find((step) => step.id === id)?.next).toBe("end_1");
  });

  it("appends to a flow that is still only a start", () => {
    const only: Draft = {
      trigger: { type: "manual" },
      start: "start_1",
      steps: [{ id: "start_1", type: "start" }],
    };
    const { draft: next, id } = appendStep(only, "start_1", "end");
    expect(next.steps.find((step) => step.id === "start_1")?.next).toBe(id);
    expect(next.steps).toHaveLength(2);
  });

  it("keeps the flow joined up when a step in the middle is taken out", () => {
    const removed = removeStep(draft(), "approval_1");
    expect(removed.steps.map((step) => step.id)).toEqual(["start_1", "end_1"]);
    // The approval pointed at the end through its answers, so the start now points there.
    expect(removed.steps.find((step) => step.id === "start_1")?.next).toBe("end_1");
  });

  it("moves the start when the start itself is removed", () => {
    const removed = removeStep(draft(), "start_1");
    expect(removed.start).toBe("approval_1");
  });

  it("drops a branch whose first step is removed and that leads nowhere else", () => {
    const parallel: Draft = {
      trigger: { type: "manual" },
      start: "parallel_1",
      steps: [
        { id: "parallel_1", type: "parallel", paths: ["end_1", "end_2"], next: null },
        { id: "end_1", type: "end" },
        { id: "end_2", type: "end" },
      ],
    };
    const removed = removeStep(parallel, "end_1");
    expect(removed.steps.find((step) => step.id === "parallel_1")?.paths).toEqual(["end_2"]);
  });

  it("changes one step and leaves the others alone", () => {
    const changed = withStep(draft(), "approval_1", { title: "Müdür onayı" });
    expect(changed.steps.find((step) => step.id === "approval_1")?.title).toBe("Müdür onayı");
    expect(changed.steps.find((step) => step.id === "end_1")).toEqual({ id: "end_1", type: "end" });
  });

  it("produces a definition the engine's own schema accepts", () => {
    const { draft: next } = insertAfter(draft(), "start_1", "next", "wait");
    expect(definitionSchema.safeParse(next).success).toBe(true);
  });
});
