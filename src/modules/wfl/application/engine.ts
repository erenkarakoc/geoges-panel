import {
  endInstance,
  enterStep,
  flowsListeningTo,
  leaveStep,
  noteWaiting,
  readDecision,
  readRunnable,
  requestApproval,
  startInstance,
  type FlowTrigger,
} from "@/modules/wfl/data/instance-store";
import {
  parseDefinition,
  RUNNABLE_STEP_TYPES,
  stepOf,
  testPasses,
  type FlowDefinition,
  type FlowStep,
} from "@/modules/wfl/domain/definition";
import type { SystemDb } from "@/platform/jobs/types";

/**
 * The engine's loop (TASK-0117, `docs/architecture/WORKFLOW_ENGINE.md` section 4).
 *
 * An instance is a state machine and this is what turns the handle: it enters a step, decides what
 * the step means, leaves it, and moves to the next one until the flow ends or has to wait for
 * somebody. Everything happens inside the transaction it is given, so a step's effect and the
 * record of having taken it commit together — or neither does.
 *
 * Four of the fourteen steps are implemented here: start, condition, approval and end. A step the
 * engine has not learned stops the instance with a reason rather than pretending to take it; what
 * keeps such a definition away from people is the dry run a publish needs (REQ-WFL-025).
 *
 * An approval is where the loop lets go. The step opens the approval and the run stops; the
 * decision comes back later as an event, and `resumeFromApproval` picks the flow up from the step
 * it was sitting in. Neither half can lose the other: the decision is written and published in one
 * transaction, and the engine's own transaction is what moves the instance.
 */

export type RunResult =
  | { state: "ended"; status: "done" | "failed"; reason?: string }
  | { state: "waiting"; stepId: string };

type Runnable = {
  id: string;
  context: Record<string, unknown>;
  definition: FlowDefinition;
  nextStepId: string | null;
};

/** The instance as the engine sees it, or null when it is not running any more. */
async function runnable(db: SystemDb, instanceId: string): Promise<Runnable | null> {
  const row = await readRunnable(db, instanceId);
  if (!row || row.status !== "running") return null;
  return {
    id: row.id,
    context: row.context,
    definition: parseDefinition(row.definition),
    nextStepId: row.openStepId,
  };
}

/** Where a step sends the flow next, given what it decided. */
function nextOf(step: FlowStep, passed: boolean): string | null {
  if (step.type === "condition") return (passed ? step.whenTrue : step.whenFalse) ?? null;
  return step.next ?? null;
}

/** Where an approval's answer sends the flow (D-099). */
function afterDecision(step: FlowStep, decision: string): string | null {
  if (step.type !== "approval") return step.next ?? null;
  if (decision === "approve") return step.outcomes.approve ?? step.next ?? null;
  if (decision === "reject") return step.outcomes.reject ?? null;
  return step.outcomes.return ?? null;
}

/**
 * Who a step waits on (D-097, REQ-WFL-017). A named person is answered here; everything else is
 * asked of the owner relations the modules declare, so the engine never learns which module knows
 * about roles, sites or records.
 *
 * The two forms nothing answers yet — a relation to the record, a permission type — return null,
 * and a step with no owner stops the instance rather than waiting on nobody.
 */
export type OwnerRelations = {
  resolve: (db: SystemDb, code: string, argument: string | null) => Promise<string | null>;
};

async function ownerOf(
  db: SystemDb,
  relations: OwnerRelations,
  owner: { type: string; userId?: string; role?: string; relation?: string; permission?: string },
): Promise<string | null> {
  if (owner.type === "user") return owner.userId ?? null;
  if (owner.type === "role") return relations.resolve(db, "role.holder", owner.role ?? null);
  if (owner.type === "relation" && owner.relation) {
    return relations.resolve(db, owner.relation, null);
  }
  return null;
}

/**
 * Runs the instance as far as it can go. It stops at a step that waits for somebody, at the end of
 * the flow, or at a step the engine cannot take; the reason is always in the run log.
 */
export async function runInstance(
  db: SystemDb,
  instanceId: string,
  relations: OwnerRelations,
): Promise<RunResult | null> {
  const instance = await runnable(db, instanceId);
  if (!instance) return null;
  return runFrom(db, instanceId, instance.nextStepId ?? instance.definition.start, relations);
}

/** The loop itself, from a step the caller chose. */
async function runFrom(
  db: SystemDb,
  instanceId: string,
  from: string | null,
  relations: OwnerRelations,
): Promise<RunResult | null> {
  const instance = await runnable(db, instanceId);
  if (!instance) return null;
  let stepId: string | null = from;

  for (;;) {
    const step = stepOf(instance.definition, stepId);
    if (!step) {
      // A path that points nowhere is the end of the flow, not a fault (REQ-WFL-011).
      await endInstance(db, { instanceId, status: "done" });
      return { state: "ended", status: "done" };
    }

    if (!RUNNABLE_STEP_TYPES.includes(step.type)) {
      const reason = `motor bu adımı henüz yürütmüyor: ${step.type}`;
      await noteWaiting(db, { instanceId, stepId: step.id, detail: { reason } });
      await endInstance(db, { instanceId, status: "failed", failure: reason, stepId: step.id });
      return { state: "ended", status: "failed", reason };
    }

    const stateId = await enterStep(db, {
      instanceId,
      stepId: step.id,
      stepType: step.type,
    });
    // Null means the step limit was passed: the instance is already ended and the log says why.
    if (!stateId) return { state: "ended", status: "failed", reason: "adım sınırı" };

    if (step.type === "approval") {
      const owner = await ownerOf(db, relations, step.owner);
      if (!owner) {
        const reason = `adımın sahibi bulunamadı: ${step.id}`;
        await leaveStep(db, { stateId, status: "failed", outcome: "no_owner" });
        await endInstance(db, { instanceId, status: "failed", failure: reason, stepId: step.id });
        return { state: "ended", status: "failed", reason };
      }
      await requestApproval(db, {
        instanceId,
        stateId,
        stepId: step.id,
        title: step.title ?? "Onay",
        ownerUserId: owner,
      });
      // The step stays open on purpose: it is what the decision will come back to.
      await noteWaiting(db, { instanceId, stepId: step.id, detail: { waitingFor: "approval" } });
      return { state: "waiting", stepId: step.id };
    }

    if (step.type === "end") {
      await leaveStep(db, { stateId, status: "done", outcome: "end" });
      await endInstance(db, { instanceId, status: "done" });
      return { state: "ended", status: "done" };
    }

    let passed = true;
    if (step.type === "condition") {
      passed = testPasses(step.test, instance.context);
      await leaveStep(
        db,
        { stateId, status: "done", outcome: passed ? "true" : "false" },
        { field: step.test.field, op: step.test.op },
      );
    } else {
      // `start` carries nothing of its own; it is the door the flow came in through.
      await leaveStep(db, { stateId, status: "done", outcome: "next" });
    }

    stepId = nextOf(step, passed);
  }
}

/**
 * Starts whatever this event triggers and runs each one as far as it goes (REQ-WFL-007).
 *
 * The flows are found by what their published definition says it listens to, so a flow starts
 * listening the moment it is published and stops the moment it is disabled — there is no
 * registration to keep in step with the definitions.
 */
export async function runEventTriggers(
  db: SystemDb,
  event: {
    code: string;
    id: string;
    record?: { schema: string; table: string; id: string } | null;
    payload?: unknown;
  },
  relations: OwnerRelations,
): Promise<string[]> {
  const keys = await flowsListeningTo(db, event.code);

  const started: string[] = [];
  for (const key of keys) {
    const trigger: FlowTrigger = {
      flowKey: key,
      kind: "event",
      eventId: event.id,
      record: event.record ?? undefined,
      context: { event: { code: event.code }, record: event.payload ?? {} },
    };
    const instanceId = await startInstance(db, trigger);
    if (!instanceId) continue;
    started.push(instanceId);
    await runInstance(db, instanceId, relations);
  }
  return started;
}

/**
 * Picks the flow up where the decision left it (REQ-WFL-014, D-099).
 *
 * The step the approval belonged to is left with the answer as its outcome, and the flow carries
 * on down the path that answer names. An approval whose instance has since ended, or whose step
 * somebody already closed, changes nothing — which is what makes a repeated delivery harmless.
 */
export async function resumeFromApproval(
  db: SystemDb,
  approvalId: string,
  relations: OwnerRelations,
): Promise<RunResult | null> {
  const decided = await readDecision(db, approvalId);
  if (!decided) return null;

  const instance = await runnable(db, decided.instanceId);
  if (!instance) return null;

  const left = await leaveStep(db, {
    stateId: decided.stepStateId,
    status: "done",
    outcome: decided.decision,
  });
  if (!left) return null;

  const step = stepOf(instance.definition, instance.nextStepId);
  const next = step ? afterDecision(step, decided.decision) : null;
  if (!next) {
    await endInstance(db, { instanceId: decided.instanceId, status: "done" });
    return { state: "ended", status: "done" };
  }
  return runFrom(db, decided.instanceId, next, relations);
}
