/**
 * Module dependency graph, read from docs/architecture/MODULE_MAP.md (ADR-001, TASK-0099).
 *
 * MODULE_MAP is the single source of truth for which module may depend on which. The
 * ESLint boundary rule is generated from it, so the document and the lint rule cannot drift
 * apart: a new dependency needs a new arrow in the map first. Validated by SPIKE-17.
 *
 * Reading of the map (its own wording, "Bağımlılık grafiği"):
 * - a solid arrow `A --> B` means A depends on / reads B, directly (not transitively);
 * - a dashed arrow `A -. "…" .-> B` is an event flow, not a code dependency;
 * - every business module may use the six platform modules, which the graph draws as one
 *   PLATFORM box; platform modules never depend on business modules.
 *
 * If the map's format drifts so that nothing can be read, this throws instead of silently
 * producing a looser rule.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
export const MODULE_MAP_PATH = resolve(ROOT, "docs/architecture/MODULE_MAP.md");

/** Parse the module table and the Mermaid graph of MODULE_MAP. */
export function parseModuleMap(text) {
  const modules = new Map();
  let group = null;
  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^\|\s*\*\*(.+?)\*\*\s*\|/);
    if (heading) {
      group = heading[1].trim();
      continue;
    }
    const row = line.match(/^\|\s*([A-Z]{2,4})\s*\|/);
    if (row && group) modules.set(row[1], group);
  }

  const platform = [...modules].filter(([, g]) => g === "Platform").map(([code]) => code);
  const solid = [];
  const dashed = [];
  for (const m of text.matchAll(/^\s*([A-Z]+)\s+-->\s+([A-Z]+)\s*$/gm)) solid.push([m[1], m[2]]);
  for (const m of text.matchAll(/^\s*([A-Z]+)\s+-\.(?:\s*"[^"]*"\s*\.)?->\s+([A-Z]+)/gm))
    dashed.push([m[1], m[2]]);

  if (modules.size === 0 || platform.length === 0 || solid.length === 0) {
    throw new Error(
      `MODULE_MAP could not be read (modules ${modules.size}, platform ${platform.length}, arrows ${solid.length}); fix the map rather than loosening the rule`,
    );
  }
  for (const [a, b] of solid) {
    for (const code of [a, b]) {
      if (code !== "PLATFORM" && !modules.has(code))
        throw new Error(`MODULE_MAP arrow uses unknown module ${code}`);
    }
  }
  return { modules, platform, solid, dashed };
}

/**
 * Allowed direct dependencies: solid arrows, plus every business module to every platform
 * module. Returns a Map of lower-case module directory name to a Set of target names.
 */
export function allowedDependencies(graph) {
  const allowed = new Map();
  const add = (from, to) => {
    if (from === to) return;
    if (!allowed.has(from)) allowed.set(from, new Set());
    allowed.get(from).add(to);
  };
  const platform = new Set(graph.platform);
  for (const [code, group] of graph.modules) {
    if (group === "Platform" || group === "Ertelenen") continue;
    for (const p of graph.platform) add(code.toLowerCase(), p.toLowerCase());
  }
  for (const [a, b] of graph.solid) {
    if (b === "PLATFORM") continue; // covered by the rule above
    if (platform.has(a) && !platform.has(b))
      throw new Error(`platform module ${a} may not depend on business module ${b}`);
    add(a.toLowerCase(), b.toLowerCase());
  }
  return allowed;
}

/** First cycle found among the solid arrows, or null. */
export function findCycle(allowed) {
  const state = new Map();
  const stack = [];
  const visit = (node) => {
    state.set(node, 1);
    stack.push(node);
    for (const next of allowed.get(node) ?? []) {
      if (state.get(next) === 1) return [...stack.slice(stack.indexOf(next)), next];
      if (!state.has(next)) {
        const cycle = visit(next);
        if (cycle) return cycle;
      }
    }
    state.set(node, 2);
    stack.pop();
    return null;
  };
  for (const node of allowed.keys()) {
    if (!state.has(node)) {
      const cycle = visit(node);
      if (cycle) return cycle;
    }
  }
  return null;
}

/**
 * eslint-plugin-boundaries `dependencies` policies for module elements: a module may use its
 * own files freely, and another module only through its `index.ts`, along an allowed arrow.
 * (The plugin's `entry-point` rule is deprecated in 7.x; `fileInternalPath` replaces it.)
 */
export function modulePolicies(allowed) {
  const policies = [
    {
      from: { element: { type: "module" } },
      allow: {
        to: {
          element: {
            type: "module",
            captured: { moduleName: "{{from.element.captured.moduleName}}" },
          },
        },
      },
    },
  ];
  for (const [from, targets] of [...allowed].sort(([a], [b]) => a.localeCompare(b))) {
    policies.push({
      from: { element: { type: "module", captured: { moduleName: from } } },
      allow: {
        to: [...targets].sort().map((to) => ({
          element: { type: "module", captured: { moduleName: to }, fileInternalPath: "index.ts" },
        })),
      },
    });
  }
  return policies;
}

/** Read MODULE_MAP from disk and return the graph, allowed dependencies and policies; throws on a cycle. */
export function loadModuleGraph(path = MODULE_MAP_PATH) {
  const graph = parseModuleMap(readFileSync(path, "utf8"));
  const allowed = allowedDependencies(graph);
  const cycle = findCycle(allowed);
  if (cycle)
    throw new Error(
      `MODULE_MAP dependency cycle: ${cycle.join(" -> ")} (MODULE_BOUNDARIES rule 4)`,
    );
  return { graph, allowed, policies: modulePolicies(allowed) };
}
