import { describe, expect, it } from "vitest";

import {
  durationMs,
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
    {
      id: "s2",
      type: "approval",
      title: "Müdür onayı",
      owner: { type: "role", role: "GM" },
      outcomes: { approve: "s3", reject: "s3", return: "s1" },
    },
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

describe("the approval step's three answers (D-099)", () => {
  const withApproval = (outcomes: Record<string, string>) => ({
    trigger: { type: "manual" },
    start: "a1",
    steps: [
      {
        id: "a1",
        type: "approval",
        owner: { type: "user", userId: "0192f0c1-0148-7000-8000-000000000001" },
        outcomes,
      },
      { id: "a2", type: "end" },
    ],
  });

  it("takes a step that names where each answer goes", () => {
    expect(
      parseDefinition(withApproval({ approve: "a2", reject: "a2", return: "a1" })),
    ).toBeTruthy();
  });

  it("refuses an answer that goes nowhere real", () => {
    expect(() => parseDefinition(withApproval({ approve: "a9" }))).toThrow(/olmayan adıma/);
  });

  it("refuses an approval with nobody to own it, because a step nobody owns waits for ever", () => {
    expect(() =>
      parseDefinition({
        trigger: { type: "manual" },
        start: "a1",
        steps: [{ id: "a1", type: "approval" }],
      }),
    ).toThrow();
  });
});

describe("waiting and telling (REQ-WFL-005)", () => {
  const withStep = (step: unknown) => ({
    trigger: { type: "manual" },
    start: "x1",
    steps: [step, { id: "x2", type: "end" }],
  });

  it("takes the durations the architecture writes, and refuses the rest", () => {
    for (const after of ["PT30M", "PT8H", "P2D", "P1DT12H"]) {
      expect(parseDefinition(withStep({ id: "x1", type: "wait", after, next: "x2" }))).toBeTruthy();
    }
    expect(() =>
      parseDefinition(withStep({ id: "x1", type: "wait", after: "8 saat", next: "x2" })),
    ).toThrow(/süre/);
  });

  it("turns a duration into the milliseconds the scheduler wants", () => {
    expect(durationMs("PT30M")).toBe(30 * 60_000);
    expect(durationMs("PT8H")).toBe(8 * 60 * 60_000);
    expect(durationMs("P2D")).toBe(2 * 24 * 60 * 60_000);
    expect(durationMs("P1DT12H")).toBe(36 * 60 * 60_000);
  });

  it("asks a notify step who it is for and what it says", () => {
    expect(
      parseDefinition(
        withStep({
          id: "x1",
          type: "notify",
          owner: { type: "role", role: "GM" },
          subject: "Kayıt incelemeye alındı",
          next: "x2",
        }),
      ),
    ).toBeTruthy();
    expect(() => parseDefinition(withStep({ id: "x1", type: "notify", next: "x2" }))).toThrow();
  });
});
