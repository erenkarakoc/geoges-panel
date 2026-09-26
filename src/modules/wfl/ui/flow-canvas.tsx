"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  AlertTriangleIcon,
  BellIcon,
  CheckCheckIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FlagIcon,
  GitBranchIcon,
  GitForkIcon,
  GitMergeIcon,
  HourglassIcon,
  LockIcon,
  MaximizeIcon,
  MinusIcon,
  PlayIcon,
  PlusIcon,
  RepeatIcon,
  SirenIcon,
  WorkflowIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useMemo, type KeyboardEvent } from "react";

import "@xyflow/react/dist/base.css";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { flowCanvasId } from "@/modules/wfl/ui/flow-canvas-id";
import { stepTypeLabel } from "@/modules/wfl/domain/graph";
import type { FlowEdge, FlowNode, Outlet } from "@/modules/wfl/domain/graph";

/**
 * The flow's boxes and arrows (SCR-196, TASK-0119, D-224).
 *
 * The one custom interface element in the panel, and the owner approved it because COSS has no
 * box-and-arrow field. Only the library's engine is used — viewport, pan, zoom, edge routing — and
 * every box is our own component in the panel's own colours, as the structure presentation's map
 * did before it was removed (D-053).
 *
 * The canvas is **one** tab stop (SPIKE-07): the boxes are not focusable one by one, arrow keys
 * move between them, Enter opens the selected step's questions and Escape brings the focus back
 * here. The mini-map is a desktop affordance and is simply not rendered on a phone.
 */

const NODE_WIDTH = 224;
const COLUMN_GAP = 64;
const ROW_HEIGHT = 156;
const TRIGGER_ID = "__trigger";

/** Line and arrowhead colour: readable on both cards, quieter than the text. */
const LINE = "color-mix(in srgb, var(--muted-foreground) 70%, transparent)";

/** A kind of step at a glance, before its name is read. */
const STEP_ICONS: Record<string, LucideIcon> = {
  approval: CheckCheckIcon,
  condition: GitBranchIcon,
  end: FlagIcon,
  escalate: SirenIcon,
  for_each: RepeatIcon,
  join: GitMergeIcon,
  lock: LockIcon,
  notify: BellIcon,
  parallel: GitForkIcon,
  record: DatabaseIcon,
  start: PlayIcon,
  subflow: WorkflowIcon,
  task: ClipboardListIcon,
  wait: HourglassIcon,
};

/** Where an exit sits along a box's edge, in percent: spread evenly, never on a corner. */
const along = (exit: number, exits: number) => ((exit + 1) / (exits + 1)) * 100;

type StepNodeData = {
  kind: FlowNode["type"] | "trigger";
  title: string;
  problems: number;
  chosen: boolean;
  /** How many forward and how many back exits the box has; each gets its own anchor. */
  exits: number;
  backExits: number;
  /** The one "+" above a box that more than one path reaches: a step before it, on all of them. */
  onInsertBefore?: () => void;
};

/** One step as a plate: its kind with an icon, its name, and whether something is missing. */
function StepNode({ data }: NodeProps) {
  const step = data as unknown as StepNodeData;
  const Icon = step.kind === "trigger" ? ZapIcon : (STEP_ICONS[step.kind] ?? WorkflowIcon);
  const exits = Math.max(step.exits, 1);

  return (
    <div
      className={cn(
        "relative flex w-56 items-center gap-2.5 rounded-lg border bg-card px-3 py-2 text-start shadow-xs transition-colors",
        step.kind === "trigger" && "border-dashed",
        (step.kind === "end" || step.kind === "trigger") && "bg-muted",
        step.chosen && "border-primary ring-2 ring-primary/32",
        step.problems > 0 && !step.chosen && "border-warning",
      )}
    >
      {/* Not connectable: the arrows come from the definition, so these are anchors only. */}
      <Handle className="opacity-0" id="in" position={Position.Top} type="target" />
      <Handle className="opacity-0" id="back-in" position={Position.Right} type="target" />
      {Array.from({ length: exits }, (_, index) => (
        <Handle
          className="opacity-0"
          id={`out-${index}`}
          key={`out-${index}`}
          position={Position.Bottom}
          style={{ left: `${along(index, exits)}%` }}
          type="source"
        />
      ))}
      {Array.from({ length: step.backExits }, (_, index) => (
        <Handle
          className="opacity-0"
          id={`back-${index}`}
          key={`back-${index}`}
          position={Position.Right}
          style={{ top: `${along(index, step.backExits)}%` }}
          type="source"
        />
      ))}

      <span
        aria-hidden="true"
        className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
      >
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {step.kind === "trigger" ? "Akış başlar" : stepTypeLabel(step.kind)}
          {step.problems > 0 ? (
            <AlertTriangleIcon aria-hidden="true" className="size-3.5 text-warning-foreground" />
          ) : null}
        </span>
        <span className="truncate text-sm font-medium">{step.title}</span>
      </span>

      {step.onInsertBefore ? (
        <Button
          aria-label={`"${step.title}" adımından önce adım ekle`}
          className="nodrag absolute -top-[30px] left-1/2 -translate-x-1/2"
          onClick={(event) => {
            event.stopPropagation();
            step.onInsertBefore?.();
          }}
          size="icon-xs"
          type="button"
          variant="outline"
        >
          <PlusIcon />
        </Button>
      ) : null}
    </div>
  );
}

type StepEdgeData = {
  label?: string;
  back: boolean;
  /** Which exit of its box the arrow leaves by: its sideways run gets a lane of its own. */
  exit?: number;
  /** Opens the palette for this arrow; the new step goes between its two boxes. */
  onInsert?: () => void;
};

/**
 * One arrow, pointing the way the flow goes. Its name ("evet", "ret", "geri") sits where it leaves
 * its box, so names never meet each other or a "+"; the "+" sits halfway, and only on an arrow
 * that is the one way into its box — where several meet, the box carries a single "+" instead. A
 * way back is dashed and runs round the right of the boxes.
 */
function StepEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props;
  const data = (props.data ?? {}) as StepEdgeData;
  const [path, labelX, labelY] = getSmoothStepPath({
    borderRadius: 12,
    // Each exit turns at its own height, so two paths from one row never share a line.
    centerY: data.back ? undefined : sourceY + 34 + (data.exit ?? 0) * 10,
    offset: data.back ? 28 : 20,
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge
        id={props.id}
        markerEnd={props.markerEnd}
        path={path}
        style={{
          stroke: LINE,
          strokeDasharray: data.back ? "5 4" : undefined,
          strokeWidth: 1.5,
        }}
      />
      <EdgeLabelRenderer>
        {data.label ? (
          <span
            className="pointer-events-none absolute rounded-md border bg-card px-1.5 text-xs leading-5 text-muted-foreground"
            style={{
              transform: data.back
                ? `translate(8px, -50%) translate(${sourceX}px, ${sourceY}px)`
                : `translate(-50%, 6px) translate(${sourceX}px, ${sourceY}px)`,
            }}
          >
            {data.label}
          </span>
        ) : null}
        {data.onInsert ? (
          <div
            className="pointer-events-auto absolute"
            // Just above the box the new step would go before; on a way back, halfway along it.
            style={{
              transform: data.back
                ? `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`
                : `translate(-50%, -50%) translate(${targetX}px, ${targetY - 20}px)`,
            }}
          >
            <Button
              aria-label={
                data.label ? `"${data.label}" yoluna adım ekle` : "Bu okun üstüne adım ekle"
              }
              onClick={data.onInsert}
              size="icon-xs"
              type="button"
              variant="outline"
            >
              <PlusIcon />
            </Button>
          </div>
        ) : null}
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes = { step: StepNode };
const edgeTypes = { step: StepEdge };

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
  /** A "+": a new step goes on these arrows, before the box they lead to. */
  onInsert?: (arrows: { from: string; outlet: Outlet }[]) => void;
  /** What starts the flow, for the box above the first step ("Satın alma talebi açıldı"). */
  startText?: string;
  /** The id of the first step, which the start box points at. */
  start?: string | null;
};

export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}

function Canvas({
  nodes,
  edges,
  selected,
  onSelect,
  onOpen,
  onInsert,
  problems,
  miniMap,
  startText,
  start,
}: FlowCanvasProps) {
  const { fitView, setViewport, zoomIn, zoomOut } = useReactFlow();

  // Arrows into each box from above; where several meet, the box carries the one "+".
  const incoming = useMemo(() => {
    const into = new Map<string, FlowEdge[]>();
    for (const edge of edges) {
      if (edge.back) continue;
      into.set(edge.to, [...(into.get(edge.to) ?? []), edge]);
    }
    return into;
  }, [edges]);

  const first = nodes.find((node) => node.id === start) ?? null;

  const drawn = useMemo<Node[]>(() => {
    const exits = (id: string, back: boolean) =>
      edges.filter((edge) => edge.from === id && edge.back === back).length;
    const steps: Node[] = nodes.map((node) => {
      const into = incoming.get(node.id) ?? [];
      return {
        id: node.id,
        type: "step",
        position: {
          x: node.column * (NODE_WIDTH + COLUMN_GAP),
          y: (node.row + (first ? 1 : 0)) * ROW_HEIGHT,
        },
        draggable: false,
        data: {
          backExits: exits(node.id, true),
          chosen: node.id === selected,
          exits: exits(node.id, false),
          kind: node.type,
          onInsertBefore:
            onInsert && into.length > 1
              ? () => onInsert(into.map((edge) => ({ from: edge.from, outlet: edge.outlet })))
              : undefined,
          problems: problems.get(node.id)?.length ?? 0,
          title: node.title,
        } satisfies StepNodeData,
      };
    });
    if (!first) return steps;
    return [
      {
        id: TRIGGER_ID,
        type: "step",
        position: { x: first.column * (NODE_WIDTH + COLUMN_GAP), y: 0 },
        draggable: false,
        data: {
          backExits: 0,
          chosen: selected === null,
          exits: 1,
          kind: "trigger",
          problems: 0,
          title: startText ?? "Başlangıç",
        } satisfies StepNodeData,
      },
      ...steps,
    ];
  }, [edges, first, incoming, nodes, onInsert, problems, selected, startText]);

  const drawnEdges = useMemo<Edge[]>(() => {
    const marker = { color: LINE, height: 14, type: MarkerType.ArrowClosed, width: 14 };
    const arrows: Edge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      sourceHandle: edge.back ? `back-${edge.exit}` : `out-${edge.exit}`,
      targetHandle: edge.back ? "back-in" : "in",
      type: "step",
      markerEnd: marker,
      data: {
        back: edge.back,
        exit: edge.exit,
        label: edge.label,
        onInsert:
          onInsert && (edge.back || (incoming.get(edge.to)?.length ?? 0) <= 1)
            ? () => onInsert([{ from: edge.from, outlet: edge.outlet }])
            : undefined,
      } satisfies StepEdgeData,
    }));
    if (!first) return arrows;
    return [
      {
        id: `${TRIGGER_ID}->${first.id}`,
        source: TRIGGER_ID,
        target: first.id,
        sourceHandle: "out-0",
        targetHandle: "in",
        type: "step",
        markerEnd: marker,
        data: { back: false } satisfies StepEdgeData,
      },
      ...arrows,
    ];
  }, [edges, first, incoming, onInsert]);

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
  //
  // A phone frames the top of the flow at a size that can be read — the start and the next few
  // steps — and the rest is a swipe away; a whole flow squeezed onto a phone is too small to read.
  const firstBox = drawn[0];
  const frame = useCallback(() => {
    if (miniMap || !firstBox) {
      fitView({ maxZoom: 1, padding: 0.12 });
      return;
    }
    const zoom = 0.8;
    setViewport({ x: 16 - firstBox.position.x * zoom, y: 16, zoom });
  }, [firstBox, fitView, miniMap, setViewport]);

  return (
    <div
      aria-label="Akış şeması: oklarla adımlar arasında gezinin, Enter adımın sorularını açar"
      className="relative h-[60svh] min-h-80 w-full overflow-hidden rounded-lg border bg-muted/32 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background lg:h-[70svh] lg:flex-1"
      id={flowCanvasId}
      onKeyDown={onKeyDown}
      role="application"
      tabIndex={0}
    >
      <ReactFlow
        disableKeyboardA11y
        edges={drawnEdges}
        edgesFocusable={false}
        edgeTypes={edgeTypes}
        fitView={miniMap}
        fitViewOptions={{ maxZoom: 1, padding: 0.12 }}
        onInit={miniMap ? undefined : frame}
        maxZoom={1.5}
        minZoom={0.3}
        nodes={drawn}
        nodesConnectable={false}
        nodesDraggable={false}
        nodesFocusable={false}
        nodeTypes={nodeTypes}
        // The start box is the flow itself: clicking it shows what starts the flow.
        onNodeClick={(_event, node) => onSelect(node.id === TRIGGER_ID ? null : node.id)}
        onPaneClick={() => onSelect(null)}
        // The library's own badge is off at the owner's request. Its MIT licence asks for the
        // copyright notice to travel with the source, which it does in `node_modules`, and does not
        // require a mark on the screen (the badge is how xyflow asks for support, not a condition).
        proOptions={{ hideAttribution: true }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Only a flow too big to see at once needs a map of itself. */}
        {miniMap && nodes.length > 10 ? (
          <MiniMap
            ariaLabel="Şemanın küçük haritası"
            maskColor="color-mix(in srgb, var(--muted-foreground) 12%, transparent)"
            nodeColor="color-mix(in srgb, var(--muted-foreground) 45%, transparent)"
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
          onClick={frame}
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
