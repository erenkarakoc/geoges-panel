import { sql } from "kysely";

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
};

const startSql = (t: FlowTrigger) => sql<{ id: string | null }>`
  select wfl.start_instance(${t.flowKey}, ${t.kind}, ${t.record?.schema ?? null},
                            ${t.record?.table ?? null}, ${t.record?.id ?? null}::uuid,
                            ${JSON.stringify(t.context ?? {})}::jsonb,
                            ${t.eventId ?? null}::uuid) as id`;

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
