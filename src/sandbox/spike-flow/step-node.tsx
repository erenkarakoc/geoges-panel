"use client";

import { Handle, Position } from "@xyflow/react";

import { type SpikeStep, stepLabels } from "./flow-data";

/**
 * SPIKE-07 — one step box. Styled only with theme tokens so the experiment also
 * answers "does this read correctly in light and dark" (D-224, WCAG 1.4.11).
 */
export function StepNode({
  data,
  selected,
}: {
  data: Record<string, unknown>;
  selected?: boolean;
}) {
  const step = data as unknown as SpikeStep;
  const isApproval = step.type === "approval";

  return (
    <div
      className={[
        "w-56 rounded-lg border bg-card px-3 py-2 text-left shadow-sm transition-colors",
        selected ? "border-primary ring-2 ring-ring" : "border-border",
        step.hasError ? "border-destructive" : "",
      ].join(" ")}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-muted-foreground" />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground uppercase">{stepLabels[step.type]}</span>
        {step.hasError ? <span className="text-[11px] text-destructive">eksik</span> : null}
      </div>

      <div className="truncate text-sm font-medium text-foreground">{step.title}</div>
      <div className="truncate text-xs text-muted-foreground">{step.owner}</div>

      {isApproval ? (
        <>
          <Handle
            id="approve"
            type="source"
            position={Position.Bottom}
            style={{ left: "25%" }}
            className="!h-2 !w-2 !bg-primary"
          />
          <Handle
            id="return"
            type="source"
            position={Position.Bottom}
            style={{ left: "50%" }}
            className="!h-2 !w-2 !bg-muted-foreground"
          />
          <Handle
            id="reject"
            type="source"
            position={Position.Bottom}
            style={{ left: "75%" }}
            className="!h-2 !w-2 !bg-destructive"
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-2 !w-2 !bg-muted-foreground"
        />
      )}
    </div>
  );
}
