import "server-only";

import { AccessDeniedError, readEffectivePermissions, signInIdentity } from "@/modules/iam";
import {
  approveTask,
  completeTask,
  insertManualTask,
  readAssignablePeople,
  readTask,
  readTaskHistory,
  readTasks,
  reopenTask,
  type TaskView,
} from "@/modules/tsk/data/tsk-store";
import {
  assignTaskSchema,
  dueAtFromDay,
  sortTasks,
  TASK_RULE_MESSAGES,
} from "@/modules/tsk/domain/tasks";

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
