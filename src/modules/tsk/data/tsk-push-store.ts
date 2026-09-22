import { sql } from "kysely";

import { runAsUser, type DbIdentity } from "@/platform/db";
import type { SystemDb } from "@/platform/jobs/types";
import type { PushTarget } from "@/platform/push/push";

/**
 * Phone notification addresses (TASK-0108 step 3, REQ-TSK-010). A person writes and reads only
 * their own; the worker reads the keys it needs to send and marks addresses the push service
 * says are gone. Keys never travel back to a browser.
 */

export function savePushSubscription(
  identity: DbIdentity,
  subscription: { endpoint: string; p256dh: string; auth: string; userAgent?: string | null },
) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ id: string }>`
      select tsk.save_push_subscription(${subscription.endpoint}, ${subscription.p256dh},
                                        ${subscription.auth},
                                        ${subscription.userAgent ?? null}) as id`.execute(db);
    return rows[0].id;
  });
}

export function expirePushSubscription(identity: DbIdentity, endpoint: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ done: boolean }>`
      select tsk.expire_push_subscription(${endpoint}) as done`.execute(db);
    return rows[0].done;
  });
}

/** Whether this browser is already known and still in use, for the "aç / kapat" button. */
export function readPushSubscriptionState(identity: DbIdentity, endpoint: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ status: string }>`
      select status from tsk.push_subscription where endpoint = ${endpoint}`.execute(db);
    return rows[0]?.status === "active";
  });
}

/** The worker's view: where to send one person's phone notification. */
export async function readPushTargets(db: SystemDb, userId: string): Promise<PushTarget[]> {
  const { rows } = await sql<{ endpoint: string; p256dh: string; auth: string }>`
    select endpoint, p256dh, auth from tsk.push_subscription
     where user_id = ${userId}::uuid and status = 'active'`.execute(db);
  return rows;
}

/** After a send: "gone" retires the address, "sent" only stamps it. */
export async function notePushResult(db: SystemDb, endpoint: string, result: "sent" | "gone") {
  await sql`
    update tsk.push_subscription
       set status = ${result === "gone" ? "expired" : "active"},
           last_sent_at = case when ${result} = 'sent' then now() else last_sent_at end,
           last_error = ${result === "gone" ? "push service: gone" : null},
           updated_at = now()
     where endpoint = ${endpoint}`.execute(db);
}

/** The notification the worker is about to send, or null when it no longer needs sending. */
export async function readNotificationForPush(db: SystemDb, notificationId: string) {
  const { rows } = await sql<{
    user_id: string;
    type: string;
    subject: string | null;
    link_path: string | null;
    channels: string[];
    read_at: Date | null;
  }>`
    select user_id, type, subject, link_path, channels, read_at
      from tsk.notification where id = ${notificationId}::uuid`.execute(db);
  const row = rows[0];
  if (!row || row.read_at !== null || !row.channels.includes("push")) return null;
  return {
    userId: row.user_id,
    type: row.type,
    subject: row.subject,
    linkPath: row.link_path,
  };
}
