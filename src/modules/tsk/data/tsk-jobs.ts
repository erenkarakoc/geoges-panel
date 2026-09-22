import { sql } from "kysely";

import type { EventSubscriber } from "@/platform/jobs/types";
import type { SignalType } from "@/platform/signals/signals";

/**
 * TSK's background work (TASK-0108). `tsk.live-signals` turns processed notification and task
 * events into live signals (ADR-018: the person hears of a change only after the event was
 * processed). Each signal names its kind only; the screen then reads with the person's own
 * permission. Not replayable: a rebuild must not ring every bell again.
 */

export type SignalSender = (userId: string, type: SignalType) => void;

const TASK_EVENTS = ["task.created", "task.completed", "task.overdue", "task.escalated"] as const;

export function liveSignals(send: SignalSender): EventSubscriber {
  return {
    name: "tsk.live-signals",
    events: ["notification.created", "notification.read", ...TASK_EVENTS],
    replayable: false,
    async handle(db, event) {
      if (event.code === "notification.created" || event.code === "notification.read") {
        const userId = event.payload.user_id;
        if (typeof userId === "string") send(userId, "notifications");
        return;
      }
      const taskId = event.payload.task_id ?? event.record?.id;
      if (typeof taskId !== "string") return;
      const { rows } = await sql<{ id: string }>`
        select tsk.task_audience(${taskId}::uuid) as id`.execute(db);
      for (const row of rows) send(row.id, "tasks");
    },
  };
}
