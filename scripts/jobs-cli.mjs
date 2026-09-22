#!/usr/bin/env node
/**
 * Operator commands for the event backbone (TASK-0104, EVENT_BACKBONE sections 4 and 6, D-259).
 * They run over the admin connection; the worker itself runs inside the server process.
 *
 *   npm run jobs:status                     queue, delay and open dead letters
 *   npm run jobs:retry -- <dead-letter-id>  runs a dead delivery or job again, by hand
 *   npm run jobs:rebuild -- <read-model>    asks the worker to rebuild a read model
 */
import { pathToFileURL } from "node:url";

import { connectAdmin, safeError } from "./db-admin.mjs";

export const REBUILD_JOB = "core.read-model-rebuild";

export async function queueStatus(client) {
  const { rows } = await client.query(
    `select
       (select count(*) from core.outbox_delivery where status = 'pending')::int as pending_deliveries,
       (select count(*) from core.scheduled_job
         where status = 'pending' and available_at <= now())::int as due_jobs,
       (select count(*) from core.scheduled_job where status = 'pending')::int as planned_jobs,
       coalesce(extract(epoch from now() - least(
         (select min(available_at) from core.outbox_delivery where status = 'pending'),
         (select min(available_at) from core.scheduled_job
           where status = 'pending' and available_at <= now()))), 0)::int as oldest_seconds`,
  );
  const dead = await client.query(
    `select id, handler, left(error, 200) as error, created_at from core.dead_letter
      where resolved_at is null order by created_at`,
  );
  return { ...rows[0], dead_letters: dead.rows };
}

/**
 * Makes a dead delivery or job due again with a fresh attempt count and marks the dead letter
 * resolved; the repeat is harmless because deliveries are unique per event and subscriber.
 */
export async function retryDeadLetter(client, id) {
  await client.query("begin");
  try {
    const { rows } = await client.query(
      `update core.dead_letter set resolved_at = now(), resolved_by = current_user
        where id = $1 and resolved_at is null
        returning delivery_id, scheduled_job_id, handler`,
      [id],
    );
    if (!rows.length) throw new Error(`no open dead letter ${id}`);
    const { delivery_id: deliveryId, scheduled_job_id: jobId, handler } = rows[0];
    if (deliveryId)
      await client.query(
        `update core.outbox_delivery set status = 'pending', attempts = 0, available_at = now()
          where id = $1`,
        [deliveryId],
      );
    else
      await client.query(
        `update core.scheduled_job set status = 'pending', attempts = 0, available_at = now()
          where id = $1`,
        [jobId],
      );
    await client.query(
      `select aud.record_event('system.dead_letter_retried', 'core', 'dead_letter', $1::uuid,
                               jsonb_build_object('handler', $2::text, 'tool_user', current_user))`,
      [id, handler],
    );
    await client.query("commit");
    return handler;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  }
}

/** Schedules a rebuild; the worker that knows the read model runs it (SPIKE-14). */
export async function requestRebuild(client, name, now = new Date()) {
  const { rows } = await client.query(
    "select core.schedule_job($1, now(), $2, jsonb_build_object('name', $3::text)) as added",
    [REBUILD_JOB, `${REBUILD_JOB}:${name}@${now.toISOString()}`, name],
  );
  return rows[0].added;
}

async function run([command, arg]) {
  const client = await connectAdmin();
  try {
    if (command === "status") {
      const s = await queueStatus(client);
      console.log(`bekleyen teslim: ${s.pending_deliveries}`);
      console.log(`zamanı gelmiş iş: ${s.due_jobs} (planlı toplam ${s.planned_jobs})`);
      console.log(`en eski bekleyen: ${s.oldest_seconds} sn`);
      console.log(`açık ölü mektup: ${s.dead_letters.length}`);
      for (const d of s.dead_letters)
        console.log(`  ${d.id}  ${d.handler}  ${d.created_at.toISOString()}  ${d.error}`);
    } else if (command === "retry") {
      if (!arg) throw new Error("kullanım: npm run jobs:retry -- <ölü mektup kimliği>");
      console.log(`yeniden çalışacak: ${await retryDeadLetter(client, arg)}`);
    } else if (command === "rebuild") {
      if (!arg) throw new Error("kullanım: npm run jobs:rebuild -- <okuma modeli>");
      await requestRebuild(client, arg);
      console.log(`yeniden kurma sıraya alındı: ${arg}`);
    } else {
      throw new Error("kullanım: jobs-cli.mjs status | retry <kimlik> | rebuild <model>");
    }
  } finally {
    await client.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  run(process.argv.slice(2)).catch((error) => {
    console.error(`durdu — ${error.code ? safeError(error) : error.message}`);
    process.exitCode = 1;
  });
}
