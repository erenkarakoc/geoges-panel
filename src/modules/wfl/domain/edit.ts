import type { StepType } from "@/modules/wfl/domain/definition";
import type { DrawableDefinition, DrawableStep, Outlet } from "@/modules/wfl/domain/graph";

/**
 * Editing a draft definition (TASK-0119, SCR-196).
 *
 * Pure functions over a plain object: add a step between two boxes, take one out, answer one of its
 * questions. Every one of them returns a new draft and none of them validates — what a valid
 * definition is belongs to `definitionSchema` and to nothing else (D-283), so an edit that leaves
 * something unanswered produces a draft the schema will complain about, which is exactly what the
 * designer shows on the box.
 */

export type DraftStep = DrawableStep & Record<string, unknown>;

export type Draft = Record<string, unknown> & {
  start?: string | null;
  steps: DraftStep[];
};

/** The prefix a new step's id gets, so an id says what the step is without being read twice. */
const ID_PREFIX: Record<string, string> = {
  approval: "approval",
  condition: "condition",
  end: "end",
  escalate: "escalate",
  for_each: "for_each",
  join: "join",
  lock: "lock",
  notify: "notify",
  parallel: "parallel",
  record: "record",
  start: "start",
  subflow: "subflow",
  task: "task",
  wait: "wait",
};

/** A free id for a new step of this kind: `approval_1`, then `approval_2`, and so on. */
export function freeStepId(draft: Draft, type: StepType): string {
  const prefix = ID_PREFIX[type] ?? "step";
  const taken = new Set(draft.steps.map((step) => step.id));
  for (let counter = 1; counter < 1000; counter += 1) {
    const id = `${prefix}_${counter}`;
    if (!taken.has(id)) return id;
  }
  throw new Error(`no free id left for ${type}`);
}

/**
 * A new step of this kind, with the little the panel can answer on its own.
 *
 * Only two answers are given without being asked, and both are visible and changeable in the
 * panel: a wait lasts eight hours and a record step makes a draft record. Everything a step cannot
 * have a sensible default for — who approves, what a condition reads, which flow a sub-flow runs —
 * is left out, so the schema asks for it and the box says it is missing.
 */
export function blankStep(type: StepType, id: string): DraftStep {
  const step: DraftStep = { id, type };
  if (type === "wait") step.after = "PT8H";
  if (type === "record") step.action = "create";
  if (type === "task") step.priority = "normal";
  if (type === "lock") step.transition = "*";
  if (type === "approval") step.outcomes = {};
  if (type === "parallel") step.paths = [];
  return step;
}

/** Where an outlet points today. */
export function outletTarget(step: DraftStep, outlet: Outlet): string | null {
  if (outlet === "next") return step.next ?? null;
  if (outlet === "whenTrue") return step.whenTrue ?? null;
  if (outlet === "whenFalse") return step.whenFalse ?? null;
  if (outlet === "body") return step.body ?? null;
  if (outlet.startsWith("path:")) {
    return (step.paths ?? [])[Number(outlet.slice(5))] ?? null;
  }
  return step.outcomes?.[outlet as "approve" | "reject" | "return"] ?? null;
}

/** The same step with one of its outlets pointing somewhere else. */
export function withOutlet(step: DraftStep, outlet: Outlet, to: string | null): DraftStep {
  if (outlet === "next") return { ...step, next: to };
  if (outlet === "whenTrue") return { ...step, whenTrue: to };
  if (outlet === "whenFalse") return { ...step, whenFalse: to };
  if (outlet === "body") return { ...step, body: to };
  if (outlet.startsWith("path:")) {
    const index = Number(outlet.slice(5));
    const paths = [...(step.paths ?? [])];
    if (to === null) paths.splice(index, 1);
    else paths[index] = to;
    return { ...step, paths };
  }
  return { ...step, outcomes: { ...(step.outcomes ?? {}), [outlet]: to } };
}

/** One step changed, everything else left alone. */
export function withStep(draft: Draft, id: string, change: Record<string, unknown>): Draft {
  return {
    ...draft,
    steps: draft.steps.map((step) => (step.id === id ? { ...step, ...change } : step)),
  };
}

/**
 * A new step on an arrow: what the arrow pointed at now follows the new step instead. This is what
 * the "+" between two boxes does, and it is the only way a step enters the middle of a flow.
 */
export function insertAfter(
  draft: Draft,
  from: string,
  outlet: Outlet,
  type: StepType,
): { draft: Draft; id: string } {
  const source = draft.steps.find((step) => step.id === from);
  if (!source) return { draft, id: "" };

  const id = freeStepId(draft, type);
  const target = outletTarget(source, outlet);
  const added = blankStep(type, id);
  // A join or an end has nowhere to send the flow on to; everything else carries the old target.
  if (target && type !== "end") added.next = target;

  return {
    draft: {
      ...draft,
      steps: [
        ...draft.steps.map((step) => (step.id === from ? withOutlet(step, outlet, id) : step)),
        added,
      ],
    },
    id,
  };
}

/** A new step after the last one in the flow, for a definition that is still only a start. */
export function appendStep(
  draft: Draft,
  from: string,
  type: StepType,
): { draft: Draft; id: string } {
  return insertAfter(draft, from, "next", type);
}

/**
 * Taking a step out. What pointed at it now points at where it pointed: a flow with a box removed
 * from the middle stays joined up, because a designer removing a step means "not this", not "stop
 * here". Removing the start moves the start to the step it led to.
 */
export function removeStep(draft: Draft, id: string): Draft {
  const going = draft.steps.find((step) => step.id === id);
  if (!going) return draft;

  const heir =
    going.next ??
    going.whenTrue ??
    going.outcomes?.approve ??
    going.body ??
    (going.paths ?? [])[0] ??
    null;

  const steps = draft.steps
    .filter((step) => step.id !== id)
    .map((step) => {
      let next = step;
      if (next.next === id) next = { ...next, next: heir };
      if (next.whenTrue === id) next = { ...next, whenTrue: heir };
      if (next.whenFalse === id) next = { ...next, whenFalse: heir };
      if (next.body === id) next = { ...next, body: heir };
      if (next.outcomes) {
        const outcomes = { ...next.outcomes };
        for (const answer of ["approve", "reject", "return"] as const) {
          if (outcomes[answer] === id) outcomes[answer] = heir;
        }
        next = { ...next, outcomes };
      }
      if (next.paths?.some((path) => path === id)) {
        // A branch whose first step is gone and that leads nowhere else is no branch at all.
        const paths = next.paths
          .map((path) => (path === id ? heir : path))
          .filter((path): path is string => Boolean(path));
        next = { ...next, paths };
      }
      return next;
    });

  return { ...draft, start: draft.start === id ? heir : draft.start, steps };
}

/** Reads a working copy as a draft to edit, or gives up — the same shape the canvas draws. */
export function asEditable(value: unknown): Draft | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as DrawableDefinition & Record<string, unknown>;
  if (!Array.isArray(draft.steps)) return null;
  return draft as Draft;
}
