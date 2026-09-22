import { sql } from "kysely";

import { readRule, ruleNumber } from "@/modules/adm";
import {
  DEFAULT_DIGEST_TIME,
  DEFAULT_ESCALATION_WAIT_HOURS,
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

/** Where a revision request is decided (SCR-192). */
const REVISION_PATH = "/approvals/revision-requests";

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

/**
 * Late tasks and the default escalation chain (REQ-TSK-006). Every quarter of an hour: a task
 * whose due date has passed tells its assignee once, and one whose waiting time has passed again
 * climbs a step. The waiting time is the dated rule `tsk.escalation-wait-hours`; in Phase 08 the
 * escalation flow takes both the chain and the time over.
 */
export function overdueAndEscalation(clock: () => Date = () => new Date()): JobDefinition {
  return {
    type: "tsk.overdue-and-escalation",
    recurrence: { everyMinutes: 15 },
    async run(db) {
      await handleLateTasks(db, clock());
    },
  };
}

export async function handleLateTasks(db: SystemDb, now: Date) {
  const rule = await readRule(db, "tsk.escalation-wait-hours", istanbulDay(now));
  const waitHours = ruleNumber(rule) ?? DEFAULT_ESCALATION_WAIT_HOURS;
  const { rows } = await sql<{ task_id: string; action: string }>`
    select task_id, action from tsk.tasks_needing_attention(${waitHours}, 100)`.execute(db);
  let told = 0;
  let escalated = 0;
  for (const row of rows) {
    if (row.action === "overdue") {
      const { rows: marked } = await sql<{ done: boolean }>`
        select tsk.mark_overdue(${row.task_id}::uuid) as done`.execute(db);
      if (marked[0].done) told += 1;
    } else {
      const { rows: moved } = await sql<{ target: string | null }>`
        select tsk.escalate_task(${row.task_id}::uuid) as target`.execute(db);
      if (moved[0].target) escalated += 1;
    }
  }
  return { told, escalated };
}

/**
 * The queue's own troubles (EVENT_BACKBONE section 4): a dead letter nobody has retried, or
 * deliveries running more than a quarter of an hour late, open one critical system-problem task
 * for the owner layer, which closes itself when the cause goes away (REQ-TSK-005).
 */
export function systemWatch(): JobDefinition {
  return {
    type: "tsk.system-watch",
    recurrence: { everyMinutes: 5 },
    async run(db) {
      await watchSystemHealth(db);
    },
  };
}

export const DELAY_ALARM_SECONDS = 15 * 60;

export async function watchSystemHealth(db: SystemDb) {
  const { rows } = await sql<{ dead_letters: number; behind_seconds: number }>`
    select dead_letters, behind_seconds from tsk.system_health()`.execute(db);
  const health = rows[0];
  await problem(db, {
    key: "system.dead_letter",
    open: health.dead_letters > 0,
    eventCode: "system.dead_letter",
    title: `İşlenemeyen ${health.dead_letters} olay var (ölü mektup)`,
    permission: null,
  });
  await problem(db, {
    key: "system.delivery_delay",
    open: health.behind_seconds > DELAY_ALARM_SECONDS,
    eventCode: "system.delivery_delay",
    title: `Olay kuyruğu ${Math.round(health.behind_seconds / 60)} dakika geride`,
    permission: null,
  });
  return health;
}

/** Opens or closes one system-problem task and tells the people who can act on it. */
async function problem(
  db: SystemDb,
  input: {
    key: string;
    open: boolean;
    eventCode: string;
    title: string;
    /** Who should hear about it; the owner layer when null. */
    permission: string | null;
    linkPath?: string;
  },
) {
  if (!input.open) {
    await sql`select tsk.resolve_problem(${input.key})`.execute(db);
    return null;
  }
  const { rows } = await sql<{ id: string }>`
    select id from ${
      input.permission
        ? sql`tsk.people_with_permission(${input.permission})`
        : sql`tsk.owner_people()`
    } as people(id)`.execute(db);
  // Nobody holds that right today: the owner layer hears it instead, so no alarm is lost.
  const people = rows.length
    ? rows
    : (await sql<{ id: string }>`select id from tsk.owner_people() as people(id)`.execute(db)).rows;
  if (!people.length) return null;
  const { rows: opened } = await sql<{ id: string }>`
    select tsk.open_problem_task(${input.key}, ${input.eventCode}, ${input.title},
                                 ${people[0].id}::uuid, 'critical', null,
                                 ${input.linkPath ?? null}) as id`.execute(db);
  for (const person of people) {
    await sql`
      select tsk.notify(${person.id}::uuid, 'system.problem', ${input.title},
                        ${input.linkPath ?? "/tasks"}, ${`problem:${input.key}`},
                        ${opened[0].id}::uuid, p_is_critical => true)`.execute(db);
  }
  return opened[0].id;
}

/**
 * A missing exchange rate is a problem for the people who may enter one by hand (REQ-ADM-013):
 * they get a critical notification and one task, which closes when the bulletin arrives. In
 * Phase 08 the default flow takes this over.
 */
export function exchangeRateAlarm(): EventSubscriber {
  return {
    name: "tsk.exchange-rate-alarm",
    events: ["exchange_rate.missing", "exchange_rate.received"],
    replayable: false,
    async handle(db, event) {
      const day = String(event.payload.bulletin_on ?? "").slice(0, 10);
      if (!day) return;
      await problem(db, {
        key: `exchange_rate.missing:${day}`,
        open: event.code === "exchange_rate.missing",
        eventCode: event.code,
        title: `${day} günü için TCMB kuru alınamadı; kuru elle girin`,
        permission: "adm.module.manage",
      });
    },
  };
}

/**
 * Revision requests become work (TASK-0109 step 4, REQ-AUD-008, D-265): a new request opens one
 * task for its approvers and tells each of them; the decision closes that task and tells the
 * person who asked. One task per request, so a second event changes nothing (REQ-TSK-005).
 */
export function revisionAlerts(): EventSubscriber {
  return {
    name: "tsk.revision-alerts",
    events: [
      "revision_request.submitted",
      "revision_request.approved",
      "revision_request.rejected",
    ],
    replayable: false,
    async handle(db, event) {
      const requestId = String(event.payload.revision_request_id ?? "");
      if (!requestId) return;
      const problemKey = `revision:${requestId}`;
      const label = String(event.payload.label ?? "Kayıt");
      const record = {
        schema: (event.payload.record_schema as string | null) ?? null,
        table: (event.payload.record_table as string | null) ?? null,
        id: (event.payload.record_id as string | null) ?? null,
      };

      if (event.code === "revision_request.submitted") {
        const approvers = Array.isArray(event.payload.approver_user_ids)
          ? (event.payload.approver_user_ids as string[])
          : [];
        if (!approvers.length) return;
        const title = `Revizyon talebi kararınızı bekliyor: ${label}`;
        const { rows } = await sql<{ id: string }>`
          select tsk.open_problem_task(${problemKey}, ${event.code}, ${title},
                                       ${approvers[0]}::uuid, 'high', null,
                                       ${REVISION_PATH}, ${record.schema}, ${record.table},
                                       ${record.id}::uuid) as id`.execute(db);
        for (const approver of approvers) {
          await sql`
            select tsk.notify(${approver}::uuid, 'approval.requested', ${label}, ${REVISION_PATH},
                              ${problemKey}, ${rows[0].id}::uuid, ${record.schema},
                              ${record.table}, ${record.id}::uuid)`.execute(db);
        }
        return;
      }

      await sql`select tsk.resolve_problem(${problemKey})`.execute(db);
      const requester = event.payload.requested_by_user_id;
      if (typeof requester !== "string") return;
      const stale = event.payload.stale === true;
      const type =
        event.code === "revision_request.approved"
          ? "revision.approved"
          : stale
            ? "revision.stale"
            : "revision.rejected";
      await sql`
        select tsk.notify(${requester}::uuid, ${type}, ${label}, ${REVISION_PATH},
                          ${`${problemKey}:${type}`}, null, ${record.schema}, ${record.table},
                          ${record.id}::uuid)`.execute(db);
    },
  };
}
