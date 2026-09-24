import { sql } from "kysely";

import { runAsUser, type DbIdentity, type DbTransaction } from "@/platform/db";
import type { SystemDb } from "@/platform/jobs/types";

import type { TaskPriority, TaskSource, TaskStatus, TaskSummary } from "@/modules/tsk/domain/tasks";

/**
 * TSK's data layer (TASK-0108). The runtime role only reads tasks and notifications; every
 * change is a `tsk.*` database function that checks who may make it (D-130, D-131) and writes
 * the notification and event in the same transaction. Row level security decides which tasks
 * exist for the person; one they may not see is simply not found.
 */

export type { DbIdentity };

type Tx = DbTransaction<unknown>;

export type TaskView = "mine" | "given" | "all";

export type TaskDetail = TaskSummary & {
  description: string | null;
  sourceEventCode: string | null;
  needsGiverApproval: boolean;
  reportedDoneAt: Date | null;
  closedAt: Date | null;
  closingKind: "completed" | "approved" | "resolved" | null;
  reopenedCount: number;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_at: Date | null;
  assignee_user_id: string;
  assignee_name: string;
  given_by_user_id: string | null;
  given_by_name: string | null;
  source_type: string;
  source_event_code: string | null;
  needs_giver_approval: boolean;
  link_path: string;
  reported_done_at: Date | null;
  closed_at: Date | null;
  closing_kind: string | null;
  reopened_count: number;
  created_at: Date;
};

const date = (value: Date | null) => (value ? new Date(value) : null);

const toTask = (r: TaskRow): TaskDetail => ({
  id: r.id,
  title: r.title,
  description: r.description,
  priority: r.priority as TaskPriority,
  status: r.status as TaskStatus,
  dueAt: date(r.due_at),
  assigneeUserId: r.assignee_user_id,
  assigneeName: r.assignee_name,
  givenByUserId: r.given_by_user_id,
  givenByName: r.given_by_name,
  sourceType: r.source_type as TaskSource,
  sourceEventCode: r.source_event_code,
  needsGiverApproval: r.needs_giver_approval,
  linkPath: r.link_path,
  reportedDoneAt: date(r.reported_done_at),
  closedAt: date(r.closed_at),
  closingKind: r.closing_kind as TaskDetail["closingKind"],
  reopenedCount: r.reopened_count,
  createdAt: new Date(r.created_at),
});

export function readTasks(identity: DbIdentity, view: TaskView, includeClosed: boolean) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<TaskRow>`
      select * from tsk.visible_tasks(${view}, ${includeClosed})`.execute(db);
    return rows.map(toTask);
  });
}

export function readTask(identity: DbIdentity, taskId: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<TaskRow>`
      select * from tsk.visible_tasks('all', true, ${taskId}::uuid)`.execute(db);
    return rows[0] ? toTask(rows[0]) : null;
  });
}

/** People the person may give a task to (D-130), for the picker. */
export function readAssignablePeople(identity: DbIdentity) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string; display_name: string }>`
      select id, display_name from tsk.assignable_people()`.execute(db);
    return rows.map((r) => ({ id: r.id, displayName: r.display_name }));
  });
}

export function insertManualTask(
  identity: DbIdentity,
  input: {
    title: string;
    description: string | null;
    assigneeId: string;
    priority: TaskPriority;
    dueAt: Date | null;
    needsApproval: boolean;
  },
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      select tsk.assign_task(${input.title}, ${input.description}, ${input.assigneeId}::uuid,
                             ${input.priority}, ${input.dueAt}::timestamptz,
                             ${input.needsApproval}) as id`.execute(db);
    return rows[0].id;
  });
}

export function completeTask(identity: DbIdentity, taskId: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ status: TaskStatus }>`
      select tsk.complete_task(${taskId}::uuid) as status`.execute(db);
    return rows[0].status;
  });
}

export function approveTask(identity: DbIdentity, taskId: string) {
  return runAsUser(identity, async (db: Tx) => {
    await sql`select tsk.approve_task(${taskId}::uuid)`.execute(db);
  });
}

export function reopenTask(identity: DbIdentity, taskId: string, reason: string | null) {
  return runAsUser(identity, async (db: Tx) => {
    await sql`select tsk.reopen_task(${taskId}::uuid, ${reason})`.execute(db);
  });
}

export type TaskHistoryEntry = {
  operation: "insert" | "update";
  field: string | null;
  oldValue: unknown;
  newValue: unknown;
  reason: string | null;
  changedByName: string | null;
  changedAt: Date;
};

/** Giving, status changes, reassignment and due date of a task the person sees. */
export function readTaskHistory(identity: DbIdentity, taskId: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{
      operation: "insert" | "update";
      field: string | null;
      old_value: unknown;
      new_value: unknown;
      reason: string | null;
      changed_by_name: string | null;
      changed_at: Date;
    }>`select * from tsk.task_history(${taskId}::uuid)`.execute(db);
    return rows.map((r): TaskHistoryEntry => ({
      operation: r.operation,
      field: r.field,
      oldValue: r.old_value,
      newValue: r.new_value,
      reason: r.reason,
      changedByName: r.changed_by_name,
      changedAt: new Date(r.changed_at),
    }));
  });
}

export type NotificationRow = {
  id: string;
  type: string;
  subject: string | null;
  linkPath: string | null;
  isCritical: boolean;
  readAt: Date | null;
  createdAt: Date;
};

/** The person's newest notifications; row level security shows only their own (D-263). */
export function readNotifications(identity: DbIdentity, limit = 30) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{
      id: string;
      type: string;
      subject: string | null;
      link_path: string | null;
      is_critical: boolean;
      read_at: Date | null;
      created_at: Date;
    }>`
      select id, type, subject, link_path, is_critical, read_at, created_at
        from tsk.notification order by created_at desc, id desc limit ${limit}`.execute(db);
    return rows.map((r): NotificationRow => ({
      id: r.id,
      type: r.type,
      subject: r.subject,
      linkPath: r.link_path,
      isCritical: r.is_critical,
      readAt: date(r.read_at),
      createdAt: new Date(r.created_at),
    }));
  });
}

/** Unread notifications only; open tasks are counted apart (REQ-TSK-009). */
export function countUnread(identity: DbIdentity) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ n: string }>`
      select count(*) as n from tsk.notification where read_at is null`.execute(db);
    return Number(rows[0].n);
  });
}

/** Marks the given notifications (or all, when null) read; returns how many changed. */
export function markNotificationsRead(identity: DbIdentity, ids: readonly string[] | null) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ n: number }>`
      select tsk.mark_read(${ids ? [...ids] : null}::uuid[]) as n`.execute(db);
    return rows[0].n;
  });
}

/**
 * Writes one notification inside a transaction the caller owns, under the system authority the
 * worker holds (`tsk.notify` is granted to it alone). This is the shape a flow's step needs: its
 * effect and the step's own mark commit or roll back together.
 *
 * Returns the notification's id, or null when there was nothing to write — an account that is no
 * longer active, or the same notification already sent within the last ten minutes, which the
 * database decides rather than this code.
 */
export function notifyPerson(
  db: SystemDb,
  input: {
    userId: string;
    type: string;
    subject: string;
    linkPath: string;
    sourceKey: string;
    isCritical?: boolean;
  },
): Promise<string | null> {
  return sql<{ id: string | null }>`
    select tsk.notify(${input.userId}::uuid, ${input.type}, ${input.subject}, ${input.linkPath},
                      ${input.sourceKey}, null, null, null, null,
                      ${input.isCritical ?? false}) as id`
    .execute(db)
    .then(({ rows }) => rows[0]?.id ?? null);
}

/**
 * Opens the task a flow's step is waiting on (TASK-0117, migration 0049). Worker-side, because a
 * flow acts with its own authority and not with a person's (REQ-WFL-020). Idempotent on the step
 * run: a retried delivery finds the task it already opened.
 */
export function openFlowTask(
  db: SystemDb,
  task: {
    stepRunId: string;
    title: string;
    assigneeUserId: string;
    priority?: "low" | "normal" | "high" | "critical";
    dueAt?: Date | null;
    linkPath?: string | null;
    record?: { schema: string; table: string; id: string } | null;
    siteId?: string | null;
    projectId?: string | null;
  },
): Promise<string> {
  return sql<{ id: string }>`
    select tsk.open_flow_task(${task.stepRunId}::uuid, ${task.title},
                              ${task.assigneeUserId}::uuid, ${task.priority ?? "normal"},
                              ${task.dueAt ?? null}::timestamptz, ${task.linkPath ?? null},
                              ${task.record?.schema ?? null}, ${task.record?.table ?? null},
                              ${task.record?.id ?? null}::uuid, ${task.siteId ?? null}::uuid,
                              ${task.projectId ?? null}::uuid) as id`
    .execute(db)
    .then(({ rows }) => rows[0].id);
}
