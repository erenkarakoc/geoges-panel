"use client";

import {
  Background,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";

import "@xyflow/react/dist/base.css";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";

import { buildSpikeFlow, type SpikeStep, stepLabels } from "./flow-data";
import { StepNode } from "./step-node";

const nodeTypes = { step: StepNode };

/**
 * SPIKE-07 — is the box-and-arrow canvas buildable with what the project already
 * has, and does a 40-step flow stay usable on a desktop and a phone?
 * Throwaway: this folder is deleted when the spike report is written.
 */
export function SpikeFlowPage() {
  const { steps, edges: rawEdges } = useMemo(() => buildSpikeFlow(40), []);

  const initialNodes: Node[] = useMemo(
    () =>
      steps.map((step, index) => ({
        id: step.id,
        type: "step",
        position: { x: (index % 4) * 280, y: Math.floor(index / 4) * 160 },
        data: step as unknown as Record<string, unknown>,
      })),
    [steps],
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      rawEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: edge.id === "e-return",
      })),
    [rawEdges],
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [selected, setSelected] = useState<SpikeStep | null>(null);
  const [renderMs, setRenderMs] = useState<number | null>(null);

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    setSelected(node.data as unknown as SpikeStep);
  }, []);

  const onInit = useCallback(() => {
    // rough first-paint measure for the spike report
    setRenderMs(Math.round(performance.now()));
  }, []);

  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-2">
        <div>
          <h1 className="text-sm font-medium">SPIKE-07 · Akış şeması denemesi</h1>
          <p className="text-xs text-muted-foreground">
            40 adım · {edges.length} bağlantı · ilk çizim {renderMs ?? "—"} ms
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            Deneme çalıştır
          </Button>
          <Button size="sm">Yayımla</Button>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onInit={onInit}
          nodesFocusable
          edgesFocusable
          fitView
          proOptions={{ hideAttribution: false }}
        >
          <Background />
          <Controls />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetPopup side="right" className="sm:max-w-[380px]">
          <SheetHeader>
            <SheetTitle>{selected ? stepLabels[selected.type] : ""}</SheetTitle>
            <SheetDescription>{selected?.title}</SheetDescription>
          </SheetHeader>
          <SheetPanel>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Adım sahibi</dt>
                <dd>{selected?.owner}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Adım kimliği</dt>
                <dd className="font-mono text-xs">{selected?.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Sorular</dt>
                <dd className="text-muted-foreground">
                  Gerçek tasarımcıda bu panelde adımın soruları olacak: ne olunca başlasın, kim
                  onaylasın, onaylanmazsa ne olsun.
                </dd>
              </div>
            </dl>
          </SheetPanel>
        </SheetPopup>
      </Sheet>
    </div>
  );
}

export function SpikeFlowPageWithProvider() {
  return (
    <ReactFlowProvider>
      <SpikeFlowPage />
    </ReactFlowProvider>
  );
}
