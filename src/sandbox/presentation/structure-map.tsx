"use client";

import { type Edge, type Node, ReactFlow } from "@xyflow/react";
import { useMemo } from "react";

import "@xyflow/react/dist/base.css";

import { bands, connectionCounts, neighboursOf, nodeHeight, nodePositions } from "./map-layout";
import { ModuleNode, type ModuleNodeData } from "./module-node";
import { businessFlows, dependencies, modules } from "./presentation-data";
import styles from "./presentation.module.css";

type BandNodeData = { name: string; note: string; group: string; width: number; height: number };

function BandNode({ data }: { data: Record<string, unknown> }) {
  const band = data as unknown as BandNodeData;

  return (
    <div
      className={styles.band}
      data-group={band.group}
      style={{ width: band.width, height: band.height }}
    >
      <span className={styles.bandLabel}>
        <span className={styles.bandName}>{band.name}</span>
        <span className={styles.bandNote}>{band.note}</span>
      </span>
    </div>
  );
}

const nodeTypes = { module: ModuleNode, band: BandNode };

type StructureMapProps = {
  selected: string | null;
  activeFlow: string | null;
  onSelect: (code: string | null) => void;
};

/**
 * The application as a cross-section. Everything is drawn at once, but only what the visitor asked
 * about is lit: with nothing selected the links stay faint, so the layering reads before any
 * single connection does.
 */
export function StructureMap({ selected, activeFlow, onSelect }: StructureMapProps) {
  const flowModules = useMemo(() => {
    const flow = businessFlows.find((candidate) => candidate.id === activeFlow);

    return flow ? new Set(flow.modules) : null;
  }, [activeFlow]);

  const nodes = useMemo<Node[]>(() => {
    const linked = selected ? new Set(neighboursOf.get(selected) ?? []) : null;

    const bandNodes: Node[] = bands.map((band) => ({
      id: `band-${band.group}`,
      type: "band",
      position: { x: band.x, y: band.y },
      draggable: false,
      selectable: false,
      zIndex: 0,
      data: {
        name: band.name,
        note: band.note,
        group: band.group,
        width: band.width,
        height: band.height,
      },
    }));

    const moduleNodes: Node[] = modules.map((module) => {
      const position = nodePositions.get(module.code) ?? { x: 0, y: 0 };

      let state: ModuleNodeData["state"] = "idle";

      if (flowModules) {
        state = flowModules.has(module.code) ? "selected" : "muted";
      }

      if (selected) {
        state =
          module.code === selected ? "selected" : linked?.has(module.code) ? "linked" : "muted";
      }

      return {
        id: module.code,
        type: "module",
        position,
        draggable: false,
        zIndex: 2,
        data: {
          code: module.code,
          name: module.name,
          group: module.group,
          connections: connectionCounts.get(module.code) ?? 0,
          deferred: Boolean(module.deferred),
          state,
        } satisfies ModuleNodeData,
      };
    });

    return [...bandNodes, ...moduleNodes];
  }, [selected, flowModules]);

  const edges = useMemo<Edge[]>(
    () =>
      dependencies.map(([from, to]) => {
        const fromPosition = nodePositions.get(from);
        const toPosition = nodePositions.get(to);
        // A link leaves through the edge of the plate that faces its partner, so the routing
        // always reads as movement between layers rather than a line crossing the section.
        const sourceAbove = (fromPosition?.y ?? 0) < (toPosition?.y ?? 0);

        const touchesSelected = selected === from || selected === to;
        const onFlow = flowModules ? flowModules.has(from) && flowModules.has(to) : false;

        let tone = "idle";

        if (flowModules) {
          tone = onFlow ? "lit" : "dim";
        }

        if (selected) {
          tone = touchesSelected ? "lit" : "dim";
        }

        return {
          id: `${from}-${to}`,
          source: from,
          target: to,
          sourceHandle: sourceAbove ? "bottom" : "top",
          targetHandle: sourceAbove ? "topIn" : "bottomIn",
          type: "smoothstep",
          pathOptions: { borderRadius: 14 },
          zIndex: 1,
          className: `${styles.link} ${styles[`link_${tone}`]}`,
        };
      }),
    [selected, flowModules],
  );

  return (
    <div className={styles.section}>
      <ReactFlow
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.06 }}
        maxZoom={1.6}
        minZoom={0.25}
        nodeExtent={[
          [-200, -200],
          [bands[0].width + 200, bands.length * (nodeHeight + 96) + 400],
        ]}
        nodes={nodes}
        nodeTypes={nodeTypes}
        nodesConnectable={false}
        onNodeClick={(_event, node) =>
          node.type === "module" ? onSelect(node.id === selected ? null : node.id) : undefined
        }
        onPaneClick={() => onSelect(null)}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
