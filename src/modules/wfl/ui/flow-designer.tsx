"use client";

import { AlertTriangleIcon, CheckIcon, LoaderIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerHeader, DrawerPopup, DrawerTitle } from "@/components/ui/drawer";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  definitionSchema,
  type FlowDefinition,
  type FlowStep,
} from "@/modules/wfl/domain/definition";
import { graphOf, stepLabel } from "@/modules/wfl/domain/graph";
import { flowCanvasId } from "@/modules/wfl/ui/flow-canvas-id";
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

export function FlowDesigner({ flow, save }: { flow: DesignerFlow; save: SaveAction }) {
  const [definition, setDefinition] = useState<unknown>(flow.definition);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [state, setState] = useState<{ error: string | null; savedAt: number | null }>({
    error: null,
    savedAt: null,
  });
  const phone = useMediaQuery("max-lg");
  const panel = useRef<HTMLDivElement | null>(null);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  useActionToast(state, state.error ? { type: "error", title: state.error } : null);

  const problems = useMemo(() => problemsByStep(definition), [definition]);
  const valid = problems.steps.size === 0 && problems.flow.length === 0;

  // The canvas needs a definition it can walk; a draft that does not parse is drawn from the last
  // shape that did, so the screen never goes blank while somebody is in the middle of typing.
  const drawable = useMemo(() => {
    const parsed = definitionSchema.safeParse(definition);
    return parsed.success ? (parsed.data as FlowDefinition) : null;
  }, [definition]);

  const graph = useMemo(
    () => (drawable ? graphOf(drawable) : { nodes: [], edges: [] }),
    [drawable],
  );

  const step = useMemo(() => {
    if (!drawable || !selected) return null;
    return drawable.steps.find((one) => one.id === selected) ?? null;
  }, [drawable, selected]);

  useEffect(() => () => (pending.current ? clearTimeout(pending.current) : undefined), []);

  /**
   * Saving is automatic and a moment behind the typing. A draft the schema refuses is **not**
   * written: the database holds definitions to the same schema, so a save that could not succeed
   * is better not attempted, and the header says what is missing until it is answered.
   */
  const persist = useCallback(
    (next: unknown) => {
      setDefinition(next);
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

  /** Writes one step's change back into the definition, leaving everything else alone. */
  const changeStep = useCallback(
    (id: string, change: Partial<FlowStep>) => {
      const current = definition as { steps: FlowStep[] };
      persist({
        ...(current as object),
        steps: current.steps.map((one) => (one.id === id ? { ...one, ...change } : one)),
      });
    },
    [definition, persist],
  );

  /** Escape in the panel puts the focus back on the canvas, which is one tab stop (SPIKE-07). */
  const backToCanvas = useCallback(() => {
    document.getElementById(flowCanvasId)?.focus();
  }, []);

  const questions = step ? (
    <StepQuestions
      onChange={(change) => changeStep(step.id, change)}
      problems={problems.steps.get(step.id) ?? []}
      step={step}
    />
  ) : (
    <p className="text-sm text-muted-foreground">
      Bir adıma tıklayın: o adımın soruları burada açılır ve verdiğiniz cevap şemada anında görünür.
    </p>
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
          onOpen={() => panel.current?.focus()}
          onSelect={setSelected}
          problems={problems.steps}
          selected={selected}
        />

        {/* The phone gets the same questions in a drawer it can pull up over the full-screen canvas. */}
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

/**
 * The step's own questions (REQ-WFL-026). This turn asks what every step has — what it is called —
 * and the fields the palette's waiting, telling and blocking steps cannot do without; the rest of
 * the questions arrive with the steps they belong to.
 */
function StepQuestions({
  step,
  problems,
  onChange,
}: {
  step: FlowStep;
  problems: readonly string[];
  onChange: (change: Partial<FlowStep>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">{stepLabel(step)}</h3>
        <span className="text-xs text-muted-foreground">
          {step.type} · {step.id}
        </span>
      </div>

      {problems.length ? (
        <ul className="flex flex-col gap-1 rounded-md border border-warning/40 bg-warning/8 p-2 text-xs">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : null}

      <Field>
        <FieldLabel htmlFor={`title-${step.id}`}>Adımın adı</FieldLabel>
        <Input
          defaultValue={step.title ?? ""}
          id={`title-${step.id}`}
          onBlur={(event) => onChange({ title: event.currentTarget.value || undefined })}
          placeholder="Ekranda ne yazsın?"
        />
        <FieldDescription>
          Bu ad görevde, bildirimde ve çalışma günlüğünde görünür.
        </FieldDescription>
      </Field>

      {step.type === "wait" ? (
        <Field>
          <FieldLabel htmlFor={`after-${step.id}`}>Ne kadar beklesin?</FieldLabel>
          <Input
            defaultValue={step.after}
            id={`after-${step.id}`}
            onBlur={(event) => onChange({ after: event.currentTarget.value } as Partial<FlowStep>)}
            placeholder="PT8H"
          />
          <FieldDescription>PT30M, PT8H ya da P2D biçiminde yazılır.</FieldDescription>
        </Field>
      ) : null}

      {step.type === "notify" || step.type === "escalate" ? (
        <Field>
          <FieldLabel htmlFor={`subject-${step.id}`}>Ne desin?</FieldLabel>
          <Input
            defaultValue={step.subject}
            id={`subject-${step.id}`}
            onBlur={(event) =>
              onChange({ subject: event.currentTarget.value } as Partial<FlowStep>)
            }
          />
        </Field>
      ) : null}

      {step.type === "lock" ? (
        <Field>
          <FieldLabel htmlFor={`reason-${step.id}`}>Neden kilitli?</FieldLabel>
          <Input
            defaultValue={step.reason}
            id={`reason-${step.id}`}
            onBlur={(event) => onChange({ reason: event.currentTarget.value } as Partial<FlowStep>)}
          />
          <FieldDescription>Engellenen kişiye bu cümle gösterilir.</FieldDescription>
        </Field>
      ) : null}
    </div>
  );
}
