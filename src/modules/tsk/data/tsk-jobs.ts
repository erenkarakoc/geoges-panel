import { sql } from "kysely";

import { readRule } from "@/modules/adm";
import {
  DEFAULT_DIGEST_TIME,
  digestText,
  notificationText,
  type DigestCounts,
} from "@/modules/tsk/domain/tasks";
import type { EventSubscriber, JobDefinition, SystemDb } from "@/platform/jobs/types";
import type { MailSender } from "@/platform/mail/mail";
import type { PushSender } from "@/platform/push/push";
import type { SignalType } from "@/platform/signals/signals";
import { istanbulDay, istanbulMinutes, minutesOf } from "@/platform/time/istanbul";

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

/**
 * The morning summary (REQ-TSK-013, D-133). Every quarter of an hour the job asks whether the
 * sending time of the dated rule `tsk.digest-time` has passed in Istanbul; if it has, everybody
 * without a summary for today gets theirs: in the panel as a notification and by e-mail. A
 * person with nothing to do gets none, and the day is still recorded so nobody is summed up
 * twice.
 */
export function dailyDigest(mail: MailSender, clock: () => Date = () => new Date()): JobDefinition {
  return {
    type: "tsk.daily-digest",
    recurrence: { everyMinutes: 15 },
    async run(db) {
      await sendDailyDigests(db, mail, clock());
    },
  };
}

export async function sendDailyDigests(db: SystemDb, mail: MailSender, now: Date) {
  const day = istanbulDay(now);
  const rule = await readRule(db, "tsk.digest-time", day);
  const time = rule.found && typeof rule.value === "string" ? rule.value : DEFAULT_DIGEST_TIME;
  const sendFrom = minutesOf(time);
  if (istanbulMinutes(now) < sendFrom) return 0;

  const { rows: people } = await sql<{ id: string; email: string; display_name: string }>`
    select id, email, display_name
      from tsk.people_without_digest(${day}::date, 200)
        as people(id uuid, email text, display_name text)`.execute(db);

  let sent = 0;
  for (const person of people) {
    const { rows } = await sql<{ payload: DigestCounts }>`
      select tsk.digest_for(${person.id}::uuid, ${day}::date) as payload`.execute(db);
    const counts = rows[0].payload;
    const digest = digestText(counts);
    let emailed = false;
    if (!digest.isEmpty && person.email) {
      emailed = await mail.send({
        to: person.email,
        subject: `GEOGES Panel — ${digest.subject}`,
        text: [`${person.display_name}, günaydın.`, "", ...digest.lines, "", "Panel: /today"].join(
          "\n",
        ),
      });
    }
    const { rows: recorded } = await sql<{ id: string | null }>`
      select tsk.record_digest(${person.id}::uuid, ${day}::date, ${JSON.stringify(counts)}::jsonb,
                               ${digest.isEmpty}, ${emailed}) as id`.execute(db);
    if (!recorded[0].id || digest.isEmpty) continue;
    await sql`
      select tsk.notify(${person.id}::uuid, 'digest.daily', ${digest.lines.join(" · ")},
                        '/today', ${`digest:${day}`})`.execute(db);
    sent += 1;
  }
  return sent;
}
