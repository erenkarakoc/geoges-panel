import { sql, type Kysely } from "kysely";

/**
 * The two doors request code has into the event backbone (TASK-0104, ADR-014). Both run inside
 * the caller's transaction (`runAsUser` or a worker handler), so an event or a scheduled run
 * exists exactly when the change that caused it is committed.
 */

export type PublishedEvent = {
  /** Catalog code, e.g. `daily_site_log.approved` (a breaking change is a new `.v2` code). */
  code: string;
  /** Publishing module code, lower case (`sit`). */
  module: string;
  record?: { schema: string; table: string; id: string };
  /** Ids and codes only; never commercial or sensitive values (REQ-TSK-011). */
  payload?: Record<string, unknown>;
  version?: number;
  /** Events with the same key reach each subscriber in publishing order; default: the record. */
  sequenceKey?: string;
};

/** Publishes an event in the current transaction; returns its id. */
export async function publishEvent<DB>(db: Kysely<DB>, event: PublishedEvent): Promise<string> {
  const { rows } = await sql<{ id: string }>`
    select core.publish_event(${event.code}, ${event.module}, ${event.record?.schema ?? null},
                              ${event.record?.table ?? null}, ${event.record?.id ?? null}::uuid,
                              ${JSON.stringify(event.payload ?? {})}::jsonb,
                              ${event.version ?? 1}, ${event.sequenceKey ?? null}) as id`.execute(
    db,
  );
  return rows[0].id;
}

/**
 * Schedules one run of a job (a workflow wake-up, a reminder). The key makes it happen once:
 * a second call with the same key does nothing and returns false.
 */
export async function scheduleJob<DB>(
  db: Kysely<DB>,
  job: { type: string; runAt: Date; key: string; payload?: Record<string, unknown> },
): Promise<boolean> {
  const { rows } = await sql<{ added: boolean }>`
    select core.schedule_job(${job.type}, ${job.runAt.toISOString()}::timestamptz, ${job.key},
                             ${JSON.stringify(job.payload ?? {})}::jsonb) as added`.execute(db);
  return rows[0].added;
}
