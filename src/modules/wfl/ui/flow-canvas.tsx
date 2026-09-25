"use client";

import {
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { AlertTriangleIcon, MaximizeIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, type KeyboardEvent } from "react";

import "@xyflow/react/dist/base.css";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { flowCanvasId } from "@/modules/wfl/ui/flow-canvas-id";
import { stepTypeLabel } from "@/modules/wfl/domain/graph";
import type { FlowEdge, FlowNode } from "@/modules/wfl/domain/graph";

/**
 * The flow's boxes and arrows (SCR-196, TASK-0119, D-224).
 *
 * The one custom interface element in the panel, and the owner approved it because COSS has no
 * box-and-arrow field. Only the library's engine is used — viewport, pan, zoom, edge routing — and
 * every box is our own component in the panel's own colours, exactly as the presentation map does
 * it (D-053).
 *
 * The canvas is **one** tab stop (SPIKE-07): the boxes are not focusable one by one, arrow keys
 * move between them, Enter opens the selected step's questions and Escape brings the focus back
 * here. The mini-map is a desktop affordance and is simply not rendered on a phone.
 */

const NODE_WIDTH = 224;
const COLUMN_GAP = 40;
const ROW_HEIGHT = 128;

type StepNodeData = {
  kind: FlowNode["type"];
  title: string;
  problems: number;
  chosen: boolean;
};

/** One step as a plate: what kind it is, what it is called, and whether something is missing. */
function StepNode({ data }: NodeProps) {
  const step = data as unknown as StepNodeData;

  return (
    <div
      className={cn(
        "flex w-56 flex-col gap-0.5 rounded-lg border bg-card px-3 py-2 text-start shadow-xs transition-colors",
        step.chosen && "border-primary ring-2 ring-primary/32",
        step.problems > 0 && !step.chosen && "border-warning",
      )}
    >
      {/* Not connectable: the arrows come from the definition, so these are anchors only. */}
      <Handle className="opacity-0" id="in" position={Position.Top} type="target" />
      <Handle className="opacity-0" id="out" position={Position.Bottom} type="source" />

      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {stepTypeLabel(step.kind)}
        {step.problems > 0 ? (
          <AlertTriangleIcon aria-hidden="true" className="size-3.5 text-warning-foreground" />
        ) : null}
      </span>
      <span className="truncate text-sm font-medium">{step.title}</span>
    </div>
  );
}

const nodeTypes = { step: StepNode };

export type FlowCanvasProps = {
  nodes: readonly FlowNode[];
  edges: readonly FlowEdge[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  /** Enter on the selected box: the panel takes the focus. */
  onOpen?: () => void;
  /** Which steps the schema found something wrong with, so the box can say so. */
  problems: Map<string, string[]>;
  /** A phone gets no mini-map (SPIKE-07 note 2). */
  miniMap?: boolean;
};

export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}

function Canvas({ nodes, edges, selected, onSelect, onOpen, problems, miniMap }: FlowCanvasProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const drawn = useMemo<Node[]>(
    () =>
      nodes.map((node) => ({
        id: node.id,
        type: "step",
        position: {
          x: node.column * (NODE_WIDTH + COLUMN_GAP),
          y: node.row * ROW_HEIGHT,
        },
        draggable: false,
        data: {
          kind: node.type,
          title: node.title,
          problems: problems.get(node.id)?.length ?? 0,
          chosen: node.id === selected,
        } satisfies StepNodeData,
      })),
    [nodes, problems, selected],
  );

  const drawnEdges = useMemo<Edge[]>(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.from,
        target: edge.to,
        sourceHandle: "out",
        targetHandle: "in",
        type: "smoothstep",
        pathOptions: { borderRadius: 12 },
        label: edge.label,
        labelShowBg: true,
        labelBgStyle: { fill: "var(--card)" },
        labelStyle: { fill: "var(--muted-foreground)", fontSize: 11 },
        style: { stroke: "var(--border)", strokeWidth: 1.5 },
      })),
    [edges],
  );

  // Boxes in reading order, which is also the order the arrow keys walk.
  const ordered = useMemo(
    () => [...nodes].sort((a, b) => a.row - b.row || a.column - b.column),
    [nodes],
  );

  const move = useCallback(
    (key: string) => {
      const here = ordered.find((node) => node.id === selected) ?? null;
      if (!here) {
        onSelect(ordered[0]?.id ?? null);
        return;
      }
      const nearest = (candidates: readonly FlowNode[]) =>
        candidates.length === 0
          ? null
          : candidates.reduce((best, node) =>
              Math.abs(node.column - here.column) < Math.abs(best.column - here.column)
                ? node
                : best,
            );

      if (key === "ArrowDown" || key === "ArrowUp") {
        const below = key === "ArrowDown";
        const rows = ordered.filter((node) => (below ? node.row > here.row : node.row < here.row));
        if (rows.length === 0) return;
        const row = below
          ? Math.min(...rows.map((node) => node.row))
          : Math.max(...rows.map((node) => node.row));
        const next = nearest(rows.filter((node) => node.row === row));
        if (next) onSelect(next.id);
        return;
      }

      const forward = key === "ArrowRight";
      const sameRow = ordered.filter(
        (node) =>
          node.row === here.row &&
          (forward ? node.column > here.column : node.column < here.column),
      );
      if (sameRow.length > 0) {
        onSelect(forward ? sameRow[0].id : sameRow[sameRow.length - 1].id);
        return;
      }
      // Off the end of a row: carry on to the next box in reading order.
      const index = ordered.findIndex((node) => node.id === here.id);
      const next = ordered[forward ? index + 1 : index - 1];
      if (next) onSelect(next.id);
    },
    [onSelect, ordered, selected],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key.startsWith("Arrow")) {
      event.preventDefault();
      move(event.key);
      return;
    }
    if (event.key === "Enter" && selected) {
      event.preventDefault();
      onOpen?.();
    }
  };

  // A newly opened flow is framed once; moving between boxes afterwards keeps the viewport still,
  // because a canvas that jumps under the hand is harder to read than one that does not.
  useEffect(() => {
    fitView({ padding: 0.12, maxZoom: 1 });
  }, [fitView]);

  return (
    <div
      aria-label="Akış şeması: oklarla adımlar arasında gezinin, Enter adımın sorularını açar"
      className="relative h-[60svh] min-h-80 w-full flex-1 overflow-hidden rounded-lg border bg-muted/32 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background lg:h-[70svh]"
      id={flowCanvasId}
      onKeyDown={onKeyDown}
      role="application"
      tabIndex={0}
    >
      <ReactFlow
        disableKeyboardA11y
        edges={drawnEdges}
        edgesFocusable={false}
        fitView
        fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
        maxZoom={1.5}
        minZoom={0.3}
        nodes={drawn}
        nodesConnectable={false}
        nodesDraggable={false}
        nodesFocusable={false}
        nodeTypes={nodeTypes}
        onNodeClick={(_event, node) => onSelect(node.id)}
        onPaneClick={() => onSelect(null)}
        proOptions={{ hideAttribution: false }}
        style={{ width: "100%", height: "100%" }}
      >
        {miniMap ? (
          <MiniMap
            ariaLabel="Şemanın küçük haritası"
            maskColor="var(--muted)"
            nodeColor="var(--border)"
            pannable
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          />
        ) : null}
      </ReactFlow>

      <div className="absolute end-2 top-2 flex flex-col gap-1">
        <Button
          aria-label="Yakınlaştır"
          onClick={() => zoomIn()}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <PlusIcon />
        </Button>
        <Button
          aria-label="Uzaklaştır"
          onClick={() => zoomOut()}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <MinusIcon />
        </Button>
        <Button
          aria-label="Şemayı ekrana sığdır"
          onClick={() => fitView({ padding: 0.12, maxZoom: 1 })}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <MaximizeIcon />
        </Button>
      </div>
    </div>
  );
}
