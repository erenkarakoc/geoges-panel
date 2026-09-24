import { describe, expect, it } from "vitest";

import {
  parseDefinition,
  RUNNABLE_STEP_TYPES,
  STEP_TYPES,
  stepOf,
  testPasses,
  valueAt,
} from "@/modules/wfl/domain/definition";

const good = {
  trigger: { type: "event", event: "record.submitted" },
  start: "s1",
  steps: [
    {
      id: "s1",
      type: "condition",
      test: { field: "record.amount", op: ">", value: 1000 },
      whenTrue: "s2",
      whenFalse: "s3",
    },
    { id: "s2", type: "approval", title: "Müdür onayı", next: "s3" },
    { id: "s3", type: "end" },
  ],
};

describe("what a definition may say (REQ-WFL-005)", () => {
  it("takes a definition whose steps and paths exist", () => {
    expect(parseDefinition(good).steps).toHaveLength(3);
  });

  it("knows the fourteen steps and no more", () => {
    expect(STEP_TYPES).toHaveLength(14);
    expect(() => parseDefinition({ ...good, steps: [{ id: "s1", type: "run_script" }] })).toThrow();
  });

  it("says which of them the engine can take today", () => {
    expect(RUNNABLE_STEP_TYPES.every((type) => STEP_TYPES.includes(type))).toBe(true);
  });

  it("refuses a path to a step that does not exist", () => {
    const broken = { ...good, steps: [{ id: "s1", type: "end", next: "nowhere" }] };
    expect(() => parseDefinition(broken)).toThrow(/olmayan adıma/);
  });

  it("refuses a start that is not one of the steps, and a repeated step id", () => {
    expect(() => parseDefinition({ ...good, start: "sx" })).toThrow(/başlangıç adımı yok/);
    expect(() =>
      parseDefinition({
        ...good,
        steps: [
          { id: "s1", type: "end" },
          { id: "s1", type: "end" },
        ],
      }),
    ).toThrow(/iki kez/);
  });

  it("finds a step by id and treats a missing one as the end of the path", () => {
    const definition = parseDefinition(good);
    expect(stepOf(definition, "s2")?.type).toBe("approval");
    expect(stepOf(definition, null)).toBeNull();
    expect(stepOf(definition, "gone")).toBeNull();
  });
});

describe("what a condition decides (REQ-WFL-008)", () => {
  const context = { record: { amount: 1500, status: "submitted" }, tags: ["urgent"] };

  it("compares numbers, equality and membership", () => {
    expect(testPasses({ field: "record.amount", op: ">", value: 1000 }, context)).toBe(true);
    expect(testPasses({ field: "record.amount", op: "<=", value: 1000 }, context)).toBe(false);
    expect(testPasses({ field: "record.status", op: "=", value: "submitted" }, context)).toBe(true);
    expect(
      testPasses({ field: "record.status", op: "in", value: ["draft", "submitted"] }, context),
    ).toBe(true);
  });

  it("answers false for a field the flow does not carry, rather than failing", () => {
    expect(testPasses({ field: "record.total", op: ">", value: 0 }, context)).toBe(false);
    expect(testPasses({ field: "record.total", op: "exists" }, context)).toBe(false);
    expect(testPasses({ field: "record.amount", op: "exists" }, context)).toBe(true);
  });

  it("reads a path, and stops rather than throwing where the path ends", () => {
    expect(valueAt(context, "record.amount")).toBe(1500);
    expect(valueAt(context, "record.amount.nope")).toBeUndefined();
    expect(valueAt(null, "a.b")).toBeUndefined();
  });
});
