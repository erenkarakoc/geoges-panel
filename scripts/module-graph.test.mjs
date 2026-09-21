import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  MODULE_MAP_PATH,
  allowedDependencies,
  findCycle,
  loadModuleGraph,
  parseModuleMap,
} from "./module-graph.mjs";

const map = readFileSync(MODULE_MAP_PATH, "utf8");

describe("module graph read from MODULE_MAP (TASK-0099)", () => {
  it("reads every module, the platform group and the arrows", () => {
    const graph = parseModuleMap(map);
    expect(graph.modules.size).toBeGreaterThanOrEqual(24);
    expect(graph.platform).toEqual(["IAM", "AUD", "DOC", "WFL", "TSK", "ADM"]);
    expect(graph.solid.length).toBeGreaterThanOrEqual(30);
  });

  it("treats dashed arrows as events, not code dependencies", () => {
    const { graph, allowed } = loadModuleGraph();
    expect(graph.dashed.map((e) => e.join("->"))).toContain("QTE->PRJ");
    expect(allowed.get("qte")?.has("prj")).toBe(false);
  });

  it("lets every business module use every platform module, never the reverse", () => {
    const { allowed } = loadModuleGraph();
    for (const p of ["iam", "aud", "doc", "wfl", "tsk", "adm"])
      expect(allowed.get("sit")?.has(p)).toBe(true);
    expect(allowed.has("iam")).toBe(false);
  });

  it("keeps arrows direct, not transitive", () => {
    const { allowed } = loadModuleGraph();
    expect(allowed.get("fin")?.has("sit")).toBe(true);
    expect(allowed.get("sit")?.has("prj")).toBe(true);
    expect(allowed.get("fin")?.has("prj")).toBe(false);
  });

  it("finds no cycle in the real map", () => {
    expect(findCycle(loadModuleGraph().allowed)).toBeNull();
  });

  it("detects a cycle when one is drawn", () => {
    const cyclic = `${map}\n  PRJ --> FIN\n`;
    const allowed = allowedDependencies(parseModuleMap(cyclic));
    expect(findCycle(allowed)).not.toBeNull();
  });

  it("refuses a platform module depending on a business module", () => {
    expect(() => allowedDependencies(parseModuleMap(`${map}\n  IAM --> SIT\n`))).toThrow(
      /platform module IAM/,
    );
  });

  it("fails loudly instead of loosening the rule when the map cannot be read", () => {
    expect(() => parseModuleMap("# empty")).toThrow(/could not be read/);
  });
});
