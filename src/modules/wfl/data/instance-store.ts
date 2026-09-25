import { sql } from "kysely";

import { scheduleJob } from "@/platform/db/events";
import { runAsUser, type DbIdentity } from "@/platform/db";
import type { SystemDb } from "@/platform/jobs/types";

/**
 * Running flows in the database (TASK-0117, migration 0046, REQ-WFL-007, 024, 034).
 *
 * The engine runs inside the worker's transaction, so every step here takes the transaction it is
 * writing in: an instance's progress and whatever the step did commit or roll back together. Only
 * starting a flow by hand goes the other way, as the person who asked for it (REQ-WFL-007).
 */

export type TriggerKind = "event" | "clock" | "threshold" | "manual";

export type FlowTrigger = {
  flowKey: string;
  kind: TriggerKind;
  record?: { schema: string; table: string; id: string };
  context?: unknown;
  /** The event's own id, so the same delivery never starts the same flow twice. */
  eventId?: string;
  /** The slot a clock-started run belongs to; one run per slot (REQ-WFL-007). */
  clockKey?: string;
};

const startSql = (t: FlowTrigger) => sql<{ id: string | null }>`
  select wfl.start_instance(${t.flowKey}, ${t.kind}, ${t.record?.schema ?? null},
                            ${t.record?.table ?? null}, ${t.record?.id ?? null}::uuid,
                            ${JSON.stringify(t.context ?? {})}::jsonb,
                            ${t.eventId ?? null}::uuid, ${t.clockKey ?? null}) as id`;

/**
 * Starts the flow's published version for this record, or returns the instance already running.
 * Null when the flow is disabled or has nothing published — a trigger for a flow the company
 * turned off is ordinary, not an error.
 */
export async function startInstance(db: SystemDb, trigger: FlowTrigger): Promise<string | null> {
  const { rows } = await startSql(trigger).execute(db);
  return rows[0]?.id ?? null;
}

/**
 * The same, asked for by a person from a screen (REQ-WFL-007). A different function in the
 * database, because this one asks for the permission the engine does not need.
 */
export function startInstanceByHand(
  identity: DbIdentity,
  trigger: Omit<FlowTrigger, "kind" | "eventId">,
) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ id: string | null }>`
      select wfl.start_instance_by_hand(${trigger.flowKey}, ${trigger.record?.schema ?? null},
                                        ${trigger.record?.table ?? null},
                                        ${trigger.record?.id ?? null}::uuid,
                                        ${JSON.stringify(trigger.context ?? {})}::jsonb) as id`.execute(
      db,
    );
    return rows[0]?.id ?? null;
  });
}

/**
 * Enters a step and counts it against the engine's limit. Null means the instance has taken too
 * many steps: it has been ended as failed and the log says why, so the engine stops rather than
 * treating it as an error to retry.
 */
export async function enterStep(
  db: SystemDb,
  step: { instanceId: string; stepId: string; stepType: string; ownerUserId?: string | null },
  limit = 500,
): Promise<string | null> {
  const { rows } = await sql<{ id: string | null }>`
    select wfl.enter_step(${step.instanceId}::uuid, ${step.stepId}, ${step.stepType},
                          ${step.ownerUserId ?? null}::uuid, ${limit}) as id`.execute(db);
  return rows[0]?.id ?? null;
}

export async function leaveStep(
  db: SystemDb,
  state: { stateId: string; status: "done" | "skipped" | "failed"; outcome?: string | null },
  detail: unknown = {},
): Promise<boolean> {
  const { rows } = await sql<{ done: boolean | null }>`
    select wfl.leave_step(${state.stateId}::uuid, ${state.status}, ${state.outcome ?? null},
                          ${JSON.stringify(detail)}::jsonb) as done`.execute(db);
  return rows[0]?.done === true;
}

export async function endInstance(
  db: SystemDb,
  end: {
    instanceId: string;
    status: "done" | "failed" | "stopped";
    failure?: string;
    stepId?: string;
  },
): Promise<boolean> {
  const { rows } = await sql<{ done: boolean | null }>`
    select wfl.end_instance(${end.instanceId}::uuid, ${end.status}, ${end.failure ?? null},
                            ${end.stepId ?? null}) as done`.execute(db);
  return rows[0]?.done === true;
}

/** Says in the log that the instance is waiting on something outside itself. */
export async function noteWaiting(
  db: SystemDb,
  wait: { instanceId: string; stepId: string; detail?: unknown },
): Promise<void> {
  await sql`select wfl.note_waiting(${wait.instanceId}::uuid, ${wait.stepId},
                                    ${JSON.stringify(wait.detail ?? {})}::jsonb)`.execute(db);
}

export type InstanceRow = {
  id: string;
  flowKey: string;
  version: number;
  status: string;
  stepsTaken: number;
  failure: string | null;
  startedAt: Date;
  endedAt: Date | null;
};

/** One instance as the run screen needs it; null when this person may not see it. */
export function readInstance(identity: DbIdentity, instanceId: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{
      id: string;
      flow_key: string;
      version: number;
      status: string;
      steps_taken: number;
      failure: string | null;
      started_at: Date;
      ended_at: Date | null;
      // The instance alone: the flow's key and version are on the row for exactly this reason —
      // the person a step is waiting on may read their run without being able to read the
      // definition it came from.
    }>`select id, flow_key, version, status, steps_taken, failure, started_at, ended_at
         from wfl.instance where id = ${instanceId}::uuid`.execute(db);
    const row = rows[0];
    return row
      ? ({
          id: row.id,
          flowKey: row.flow_key,
          version: Number(row.version),
          status: row.status,
          stepsTaken: Number(row.steps_taken),
          failure: row.failure,
          startedAt: row.started_at,
          endedAt: row.ended_at,
        } satisfies InstanceRow)
      : null;
  });
}

/** What the instance did, in order (REQ-WFL-034). */
export function readRunLog(identity: DbIdentity, instanceId: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{
      at: Date;
      step_id: string | null;
      kind: string;
      detail: unknown;
    }>`select at, step_id, kind, detail from wfl.run_log
        where instance_id = ${instanceId}::uuid order by at, id`.execute(db);
    return rows.map((row) => ({
      at: row.at,
      stepId: row.step_id,
      kind: row.kind,
      detail: row.detail,
    }));
  });
}

export type RunnableRow = {
  id: string;
  status: string;
  context: Record<string, unknown>;
  definition: unknown;
  /** The step the instance is sitting in, when it is waiting inside one. */
  openStepId: string | null;
  /** Where a branch begins; null for a run of its own, which begins at the definition's start. */
  startStepId: string | null;
};

/** What the engine needs to take the next step, read as the worker. */
export async function readRunnable(db: SystemDb, instanceId: string): Promise<RunnableRow | null> {
  const { rows } = await sql<{
    id: string;
    status: string;
    context: Record<string, unknown>;
    definition: unknown;
    open_step_id: string | null;
    start_step_id: string | null;
  }>`select i.id, i.status, i.context, v.definition, i.start_step_id,
            (select s.step_id from wfl.step_state s
              where s.instance_id = i.id and s.status = 'running'
              order by s.entered_at desc limit 1) as open_step_id
       from wfl.instance i
       join wfl.flow_version v on v.id = i.flow_version_id
      where i.id = ${instanceId}::uuid`.execute(db);
  const row = rows[0];
  return row
    ? {
        id: row.id,
        status: row.status,
        context: row.context ?? {},
        definition: row.definition,
        openStepId: row.open_step_id,
        startStepId: row.start_step_id,
      }
    : null;
}

/** Every published flow the clock drives, with what its trigger says. */
export async function clockFlows(db: SystemDb): Promise<
  {
    key: string;
    dailyAt: string | null;
    everyMinutes: number | null;
    monthlyOn: number | null;
  }[]
> {
  const { rows } = await sql<{
    key: string;
    daily_at: string | null;
    every_minutes: number | null;
    monthly_on: number | null;
  }>`select f.key,
            v.definition -> 'trigger' ->> 'dailyAt' as daily_at,
            (v.definition -> 'trigger' ->> 'everyMinutes')::int as every_minutes,
            (v.definition -> 'trigger' ->> 'monthlyOn')::int as monthly_on
       from wfl.flow_version v
       join wfl.flow f on f.id = v.flow_id
      where v.status = 'published' and f.disabled_at is null
        and v.definition -> 'trigger' ->> 'type' = 'clock'`.execute(db);
  return rows.map((row) => ({
    key: row.key,
    dailyAt: row.daily_at,
    everyMinutes: row.every_minutes === null ? null : Number(row.every_minutes),
    monthlyOn: row.monthly_on === null ? null : Number(row.monthly_on),
  }));
}

/**
 * The flows whose published definition listens to this event. Asking the definitions themselves
 * is what lets a flow start listening the moment it is published (REQ-WFL-007).
 */
export type ListeningFlow = {
  key: string;
  /** `event` starts on the event alone; `threshold` starts only when its test passes. */
  triggerType: "event" | "threshold";
  /** The threshold's test, as the definition wrote it. */
  test: unknown;
};

export async function flowsListeningTo(db: SystemDb, eventCode: string): Promise<ListeningFlow[]> {
  const { rows } = await sql<{ key: string; trigger_type: string; test: unknown }>`
    select f.key,
           v.definition -> 'trigger' ->> 'type' as trigger_type,
           v.definition -> 'trigger' -> 'test' as test
      from wfl.flow_version v
      join wfl.flow f on f.id = v.flow_id
     where v.status = 'published' and f.disabled_at is null
       and v.definition -> 'trigger' ->> 'type' in ('event', 'threshold')
       and v.definition -> 'trigger' ->> 'event' = ${eventCode}`.execute(db);
  return rows.map((row) => ({
    key: row.key,
    triggerType: row.trigger_type === "threshold" ? "threshold" : "event",
    test: row.test,
  }));
}

/**
 * Opens the approval a step waits on; the same step visit never opens two.
 *
 * The owner is a person when the step named one, and nobody at all when the step addressed a group —
 * a role, a permission, the owner layer. Either way the rule itself is written down: it is what the
 * queue shows ("because you hold this role") and what the database asks when somebody answers.
 */
export async function requestApproval(
  db: SystemDb,
  approval: {
    instanceId: string;
    stateId: string;
    stepId: string;
    title: string;
    ownerUserId: string | null;
    ownerRule: unknown;
  },
): Promise<string> {
  const { rows } = await sql<{ id: string }>`
    select wfl.request_approval(${approval.instanceId}::uuid, ${approval.stateId}::uuid,
                                ${approval.stepId}, ${approval.title},
                                ${approval.ownerUserId}::uuid,
                                ${JSON.stringify(approval.ownerRule ?? {})}::jsonb) as id`.execute(
    db,
  );
  return rows[0].id;
}

export type ApprovalDecision = "approve" | "reject" | "return";

/**
 * The decision, made by the person it belongs to (REQ-WFL-014). False when it was already decided;
 * what happens next is the engine's, which hears `approval.decided` like any other event.
 */
export function decideApproval(
  identity: DbIdentity,
  approvalId: string,
  decision: ApprovalDecision,
  reason?: string,
) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ done: boolean | null }>`
      select wfl.decide_approval(${approvalId}::uuid, ${decision},
                                 ${reason ?? null}) as done`.execute(db);
    return rows[0]?.done === true;
  });
}

export type WaitingApproval = {
  id: string;
  instanceId: string;
  stepId: string;
  title: string;
  record: { schema: string; table: string; id: string } | null;
  createdAt: Date;
  /** How the step addressed it (D-097); the screen turns this into "why it is with you". */
  ownerRule: unknown;
  /** Whose approval it is, when it belongs to one person; null when it belongs to a group. */
  ownerUserId: string | null;
  /** True when it is in this queue through a delegation rather than the person's own place. */
  delegated: boolean;
  /** Which flow and version opened it, so the queue can say where it came from. */
  flowKey: string | null;
  flowName: string | null;
  flowVersion: number | null;
  /** How many times this run has already been sent back for correction (REQ-WFL-016). */
  returnedBefore: number;
  /** What was asked for the last time it was sent back. */
  lastReturnReason: string | null;
};

/**
 * What this person is being asked to decide (REQ-WFL-012, SCR-012).
 *
 * One question decides what is in the queue — "is this approval mine" — and the database asks it,
 * from live assignments, so an approval addressed to a role is in the queue of whoever holds it
 * today and a delegate sees what the person they stand in for sees.
 */
export function readMyApprovals(identity: DbIdentity) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{
      id: string;
      instance_id: string;
      step_id: string;
      title: string;
      record_schema: string | null;
      record_table: string | null;
      record_id: string | null;
      created_at: Date;
      owner_rule: unknown;
      owner_user_id: string | null;
      delegated: boolean;
      flow_key: string | null;
      flow_name: string | null;
      flow_version: number | null;
      returned_before: number;
      last_return_reason: string | null;
    }>`select * from wfl.my_approvals()`.execute(db);
    return rows.map((row): WaitingApproval => ({
      createdAt: row.created_at,
      delegated: row.delegated,
      flowKey: row.flow_key,
      flowName: row.flow_name,
      flowVersion: row.flow_version === null ? null : Number(row.flow_version),
      id: row.id,
      instanceId: row.instance_id,
      lastReturnReason: row.last_return_reason,
      ownerRule: row.owner_rule,
      ownerUserId: row.owner_user_id,
      record:
        row.record_schema && row.record_table && row.record_id
          ? { schema: row.record_schema, table: row.record_table, id: row.record_id }
          : null,
      returnedBefore: Number(row.returned_before),
      stepId: row.step_id,
      title: row.title,
    }));
  });
}

/** How many approvals are waiting on this person: the badge three places have to agree on. */
export function readMyApprovalCount(identity: DbIdentity) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ waiting: number }>`
      select wfl.my_approval_count() as waiting`.execute(db);
    return Number(rows[0]?.waiting ?? 0);
  });
}

/** One decided approval as the engine needs it when the decision comes back to it. */
export async function readDecision(
  db: SystemDb,
  approvalId: string,
): Promise<{ instanceId: string; stepStateId: string; decision: string } | null> {
  const { rows } = await sql<{
    instance_id: string;
    step_state_id: string;
    decision: string | null;
  }>`select instance_id, step_state_id, decision from wfl.approval
       where id = ${approvalId}::uuid and status = 'decided'`.execute(db);
  const row = rows[0];
  return row?.decision
    ? { instanceId: row.instance_id, stepStateId: row.step_state_id, decision: row.decision }
    : null;
}

/** The instance and step a step visit belongs to, while that visit is still open. */
export async function readStepRun(
  db: SystemDb,
  stepRunId: string,
): Promise<{ instanceId: string; stepId: string } | null> {
  const { rows } = await sql<{ instance_id: string; step_id: string }>`
    select instance_id, step_id from wfl.step_state
     where id = ${stepRunId}::uuid and status = 'running'`.execute(db);
  const row = rows[0];
  return row ? { instanceId: row.instance_id, stepId: row.step_id } : null;
}

/** The job type the engine's own wake-ups use. */
export const WAKE_JOB = "wfl.wake";

/** The job type an approval's escalation timer uses. */
export const ESCALATE_JOB = "wfl.escalate";

/**
 * Asks the scheduler to wake this step when its time comes. The key is the step visit, so the
 * same wait never schedules two wake-ups however often the step is retried.
 */
export async function scheduleWake(
  db: SystemDb,
  wake: { stepRunId: string; wakeAt: Date },
): Promise<boolean> {
  return scheduleJob(db, {
    type: WAKE_JOB,
    runAt: wake.wakeAt,
    key: `wfl.wake:${wake.stepRunId}`,
    payload: { stepRunId: wake.stepRunId },
  });
}

/**
 * Asks to look at this approval again when its patience runs out. Keyed by the approval, so a
 * step retried never schedules two timers for the same one.
 */
export async function scheduleEscalation(
  db: SystemDb,
  escalation: {
    approvalId: string;
    at: Date;
    to: { type: string; userId?: string; role?: string };
  },
): Promise<boolean> {
  return scheduleJob(db, {
    type: ESCALATE_JOB,
    runAt: escalation.at,
    key: `wfl.escalate:${escalation.approvalId}`,
    payload: { approvalId: escalation.approvalId, to: escalation.to },
  });
}

/** Moves a waiting approval to somebody else; false when it was answered in the meantime. */
export async function escalateApproval(
  db: SystemDb,
  approvalId: string,
  toUserId: string,
): Promise<boolean> {
  const { rows } = await sql<{ moved: boolean | null }>`
    select wfl.escalate_approval(${approvalId}::uuid, ${toUserId}::uuid) as moved`.execute(db);
  return rows[0]?.moved === true;
}

/** A condition's counting query took longer than the engine allows (REQ-WFL-008). */
export class ConditionTimeout extends Error {
  constructor(readonly limitMs: number) {
    super(`koşul sorgusu ${limitMs} ms sınırını aştı`);
    this.name = "ConditionTimeout";
  }
}

/**
 * Counts what a looking-back condition asks about, under a time limit (D-100, SPIKE-06).
 *
 * Three guarantees live here. The query is given a limit of its own and the limit is restored
 * afterwards, so one slow condition cannot spend the whole step's budget. The count is read fresh
 * every time — nothing is cached inside the instance, because a condition that answers from an old
 * count is a condition nobody can reason about. And a query that runs out of time raises rather
 * than returning zero: a flow must not take the "no" branch because the database was busy.
 */
export async function countInWindow(
  db: SystemDb,
  ask: {
    countOf: "flow_runs" | "returned_approvals";
    withinDays: number;
    flowId: string;
    record: { schema: string; table: string; id: string } | null;
    limitMs?: number;
  },
): Promise<number> {
  const limitMs = ask.limitMs ?? 2000;
  const { rows: before } = await sql<{ was: string }>`
    select current_setting('statement_timeout') as was`.execute(db);
  await sql.raw(`set local statement_timeout = ${limitMs}`).execute(db);
  try {
    const since = sql`now() - (${ask.withinDays} || ' days')::interval`;
    const { rows } =
      ask.countOf === "flow_runs"
        ? await sql<{ n: number }>`
            select count(*)::int as n from wfl.instance i
             where i.flow_id = ${ask.flowId}::uuid and i.started_at >= ${since}
               and (${ask.record?.id ?? null}::uuid is null or i.record_id = ${ask.record?.id ?? null}::uuid)`.execute(
            db,
          )
        : await sql<{ n: number }>`
            select count(*)::int as n from wfl.approval a
             join wfl.instance i on i.id = a.instance_id
             where i.flow_id = ${ask.flowId}::uuid and a.decided_at >= ${since}
               and a.decision = 'return'
               and (${ask.record?.id ?? null}::uuid is null or i.record_id = ${ask.record?.id ?? null}::uuid)`.execute(
            db,
          );
    return Number(rows[0]?.n ?? 0);
  } catch (error) {
    // 57014 is the database saying it stopped the query, which is the case REQ-WFL-008 is about.
    if ((error as { code?: string }).code === "57014") throw new ConditionTimeout(limitMs);
    throw error;
  } finally {
    await sql.raw(`set local statement_timeout = '${before[0].was}'`).execute(db);
  }
}

/** The flow a running instance belongs to, for a condition that counts the flow's own history. */
export async function readInstanceFlow(
  db: SystemDb,
  instanceId: string,
): Promise<{
  flowId: string;
  flowKey: string;
  version: number;
  record: { schema: string; table: string; id: string } | null;
} | null> {
  const { rows } = await sql<{
    flow_id: string;
    flow_key: string;
    version: number;
    record_schema: string | null;
    record_table: string | null;
    record_id: string | null;
  }>`select flow_id, flow_key, version, record_schema, record_table, record_id from wfl.instance
       where id = ${instanceId}::uuid`.execute(db);
  const row = rows[0];
  if (!row) return null;
  return {
    flowId: row.flow_id,
    flowKey: row.flow_key,
    version: Number(row.version),
    record:
      row.record_schema && row.record_table && row.record_id
        ? { schema: row.record_schema, table: row.record_table, id: row.record_id }
        : null,
  };
}

/** Holds a transition shut for a record (REQ-WFL-029); a second call finds the lock already held. */
export async function holdLock(
  db: SystemDb,
  lock: {
    record: { schema: string; table: string; id: string };
    transition: string;
    reason: string;
    instanceId?: string;
    stepId?: string;
  },
): Promise<string> {
  const { rows } = await sql<{ id: string }>`
    select wfl.hold_lock(${lock.record.schema}, ${lock.record.table}, ${lock.record.id}::uuid,
                         ${lock.transition}, ${lock.reason}, ${lock.instanceId ?? null}::uuid,
                         ${lock.stepId ?? null}) as id`.execute(db);
  return rows[0].id;
}

/** Lets go of a lock the flow itself is holding. */
export async function releaseLock(db: SystemDb, lockId: string): Promise<boolean> {
  const { rows } = await sql<{ done: boolean | null }>`
    select wfl.release_lock(${lockId}::uuid) as done`.execute(db);
  return rows[0]?.done === true;
}

/** Passing a lock: the owner layer or the general manager, with a reason (REQ-WFL-030, D-084). */
export function overrideLock(identity: DbIdentity, lockId: string, reason: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ done: boolean | null }>`
      select wfl.override_lock(${lockId}::uuid, ${reason}) as done`.execute(db);
    return rows[0]?.done === true;
  });
}

export type RecordLock = {
  id: string;
  transition: string;
  reason: string;
  flowKey: string | null;
  heldSince: Date;
};

/** What is holding a record shut, for the screen that has to explain a refusal. */
export function locksOn(
  identity: DbIdentity,
  record: { schema: string; table: string; id: string },
) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{
      id: string;
      transition: string;
      reason: string;
      flow_key: string | null;
      held_since: Date;
    }>`select * from wfl.locks_on(${record.schema}, ${record.table}, ${record.id}::uuid)`.execute(
      db,
    );
    return rows.map((row): RecordLock => ({
      id: row.id,
      transition: row.transition,
      reason: row.reason,
      flowKey: row.flow_key,
      heldSince: row.held_since,
    }));
  });
}

/**
 * Opens one branch of a run (REQ-WFL-006): the same flow and record, starting at its own step.
 * Null when the parent is no longer running; the database refuses a fourth level.
 */
export async function startBranch(
  db: SystemDb,
  branch: {
    parentInstanceId: string;
    parentStepStateId: string;
    startStepId: string;
    label: string;
    context?: Record<string, unknown>;
  },
): Promise<string | null> {
  const { rows } = await sql<{ id: string | null }>`
    select wfl.start_branch(${branch.parentInstanceId}::uuid, ${branch.parentStepStateId}::uuid,
                            ${branch.startStepId}, ${branch.label},
                            ${JSON.stringify(branch.context ?? {})}::jsonb) as id`.execute(db);
  return rows[0]?.id ?? null;
}

/**
 * Hands the work to another flow as a child of this run (REQ-WFL-011). Null when that flow is not
 * published, is disabled, or the parent is no longer running.
 */
export async function startSubflow(
  db: SystemDb,
  child: {
    parentInstanceId: string;
    parentStepStateId: string;
    flowKey: string;
    context?: Record<string, unknown>;
  },
): Promise<string | null> {
  const { rows } = await sql<{ id: string | null }>`
    select wfl.start_subflow(${child.parentInstanceId}::uuid, ${child.parentStepStateId}::uuid,
                             ${child.flowKey},
                             ${JSON.stringify(child.context ?? {})}::jsonb) as id`.execute(db);
  return rows[0]?.id ?? null;
}

export type BranchState = {
  opened: number;
  running: number;
  failed: number;
  firstFailure: string | null;
};

/** How the branches of one step stand, for the parent that is waiting in it. */
export async function branchState(db: SystemDb, parentStepStateId: string): Promise<BranchState> {
  const { rows } = await sql<{
    opened: number;
    running: number;
    failed: number;
    first_failure: string | null;
  }>`select * from wfl.branch_state(${parentStepStateId}::uuid)`.execute(db);
  const row = rows[0];
  return {
    opened: Number(row?.opened ?? 0),
    running: Number(row?.running ?? 0),
    failed: Number(row?.failed ?? 0),
    firstFailure: row?.first_failure ?? null,
  };
}

/** The run this one branched from, or null when it is a run of its own. */
export async function branchParent(
  db: SystemDb,
  instanceId: string,
): Promise<{ parentInstanceId: string; parentStepStateId: string; label: string | null } | null> {
  const { rows } = await sql<{
    parent_instance_id: string;
    parent_step_state_id: string;
    branch_label: string | null;
  }>`select * from wfl.branch_parent(${instanceId}::uuid)`.execute(db);
  const row = rows[0];
  return row
    ? {
        parentInstanceId: row.parent_instance_id,
        parentStepStateId: row.parent_step_state_id,
        label: row.branch_label,
      }
    : null;
}

export type RunRow = {
  id: string;
  flowKey: string;
  flowName: string | null;
  version: number;
  status: string;
  trigger: string;
  startedAt: Date;
  endedAt: Date | null;
  failure: string | null;
  /** The step it is sitting in, when it is waiting on somebody or something. */
  openStepId: string | null;
  openStepType: string | null;
  openOwnerUserId: string | null;
  /** What the run is about, when the flow is about a record. */
  record: { schema: string; table: string; id: string } | null;
};

/**
 * The runs, for the working log (SCR-197, REQ-WFL-034). Whoever may design flows sees them all;
 * anybody else sees only the runs a step of theirs is in, which is what the policy already says —
 * so this read needs no permission of its own.
 */
export function readRuns(
  identity: DbIdentity,
  filter: { flowKey?: string | null; status?: string | null; limit?: number } = {},
) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{
      id: string;
      flow_key: string;
      flow_name: string | null;
      version: number;
      status: string;
      trigger_kind: string;
      started_at: Date;
      ended_at: Date | null;
      failure: string | null;
      record_schema: string | null;
      record_table: string | null;
      record_id: string | null;
      open_step_id: string | null;
      open_step_type: string | null;
      open_owner_user_id: string | null;
    }>`select i.id, i.flow_key, f.name as flow_name, i.version, i.status, i.trigger_kind,
              i.started_at, i.ended_at, i.failure,
              i.record_schema, i.record_table, i.record_id,
              s.step_id as open_step_id, s.step_type as open_step_type,
              s.owner_user_id as open_owner_user_id
         from wfl.instance i
         left join wfl.flow f on f.id = i.flow_id
         left join lateral (
           select step_id, step_type, owner_user_id from wfl.step_state x
            where x.instance_id = i.id and x.status = 'running'
            order by x.entered_at desc limit 1
         ) s on true
        where (${filter.flowKey ?? null}::text is null or i.flow_key = ${filter.flowKey ?? null})
          and (${filter.status ?? null}::text is null or i.status = ${filter.status ?? null})
        order by i.started_at desc
        limit ${Math.min(Math.max(filter.limit ?? 50, 1), 200)}`.execute(db);

    return rows.map((row): RunRow => ({
      endedAt: row.ended_at,
      failure: row.failure,
      flowKey: row.flow_key,
      flowName: row.flow_name,
      id: row.id,
      openOwnerUserId: row.open_owner_user_id,
      openStepId: row.open_step_id,
      openStepType: row.open_step_type,
      record:
        row.record_schema && row.record_table && row.record_id
          ? { schema: row.record_schema, table: row.record_table, id: row.record_id }
          : null,
      startedAt: row.started_at,
      status: row.status,
      trigger: row.trigger_kind,
      version: Number(row.version),
    }));
  });
}

export type StepVisit = {
  stepId: string;
  stepType: string;
  status: string;
  outcome: string | null;
  ownerUserId: string | null;
  enteredAt: Date;
  leftAt: Date | null;
  detail: unknown;
};

/** Every step visit of one run, in order: the timeline SCR-197's detail draws. */
export function readStepVisits(identity: DbIdentity, instanceId: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{
      step_id: string;
      step_type: string;
      status: string;
      outcome: string | null;
      owner_user_id: string | null;
      entered_at: Date;
      left_at: Date | null;
      detail: unknown;
    }>`select step_id, step_type, status, outcome, owner_user_id, entered_at, left_at, detail
         from wfl.step_state
        where instance_id = ${instanceId}::uuid
        order by entered_at`.execute(db);
    return rows.map((row): StepVisit => ({
      detail: row.detail,
      enteredAt: row.entered_at,
      leftAt: row.left_at,
      outcome: row.outcome,
      ownerUserId: row.owner_user_id,
      status: row.status,
      stepId: row.step_id,
      stepType: row.step_type,
    }));
  });
}

export type RecentlyPublished = {
  flowKey: string;
  flowName: string | null;
  version: number;
  publishedAt: Date;
  /** What it has done since: runs started, and what those runs opened for people. */
  runs: number;
  approvals: number;
  tasks: number;
  notices: number;
  records: number;
};

/**
 * Flows published in the last few days and what they have actually done (REQ-WFL-023).
 *
 * A new flow is watched for a week, and "watched" means something concrete: how many runs it started
 * and how much work it put in front of people. The counts come from the step visits, so they are what
 * happened rather than what the definition says would happen.
 */
export function readRecentlyPublished(identity: DbIdentity, days = 7) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{
      flow_key: string;
      flow_name: string | null;
      version: number;
      published_at: Date;
      runs: number;
      approvals: number;
      tasks: number;
      notices: number;
      records: number;
    }>`select f.key as flow_key, f.name as flow_name, v.version, v.published_at,
              (select pg_catalog.count(*)::integer from wfl.instance i
                where i.flow_version_id = v.id) as runs,
              coalesce(counted.approvals, 0) as approvals,
              coalesce(counted.tasks, 0) as tasks,
              coalesce(counted.notices, 0) as notices,
              coalesce(counted.records, 0) as records
         from wfl.flow_version v
         join wfl.flow f on f.id = v.flow_id
         left join lateral (
           select
             pg_catalog.count(*) filter (where s.step_type = 'approval')::integer as approvals,
             pg_catalog.count(*) filter (where s.step_type = 'task')::integer as tasks,
             pg_catalog.count(*) filter (where s.step_type = 'notify')::integer as notices,
             pg_catalog.count(*) filter (where s.step_type = 'record')::integer as records
             from wfl.step_state s
             join wfl.instance i on i.id = s.instance_id
            where i.flow_version_id = v.id
         ) counted on true
        where v.published_at is not null
          and v.published_at >= pg_catalog.now() - pg_catalog.make_interval(days => ${days})
        order by v.published_at desc`.execute(db);

    return rows.map((row): RecentlyPublished => ({
      approvals: Number(row.approvals),
      flowKey: row.flow_key,
      flowName: row.flow_name,
      notices: Number(row.notices),
      publishedAt: row.published_at,
      records: Number(row.records),
      runs: Number(row.runs),
      tasks: Number(row.tasks),
      version: Number(row.version),
    }));
  });
}
