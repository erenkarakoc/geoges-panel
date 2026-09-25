import { describe, expect, it } from "vitest";

import { parseDefinition } from "@/modules/wfl/domain/definition";
import { asDraft, graphOf, pathsOf, stepLabel } from "@/modules/wfl/domain/graph";

const definition = parseDefinition({
  trigger: { type: "manual" },
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
      outcomes: { approve: "s3", reject: "s4", return: "s1" },
    },
    { id: "s3", type: "end" },
    { id: "s4", type: "end" },
  ],
});

describe("a definition drawn as boxes and arrows (SCR-196)", () => {
  it("places every step and names each path", () => {
    const { nodes, edges } = graphOf(definition);
    expect(nodes.map((node) => node.id).sort()).toEqual(["s1", "s2", "s3", "s4"]);
    expect(edges.filter((edge) => edge.from === "s1").map((edge) => edge.label)).toEqual([
      "evet",
      "hayır",
    ]);
    expect(edges.filter((edge) => edge.from === "s2").map((edge) => edge.label)).toEqual([
      "onay",
      "ret",
      "geri",
    ]);
  });

  it("puts a step below the one that sends it", () => {
    const { nodes } = graphOf(definition);
    const row = (id: string) => nodes.find((node) => node.id === id)?.row;
    expect(row("s1")).toBe(0);
    expect(row("s2")).toBe(1);
  });

  it("draws a step nothing points at, rather than hiding it", () => {
    const orphaned = parseDefinition({
      trigger: { type: "manual" },
      start: "a1",
      steps: [
        { id: "a1", type: "end" },
        {
          id: "a2",
          type: "notify",
          owner: { type: "user", userId: "0192f0c1-0148-7000-8000-000000000001" },
          subject: "Kimse bağlamadı",
        },
      ],
    });
    expect(graphOf(orphaned).nodes.map((node) => node.id)).toEqual(["a1", "a2"]);
  });

  it("draws a draft the schema would refuse, so an unanswered step stays visible", () => {
    const halfAnswered = asDraft({
      start: "s1",
      steps: [
        { id: "s1", type: "start", next: "s2" },
        // No owner yet: the schema refuses this definition and the canvas draws it anyway.
        { id: "s2", type: "approval", outcomes: {} },
      ],
    });
    expect(halfAnswered).not.toBeNull();
    const { nodes, edges } = graphOf(halfAnswered!);
    expect(nodes.map((node) => node.id)).toEqual(["s1", "s2"]);
    expect(edges).toHaveLength(1);
  });

  it("gives up on something that is not a draft at all", () => {
    expect(asDraft(null)).toBeNull();
    expect(asDraft({ steps: "hayır" })).toBeNull();
  });

  it("labels a box with its own words, or with what kind of step it is", () => {
    expect(stepLabel(definition.steps[1])).toBe("Müdür onayı");
    expect(stepLabel(definition.steps[2])).toBe("Bitiş");
  });

  it("knows where a parallel step's branches go", () => {
    const parallel = parseDefinition({
      trigger: { type: "manual" },
      start: "p1",
      steps: [
        { id: "p1", type: "parallel", paths: ["b1", "b2"], next: "j1" },
        { id: "b1", type: "end" },
        { id: "b2", type: "end" },
        { id: "j1", type: "end" },
      ],
    });
    expect(pathsOf(parallel.steps[0])).toEqual([
      { to: "b1", label: "dal 1", outlet: "path:0" },
      { to: "b2", label: "dal 2", outlet: "path:1" },
      { to: "j1", label: "birleşme", outlet: "next" },
    ]);
  });
});
