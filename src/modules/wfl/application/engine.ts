import { istanbulDay, istanbulMinutes, minutesOf } from "@/platform/time/istanbul";
import { readDefinitionOf, recordDryRunAsSystem } from "@/modules/wfl/data/flow-store";
import {
  ConditionTimeout,
  countInWindow,
  endInstance,
  enterStep,
  clockFlows,
  flowsListeningTo,
  leaveStep,
  noteWaiting,
  readDecision,
  readInstanceFlow,
  readRunnable,
  branchParent,
  branchState,
  escalateApproval,
  readStepRun,
  holdLock,
  requestApproval,
  startBranch,
  startSubflow,
  scheduleEscalation,
  scheduleWake,
  startInstance,
  type FlowTrigger,
} from "@/modules/wfl/data/instance-store";
import {
  countPasses,
  durationMs,
  isWindowTest,
  parseDefinition,
  RUNNABLE_STEP_TYPES,
  stepOf,
  testPasses,
  type FlowDefinition,
  type FlowStep,
} from "@/modules/wfl/domain/definition";
import { stepLabel } from "@/modules/wfl/domain/graph";
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

/**
 * How long a looking-back condition may take (WORKFLOW_ENGINE section 7, D-100). An engineering
 * limit rather than a designer's setting: a flow says what it wants counted, not how long the
 * database may spend counting it.
 */
const conditionLimitMs = 2000;

/** A lock step in a flow that is about no record at all (REQ-WFL-029). */
export class LockWithoutRecord extends Error {
  constructor(stepId: string) {
    super(`kilit adımı bir kayıt istiyor, akışın kaydı yok: ${stepId}`);
    this.name = "LockWithoutRecord";
  }
}

export type RunResult =
  | { state: "ended"; status: "done" | "failed"; reason?: string }
  | { state: "waiting"; stepId: string };

/** The four ways a step can name who it waits on (D-097). */
export type OwnerRule = {
  type: string;
  userId?: string;
  role?: string;
  relation?: string;
  permission?: string;
};

export type OwnerRelations = {
  /** `record` is the record the flow is about, for a relation that reads it (D-298). */
  resolve: (
    db: SystemDb,
    code: string,
    argument: string | null,
    record?: { schema: string; table: string; id: string } | null,
  ) => Promise<string | null>;
};

/**
 * What the engine is allowed to do to the rest of the panel: the catalog's actions, called by
 * code. The engine knows no module — it knows `task.open` (D-280, TASK-0118).
 */
export type CapabilityActions = {
  run: (db: SystemDb, code: string, input: unknown) => Promise<unknown>;
};

/** One thing a "her biri için" step will run for; the owning module says what they are. */
export type FlowListItem = { id: string; label?: string; item?: Record<string, unknown> };

/**
 * The lists the modules publish (REQ-WFL-009, D-096): "this person's open handovers". The engine
 * knows no module, so it asks by code, for the record the flow is about, and hands the module the
 * same time limit a looking-back condition has (D-222): a list that cannot be read in time stops
 * the flow instead of running half the work.
 */
export type CapabilityLists = {
  list: (
    db: SystemDb,
    code: string,
    ask: { record: { schema: string; table: string; id: string } | null; limitMs: number },
  ) => Promise<FlowListItem[]>;
};

export type FlowRuntime = OwnerRelations & Partial<CapabilityActions> & Partial<CapabilityLists>;

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
  /**
   * Opens the approval and answers with its id, or null when nothing was really opened. The owner is
   * a person when the step named one and null when it addressed a group; the rule says which.
   */
  approval(
    stateId: string,
    step: FlowStep,
    ownerUserId: string | null,
    ownerRule: OwnerRule,
  ): Promise<string | null>;
  /** Holds a transition shut on the record the flow is about (REQ-WFL-029). */
  lock(step: FlowStep, transition: string, reason: string): Promise<void>;
  /** Opens one run per path and answers with their ids; a dry run opens none (REQ-WFL-006). */
  branch(stateId: string, paths: readonly string[]): Promise<string[]>;
  /** Hands the work to another flow and answers with its run, or null (REQ-WFL-011). */
  subflow(
    stateId: string,
    flowKey: string,
    context: Record<string, unknown>,
  ): Promise<string | null>;
  /** Opens one run per item of a list, each carrying its item (REQ-WFL-009). */
  branchItems(
    stateId: string,
    bodyStepId: string,
    items: readonly FlowListItem[],
  ): Promise<string[]>;
  /** The approval's patience: after this, it moves to somebody else. */
  escalate(approvalId: string | null, at: Date, to: OwnerRule): Promise<void>;
  action(code: string, input: unknown): Promise<unknown>;
  /** Asks to be woken at a time; the dry run is never actually woken. */
  sleep(stateId: string, wakeAt: Date): Promise<void>;
};

type Runnable = {
  id: string;
  context: Record<string, unknown>;
  definition: FlowDefinition;
  /** The step the instance is sitting in, when it is waiting inside one. */
  openStepId: string | null;
  /** Where a branch begins; null for a run of its own (REQ-WFL-006). */
  startStepId: string | null;
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
    startStepId: row.startStepId,
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
    approval: (stateId, step, ownerUserId, ownerRule) =>
      requestApproval(db, {
        instanceId,
        ownerRule,
        ownerUserId,
        stateId,
        stepId: step.id,
        title: step.title ?? "Onay",
      }),
    async escalate(approvalId, at, to) {
      if (!approvalId) return;
      await scheduleEscalation(db, { approvalId, at, to });
    },
    async lock(step, transition, reason) {
      const where = await readInstanceFlow(db, instanceId);
      if (!where?.record) throw new LockWithoutRecord(step.id);
      await holdLock(db, {
        record: where.record,
        transition,
        reason,
        instanceId,
        stepId: step.id,
      });
    },
    async branch(stateId, paths) {
      // Every branch is opened before any of them runs: a branch that finished while the others
      // were still being written would look like "all of them are done" to the join.
      const opened: string[] = [];
      for (const path of paths) {
        const childId = await startBranch(db, {
          parentInstanceId: instanceId,
          parentStepStateId: stateId,
          startStepId: path,
          label: path,
        });
        if (childId) opened.push(childId);
      }
      return opened;
    },
    subflow: (stateId, flowKey, context) =>
      startSubflow(db, {
        parentInstanceId: instanceId,
        parentStepStateId: stateId,
        flowKey,
        context,
      }),
    async branchItems(stateId, bodyStepId, items) {
      const opened: string[] = [];
      for (const one of items) {
        const childId = await startBranch(db, {
          parentInstanceId: instanceId,
          parentStepStateId: stateId,
          startStepId: bodyStepId,
          label: (one.label ?? one.id).slice(0, 80),
          // The branch carries its own item, so every step inside the body reads `item.…`.
          context: { item: { id: one.id, ...(one.item ?? {}) } },
        });
        if (childId) opened.push(childId);
      }
      return opened;
    },
    async action(code, input) {
      if (!relations.run) throw new Error(`no capability catalog is wired for ${code}`);
      return relations.run(db, code, input);
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
 * A relation is handed the record the flow is about, so "the item's responsible person" can be
 * answered by the module that owns the item (D-298). A permission type is not answered yet and
 * returns null; a step with no owner stops the flow rather than waiting on nobody.
 */
async function ownerOf(
  db: SystemDb,
  relations: FlowRuntime,
  owner: OwnerRule,
  instanceId?: string,
): Promise<string | null> {
  if (owner.type === "user") return owner.userId ?? null;
  if (owner.type === "role") return relations.resolve(db, "role.holder", owner.role ?? null);
  if (owner.type === "relation" && owner.relation) {
    const where = instanceId ? await readInstanceFlow(db, instanceId) : null;
    return relations.resolve(db, owner.relation, null, where?.record ?? null);
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
  /** The running instance, when there is one; a dry run counts nothing and has none. */
  instanceId?: string,
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
      const reason = `Bu adımı motor henüz yürütmüyor: ${stepLabel(step)}.`;
      await sink.wait(step.id, { reason });
      await sink.end("failed", reason, step.id);
      return { state: "ended", status: "failed", reason };
    }

    const stateId = await sink.enter(step);
    // Null means the step limit was passed: the instance is already ended and the log says why.
    if (!stateId)
      return { state: "ended", status: "failed", reason: "Akış izin verilen adım sayısını aştı." };

    if (step.type === "lock") {
      // A lock is about a record, and a flow triggered by a clock may have none: that is a
      // definition mistake, and it stops the flow with its own name rather than silently doing
      // nothing (REQ-WFL-029).
      try {
        await sink.lock(step, step.transition, step.reason);
      } catch (error) {
        if (!(error instanceof LockWithoutRecord)) throw error;
        await sink.leave(stateId, "failed", "no_record");
        await sink.end("failed", error.message, step.id);
        return { state: "ended", status: "failed", reason: error.message };
      }
      await sink.leave(stateId, "done", "held", {
        transition: step.transition,
        reason: step.reason,
      });
      stepId = step.next ?? null;
      continue;
    }

    if (step.type === "parallel") {
      // A dry run has no runs to open, so it walks the paths itself: the designer is shown what
      // each branch would do, in the order they are written (REQ-WFL-025).
      if (!instanceId) {
        await sink.leave(stateId, "done", "branches", { paths: step.paths });
        let waits = false;
        for (const path of step.paths) {
          const branch = await walk(db, definition, path, sink, context, relations);
          if (branch.state === "ended" && branch.status === "failed") return branch;
          if (branch.state === "waiting") waits = true;
        }
        // A path that waits on somebody holds the whole step: the report stops here rather than
        // showing a join that would not happen until that person answered.
        if (waits) {
          await sink.wait(step.id, { waitingFor: "branches", opened: step.paths.length });
          return { state: "waiting", stepId: step.id };
        }
        stepId = step.next ?? null;
        continue;
      }

      const opened = await sink.branch(stateId, step.paths);
      if (opened.length === 0) {
        // Nothing could be opened — the run is no longer running, or the depth limit was hit.
        const reason = `${stepLabel(step)} adımı tek bir dal açamadı.`;
        await sink.leave(stateId, "failed", "no_branch");
        await sink.end("failed", reason, step.id);
        return { state: "ended", status: "failed", reason };
      }
      // The parent sits in this step until the last branch ends; the branches run on their own.
      await sink.wait(step.id, { waitingFor: "branches", opened: opened.length });
      for (const childId of opened) await runBranch(db, childId, relations);
      return { state: "waiting", stepId: step.id };
    }

    if (step.type === "record") {
      // The flow may make a draft record and may move a record to another state, and never
      // finalises a ledger (REQ-WFL-010, D-080): the module that owns the record refuses that
      // last one, and the engine reports the refusal rather than carrying on as if it had worked.
      const code = step.action === "create" ? "record.create" : "record.set_status";
      if (!instanceId) {
        await sink.leave(
          stateId,
          "done",
          code === "record.create" ? "would_create" : "would_set_status",
          { recordType: step.recordType, status: step.status },
        );
        stepId = step.next ?? null;
        continue;
      }
      const where = await readInstanceFlow(db, instanceId);
      try {
        const written = await sink.action(code, {
          stepRunId: stateId,
          recordType: step.recordType ?? null,
          status: step.status ?? null,
          values: step.values ?? {},
          record: where?.record ?? null,
          // What the record's own history has to show: which flow, which version, which step.
          flow: { key: where?.flowKey ?? null, version: where?.version ?? null, stepId: step.id },
        });
        await sink.leave(stateId, "done", step.action, {
          recordType: step.recordType,
          status: step.status,
          written,
        });
      } catch (error) {
        const reason = `${stepLabel(step)} adımı tamamlanamadı: ${(error as Error).message}`;
        await sink.leave(stateId, "failed", "refused", { recordType: step.recordType });
        await sink.end("failed", reason, step.id);
        return { state: "ended", status: "failed", reason };
      }
      stepId = step.next ?? null;
      continue;
    }

    if (step.type === "subflow") {
      if (!instanceId) {
        // A dry run names the flow it would hand the work to and walks on: what that flow does
        // is its own dry run, and the designer runs it there (REQ-WFL-025).
        await sink.leave(stateId, "done", "would_subflow", { flow: step.flow });
        stepId = step.next ?? null;
        continue;
      }
      const childId = await sink.subflow(stateId, step.flow, context);
      if (!childId) {
        const reason = `${stepLabel(step)} adımının çalıştıracağı akış yayımlanmamış.`;
        await sink.leave(stateId, "failed", "no_subflow", { flow: step.flow });
        await sink.end("failed", reason, step.id);
        return { state: "ended", status: "failed", reason };
      }
      await sink.wait(step.id, { waitingFor: "subflow", flow: step.flow });
      await runBranch(db, childId, relations);
      return { state: "waiting", stepId: step.id };
    }

    if (step.type === "for_each") {
      // The list is the owning module's answer, read for the record the flow is about and under
      // the same time limit a looking-back condition has (REQ-WFL-009, D-222).
      if (!relations.list) {
        const reason = `${stepLabel(step)} adımının listesi bu panelde tanımlı değil.`;
        await sink.leave(stateId, "failed", "no_list");
        await sink.end("failed", reason, step.id);
        return { state: "ended", status: "failed", reason };
      }
      const where = instanceId ? await readInstanceFlow(db, instanceId) : null;
      let items: FlowListItem[];
      try {
        items = await relations.list(db, step.list, {
          record: where?.record ?? null,
          limitMs: conditionLimitMs,
        });
      } catch (error) {
        const reason = `${stepLabel(step)} adımının listesi okunamadı: ${(error as Error).message}`;
        await sink.leave(stateId, "failed", "list_failed", { list: step.list });
        await sink.end("failed", reason, step.id);
        return { state: "ended", status: "failed", reason };
      }

      if (items.length > step.limit) {
        // Doing part of the work quietly is the one answer a person cannot act on.
        const reason =
          `${stepLabel(step)} adımının listesi izin verilenden uzun: ` +
          `${items.length} öğe, sınır ${step.limit}.`;
        await sink.leave(stateId, "failed", "too_many", { list: step.list, items: items.length });
        await sink.end("failed", reason, step.id);
        return { state: "ended", status: "failed", reason };
      }

      if (items.length === 0) {
        // An empty list is an answer, not a fault: there is nothing to do for each of nothing.
        await sink.leave(stateId, "done", "empty", { list: step.list });
        stepId = step.next ?? null;
        continue;
      }

      if (!instanceId) {
        // A dry run reads the real list and walks the body once, for the first item, so the
        // designer sees what each round would do without a report as long as the list.
        await sink.leave(stateId, "done", "items", { list: step.list, items: items.length });
        const first = items[0];
        const body = await walk(
          db,
          definition,
          step.body,
          sink,
          { ...context, item: { id: first.id, ...(first.item ?? {}) } },
          relations,
        );
        if (body.state === "ended" && body.status === "failed") return body;
        if (body.state === "waiting") {
          await sink.wait(step.id, { waitingFor: "items", items: items.length });
          return { state: "waiting", stepId: step.id };
        }
        stepId = step.next ?? null;
        continue;
      }

      const opened = await sink.branchItems(stateId, step.body, items);
      if (opened.length === 0) {
        const reason = `${stepLabel(step)} adımı listedeki öğeler için dal açamadı.`;
        await sink.leave(stateId, "failed", "no_branch");
        await sink.end("failed", reason, step.id);
        return { state: "ended", status: "failed", reason };
      }
      await sink.wait(step.id, { waitingFor: "items", opened: opened.length, list: step.list });
      for (const childId of opened) await runBranch(db, childId, relations);
      return { state: "waiting", stepId: step.id };
    }

    if (step.type === "join") {
      // The paths are already back together: the parent only reaches a join after its branches
      // have ended (REQ-WFL-006). It carries nothing of its own.
      await sink.leave(stateId, "done", "joined");
      stepId = step.next ?? null;
      continue;
    }

    if (step.type === "escalate") {
      // Raising something is not waiting for it (D-282): the person above is given a task and
      // told about it, and the flow carries on. Both go through the catalog's actions, so the
      // engine still writes nobody's task and nobody's notification itself.
      const above = await ownerOf(db, relations, step.to, instanceId);
      if (!above) {
        const reason = `${stepLabel(step)} adımında haber verilecek kişi bulunamadı.`;
        await sink.leave(stateId, "failed", "no_owner");
        await sink.end("failed", reason, step.id);
        return { state: "ended", status: "failed", reason };
      }
      await sink.action("task.open", {
        stepRunId: stateId,
        title: step.subject,
        assigneeUserId: above,
        priority: "high",
      });
      await sink.action("notification.send", {
        userId: above,
        type: "workflow.escalation",
        subject: step.subject,
        linkPath: "/today",
        sourceKey: `wfl:escalate:${stateId}`,
      });
      await sink.leave(stateId, "done", "raised", { to: above });
      stepId = step.next ?? null;
      continue;
    }

    if (step.type === "notify") {
      const owner = await ownerOf(db, relations, step.owner, instanceId);
      if (!owner) {
        const reason = `${stepLabel(step)} adımının kime düşeceği bulunamadı.`;
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
      // An approval addressed by role or by permission belongs to **whoever holds it** and any one
      // of them answers (REQ-IAM-025, REQ-IAM-026): the rule travels with the approval and the
      // database works out who may see and decide from live assignments, so somebody leaving or
      // changing role needs no repair. A task is different — somebody has to do it — so it is still
      // given to one person.
      const group =
        step.type === "approval" &&
        (step.owner.type === "role" || step.owner.type === "permission");
      const owner = group ? null : await ownerOf(db, relations, step.owner, instanceId);
      if (!owner && !group) {
        const reason = `${stepLabel(step)} adımının kime düşeceği bulunamadı.`;
        await sink.leave(stateId, "failed", "no_owner");
        await sink.end("failed", reason, step.id);
        return { state: "ended", status: "failed", reason };
      }
      if (step.type === "approval") {
        const approvalId = await sink.approval(stateId, step, owner, step.owner);
        if (step.escalation) {
          await sink.escalate(
            approvalId,
            new Date(Date.now() + durationMs(step.escalation.after)),
            step.escalation.to,
          );
        }
      } else {
        await sink.action("task.open", {
          stepRunId: stateId,
          title: step.title ?? "Görev",
          assigneeUserId: owner as string,
          priority: step.priority,
        });
      }
      // The step stays open on purpose: it is what the answer will come back to. The rule is in the
      // log as well, because "why was this with them" is asked about finished runs too.
      await sink.wait(step.id, { waitingFor: step.type, owner, rule: step.owner });
      return { state: "waiting", stepId: step.id };
    }

    if (step.type === "end") {
      await sink.leave(stateId, "done", "end");
      await sink.end("done");
      return { state: "ended", status: "done" };
    }

    let passed = true;
    if (step.type === "condition") {
      const test = step.test;

      // A condition that looks back is a counting query with a limit of its own; running out of
      // time stops the flow with the reason rather than quietly answering "no" (REQ-WFL-008).
      if (isWindowTest(test)) {
        if (!instanceId) {
          // A dry run has no history of its own to count, and says so rather than inventing one.
          await sink.leave(stateId, "done", "unknown", { countOf: test.countOf });
          stepId = step.whenTrue ?? step.next ?? null;
          continue;
        }
        const where = await readInstanceFlow(db, instanceId);
        try {
          const count = await countInWindow(db, {
            countOf: test.countOf,
            withinDays: test.withinDays,
            flowId: where?.flowId ?? "",
            record: where?.record ?? null,
            limitMs: conditionLimitMs,
          });
          passed = countPasses(test, count);
          await sink.leave(stateId, "done", passed ? "true" : "false", {
            countOf: test.countOf,
            withinDays: test.withinDays,
            count,
          });
        } catch (error) {
          if (!(error instanceof ConditionTimeout)) throw error;
          await sink.leave(stateId, "failed", "timeout", { countOf: test.countOf });
          await sink.end("failed", error.message, step.id);
          return { state: "ended", status: "failed", reason: error.message };
        }
        stepId = passed ? (step.whenTrue ?? null) : (step.whenFalse ?? null);
        continue;
      }

      passed = testPasses(test, context);
      await sink.leave(stateId, "done", passed ? "true" : "false", {
        field: test.field,
        op: test.op,
      });
    } else {
      // `start` carries nothing of its own; it is the door the flow came in through.
      await sink.leave(stateId, "done", "next");
    }

    stepId = nextOf(step, passed);
  }
}

/**
 * Runs one branch as far as it goes, and joins its parent when it was the last one (REQ-WFL-006).
 * A branch is an ordinary run: it may wait on an approval, a task or a timer, and then it is the
 * answer to that which brings it back here.
 */
async function runBranch(db: SystemDb, childId: string, relations: FlowRuntime): Promise<void> {
  const child = await runnable(db, childId);
  if (!child) return;
  const result = await walk(
    db,
    child.definition,
    child.startStepId ?? child.definition.start,
    writingSink(db, childId, relations),
    child.context,
    relations,
    childId,
  );
  if (result.state === "ended") await joinParent(db, childId, relations);
}

/**
 * Brings a parent back to life once its last branch has ended (REQ-WFL-006).
 *
 * A branch that failed fails the parent with the branch's own reason: a process that quietly
 * carried on without half its work is worse than one that stops and says what stopped it. The
 * parent may itself be a branch, so the same question is asked one level up.
 */
async function joinParent(db: SystemDb, childId: string, relations: FlowRuntime): Promise<void> {
  const parent = await branchParent(db, childId);
  if (!parent) return;
  const state = await branchState(db, parent.parentStepStateId);
  if (state.running > 0) return;

  const run = await runnable(db, parent.parentInstanceId);
  // The parent is only waiting in the step that opened the branches; anything else means somebody
  // has already moved it on, and a repeated delivery must not move it twice.
  if (!run || !run.openStepId) return;
  const step = stepOf(run.definition, run.openStepId);
  // Parallel paths, the items of a "her biri için" and a subflow all wait on children the same
  // way; anything else means somebody has already moved the parent on.
  const waitsOnBranches =
    step?.type === "parallel" || step?.type === "for_each" || step?.type === "subflow";
  if (!waitsOnBranches) return;

  if (state.failed > 0) {
    const reason = state.firstFailure ?? `${stepLabel(step)} adımının bir dalı tamamlanamadı.`;
    await leaveStep(
      db,
      { stateId: parent.parentStepStateId, status: "failed", outcome: "branch_failed" },
      { branches: state.opened, failed: state.failed },
    );
    await endInstance(db, {
      instanceId: parent.parentInstanceId,
      status: "failed",
      failure: reason,
      stepId: step.id,
    });
    await joinParent(db, parent.parentInstanceId, relations);
    return;
  }

  await leaveStep(
    db,
    { stateId: parent.parentStepStateId, status: "done", outcome: "joined" },
    { branches: state.opened },
  );
  const result = await walk(
    db,
    run.definition,
    step.next ?? null,
    writingSink(db, parent.parentInstanceId, relations),
    run.context,
    relations,
    parent.parentInstanceId,
  );
  if (result.state === "ended") await joinParent(db, parent.parentInstanceId, relations);
}

/**
 * Runs, and tells the parent when this was a branch that just ended (REQ-WFL-006). Every door a
 * run can end through — the first walk, an approval, a task, a timer — comes through here.
 */
async function walkAndJoin(
  db: SystemDb,
  instanceId: string,
  definition: FlowDefinition,
  from: string | null,
  context: Record<string, unknown>,
  relations: FlowRuntime,
): Promise<RunResult> {
  const result = await walk(
    db,
    definition,
    from,
    writingSink(db, instanceId, relations),
    context,
    relations,
    instanceId,
  );
  if (result.state === "ended") await joinParent(db, instanceId, relations);
  return result;
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
  return walkAndJoin(
    db,
    instanceId,
    instance.definition,
    instance.startStepId ?? instance.definition.start,
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
  const listening = await flowsListeningTo(db, event.code);
  const context = { event: { code: event.code }, record: event.payload ?? {} };

  const started: string[] = [];
  for (const flow of listening) {
    // A threshold flow hears the same event as anybody else and then asks whether it is the one
    // it was waiting for: "when a price changes by more than ten per cent" (D-103). There is no
    // standing query behind it — the event brings the value with it.
    if (flow.triggerType === "threshold") {
      const test = flow.test;
      if (!test || isWindowTest(test) || !testPasses(test as never, context)) continue;
    }
    const trigger: FlowTrigger = {
      flowKey: flow.key,
      kind: "event",
      eventId: event.id,
      record: event.record ?? undefined,
      context,
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
  return walkAndJoin(
    db,
    decided.instanceId,
    instance.definition,
    next,
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
  return walkAndJoin(
    db,
    open.instanceId,
    instance.definition,
    step?.next ?? null,
    instance.context,
    relations,
  );
}

export type DryRunStep = {
  stepId: string;
  type: string;
  /** The engine's own word for what the step did; a screen translates it (TASK-0119). */
  outcome: string;
  /** How the step ended, so a screen can say something sensible about a word it does not know. */
  status: "done" | "failed" | "waiting";
  /** What the outcome is about: an action's code, another flow's key, a transition's name. */
  about?: string;
  /** When the step would act, for a wait or an escalation that has not happened yet. */
  at?: Date;
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
    async leave(_stateId, status, outcome, detail) {
      if (!entered) return;
      // What the outcome is *about* travels with the step's own detail; the report carries it so a
      // screen can say "şu akışa devreder" without knowing the engine's words.
      const said = detail as { flow?: string; recordType?: string; list?: string } | undefined;
      steps.push({
        about: said?.flow ?? said?.recordType ?? said?.list,
        outcome,
        status,
        stepId: entered.id,
        type: entered.type,
      });
    },
    async end(status, why) {
      outcome.ends = status;
      outcome.failure = why;
    },
    async wait(stepId, detail) {
      const owner = (detail as { owner?: string } | null)?.owner ?? null;
      const step = entered;
      if (step?.id === stepId && (step.type === "approval" || step.type === "task")) {
        steps.push({ stepId, type: step.type, outcome: "waiting", status: "waiting", owner });
        outcome.ends = "waiting";
      }
    },
    async approval() {
      // Nothing: a dry run never puts anything in front of anybody.
      return null;
    },
    async branch() {
      // A dry run opens no runs; the loop walks each path itself, so the report shows them.
      return [];
    },
    async branchItems() {
      return [];
    },
    async subflow() {
      // A dry run starts no other flow; the report says which one it would hand the work to.
      return null;
    },
    async lock(step, transition) {
      steps.push({
        about: transition,
        outcome: "would_hold",
        status: "done",
        stepId: step.id,
        type: step.type,
      });
    },
    async escalate(_approvalId, at) {
      if (entered) {
        steps.push({
          at,
          outcome: "would_escalate",
          status: "done",
          stepId: entered.id,
          type: entered.type,
        });
      }
    },
    async action() {
      // Nothing: a dry run calls no action, which is what keeps it from opening real work.
      return null;
    },
    async sleep(_stateId, wakeAt) {
      if (entered) {
        steps.push({
          at: wakeAt,
          outcome: "would_wait",
          status: "waiting",
          stepId: entered.id,
          type: entered.type,
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
  return walkAndJoin(
    db,
    open.instanceId,
    instance.definition,
    step?.next ?? null,
    instance.context,
    relations,
  );
}

/**
 * The slot a clock-driven flow is being started for (REQ-WFL-007).
 *
 * "Every day at 07:30" has one slot a day; "every thirty minutes" has one per half hour, counted
 * from midnight in Istanbul, which is the panel's day (D-215). The slot is what keeps a second
 * run from opening when the scheduler runs the round twice or a worker picks the same minute up
 * after a restart.
 */
export function clockSlot(
  trigger: { dailyAt: string | null; everyMinutes: number | null; monthlyOn?: number | null },
  now: Date,
): string | null {
  const day = istanbulDay(now);
  const minutes = istanbulMinutes(now);
  if (trigger.monthlyOn && trigger.dailyAt) {
    // A month is a slot of its own: "the 25th at 06:00" belongs to that month and to no other, so a
    // round that runs again the same afternoon finds the slot taken and starts nothing.
    if (Number(day.slice(8, 10)) !== trigger.monthlyOn) return null;
    return minutes >= minutesOf(trigger.dailyAt)
      ? `${day.slice(0, 7)}/${day}@${trigger.dailyAt}`
      : null;
  }
  if (trigger.dailyAt) {
    return minutes >= minutesOf(trigger.dailyAt) ? `${day}@${trigger.dailyAt}` : null;
  }
  if (trigger.everyMinutes) {
    const slot = Math.floor(minutes / trigger.everyMinutes) * trigger.everyMinutes;
    return `${day}#${String(slot).padStart(4, "0")}`;
  }
  return null;
}

/**
 * Starts the clock-driven flows whose moment has come and runs each as far as it goes. Called by
 * the engine's own scheduled round; a round that runs twice starts nothing twice.
 */
export async function runClockTriggers(
  db: SystemDb,
  now: Date,
  relations: FlowRuntime,
): Promise<string[]> {
  const started: string[] = [];
  for (const flow of await clockFlows(db)) {
    const slot = clockSlot(flow, now);
    if (!slot) continue;
    const instanceId = await startInstance(db, {
      flowKey: flow.key,
      kind: "clock",
      clockKey: slot,
      context: { clock: { slot } },
    });
    if (!instanceId) continue;
    const result = await runInstance(db, instanceId, relations);
    // Only a run this round opened is reported; one the slot already had is not started again.
    if (result) started.push(instanceId);
  }
  return started;
}

/**
 * Moves an approval that has waited too long (REQ-WFL-005, REQ-IAM-020).
 *
 * The person it moves to is worked out when the timer fires, not when it was set: eight hours is
 * long enough for the role to be somebody else, and the flow means "whoever holds it then".
 * Nothing happens when the approval was answered in the meantime, which is a decision winning
 * over a clock, as it should.
 */
export async function escalateWaitingApproval(
  db: SystemDb,
  approvalId: string,
  to: OwnerRule,
  relations: FlowRuntime,
): Promise<boolean> {
  const owner = await ownerOf(db, relations, to);
  if (!owner) return false;
  return escalateApproval(db, approvalId, owner);
}
