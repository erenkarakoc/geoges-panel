"use client";

import { AlertTriangleIcon, CheckIcon, LoaderIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Drawer, DrawerHeader, DrawerPopup, DrawerTitle } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import { definitionSchema, STEP_TYPES, type StepType } from "@/modules/wfl/domain/definition";
import {
  asEditable,
  insertAfter,
  removeStep,
  withStep,
  type Draft,
} from "@/modules/wfl/domain/edit";
import { graphOf, stepLabel, stepTypeLabel, type Outlet } from "@/modules/wfl/domain/graph";
import { flowCanvasId } from "@/modules/wfl/ui/flow-canvas-id";
import {
  StepQuestions,
  TriggerQuestions,
  type DesignerVocabulary,
} from "@/modules/wfl/ui/step-questions";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * The flow designer (SCR-196, TASK-0119, D-283).
 *
 * Two editors, one definition: the canvas arranges the steps and the panel asks each step its own
 * questions, and both write into the same object. What makes a definition valid is asked of the
 * engine's own schema — the screen keeps no second list of rules, so it cannot disagree with the
 * thing that will run the flow.
 *
 * The drawing library is fetched only when this screen is open (SPIKE-07 note 3), which is why the
 * canvas arrives through `dynamic` rather than a plain import.
 */

const FlowCanvas = dynamic(
  () => import("@/modules/wfl/ui/flow-canvas").then((module) => module.FlowCanvas),
  {
    loading: () => <Skeleton className="h-[60svh] min-h-80 w-full rounded-lg lg:h-[70svh]" />,
    ssr: false,
  },
);

export type DesignerFlow = {
  key: string;
  name: string;
  version: number;
  status: string;
  definition: unknown;
};

type SaveAction = (input: {
  key: string;
  name: string;
  definition: unknown;
}) => Promise<{ error: string | null; savedAt: number | null }>;

/** What the schema found wrong, per step, in the schema's own words. */
function problemsByStep(definition: unknown): { steps: Map<string, string[]>; flow: string[] } {
  const found = definitionSchema.safeParse(definition);
  const steps = new Map<string, string[]>();
  const flow: string[] = [];
  if (found.success) return { steps, flow };

  const parsed = definition as { steps?: { id?: string }[] };
  for (const issue of found.error.issues) {
    const [first, index] = issue.path;
    const id = first === "steps" && typeof index === "number" ? parsed.steps?.[index]?.id : null;
    if (id) steps.set(id, [...(steps.get(id) ?? []), issue.message]);
    else flow.push(issue.message);
  }
  return { steps, flow };
}

export function FlowDesigner({
  flow,
  vocabulary,
  save,
}: {
  flow: DesignerFlow;
  vocabulary: DesignerVocabulary;
  save: SaveAction;
}) {
  const [draft, setDraft] = useState<Draft>(
    () => asEditable(flow.definition) ?? { trigger: { type: "manual" }, start: "", steps: [] },
  );
  const [selected, setSelected] = useState<string | null>(null);
  /** Where a new step would go, while the palette is open. */
  const [adding, setAdding] = useState<{ from: string; outlet: Outlet } | null>(null);
  const [saving, startSaving] = useTransition();
  const [state, setState] = useState<{ error: string | null; savedAt: number | null }>({
    error: null,
    savedAt: null,
  });
  const phone = useMediaQuery("max-lg");
  const panel = useRef<HTMLDivElement | null>(null);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  useActionToast(state, state.error ? { type: "error", title: state.error } : null);

  const problems = useMemo(() => problemsByStep(draft), [draft]);
  const valid = problems.steps.size === 0 && problems.flow.length === 0;
  const graph = useMemo(() => graphOf(draft), [draft]);
  const step = useMemo(
    () => draft.steps.find((one) => one.id === selected) ?? null,
    [draft, selected],
  );

  useEffect(() => () => (pending.current ? clearTimeout(pending.current) : undefined), []);

  /**
   * Saving is automatic and a moment behind the typing. A draft the schema refuses is **not**
   * written: the database holds definitions to the same schema, so a save that could not succeed
   * is better not attempted, and the header says what is missing until it is answered.
   */
  const persist = useCallback(
    (next: Draft) => {
      setDraft(next);
      if (pending.current) clearTimeout(pending.current);
      if (!definitionSchema.safeParse(next).success) return;
      pending.current = setTimeout(() => {
        startSaving(async () => {
          const answer = await save({ key: flow.key, name: flow.name, definition: next });
          setState(answer);
        });
      }, 700);
    },
    [flow.key, flow.name, save],
  );

  /** Escape in the panel puts the focus back on the canvas, which is one tab stop (SPIKE-07). */
  const backToCanvas = useCallback(() => {
    document.getElementById(flowCanvasId)?.focus();
  }, []);

  const addStep = (type: StepType) => {
    if (!adding) return;
    const { draft: next, id } = insertAfter(draft, adding.from, adding.outlet, type);
    setAdding(null);
    setSelected(id);
    persist(next);
  };

  const questions = step ? (
    <StepQuestions
      onChange={(change) => persist(withStep(draft, step.id, change))}
      onRemove={() => {
        setSelected(null);
        persist(removeStep(draft, step.id));
      }}
      problems={problems.steps.get(step.id) ?? []}
      step={step}
      steps={draft.steps}
      vocabulary={vocabulary}
    />
  ) : (
    <TriggerQuestions
      onChange={(trigger) => persist({ ...draft, trigger })}
      trigger={draft.trigger as Record<string, unknown> | undefined}
      vocabulary={vocabulary}
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-col">
          <h2 className="truncate text-lg font-semibold">{flow.name}</h2>
          <span className="text-xs text-muted-foreground">
            Sürüm {flow.version} · {flow.status === "published" ? "yayında" : "taslak"}
          </span>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <SaveState saving={saving} savedAt={state.savedAt} />
          {valid ? null : (
            <Badge variant="warning">
              <AlertTriangleIcon aria-hidden="true" />
              Eksik var
            </Badge>
          )}
        </div>
      </header>

      {problems.flow.length ? (
        <p className="rounded-lg border border-warning/40 bg-warning/8 p-3 text-sm">
          {problems.flow.join(" · ")}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <FlowCanvas
          edges={graph.edges}
          miniMap={!phone}
          nodes={graph.nodes}
          onInsert={(from, outlet) => setAdding({ from, outlet })}
          onOpen={() => panel.current?.focus()}
          onSelect={setSelected}
          problems={problems.steps}
          selected={selected}
        />

        {/* The phone gets the same questions in a drawer it pulls up over the full-screen canvas. */}
        {phone ? (
          <Drawer
            onOpenChange={(open) => (open ? undefined : setSelected(null))}
            open={Boolean(step)}
          >
            <DrawerPopup position="bottom" showBar>
              <DrawerHeader>
                <DrawerTitle>{step ? stepLabel(step) : "Adım"}</DrawerTitle>
              </DrawerHeader>
              <ScrollArea className="max-h-[60svh]">
                <div className="p-4 pt-0">{questions}</div>
              </ScrollArea>
            </DrawerPopup>
          </Drawer>
        ) : (
          <aside className="w-full shrink-0 lg:w-80">
            <ScrollArea className="h-full rounded-lg border">
              <div
                className="flex flex-col gap-4 p-4 outline-none"
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    backToCanvas();
                  }
                }}
                ref={panel}
                tabIndex={-1}
              >
                {questions}
              </div>
            </ScrollArea>
          </aside>
        )}
      </div>

      {/* The palette: the fourteen steps of REQ-WFL-005 and nothing else. */}
      <Dialog onOpenChange={(open) => (open ? undefined : setAdding(null))} open={Boolean(adding)}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Yeni adım</DialogTitle>
            <DialogDescription>
              Bu okun üstüne eklenecek adımı seçin; ok, yeni adımdan sonra kaldığı yere devam eder.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 p-4 pt-0 sm:grid-cols-3">
            {STEP_TYPES.filter((type) => type !== "start").map((type) => (
              <Button key={type} onClick={() => addStep(type)} variant="outline">
                {stepTypeLabel(type)}
              </Button>
            ))}
          </div>
        </DialogPopup>
      </Dialog>
    </div>
  );
}

function SaveState({ saving, savedAt }: { saving: boolean; savedAt: number | null }) {
  if (saving) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <LoaderIcon aria-hidden="true" className="size-3.5 animate-spin" />
        kaydediliyor
      </span>
    );
  }
  if (!savedAt) return null;
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <CheckIcon aria-hidden="true" className="size-3.5" />
      kaydedildi
    </span>
  );
}
