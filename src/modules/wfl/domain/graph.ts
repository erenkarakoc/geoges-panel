import { stepOf, type FlowDefinition, type FlowStep } from "@/modules/wfl/domain/definition";

/**
 * A definition as boxes and arrows (TASK-0119, SCR-196).
 *
 * Pure on purpose: the canvas library draws what this returns, and what it returns can be read in
 * a test without a browser. Laying out is deliberately simple — every path from the start, each
 * step one row below the one that sent it — because a designer moving boxes by hand is the next
 * turn's work and a layout nobody can predict is worse than a plain one.
 */

export type FlowNode = {
  id: string;
  type: FlowStep["type"];
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
};

/** Where each step sends the flow, and what to call each path. */
export function pathsOf(step: FlowStep): { to: string; label?: string }[] {
  const paths: { to: string; label?: string }[] = [];
  const add = (to: string | null | undefined, label?: string) => {
    if (to) paths.push({ to, label });
  };
  if (step.type === "condition") {
    add(step.whenTrue, "evet");
    add(step.whenFalse, "hayır");
    return paths;
  }
  if (step.type === "approval") {
    add(step.outcomes.approve ?? step.next, "onay");
    add(step.outcomes.reject, "ret");
    add(step.outcomes.return, "geri");
    return paths;
  }
  if (step.type === "parallel") {
    step.paths.forEach((path, index) => add(path, `dal ${index + 1}`));
    add(step.next, "birleşme");
    return paths;
  }
  if (step.type === "for_each") {
    add(step.body, "her öğe");
    add(step.next, "bitince");
    return paths;
  }
  add(step.next);
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
export function stepTypeLabel(type: FlowStep["type"]): string {
  return TYPE_LABELS[type] ?? type;
}

export function stepLabel(step: FlowStep): string {
  return step.title?.trim() || stepTypeLabel(step.type);
}

/**
 * Walks the definition from its start and gives every step a place. A step nothing points at is
 * still drawn — an orphan the designer can see is better than one it cannot.
 */
export function graphOf(definition: FlowDefinition): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  const placed = new Map<string, FlowNode>();
  const rowsUsed: number[] = [];

  const place = (stepId: string, row: number) => {
    const step = stepOf(definition, stepId);
    if (!step || placed.has(stepId)) return;
    const column = rowsUsed[row] ?? 0;
    rowsUsed[row] = column + 1;
    const node: FlowNode = { id: step.id, type: step.type, title: stepLabel(step), column, row };
    placed.set(step.id, node);
    nodes.push(node);
    for (const path of pathsOf(step)) {
      edges.push({
        id: `${step.id}->${path.to}${path.label ? `:${path.label}` : ""}`,
        from: step.id,
        to: path.to,
        label: path.label,
      });
      place(path.to, row + 1);
    }
  };

  place(definition.start, 0);

  // Whatever the walk did not reach: a step somebody added and has not connected yet.
  for (const step of definition.steps) {
    if (placed.has(step.id)) continue;
    const row = rowsUsed.length;
    rowsUsed[row] = 1;
    const node: FlowNode = { id: step.id, type: step.type, title: stepLabel(step), column: 0, row };
    placed.set(step.id, node);
    nodes.push(node);
    for (const path of pathsOf(step)) {
      edges.push({
        id: `${step.id}->${path.to}${path.label ? `:${path.label}` : ""}`,
        from: step.id,
        to: path.to,
        label: path.label,
      });
    }
  }

  // An arrow to a step that is not there would draw into nothing; the schema refuses such a
  // definition, and a draft on its way to being one is simply drawn without that arrow.
  return { nodes, edges: edges.filter((edge) => placed.has(edge.to)) };
}
