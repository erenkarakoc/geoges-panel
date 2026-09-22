/**
 * State shared by the task server actions and the forms' `useActionState` hooks; kept out of
 * `task-actions.ts` because a `"use server"` module may only export async functions.
 */
export type TaskFormState = { error: string | null; done: string | null };

export const initialTaskFormState: TaskFormState = { error: null, done: null };
