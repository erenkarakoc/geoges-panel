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
 * The two steps with something of their own to say — the condition with its branches, the approval
 * with its three answers — are kept apart from the rest, because a union that can be narrowed
 * needs its halves written out rather than filtered.
 */
const PLAIN_STEP_TYPES = [
  "start",
  "escalate",
  "parallel",
  "join",
  "subflow",
  "lock",
  "end",
  "record",
  "for_each",
] as const;

export const STEP_TYPES = [
  "condition",
  "approval",
  "task",
  "wait",
  "notify",
  ...PLAIN_STEP_TYPES,
] as const;

export type StepType = (typeof STEP_TYPES)[number];

/** The steps the engine can take today; the rest wait for their own slice of the work. */
export const RUNNABLE_STEP_TYPES: readonly StepType[] = [
  "start",
  "condition",
  "approval",
  "task",
  "wait",
  "notify",
  "end",
];

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

/** How long a wait lasts: an ISO-8601 duration, as the architecture's own example writes it. */
export const DURATION = /^P(?:\d+D(?:T(?:\d+H)?(?:\d+M)?)?|T(?:\d+H(?:\d+M)?|\d+M))$/;

const baseStep = z.object({
  id: stepId,
  title: z.string().trim().min(1).max(200).optional(),
  /** Where to go when the step is done; nothing means the flow ends here. */
  next: stepId.nullish(),
});

/**
 * A condition that looks back (REQ-WFL-008, D-100): "this flow has run more than three times for
 * this record in the last thirty days". It is a counting query, not a field, which is why it is a
 * shape of its own and why the engine gives it a time limit.
 *
 * What can be counted is the engine's own history for now. The modules' own records join it when
 * they arrive, through the catalog, the same way everything else does.
 */
export const windowTestSchema = z.object({
  countOf: z.enum(["flow_runs", "returned_approvals"]),
  withinDays: z.number().int().min(1).max(365),
  op: z.enum([">", ">=", "<", "<=", "=", "!="]),
  value: z.number().int().min(0),
});

export type WindowTest = z.infer<typeof windowTestSchema>;

const conditionStep = baseStep.extend({
  type: z.literal("condition"),
  test: z.union([testSchema, windowTestSchema]),
  whenTrue: stepId.nullish(),
  whenFalse: stepId.nullish(),
});

/** How a step finds the person it waits on (D-097). Only two of the four forms are read today. */
export const ownerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("user"), userId: z.uuid() }),
  z.object({ type: z.literal("role"), role: z.string().min(2).max(40) }),
  z.object({ type: z.literal("relation"), relation: z.string().min(2).max(60) }),
  z.object({ type: z.literal("permission"), permission: z.string().min(2).max(60) }),
]);

const approvalStep = baseStep.extend({
  type: z.literal("approval"),
  owner: ownerSchema,
  /** After this long without an answer, the approval moves to somebody else (REQ-IAM-020). */
  escalation: z
    .object({
      after: z.string().regex(DURATION, "süre PT8H, PT30M ya da P2D biçiminde yazılır"),
      to: ownerSchema,
    })
    .optional(),
  /** Where each of the three answers sends the flow (D-099); nothing means the flow ends there. */
  outcomes: z
    .object({
      approve: stepId.nullish(),
      reject: stepId.nullish(),
      return: stepId.nullish(),
    })
    .default({}),
});

const taskStep = baseStep.extend({
  type: z.literal("task"),
  owner: ownerSchema,
  priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
});

const waitStep = baseStep.extend({
  type: z.literal("wait"),
  after: z.string().regex(DURATION, "süre PT8H, PT30M ya da P2D biçiminde yazılır"),
});

const notifyStep = baseStep.extend({
  type: z.literal("notify"),
  owner: ownerSchema,
  /** What the person is told; the flow's own words, not a code. */
  subject: z.string().trim().min(1).max(200),
});

const plainStep = baseStep.extend({ type: z.enum(PLAIN_STEP_TYPES) });

export const stepSchema = z.discriminatedUnion("type", [
  conditionStep,
  approvalStep,
  taskStep,
  waitStep,
  notifyStep,
  plainStep,
]);
export type FlowStep = z.infer<typeof stepSchema>;

export const triggerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("event"), event: z.string().regex(/^[a-z_]+\.[a-z_]+$/) }),
  // The platform's own recurrence words (`platform/jobs/types`), not a cron dialect: the panel
  // has one way of saying "every day at" and "every N minutes", and a flow uses that one. Which
  // of the two it is saying is checked below, where the whole definition is.
  z.object({
    type: z.literal("clock"),
    dailyAt: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "günlük saat SS:DD biçiminde yazılır")
      .optional(),
    everyMinutes: z.number().int().min(5).max(1440).optional(),
  }),
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
    if (definition.trigger.type === "clock") {
      const daily = Boolean(definition.trigger.dailyAt);
      const every = Boolean(definition.trigger.everyMinutes);
      if (daily === every) {
        ctx.addIssue({
          code: "custom",
          message: "saat tetikleyicisi ya günlük bir saat ya da bir dakika aralığı ister",
        });
      }
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
        step.type === "approval" ? step.outcomes.approve : null,
        step.type === "approval" ? step.outcomes.reject : null,
        step.type === "approval" ? step.outcomes.return : null,
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

/** An ISO-8601 duration in milliseconds; the shapes the schema allows and nothing else. */
export function durationMs(after: string): number {
  const days = Number(/(\d+)D/.exec(after)?.[1] ?? 0);
  const hours = Number(/T(?:(\d+)H)?/.exec(after)?.[1] ?? 0);
  const minutes = Number(/(\d+)M$/.exec(after)?.[1] ?? 0);
  return ((days * 24 + hours) * 60 + minutes) * 60_000;
}

/** Whether a condition is the kind that counts history rather than reading a field. */
export function isWindowTest(test: unknown): test is WindowTest {
  return typeof test === "object" && test !== null && "countOf" in test;
}

/** Compares a counted number with what the condition asked for. */
export function countPasses(test: WindowTest, count: number): boolean {
  switch (test.op) {
    case ">":
      return count > test.value;
    case ">=":
      return count >= test.value;
    case "<":
      return count < test.value;
    case "<=":
      return count <= test.value;
    case "=":
      return count === test.value;
    default:
      return count !== test.value;
  }
}
