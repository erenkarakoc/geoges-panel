import type { PooledClient } from "./run-as-user";

/**
 * The outbox worker's queries (TASK-0104, ADR-014, SPIKE-03). They run on the worker role's
 * connection (`geoges_worker`, D-259) inside transactions the worker opens; the worker decides
 * when to commit. SQL lives here because only `platform/db` and module data layers hold SQL.
 */

export type DeliveryRow = {
  deliveryId: string;
  outboxId: string;
  subscriber: string;
  attempts: number;
  eventId: string;
  eventCode: string;
  eventVersion: number;
  publisherModule: string;
  recordSchema: string | null;
  recordTable: string | null;
  recordId: string | null;
  sequenceKey: string;
  payload: Record<string, unknown>;
  actorUserId: string | null;
  occurredAt: Date;
};

export type JobRow = {
  id: string;
  jobType: string;
  runAt: Date;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  attempts: number;
};

type Row = Record<string, unknown>;

const toDelivery = (r: Row): DeliveryRow => ({
  deliveryId: String(r.delivery_id),
  outboxId: String(r.outbox_id),
  subscriber: r.subscriber as string,
  attempts: Number(r.attempts),
  eventId: r.event_id as string,
  eventCode: r.event_code as string,
  eventVersion: Number(r.event_version),
  publisherModule: r.publisher_module as string,
  recordSchema: r.record_schema as string | null,
  recordTable: r.record_table as string | null,
  recordId: r.record_id as string | null,
  sequenceKey: r.sequence_key as string,
  payload: r.payload as Record<string, unknown>,
  actorUserId: r.actor_user_id as string | null,
  occurredAt: new Date(r.occurred_at as string),
});

/** Opens a worker transaction: no person, a statement timeout, nothing session-wide. */
export async function beginSystem(client: PooledClient): Promise<void> {
  await client.query("begin");
  await client.query(
    "select set_config('app.user_id', '', true), set_config('app.role_id', '', true), set_config('statement_timeout', '60s', true)",
  );
}

/**
 * Keeps the database's subscriptions in step with the code registry, so core.publish_event can
 * create the deliveries in the publishing transaction. Adds and refreshes; never removes.
 */
export async function syncSubscriptions(
  client: PooledClient,
  subscriptions: readonly { subscriber: string; eventCode: string; replayable: boolean }[],
): Promise<void> {
  if (!subscriptions.length) return;
  await client.query(
    `insert into core.event_subscription (subscriber, event_code, replayable)
     select * from unnest($1::text[], $2::text[], $3::boolean[])
     on conflict (subscriber, event_code)
     do update set replayable = excluded.replayable, last_seen_at = now()`,
    [
      subscriptions.map((s) => s.subscriber),
      subscriptions.map((s) => s.eventCode),
      subscriptions.map((s) => s.replayable),
    ],
  );
}

/**
 * Claims the next deliverable delivery of one of `subscribers` (the ones this worker knows) and
 * locks it for this transaction. A delivery is taken only when no older delivery of the same
 * subscriber and sequence key is still open — pending, locked by another worker, or dead
 * (SPIKE-03: head-of-line per record).
 */
export async function claimDelivery(
  client: PooledClient,
  subscribers: readonly string[],
): Promise<DeliveryRow | null> {
  const { rows } = await client.query(
    `select d.id as delivery_id, d.outbox_id, d.subscriber, d.attempts, o.event_id, o.event_code,
            o.event_version, o.publisher_module, o.record_schema, o.record_table, o.record_id,
            o.sequence_key, o.payload, o.actor_user_id, o.occurred_at
       from core.outbox_delivery d
       join core.outbox o on o.id = d.outbox_id
      where d.status = 'pending' and d.available_at <= now() and d.subscriber = any($1)
        and not exists (
          select from core.outbox_delivery e
           where e.subscriber = d.subscriber and e.sequence_key = d.sequence_key
             and e.status <> 'done' and e.outbox_id < d.outbox_id)
      order by d.outbox_id
      limit 1
      for update of d skip locked`,
    [subscribers],
  );
  return rows.length ? toDelivery(rows[0] as Row) : null;
}

export async function markDeliveryDone(client: PooledClient, deliveryId: string): Promise<void> {
  await client.query(
    `update core.outbox_delivery
        set status = 'done', processed_at = now(), attempts = attempts + 1, last_error = null
      where id = $1`,
    [deliveryId],
  );
}

/**
 * Records a failed delivery (after the handler was rolled back to its savepoint). Before the last attempt it waits for the
 * given time; after it, the delivery is dead: a dead letter and an audit event are written.
 */
export async function markDeliveryFailed(
  client: PooledClient,
  delivery: DeliveryRow,
  error: string,
  retryAt: Date | null,
): Promise<void> {
  if (retryAt) {
    await client.query(
      `update core.outbox_delivery
          set attempts = attempts + 1, last_error = $2, available_at = $3
        where id = $1`,
      [delivery.deliveryId, error, retryAt],
    );
    return;
  }
  await client.query(
    `update core.outbox_delivery set status = 'dead', attempts = attempts + 1, last_error = $2
      where id = $1`,
    [delivery.deliveryId, error],
  );
  await client.query(
    `insert into core.dead_letter (delivery_id, handler, error, payload)
     values ($1, $2, $3, jsonb_build_object('event_id', $4::text, 'event_code', $5::text,
                                            'publisher_module', $6::text))`,
    [
      delivery.deliveryId,
      delivery.subscriber,
      error,
      delivery.eventId,
      delivery.eventCode,
      delivery.publisherModule,
    ],
  );
  await client.query(
    `select aud.record_event('system.dead_letter', 'core', 'outbox_delivery', null,
                             jsonb_build_object('subscriber', $1::text, 'event_code', $2::text))`,
    [delivery.subscriber, delivery.eventCode],
  );
}

/**
 * Claims the next due job this worker can run — one of `types`, or a rebuild of one of
 * `readModels` — and locks it for this transaction.
 */
export async function claimJob(
  client: PooledClient,
  types: readonly string[],
  rebuildJob: string,
  readModels: readonly string[],
): Promise<JobRow | null> {
  const { rows } = await client.query(
    `select id, job_type, run_at, idempotency_key, payload, attempts from core.scheduled_job
      where status = 'pending' and available_at <= now()
        and (job_type = any($1) or (job_type = $2 and payload ->> 'name' = any($3)))
      order by available_at, id
      limit 1
      for update skip locked`,
    [types, rebuildJob, readModels],
  );
  if (!rows.length) return null;
  const r = rows[0] as Row;
  return {
    id: r.id as string,
    jobType: r.job_type as string,
    runAt: new Date(r.run_at as string),
    idempotencyKey: r.idempotency_key as string,
    payload: r.payload as Record<string, unknown>,
    attempts: Number(r.attempts),
  };
}

export async function markJobDone(client: PooledClient, jobId: string): Promise<void> {
  await client.query(
    `update core.scheduled_job
        set status = 'done', processed_at = now(), attempts = attempts + 1, last_error = null
      where id = $1`,
    [jobId],
  );
}

export async function markJobFailed(
  client: PooledClient,
  job: JobRow,
  error: string,
  retryAt: Date | null,
): Promise<void> {
  if (retryAt) {
    await client.query(
      `update core.scheduled_job set attempts = attempts + 1, last_error = $2, available_at = $3
        where id = $1`,
      [job.id, error, retryAt],
    );
    return;
  }
  await client.query(
    `update core.scheduled_job set status = 'dead', attempts = attempts + 1, last_error = $2
      where id = $1`,
    [job.id, error],
  );
  await client.query(
    `insert into core.dead_letter (scheduled_job_id, handler, error, payload)
     values ($1, $2, $3, jsonb_build_object('idempotency_key', $4::text))`,
    [job.id, job.jobType, error, job.idempotencyKey],
  );
  await client.query(
    `select aud.record_event('system.dead_letter', 'core', 'scheduled_job', $1::uuid,
                             jsonb_build_object('job_type', $2::text))`,
    [job.id, job.jobType],
  );
}

/** Plans one run of a job; idempotent by key. */
export async function planJob(
  client: PooledClient,
  job: { type: string; runAt: Date; key: string; payload?: Record<string, unknown> },
): Promise<boolean> {
  const { rows } = await client.query("select core.schedule_job($1, $2, $3, $4::jsonb) as added", [
    job.type,
    job.runAt,
    job.key,
    JSON.stringify(job.payload ?? {}),
  ]);
  return (rows[0] as Row).added === true;
}

export type QueueState = {
  pendingDeliveries: number;
  pendingJobsDue: number;
  openDeadLetters: number;
  /** Age in seconds of the oldest work that should already have run; 0 when none. */
  oldestWaitingSeconds: number;
};

/** What is waiting, for `jobs:status` and the 15-minute delay alarm (EVENT_BACKBONE section 7). */
export async function readQueueState(client: PooledClient): Promise<QueueState> {
  const { rows } = await client.query(
    `select
       (select count(*) from core.outbox_delivery where status = 'pending')::int as pending_deliveries,
       (select count(*) from core.scheduled_job
         where status = 'pending' and available_at <= now())::int as pending_jobs_due,
       (select count(*) from core.dead_letter where resolved_at is null)::int as open_dead_letters,
       coalesce(extract(epoch from now() - least(
         (select min(available_at) from core.outbox_delivery where status = 'pending'),
         (select min(available_at) from core.scheduled_job
           where status = 'pending' and available_at <= now()))), 0)::int as oldest`,
  );
  const r = rows[0] as Row;
  return {
    pendingDeliveries: Number(r.pending_deliveries),
    pendingJobsDue: Number(r.pending_jobs_due),
    openDeadLetters: Number(r.open_dead_letters),
    oldestWaitingSeconds: Math.max(0, Number(r.oldest)),
  };
}

/** Writes the delay alarm at most once an hour (EVENT_BACKBONE section 7). */
export async function noteQueueDelay(client: PooledClient, seconds: number): Promise<boolean> {
  const { rows } = await client.query(
    `select aud.record_event('system.queue_delayed', null, null, null,
                             jsonb_build_object('oldest_waiting_seconds', $1::int)) as id
      where not exists (select from aud.audit_log
                         where event_type = 'system.queue_delayed'
                           and occurred_at > now() - interval '1 hour')`,
    [seconds],
  );
  return rows.length > 0;
}

// ---------------------------------------------------------------------------------------------
// Read models (D-233, SPIKE-14)
// ---------------------------------------------------------------------------------------------

/** The version readers see; registers the model at version 1 the first time. */
export async function readModelVersion(
  client: PooledClient,
  name: string,
  table: string,
): Promise<number> {
  const { rows } = await client.query(
    `insert into core.read_model (name, active_table) values ($1, $2)
     on conflict (name) do update set active_table = excluded.active_table
     returning version`,
    [name, table],
  );
  return Number((rows[0] as Row).version);
}

/** Highest outbox id: the point a rebuild replays up to before catching up. */
export async function outboxHead(client: PooledClient): Promise<string> {
  const { rows } = await client.query("select coalesce(max(id), 0) as id from core.outbox");
  return String((rows[0] as Row).id);
}

/** Events of the given codes after an outbox id, in order, one batch at a time. */
export async function readEventsAfter(
  client: PooledClient,
  codes: readonly string[],
  afterId: string,
  limit: number,
): Promise<DeliveryRow[]> {
  const { rows } = await client.query(
    `select null as delivery_id, id as outbox_id, null as subscriber, 0 as attempts, event_id,
            event_code, event_version, publisher_module, record_schema, record_table, record_id,
            sequence_key, payload, actor_user_id, occurred_at
       from core.outbox where event_code = any($1) and id > $2 order by id limit $3`,
    [codes, afterId, limit],
  );
  return (rows as Row[]).map(toDelivery);
}

/** Readers switch to the rebuilt version in one statement. */
export async function switchReadModel(
  client: PooledClient,
  name: string,
  version: number,
  difference: number,
): Promise<void> {
  await client.query(
    `update core.read_model set version = $2, rebuilt_at = now(), last_difference = $3
      where name = $1`,
    [name, version, difference],
  );
  await client.query(
    `select aud.record_event('read_model.rebuilt', 'core', 'read_model', null,
                             jsonb_build_object('name', $1::text, 'version', $2::int,
                                                'difference', $3::int))`,
    [name, version, difference],
  );
}

/** The version live updates write to; 1 for a model never rebuilt. */
export async function activeReadModelVersion(client: PooledClient, name: string): Promise<number> {
  const { rows } = await client.query("select version from core.read_model where name = $1", [
    name,
  ]);
  return rows.length ? Number((rows[0] as Row).version) : 1;
}

/** Holds a long job (a rebuild) for an hour; if the process dies, the job becomes due again. */
export async function leaseJob(client: PooledClient, jobId: string): Promise<void> {
  await client.query(
    "update core.scheduled_job set available_at = now() + interval '1 hour' where id = $1",
    [jobId],
  );
}
