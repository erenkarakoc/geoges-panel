import { z } from "zod";

/**
 * What a flow definition is allowed to say (TASK-0117, REQ-WFL-005/006/007, ADR-006).
 *
 * The palette is fixed at fourteen steps and this schema is where that is true: a definition with
 * anything else in it is not a definition the panel will store. There is no free code and no
 * escape hatch, which is what makes "a flow cannot write the ledger" a missing ability rather than
 * a rule somebody enforces (D-080, D-091).
 *
 * The engine does not run all fourteen yet. A definition naming a step the engine has not learned
 * is still a valid definition — what stops it reaching people is the dry run a publish needs
 * (REQ-WFL-025), which walks the definition and fails on a step it cannot take.
 */

/**
 * The condition is listed on its own because it is the one step with branches, and a union that
 * can be narrowed needs the two halves kept apart.
 */
const PLAIN_STEP_TYPES = [
  "start",
  "approval",
  "task",
  "wait",
  "notify",
  "escalate",
  "parallel",
  "join",
  "subflow",
  "lock",
  "end",
  "record",
  "for_each",
] as const;

export const STEP_TYPES = ["condition", ...PLAIN_STEP_TYPES] as const;

export type StepType = (typeof STEP_TYPES)[number];

/** The steps the engine can take today; the rest wait for their own slice of the work. */
export const RUNNABLE_STEP_TYPES: readonly StepType[] = ["start", "condition", "end"];

const stepId = z
  .string()
  .regex(/^[a-z][a-z0-9_]{0,30}$/, "adım kimliği küçük harf ve rakamdan oluşur");

/** What a condition reads and what it expects; the value comes from the instance's context. */
const testSchema = z.object({
  /** A path into the flow's context, e.g. `record.amount` (D-100). */
  field: z.string().min(1).max(120),
  op: z.enum(["=", "!=", ">", ">=", "<", "<=", "in", "exists"]),
  value: z.unknown().optional(),
});

const baseStep = z.object({
  id: stepId,
  title: z.string().trim().min(1).max(200).optional(),
  /** Where to go when the step is done; nothing means the flow ends here. */
  next: stepId.nullish(),
});

const conditionStep = baseStep.extend({
  type: z.literal("condition"),
  test: testSchema,
  whenTrue: stepId.nullish(),
  whenFalse: stepId.nullish(),
});

const plainStep = baseStep.extend({ type: z.enum(PLAIN_STEP_TYPES) });

export const stepSchema = z.discriminatedUnion("type", [conditionStep, plainStep]);
export type FlowStep = z.infer<typeof stepSchema>;

export const triggerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("event"), event: z.string().regex(/^[a-z_]+\.[a-z_]+$/) }),
  z.object({ type: z.literal("clock"), cron: z.string().min(1).max(120) }),
  z.object({
    type: z.literal("threshold"),
    event: z.string().regex(/^[a-z_]+\.[a-z_]+$/),
    test: testSchema,
  }),
  z.object({ type: z.literal("manual") }),
]);
export type FlowTriggerDefinition = z.infer<typeof triggerSchema>;

export const definitionSchema = z
  .object({
    trigger: triggerSchema,
    /** Where the flow begins; the step with this id is entered first. */
    start: stepId,
    steps: z.array(stepSchema).min(1).max(200),
    settings: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((definition, ctx) => {
    const ids = new Set<string>();
    for (const step of definition.steps) {
      if (ids.has(step.id)) {
        ctx.addIssue({ code: "custom", message: `adım kimliği iki kez: ${step.id}` });
      }
      ids.add(step.id);
    }
    if (!ids.has(definition.start)) {
      ctx.addIssue({ code: "custom", message: `başlangıç adımı yok: ${definition.start}` });
    }
    // A step that points nowhere in particular is the end of a path; a step that points at
    // something that does not exist is a definition nobody can run.
    for (const step of definition.steps) {
      for (const target of [
        step.next,
        step.type === "condition" ? step.whenTrue : null,
        step.type === "condition" ? step.whenFalse : null,
      ]) {
        if (target && !ids.has(target)) {
          ctx.addIssue({ code: "custom", message: `${step.id} olmayan adıma gidiyor: ${target}` });
        }
      }
    }
  });

export type FlowDefinition = z.infer<typeof definitionSchema>;

export function parseDefinition(value: unknown): FlowDefinition {
  return definitionSchema.parse(value);
}

/** The step with this id, or null; the engine treats a missing step as the end of the path. */
export function stepOf(definition: FlowDefinition, id: string | null | undefined): FlowStep | null {
  if (!id) return null;
  return definition.steps.find((step) => step.id === id) ?? null;
}

/** Reads `a.b.c` out of the flow's context; missing is undefined, never an error. */
export function valueAt(context: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value === null || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, context);
}

/**
 * What a condition decides (REQ-WFL-008, D-100). Comparisons are the typed ones of the catalog's
 * condition fields; anything the context does not hold is simply false, because a flow asking
 * about a field that is not there has its answer.
 */
export function testPasses(test: z.infer<typeof testSchema>, context: unknown): boolean {
  const left = valueAt(context, test.field);
  const right = test.value;
  switch (test.op) {
    case "exists":
      return left !== undefined && left !== null;
    case "=":
      return left === right;
    case "!=":
      return left !== right;
    case "in":
      return Array.isArray(right) && right.includes(left as never);
    default: {
      if (typeof left !== "number" || typeof right !== "number") return false;
      if (test.op === ">") return left > right;
      if (test.op === ">=") return left >= right;
      if (test.op === "<") return left < right;
      return left <= right;
    }
  }
}
