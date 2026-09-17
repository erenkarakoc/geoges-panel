import { dependencies, type GroupId, moduleGroups, modules } from "./presentation-data";

/**
 * Cross-section layout: one horizontal band per group, stacked so the stack itself carries the
 * architecture — platform at the bottom because everything rests on it, analysis at the top
 * because it summarises what happens below. Links then read as depth, not as decoration.
 */
export const bandOrder: readonly GroupId[] = [
  "analysis",
  "corporate",
  "commercial",
  "operations",
  "platform",
];

export const nodeWidth = 158;
export const nodeHeight = 62;

const gapX = 22;
const bandHeight = 158;
const labelColumn = 186;
const contentPadding = 40;

const widestBand = Math.max(
  ...bandOrder.map((group) => modules.filter((module) => module.group === group).length),
);

export const bandWidth =
  labelColumn + contentPadding * 2 + widestBand * nodeWidth + (widestBand - 1) * gapX;

export type Band = {
  group: GroupId;
  name: string;
  note: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export const bands: readonly Band[] = bandOrder.map((group, index) => {
  const meta = moduleGroups.find((candidate) => candidate.id === group);

  return {
    group,
    name: meta?.name ?? group,
    note: meta?.note ?? "",
    x: 0,
    y: index * bandHeight,
    width: bandWidth,
    height: bandHeight,
  };
});

export type NodePosition = { x: number; y: number };

export const nodePositions: ReadonlyMap<string, NodePosition> = (() => {
  const positions = new Map<string, NodePosition>();

  bandOrder.forEach((group, bandIndex) => {
    const members = modules.filter((module) => module.group === group);
    const rowWidth = members.length * nodeWidth + (members.length - 1) * gapX;
    const available = bandWidth - labelColumn - contentPadding * 2;
    const startX = labelColumn + contentPadding + (available - rowWidth) / 2;

    members.forEach((module, index) => {
      positions.set(module.code, {
        x: Math.round(startX + index * (nodeWidth + gapX)),
        y: Math.round(bandIndex * bandHeight + (bandHeight - nodeHeight) / 2),
      });
    });
  });

  return positions;
})();

/** How many other modules a module is wired to — shown on the node, no legend needed. */
export const connectionCounts: ReadonlyMap<string, number> = (() => {
  const counts = new Map<string, number>();

  for (const [from, to] of dependencies) {
    counts.set(from, (counts.get(from) ?? 0) + 1);
    counts.set(to, (counts.get(to) ?? 0) + 1);
  }

  return counts;
})();

export const neighboursOf: ReadonlyMap<string, readonly string[]> = (() => {
  const neighbours = new Map<string, string[]>();

  for (const [from, to] of dependencies) {
    neighbours.set(from, [...(neighbours.get(from) ?? []), to]);
    neighbours.set(to, [...(neighbours.get(to) ?? []), from]);
  }

  return neighbours;
})();
