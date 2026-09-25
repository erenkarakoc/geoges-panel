import { describe, expect, it } from "vitest";

import { complaintsOf } from "@/modules/wfl/domain/complaints";
import { stepNames } from "@/modules/wfl/domain/graph";

/** Everything a person reads has to be a Turkish sentence: no ids, no paths, no English. */
const technical = /[a-z]+_[a-z0-9]+|steps\.|Invalid|expected|received|required|undefined/;

describe("what is missing from a flow, said the way a person would say it", () => {
  it("says nothing at all about a flow that is whole", () => {
    const whole = {
      trigger: { type: "manual" },
      start: "start_1",
      steps: [
        { id: "start_1", type: "start", next: "end_1" },
        { id: "end_1", type: "end" },
      ],
    };
    expect(complaintsOf(whole)).toEqual({ steps: new Map(), flow: [] });
  });

  it("asks for the owner of an approval in the approval's own terms", () => {
    const missing = {
      trigger: { type: "manual" },
      start: "start_1",
      steps: [
        { id: "start_1", type: "start", next: "approval_1" },
        { id: "approval_1", type: "approval", outcomes: {} },
      ],
    };
    const said = complaintsOf(missing).steps.get("approval_1") ?? [];
    expect(said).toContain("Bu adımın kime düşeceği seçilmedi.");
    for (const sentence of said) expect(sentence).not.toMatch(technical);
  });

  it("says what a condition has not been told, field by field", () => {
    const halfAnswered = {
      trigger: { type: "manual" },
      start: "condition_1",
      steps: [
        { id: "condition_1", type: "condition", test: { op: "=" }, whenTrue: "end_1" },
        { id: "end_1", type: "end" },
      ],
    };
    const said = complaintsOf(halfAnswered).steps.get("condition_1") ?? [];
    expect(said).toContain("Hangi alana bakılacağı seçilmedi.");
  });

  it("puts the flow's own gaps with the flow, not with a step", () => {
    const noTrigger = {
      start: "end_1",
      steps: [{ id: "end_1", type: "end" }],
    };
    const said = complaintsOf(noTrigger);
    expect(said.flow).toContain("Akışın ne olunca başlayacağı belirlenmedi.");
    expect(said.steps.size).toBe(0);
  });

  it("turns the schema's extra checks into sentences that name the step, not its id", () => {
    const needsType = {
      trigger: { type: "manual" },
      start: "record_1",
      steps: [{ id: "record_1", type: "record", action: "create", title: "Tutanak aç" }],
    };
    const said = complaintsOf(needsType);
    const sentences = [...said.steps.values()].flat().concat(said.flow);
    expect(sentences.join(" ")).toContain("Tutanak aç");
    for (const sentence of sentences) expect(sentence).not.toMatch(technical);
  });

  it("never shows an English message, whatever the draft looks like", () => {
    const nonsense = {
      trigger: { type: "clock", dailyAt: "9", everyMinutes: 2 },
      start: "wait_1",
      steps: [
        { id: "wait_1", type: "wait", after: "8 saat", next: "notify_1" },
        { id: "notify_1", type: "notify", owner: { type: "role" }, subject: "" },
        { id: "lock_1", type: "lock" },
        { id: "parallel_1", type: "parallel", paths: ["wait_1"] },
      ],
    };
    const said = complaintsOf(nonsense);
    const sentences = [...said.steps.values()].flat().concat(said.flow);
    expect(sentences.length).toBeGreaterThan(3);
    for (const sentence of sentences) expect(sentence).not.toMatch(technical);
  });
});

describe("what a step is called on the screen", () => {
  it("uses the step's own name, or what kind of step it is", () => {
    const names = stepNames([
      { id: "approval_1", type: "approval", title: "Müdür onayı" },
      { id: "approval_2", type: "approval" },
      { id: "approval_3", type: "approval" },
    ]);
    expect(names.get("approval_1")).toBe("Müdür onayı");
    expect(names.get("approval_2")).toBe("Onay");
    // Two steps of the same kind are told apart without anybody having to read an id.
    expect(names.get("approval_3")).toBe("Onay 2");
  });
});
