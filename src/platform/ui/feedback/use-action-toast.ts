"use client";

import { useEffect, useRef } from "react";

import { toastManager } from "@/components/ui/toast";

export type ActionToast = {
  type: "error" | "success" | "info" | "warning";
  title: string;
  description?: string;
} | null;

/**
 * Reports the result of a server action as a toast (DESIGN_SYSTEM_RULES §13): errors, warnings
 * and success messages are never rendered inside the form.
 *
 * `state` is the object `useActionState` returns — a new object on every submission, so the same
 * message repeats correctly when the user retries and fails the same way twice.
 */
export function useActionToast(state: object, toast: ActionToast): void {
  const reportedState = useRef(state);

  useEffect(() => {
    if (reportedState.current === state) {
      return;
    }

    reportedState.current = state;

    if (toast) {
      toastManager.add(toast);
    }
  });
}
