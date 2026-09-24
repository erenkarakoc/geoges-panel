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
};

/** What the engine needs to take the next step, read as the worker. */
export async function readRunnable(db: SystemDb, instanceId: string): Promise<RunnableRow | null> {
  const { rows } = await sql<{
    id: string;
    status: string;
    context: Record<string, unknown>;
    definition: unknown;
    open_step_id: string | null;
  }>`select i.id, i.status, i.context, v.definition,
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
      }
    : null;
}

/** Every published flow the clock drives, with what its trigger says. */
export async function clockFlows(
  db: SystemDb,
): Promise<{ key: string; dailyAt: string | null; everyMinutes: number | null }[]> {
  const { rows } = await sql<{
    key: string;
    daily_at: string | null;
    every_minutes: number | null;
  }>`select f.key,
            v.definition -> 'trigger' ->> 'dailyAt' as daily_at,
            (v.definition -> 'trigger' ->> 'everyMinutes')::int as every_minutes
       from wfl.flow_version v
       join wfl.flow f on f.id = v.flow_id
      where v.status = 'published' and f.disabled_at is null
        and v.definition -> 'trigger' ->> 'type' = 'clock'`.execute(db);
  return rows.map((row) => ({
    key: row.key,
    dailyAt: row.daily_at,
    everyMinutes: row.every_minutes === null ? null : Number(row.every_minutes),
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

/** Opens the approval a step waits on; the same step visit never opens two. */
export async function requestApproval(
  db: SystemDb,
  approval: {
    instanceId: string;
    stateId: string;
    stepId: string;
    title: string;
    ownerUserId: string;
  },
): Promise<string> {
  const { rows } = await sql<{ id: string }>`
    select wfl.request_approval(${approval.instanceId}::uuid, ${approval.stateId}::uuid,
                                ${approval.stepId}, ${approval.title},
                                ${approval.ownerUserId}::uuid) as id`.execute(db);
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
};

/** What this person is being asked to decide (REQ-WFL-012). */
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
    }>`select id, instance_id, step_id, title, record_schema, record_table, record_id, created_at
         from wfl.approval
        where status = 'waiting' and owner_user_id = ${identity.userId}::uuid
        order by created_at`.execute(db);
    return rows.map((row): WaitingApproval => ({
      id: row.id,
      instanceId: row.instance_id,
      stepId: row.step_id,
      title: row.title,
      record:
        row.record_schema && row.record_table && row.record_id
          ? { schema: row.record_schema, table: row.record_table, id: row.record_id }
          : null,
      createdAt: row.created_at,
    }));
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
  record: { schema: string; table: string; id: string } | null;
} | null> {
  const { rows } = await sql<{
    flow_id: string;
    record_schema: string | null;
    record_table: string | null;
    record_id: string | null;
  }>`select flow_id, record_schema, record_table, record_id from wfl.instance
       where id = ${instanceId}::uuid`.execute(db);
  const row = rows[0];
  if (!row) return null;
  return {
    flowId: row.flow_id,
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
