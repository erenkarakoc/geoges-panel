import { readDefinitionOf, recordDryRunAsSystem } from "@/modules/wfl/data/flow-store";
import {
  endInstance,
  enterStep,
  flowsListeningTo,
  leaveStep,
  noteWaiting,
  readDecision,
  readRunnable,
  readStepRun,
  requestApproval,
  scheduleWake,
  startInstance,
  type FlowTrigger,
} from "@/modules/wfl/data/instance-store";
import {
  durationMs,
  parseDefinition,
  RUNNABLE_STEP_TYPES,
  stepOf,
  testPasses,
  type FlowDefinition,
  type FlowStep,
} from "@/modules/wfl/domain/definition";
import type { SystemDb } from "@/platform/jobs/types";

/**
 * The engine's loop (TASK-0117, `docs/architecture/WORKFLOW_ENGINE.md` sections 4 and 6).
 *
 * An instance is a state machine and this is what turns the handle: it enters a step, decides what
 * the step means, leaves it, and moves to the next until the flow ends or has to wait for somebody.
 * Everything happens inside the transaction it is given, so a step's effect and the record of
 * having taken it commit together — or neither does.
 *
 * Five of the fourteen steps are implemented: start, condition, approval, task and end. A step the
 * engine has not learned stops the flow with that step's name rather than being skipped.
 *
 * An approval or a task is where the loop lets go: the step is opened and the run stops, the answer
 * comes back later as an event, and `resumeFromApproval` or `resumeFromTask` picks the flow up from
 * the step it was sitting in. Neither half can lose the other — the answer is written and published
 * in one transaction, and the engine's own transaction is what moves the instance.
 *
 * **The dry run is this same loop.** What a step *does* — writing its state, opening an approval,
 * asking somebody else to act — is behind `StepSink`, and the dry run passes a sink that writes
 * nothing and remembers everything. That is SPIKE-05's finding made structural: a second evaluator
 * would be a second behaviour, and then the thing people test would not be the thing that runs.
 */

export type RunResult =
  | { state: "ended"; status: "done" | "failed"; reason?: string }
  | { state: "waiting"; stepId: string };

export type OwnerRelations = {
  resolve: (db: SystemDb, code: string, argument: string | null) => Promise<string | null>;
};

/**
 * What the engine is allowed to do to the rest of the panel: the catalog's actions, called by
 * code. The engine knows no module — it knows `task.open` (D-280, TASK-0118).
 */
export type CapabilityActions = {
  run: (db: SystemDb, code: string, input: unknown) => Promise<unknown>;
};

export type FlowRuntime = OwnerRelations & Partial<CapabilityActions>;

/** Everything a step does that leaves a mark. The dry run's sink leaves none. */
type StepSink = {
  enter(step: FlowStep): Promise<string | null>;
  leave(
    stateId: string,
    status: "done" | "failed",
    outcome: string,
    detail?: unknown,
  ): Promise<void>;
  end(status: "done" | "failed", failure?: string, stepId?: string): Promise<void>;
  wait(stepId: string, detail: unknown): Promise<void>;
  approval(stateId: string, step: FlowStep, ownerUserId: string): Promise<void>;
  action(code: string, input: unknown): Promise<void>;
  /** Asks to be woken at a time; the dry run is never actually woken. */
  sleep(stateId: string, wakeAt: Date): Promise<void>;
};

type Runnable = {
  id: string;
  context: Record<string, unknown>;
  definition: FlowDefinition;
  /** The step the instance is sitting in, when it is waiting inside one. */
  openStepId: string | null;
};

/** The instance as the engine sees it, or null when it is not running any more. */
async function runnable(db: SystemDb, instanceId: string): Promise<Runnable | null> {
  const row = await readRunnable(db, instanceId);
  if (!row || row.status !== "running") return null;
  return {
    id: row.id,
    context: row.context,
    definition: parseDefinition(row.definition),
    openStepId: row.openStepId,
  };
}

/** The sink that actually writes: every mark a real run leaves. */
function writingSink(db: SystemDb, instanceId: string, relations: FlowRuntime): StepSink {
  return {
    enter: (step) => enterStep(db, { instanceId, stepId: step.id, stepType: step.type }),
    async leave(stateId, status, outcome, detail) {
      await leaveStep(db, { stateId, status, outcome }, detail ?? {});
    },
    async end(status, failure, stepId) {
      await endInstance(db, { instanceId, status, failure, stepId });
    },
    async wait(stepId, detail) {
      await noteWaiting(db, { instanceId, stepId, detail });
    },
    async approval(stateId, step, ownerUserId) {
      await requestApproval(db, {
        instanceId,
        stateId,
        stepId: step.id,
        title: step.title ?? "Onay",
        ownerUserId,
      });
    },
    async action(code, input) {
      if (!relations.run) throw new Error(`no capability catalog is wired for ${code}`);
      await relations.run(db, code, input);
    },
    async sleep(stateId, wakeAt) {
      // The wake-up is a row in the database, so a server that restarts in the meantime still
      // wakes the flow (WORKFLOW_ENGINE section 4).
      await scheduleWake(db, { stepRunId: stateId, wakeAt });
    },
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
 * and a step with no owner stops the flow rather than waiting on nobody.
 */
async function ownerOf(
  db: SystemDb,
  relations: FlowRuntime,
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
 * The loop itself: the definition, where to start, what to write with, and what the flow carries.
 * The dry run gives it a sink that writes nothing; everything else is the same.
 */
async function walk(
  db: SystemDb,
  definition: FlowDefinition,
  from: string | null,
  sink: StepSink,
  context: Record<string, unknown>,
  relations: FlowRuntime,
): Promise<RunResult> {
  let stepId: string | null = from;

  for (;;) {
    const step = stepOf(definition, stepId);
    if (!step) {
      // A path that points nowhere is the end of the flow, not a fault (REQ-WFL-011).
      await sink.end("done");
      return { state: "ended", status: "done" };
    }

    if (!RUNNABLE_STEP_TYPES.includes(step.type)) {
      const reason = `motor bu adımı henüz yürütmüyor: ${step.type}`;
      await sink.wait(step.id, { reason });
      await sink.end("failed", reason, step.id);
      return { state: "ended", status: "failed", reason };
    }

    const stateId = await sink.enter(step);
    // Null means the step limit was passed: the instance is already ended and the log says why.
    if (!stateId) return { state: "ended", status: "failed", reason: "adım sınırı" };

    if (step.type === "notify") {
      const owner = await ownerOf(db, relations, step.owner);
      if (!owner) {
        const reason = `adımın sahibi bulunamadı: ${step.id}`;
        await sink.leave(stateId, "failed", "no_owner");
        await sink.end("failed", reason, step.id);
        return { state: "ended", status: "failed", reason };
      }
      // Notifying is an action of the catalog like any other; the engine does not write anybody's
      // notification itself (D-280).
      await sink.action("notification.send", {
        userId: owner,
        type: "workflow.notice",
        subject: step.subject,
        linkPath: "/today",
        sourceKey: `wfl:${stateId}`,
      });
      await sink.leave(stateId, "done", "sent", { owner });
      stepId = step.next ?? null;
      continue;
    }

    if (step.type === "wait") {
      const wakeAt = new Date(Date.now() + durationMs(step.after));
      await sink.sleep(stateId, wakeAt);
      await sink.wait(step.id, { waitingFor: "time", until: wakeAt.toISOString() });
      return { state: "waiting", stepId: step.id };
    }

    if (step.type === "approval" || step.type === "task") {
      const owner = await ownerOf(db, relations, step.owner);
      if (!owner) {
        const reason = `adımın sahibi bulunamadı: ${step.id}`;
        await sink.leave(stateId, "failed", "no_owner");
        await sink.end("failed", reason, step.id);
        return { state: "ended", status: "failed", reason };
      }
      if (step.type === "approval") {
        await sink.approval(stateId, step, owner);
      } else {
        await sink.action("task.open", {
          stepRunId: stateId,
          title: step.title ?? "Görev",
          assigneeUserId: owner,
          priority: step.priority,
        });
      }
      // The step stays open on purpose: it is what the answer will come back to.
      await sink.wait(step.id, { waitingFor: step.type, owner });
      return { state: "waiting", stepId: step.id };
    }

    if (step.type === "end") {
      await sink.leave(stateId, "done", "end");
      await sink.end("done");
      return { state: "ended", status: "done" };
    }

    let passed = true;
    if (step.type === "condition") {
      passed = testPasses(step.test, context);
      await sink.leave(stateId, "done", passed ? "true" : "false", {
        field: step.test.field,
        op: step.test.op,
      });
    } else {
      // `start` carries nothing of its own; it is the door the flow came in through.
      await sink.leave(stateId, "done", "next");
    }

    stepId = nextOf(step, passed);
  }
}

/** Runs the instance as far as it can go. */
export async function runInstance(
  db: SystemDb,
  instanceId: string,
  relations: FlowRuntime,
): Promise<RunResult | null> {
  const instance = await runnable(db, instanceId);
  if (!instance) return null;
  // Sitting inside a step means waiting on somebody: an approval, a task, a timer. Running the
  // instance again — which a repeated delivery does — must change nothing, and re-entering the
  // step it is already in is exactly what a flow must never do.
  if (instance.openStepId) return { state: "waiting", stepId: instance.openStepId };
  return walk(
    db,
    instance.definition,
    instance.definition.start,
    writingSink(db, instanceId, relations),
    instance.context,
    relations,
  );
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
  relations: FlowRuntime,
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
 * Picks the flow up where a decision left it (REQ-WFL-014, D-099).
 *
 * The step the approval belonged to is left with the answer as its outcome, and the flow carries on
 * down the path that answer names. An approval whose instance has since ended, or whose step
 * somebody already closed, changes nothing — which is what makes a repeated delivery harmless.
 */
export async function resumeFromApproval(
  db: SystemDb,
  approvalId: string,
  relations: FlowRuntime,
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

  const step = stepOf(instance.definition, instance.openStepId);
  const next = step ? afterDecision(step, decided.decision) : null;
  return walk(
    db,
    instance.definition,
    next,
    writingSink(db, decided.instanceId, relations),
    instance.context,
    relations,
  );
}

/**
 * Picks the flow up when the task its step opened is closed (REQ-TSK-004, REQ-WFL-005).
 *
 * The step run is on the event, because the task carries it: the flow recognises its own task
 * without reading TSK's tables. A task that belongs to no flow, or to a step somebody already
 * closed, changes nothing.
 */
export async function resumeFromTask(
  db: SystemDb,
  stepRunId: string,
  relations: FlowRuntime,
): Promise<RunResult | null> {
  const open = await readStepRun(db, stepRunId);
  if (!open) return null;

  const instance = await runnable(db, open.instanceId);
  if (!instance) return null;

  const left = await leaveStep(db, { stateId: stepRunId, status: "done", outcome: "completed" });
  if (!left) return null;

  const step = stepOf(instance.definition, open.stepId);
  return walk(
    db,
    instance.definition,
    step?.next ?? null,
    writingSink(db, open.instanceId, relations),
    instance.context,
    relations,
  );
}

export type DryRunStep = {
  stepId: string;
  type: string;
  outcome: string;
  /** Who the step would wait on, worked out for real (REQ-WFL-025). */
  owner?: string | null;
};

export type DryRunReport = {
  passed: boolean;
  /** Every step the flow would take, in order. */
  steps: DryRunStep[];
  /** Why it would stop, when it would stop badly. */
  failure?: string;
  /** Where it ends up: finished, or waiting on somebody. */
  ends: "done" | "failed" | "waiting";
};

/**
 * The dry run a publish needs (REQ-WFL-025).
 *
 * The same loop, the same conditions against the same real data, the same owners worked out for
 * real — and a sink that writes nothing: no instance, no step state, no approval, no task, no
 * notification. What comes back is the path the flow would take, which is what the designer is
 * shown and what the publish is checked against.
 */
export async function dryRun(
  db: SystemDb,
  definition: FlowDefinition,
  context: Record<string, unknown>,
  relations: FlowRuntime,
): Promise<DryRunReport> {
  const steps: DryRunStep[] = [];
  // Held in an object rather than in local variables: the sink writes them from inside closures,
  // which is exactly the case the compiler cannot narrow.
  const outcome: { ends: DryRunReport["ends"]; failure?: string } = { ends: "done" };
  let entered: FlowStep | null = null;
  let counter = 0;

  const sink: StepSink = {
    async enter(step) {
      entered = step;
      counter += 1;
      // The engine's own limit, so a loop that would never end does not hang the dry run either.
      return counter > 500 ? null : `dry-${counter}`;
    },
    async leave(_stateId, _status, outcome) {
      if (entered) steps.push({ stepId: entered.id, type: entered.type, outcome });
    },
    async end(status, why) {
      outcome.ends = status;
      outcome.failure = why;
    },
    async wait(stepId, detail) {
      const owner = (detail as { owner?: string } | null)?.owner ?? null;
      const step = entered;
      if (step?.id === stepId && (step.type === "approval" || step.type === "task")) {
        steps.push({ stepId, type: step.type, outcome: "waiting", owner });
        outcome.ends = "waiting";
      }
    },
    async approval() {
      // Nothing: a dry run never puts anything in front of anybody.
    },
    async action() {
      // Nothing: a dry run calls no action, which is what keeps it from opening real work.
    },
    async sleep(_stateId, wakeAt) {
      if (entered) {
        steps.push({
          stepId: entered.id,
          type: entered.type,
          outcome: `waiting until ${wakeAt.toISOString()}`,
        });
      }
      outcome.ends = "waiting";
    },
  };

  const result = await walk(db, definition, definition.start, sink, context, relations);
  if (result.state === "waiting") outcome.ends = "waiting";
  return {
    passed: outcome.ends !== "failed",
    steps,
    failure: outcome.failure,
    ends: outcome.ends,
  };
}

/**
 * Runs a version dry and writes the evidence a publish will look for (REQ-WFL-025).
 *
 * The sample the conditions are evaluated against is given by whoever asked for the run — the
 * designer picks a real record, so the branches are decided by real data, which is the whole point
 * of a dry run rather than a schema check.
 */
export async function dryRunVersion(
  db: SystemDb,
  versionId: string,
  context: Record<string, unknown>,
  relations: FlowRuntime,
): Promise<DryRunReport> {
  const version = await readDefinitionOf(db, versionId);
  if (!version) {
    return { passed: false, steps: [], failure: "böyle bir akış sürümü yok", ends: "failed" };
  }

  let report: DryRunReport;
  try {
    report = await dryRun(db, parseDefinition(version.definition), context, relations);
  } catch (error) {
    // A definition that will not even parse is a failed dry run, not a crash: the designer is
    // told what is wrong with it and the publish stays shut.
    report = {
      passed: false,
      steps: [],
      failure: error instanceof Error ? error.message : "tanım okunamadı",
      ends: "failed",
    };
  }

  await recordDryRunAsSystem(db, {
    versionId,
    passed: report.passed,
    summary: { steps: report.steps, ends: report.ends, failure: report.failure ?? null },
  });
  return report;
}

/**
 * Wakes a flow that was waiting for a time to pass (REQ-WFL-005, WORKFLOW_ENGINE section 4).
 *
 * The wake-up is a scheduled job, so a server that restarts in the meantime changes nothing; the
 * job carries the step run, and a step somebody already left is a wake-up that does nothing.
 */
export async function resumeFromWait(
  db: SystemDb,
  stepRunId: string,
  relations: FlowRuntime,
): Promise<RunResult | null> {
  const open = await readStepRun(db, stepRunId);
  if (!open) return null;

  const instance = await runnable(db, open.instanceId);
  if (!instance) return null;

  const left = await leaveStep(db, { stateId: stepRunId, status: "done", outcome: "woke" });
  if (!left) return null;

  const step = stepOf(instance.definition, open.stepId);
  return walk(
    db,
    instance.definition,
    step?.next ?? null,
    writingSink(db, open.instanceId, relations),
    instance.context,
    relations,
  );
}
