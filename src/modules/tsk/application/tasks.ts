import "server-only";

import { AccessDeniedError, readEffectivePermissions, signInIdentity } from "@/modules/iam";
import {
  approveTask,
  completeTask,
  countUnread,
  insertManualTask,
  markNotificationsRead,
  readAssignablePeople,
  readNotifications,
  readTask,
  readTaskHistory,
  readTasks,
  reopenTask,
  type TaskView,
} from "@/modules/tsk/data/tsk-store";
import {
  expirePushSubscription,
  readPushSubscriptionState,
  savePushSubscription,
} from "@/modules/tsk/data/tsk-push-store";
import {
  assignTaskSchema,
  dueAtFromDay,
  notificationText,
  sortTasks,
  TASK_RULE_MESSAGES,
} from "@/modules/tsk/domain/tasks";
import { processPushSender } from "@/platform/push/push";

/**
 * The task service (TASK-0108, REQ-TSK-001…008). Everyone signed in may give tasks within their
 * scope (D-130); the database decides who is in it and who may close, approve or reopen, so the
 * service only validates input and turns the database's refusals into Turkish messages.
 */

export class TaskError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskError";
  }
}

async function identity() {
  const signedIn = await signInIdentity();
  if (!signedIn) throw new AccessDeniedError("iam.session");
  return signedIn.identity;
}

/** Runs a change and turns a refusal of the database into a message for the screen. */
async function refusalsAsMessages<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    const hint = (error as { hint?: unknown } | null)?.hint;
    const message = typeof hint === "string" ? TASK_RULE_MESSAGES[hint] : undefined;
    if (message) throw new TaskError(message);
    throw error;
  }
}

/** Whether the person may look at every task of the company: the owner layer (D-263). */
export async function canSeeAllTasks(): Promise<boolean> {
  return (await readEffectivePermissions())?.isOwnerLayer ?? false;
}

/** The task list in its fixed order: late ones first (REQ-TSK-007). */
export async function listTasks(view: TaskView, includeClosed = false) {
  const tasks = await readTasks(await identity(), view, includeClosed);
  return sortTasks(tasks, new Date());
}

export async function getTask(taskId: string) {
  return readTask(await identity(), taskId);
}

/** The task and its history, or null when it does not exist for the person. */
export async function getTaskWithHistory(taskId: string) {
  const who = await identity();
  const task = await readTask(who, taskId);
  if (!task) return null;
  return { task, history: await readTaskHistory(who, taskId), viewerId: who.userId };
}

export async function assignablePeople() {
  return readAssignablePeople(await identity());
}

/** Gives a task (SCR-014). Returns the new task's id. */
export async function assignTask(raw: unknown): Promise<string> {
  const input = assignTaskSchema.parse(raw);
  const who = await identity();
  return refusalsAsMessages(() =>
    insertManualTask(who, {
      title: input.title,
      description: input.description || null,
      assigneeId: input.assigneeId,
      priority: input.priority,
      dueAt: input.dueOn ? dueAtFromDay(input.dueOn) : null,
      needsApproval: input.needsApproval,
    }),
  );
}

export async function markTaskDone(taskId: string) {
  const who = await identity();
  return refusalsAsMessages(() => completeTask(who, taskId));
}

export async function approveTaskDone(taskId: string) {
  const who = await identity();
  return refusalsAsMessages(() => approveTask(who, taskId));
}

export async function reopen(taskId: string, reason: string | null) {
  const who = await identity();
  return refusalsAsMessages(() => reopenTask(who, taskId, reason?.trim() || null));
}

// ---------------------------------------------------------------------------------------------
// Notifications (SCR-015, REQ-TSK-009…011)
// ---------------------------------------------------------------------------------------------

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  linkPath: string | null;
  isCritical: boolean;
  isRead: boolean;
  createdAt: string;
};

/**
 * The bell's data: the unread count and the newest notifications, their words built from the
 * type's fixed template (REQ-TSK-011). The count is unread notifications only, apart from open
 * tasks (REQ-TSK-009).
 */
export async function notificationSummary(): Promise<{
  unread: number;
  items: NotificationItem[];
}> {
  const who = await identity();
  const [unread, rows] = await Promise.all([countUnread(who), readNotifications(who, 30)]);
  return {
    unread,
    items: rows.map((n) => ({
      id: n.id,
      type: n.type,
      ...notificationText(n.type, n.subject),
      linkPath: n.linkPath,
      isCritical: n.isCritical,
      isRead: n.readAt !== null,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

/** Marks the given notifications read, or all of them when `ids` is null. */
export async function markRead(ids: readonly string[] | null): Promise<number> {
  return markNotificationsRead(await identity(), ids);
}

// ---------------------------------------------------------------------------------------------
// Phone notifications (REQ-TSK-010, D-132, D-252)
// ---------------------------------------------------------------------------------------------

/** What the browser needs to switch phone notifications on, and whether it already is. */
export async function pushSettings(endpoint: string | null) {
  const key = processPushSender.publicKey();
  if (!key) return { publicKey: null, enabled: false };
  const on = endpoint ? await readPushSubscriptionState(await identity(), endpoint) : false;
  return { publicKey: key, enabled: on };
}

/** Remembers the browser the person just allowed (REQ-TSK-010). */
export async function rememberPushBrowser(subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}) {
  return savePushSubscription(await identity(), subscription);
}

/** Switches this browser off again; the row is kept as "expired". */
export async function forgetPushBrowser(endpoint: string) {
  return expirePushSubscription(await identity(), endpoint);
}
