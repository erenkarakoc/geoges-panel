"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  approveTaskDone,
  assignTask,
  markTaskDone,
  reopen,
  TaskError,
} from "@/modules/tsk/application/tasks";
import type { TaskFormState } from "@/modules/tsk/application/task-form-state";

/** The first message of a failed validation, or the database's refusal, for the toast. */
function failure(error: unknown): string {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? "Form eksik.";
  if (error instanceof TaskError) return error.message;
  throw error;
}

/**
 * SCR-014 "Görev ver": gives the task. From the full page it opens the new task; from the
 * dialog (`stay`) it reports success so the dialog closes over the page the person was on.
 */
export async function assignTaskAction(
  _previous: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  let taskId: string;
  try {
    taskId = await assignTask({
      title: formData.get("title") ?? "",
      description: formData.get("description") ?? undefined,
      assigneeId: formData.get("assigneeId") ?? "",
      priority: formData.get("priority") || undefined,
      dueOn: formData.get("dueOn") ?? undefined,
      needsApproval: formData.get("needsApproval") === "on",
    });
  } catch (error) {
    return { error: failure(error), done: null };
  }
  revalidatePath("/tasks");
  if (formData.get("stay") === "1") return { error: null, done: "Görev verildi.", taskId };
  redirect(`/tasks/${taskId}`);
}

const stepSchema = z.object({
  taskId: z.guid(),
  step: z.enum(["complete", "approve", "reopen"]),
  reason: z.string().max(1000).optional(),
});

const DONE_MESSAGES = {
  complete: "Görev tamamlandı.",
  reported: "Görevi verene bildirildi; onayından sonra kapanacak.",
  approve: "Görev onaylandı ve kapandı.",
  reopen: "Görev yeniden açıldı.",
} as const;

/** Completing, approving or reopening a task from its detail screen (REQ-TSK-004). */
export async function taskStepAction(
  _previous: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  let done: string;
  try {
    const input = stepSchema.parse({
      taskId: formData.get("taskId"),
      step: formData.get("step"),
      reason: formData.get("reason") ?? undefined,
    });
    if (input.step === "complete") {
      const status = await markTaskDone(input.taskId);
      done = status === "reported_done" ? DONE_MESSAGES.reported : DONE_MESSAGES.complete;
    } else if (input.step === "approve") {
      await approveTaskDone(input.taskId);
      done = DONE_MESSAGES.approve;
    } else {
      await reopen(input.taskId, input.reason ?? null);
      done = DONE_MESSAGES.reopen;
    }
    revalidatePath("/tasks");
    revalidatePath(`/tasks/${input.taskId}`);
  } catch (error) {
    return { error: failure(error), done: null };
  }
  return { error: null, done };
}
