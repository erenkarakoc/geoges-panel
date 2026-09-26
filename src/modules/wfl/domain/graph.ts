import type { StepType } from "@/modules/wfl/domain/definition";

/**
 * A definition as boxes and arrows (TASK-0119, SCR-196).
 *
 * Pure on purpose: the canvas library draws what this returns, and what it returns can be read in
 * a test without a browser. Laying out is deliberately simple — every path from the start, each
 * step one row below the one that sent it — because a designer moving boxes by hand is the next
 * turn's work and a layout nobody can predict is worse than a plain one.
 *
 * What it draws is a **draft**, not necessarily a valid definition: a step somebody has just added
 * and not yet answered is still drawn, wearing the schema's complaint. A canvas that went blank
 * the moment an answer is missing would fail exactly when the designer is needed most.
 */

/** A step as the canvas needs it: an id, a kind, and wherever it sends the flow. */
export type DrawableStep = {
  id: string;
  type: StepType | string;
  title?: string | null;
  next?: string | null;
  whenTrue?: string | null;
  whenFalse?: string | null;
  outcomes?: { approve?: string | null; reject?: string | null; return?: string | null } | null;
  paths?: readonly (string | null)[] | null;
  body?: string | null;
};

export type DrawableDefinition = {
  start?: string | null;
  steps: readonly DrawableStep[];
};

/** Which field of the step an arrow leaves through, so a "+" on it knows what to rewire. */
export type Outlet =
  "next" | "whenTrue" | "whenFalse" | "approve" | "reject" | "return" | "body" | `path:${number}`;

export type FlowNode = {
  id: string;
  type: string;
  title: string;
  /** Column and row, in steps; the canvas turns these into pixels. */
  column: number;
  row: number;
};

export type FlowEdge = {
  id: string;
  from: string;
  to: string;
  /** What this path means: the answer, the branch, or nothing in particular. */
  label?: string;
  outlet: Outlet;
  /**
   * An arrow back to a step at or above its source (a "geri", a loop to fix and try again). Drawn
   * dashed, round the side of the boxes, so it never crosses the forward path.
   */
  back: boolean;
  /** Which of the source's forward (or back) exits this is, and how many there are. */
  exit: number;
  exits: number;
};

/** Where each step sends the flow, what to call each path, and which field it left through. */
export function pathsOf(step: DrawableStep): { to: string; label?: string; outlet: Outlet }[] {
  const paths: { to: string; label?: string; outlet: Outlet }[] = [];
  const add = (to: string | null | undefined, outlet: Outlet, label?: string) => {
    if (to) paths.push({ to, label, outlet });
  };
  if (step.type === "condition") {
    add(step.whenTrue, "whenTrue", "evet");
    add(step.whenFalse, "whenFalse", "hayır");
    return paths;
  }
  if (step.type === "approval") {
    add(step.outcomes?.approve ?? step.next, step.outcomes?.approve ? "approve" : "next", "onay");
    add(step.outcomes?.reject, "reject", "ret");
    add(step.outcomes?.return, "return", "geri");
    return paths;
  }
  if (step.type === "parallel") {
    (step.paths ?? []).forEach((path, index) => add(path, `path:${index}`, `dal ${index + 1}`));
    add(step.next, "next", "birleşme");
    return paths;
  }
  if (step.type === "for_each") {
    add(step.body, "body", "her öğe");
    add(step.next, "next", "bitince");
    return paths;
  }
  add(step.next, "next");
  return paths;
}

/** The step's own words for the box: its title, or its kind when it has none. */
const TYPE_LABELS: Record<string, string> = {
  start: "Başlangıç",
  condition: "Koşul",
  approval: "Onay",
  task: "Görev",
  wait: "Bekleme",
  notify: "Bildirim",
  escalate: "Eskalasyon",
  lock: "Kilit",
  parallel: "Paralel dal",
  join: "Birleşme",
  subflow: "Alt akış",
  record: "Kayıt",
  for_each: "Her biri için",
  end: "Bitiş",
};

/** What the kind of step is called in Turkish, for the line above a box's own name. */
export function stepTypeLabel(type: StepType | string): string {
  return TYPE_LABELS[type] ?? type;
}

export function stepLabel(step: DrawableStep): string {
  return step.title?.trim() || stepTypeLabel(step.type);
}

/**
 * A name for every step that a person can read, and that tells two steps apart.
 *
 * Nothing on a screen says `approval_1`: an id is how the definition refers to a step, not how
 * anybody talks about one. A step with no name of its own is called what it is — "Onay" — and when a
 * flow has two of those they become "Onay" and "Onay 2", in the order the flow was written.
 */
export function stepNames(steps: readonly DrawableStep[]): Map<string, string> {
  const used = new Map<string, number>();
  const names = new Map<string, string>();
  for (const step of steps) {
    const base = stepLabel(step);
    const seen = (used.get(base) ?? 0) + 1;
    used.set(base, seen);
    names.set(step.id, seen === 1 ? base : `${base} ${seen}`);
  }
  return names;
}

/**
 * Walks the definition from its start and gives every step a place. A step nothing points at is
 * still drawn — an orphan the designer can see is better than one it cannot.
 */
export function graphOf(definition: DrawableDefinition): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const placed = new Map<string, FlowNode>();
  const rowsUsed: number[] = [];
  const byId = new Map(definition.steps.map((step) => [step.id, step]));
  // Two steps of the same kind are told apart by their names, so no box needs to show an id.
  const names = stepNames(definition.steps);
  const nameOf = (step: DrawableStep) => names.get(step.id) ?? stepLabel(step);

  const arrows = (step: DrawableStep) => {
    for (const path of pathsOf(step)) {
      edges.push({
        id: `${step.id}->${path.to}:${path.outlet}`,
        from: step.id,
        to: path.to,
        label: path.label,
        outlet: path.outlet,
        back: false,
        exit: 0,
        exits: 1,
      });
    }
  };

  const place = (stepId: string, row: number) => {
    const step = byId.get(stepId);
    if (!step || placed.has(stepId)) return;
    const column = rowsUsed[row] ?? 0;
    rowsUsed[row] = column + 1;
    const node: FlowNode = { id: step.id, type: step.type, title: nameOf(step), column, row };
    placed.set(step.id, node);
    nodes.push(node);
    arrows(step);
    for (const path of pathsOf(step)) place(path.to, row + 1);
  };

  if (definition.start) place(definition.start, 0);

  // Whatever the walk did not reach: a step somebody added and has not connected yet.
  for (const step of definition.steps) {
    if (placed.has(step.id)) continue;
    const row = rowsUsed.length;
    rowsUsed[row] = 1;
    const node: FlowNode = { id: step.id, type: step.type, title: nameOf(step), column: 0, row };
    placed.set(step.id, node);
    nodes.push(node);
    arrows(step);
  }

  // An arrow to a step that is not there would draw into nothing; the schema refuses such a
  // definition, and a draft on its way to being one is simply drawn without that arrow.
  const drawn = edges.filter((edge) => placed.has(edge.to));
  for (const edge of drawn) {
    edge.back = placed.get(edge.to)!.row <= placed.get(edge.from)!.row;
  }
  // Each exit of a box gets its own place on the box's edge, so the names of two paths leaving
  // the same box never sit on top of each other.
  for (const node of nodes) {
    for (const back of [false, true]) {
      const out = drawn.filter((edge) => edge.from === node.id && edge.back === back);
      out.forEach((edge, index) => {
        edge.exit = index;
        edge.exits = out.length;
      });
    }
  }
  return { nodes, edges: drawn };
}

/**
 * Reads an editor's working copy as something drawable, or gives up. The designer holds whatever
 * the last edit produced, which is not always a definition the schema would accept; this says
 * whether there is enough there to draw at all.
 */
export function asDraft(value: unknown): DrawableDefinition | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as { start?: unknown; steps?: unknown };
  if (!Array.isArray(draft.steps)) return null;
  const steps = draft.steps.filter(
    (step): step is DrawableStep =>
      Boolean(step) &&
      typeof step === "object" &&
      typeof (step as { id?: unknown }).id === "string" &&
      typeof (step as { type?: unknown }).type === "string",
  );
  return { start: typeof draft.start === "string" ? draft.start : null, steps };
}
