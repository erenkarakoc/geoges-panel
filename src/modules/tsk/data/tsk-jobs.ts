import { sql } from "kysely";

import { notificationText } from "@/modules/tsk/domain/tasks";
import type { EventSubscriber } from "@/platform/jobs/types";
import type { PushSender } from "@/platform/push/push";
import type { SignalType } from "@/platform/signals/signals";

import { notePushResult, readNotificationForPush, readPushTargets } from "./tsk-push-store";

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

/**
 * Sends the phone notification of a notification that asked for one (REQ-TSK-010, D-132): new
 * task, approval request and critical alert. The words are the panel's own (a fixed template,
 * no sensitive data, REQ-TSK-011). An address the push service calls gone is retired; other
 * failures are left alone, because a notification is never repeated later out of context.
 */
export function phonePush(sender: PushSender): EventSubscriber {
  return {
    name: "tsk.phone-push",
    events: ["notification.created"],
    replayable: false,
    async handle(db, event) {
      const notificationId = String(event.payload.notification_id ?? "");
      if (!notificationId) return;
      const notification = await readNotificationForPush(db, notificationId);
      if (!notification) return;
      const targets = await readPushTargets(db, notification.userId);
      if (!targets.length) return;
      const message = {
        ...notificationText(notification.type, notification.subject),
        url: notification.linkPath,
      };
      for (const target of targets) {
        const result = await sender.send(target, message);
        if (result !== "failed") await notePushResult(db, target.endpoint, result);
      }
    },
  };
}
