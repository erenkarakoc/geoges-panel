import {
  activeReadModelVersion,
  beginSystem,
  claimDelivery,
  claimJob,
  leaseJob,
  markDeliveryDone,
  markDeliveryFailed,
  markJobDone,
  markJobFailed,
  noteQueueDelay,
  outboxHead,
  planJob,
  readEventsAfter,
  readModelVersion,
  readQueueState,
  switchReadModel,
  syncSubscriptions,
  type DeliveryRow,
} from "@/platform/db/job-store";
import { kyselyOn, type ClientPool, type PooledClient } from "@/platform/db/run-as-user";

import { validateRegistry } from "./registry";
import { occurrences, retryAt, runKey } from "./timing";
import type {
  DeliveredEvent,
  HandlerContext,
  JobRegistry,
  ReadModelDefinition,
  SystemDb,
} from "./types";

/**
 * The outbox worker (TASK-0104, ADR-014, EVENT_BACKBONE.md, D-259). One `tick` keeps the
 * subscriptions in step with the registry, plans recurring jobs, delivers what is due, runs due
 * jobs and raises the delay alarm. Deliveries are created by core.publish_event in the publishing
 * transaction; a worker only takes deliveries and jobs it has handlers for, so workers with
 * different registries (a test next to a dev server) never take each other's work. Every unit of work is its own transaction on the worker role's
 * connection: the handler's effect and the "done" mark commit together; a failure rolls the
 * effect back to a savepoint and records the failure in the same transaction. Several workers
 * may run at once (locks and head-of-line checks keep them apart).
 */

export const REBUILD_JOB = "core.read-model-rebuild";
const DELAY_ALARM_SECONDS = 15 * 60;
const BATCH = 200;

export type WorkerOptions = {
  pool: ClientPool;
  registry: JobRegistry;
  now?: () => Date;
  log?: (message: string) => void;
};

const toEvent = (row: DeliveryRow): DeliveredEvent => ({
  id: row.eventId,
  code: row.eventCode,
  version: row.eventVersion,
  module: row.publisherModule,
  record:
    row.recordSchema && row.recordTable && row.recordId
      ? { schema: row.recordSchema, table: row.recordTable, id: row.recordId }
      : null,
  payload: row.payload,
  actorUserId: row.actorUserId,
  occurredAt: row.occurredAt,
});

/** Error text kept for the dead-letter list: the message only, bounded. */
const describe = (error: unknown) =>
  (error instanceof Error ? error.message : String(error)).slice(0, 2000);

export function createWorker({ pool, registry, now = () => new Date(), log }: WorkerOptions) {
  validateRegistry(registry);
  const subscribers = new Map(registry.subscribers.map((s) => [s.name, s]));
  const jobs = new Map(registry.jobs.map((j) => [j.type, j]));
  const readModels = new Map(registry.readModels.map((m) => [m.name, m]));

  /** Runs `work` in one worker transaction; the connection is destroyed if even rollback fails. */
  async function inTransaction<T>(work: (client: PooledClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await beginSystem(client);
      const result = await work(client);
      await client.query("commit");
      client.release();
      return result;
    } catch (error) {
      try {
        await client.query("rollback");
        client.release();
      } catch {
        client.release(true);
      }
      throw error;
    }
  }

  const contextFor = (client: PooledClient): HandlerContext => ({
    readModelVersion: (name) => activeReadModelVersion(client, name),
  });

  const subscriberNames = [...subscribers.keys()];
  const jobTypes = [...jobs.keys()];
  const readModelNames = [...readModels.keys()];

  /** Writes this registry's subscriptions; publishing creates deliveries from them. */
  function syncRegistry(): Promise<void> {
    return inTransaction((client) =>
      syncSubscriptions(
        client,
        registry.subscribers.flatMap((s) =>
          s.events.map((eventCode) => ({
            subscriber: s.name,
            eventCode,
            replayable: s.replayable,
          })),
        ),
      ),
    );
  }

  /** Delivers one due delivery; false when nothing is deliverable. */
  function deliverOne(): Promise<boolean> {
    return inTransaction(async (client) => {
      const row = await claimDelivery(client, subscriberNames);
      if (!row) return false;
      await client.query("savepoint handler");
      try {
        const subscriber = subscribers.get(row.subscriber);
        if (!subscriber) throw new Error(`no subscriber named ${row.subscriber} is registered`);
        await subscriber.handle(kyselyOn(client), toEvent(row), contextFor(client));
        await markDeliveryDone(client, row.deliveryId);
      } catch (error) {
        await client.query("rollback to savepoint handler");
        await markDeliveryFailed(client, row, describe(error), retryAt(row.attempts, now()));
        log?.(`delivery ${row.deliveryId} (${row.subscriber}) failed: ${describe(error)}`);
      }
      return true;
    });
  }

  /** Runs one due job; false when none is due. */
  async function runOneJob(): Promise<boolean> {
    const claimed = await inTransaction(async (client) => {
      const job = await claimJob(client, jobTypes, REBUILD_JOB, readModelNames);
      if (!job) return null;
      if (job.jobType === REBUILD_JOB) {
        // A rebuild spans many transactions: hold the job, run it, then settle it.
        await leaseJob(client, job.id);
        return { job, long: true };
      }
      await client.query("savepoint handler");
      try {
        const definition = jobs.get(job.jobType);
        if (!definition) throw new Error(`no job named ${job.jobType} is registered`);
        await definition.run(kyselyOn(client), { runAt: job.runAt, payload: job.payload });
        await markJobDone(client, job.id);
      } catch (error) {
        await client.query("rollback to savepoint handler");
        await markJobFailed(client, job, describe(error), retryAt(job.attempts, now()));
        log?.(`job ${job.jobType} failed: ${describe(error)}`);
      }
      return { job, long: false };
    });
    if (!claimed) return false;
    if (claimed.long) {
      const { job } = claimed;
      try {
        await rebuildReadModel(String(job.payload.name ?? ""));
        await inTransaction((client) => markJobDone(client, job.id));
      } catch (error) {
        await inTransaction((client) =>
          markJobFailed(client, job, describe(error), retryAt(job.attempts, now())),
        );
        log?.(`rebuild ${String(job.payload.name)} failed: ${describe(error)}`);
      }
    }
    return true;
  }

  /** Plans the latest and the next run of every recurring job; planning twice is harmless. */
  function planRecurring(): Promise<void> {
    return inTransaction(async (client) => {
      for (const job of registry.jobs) {
        if (!job.recurrence) continue;
        const { previous, next } = occurrences(job.recurrence, now());
        for (const runAt of [previous, next])
          await planJob(client, { type: job.type, runAt, key: runKey(job.type, runAt) });
      }
    });
  }

  /** Writes the 15-minute delay alarm to the audit log, at most once an hour. */
  function checkDelay(): Promise<number> {
    return inTransaction(async (client) => {
      const state = await readQueueState(client);
      if (state.oldestWaitingSeconds > DELAY_ALARM_SECONDS)
        await noteQueueDelay(client, state.oldestWaitingSeconds);
      return state.oldestWaitingSeconds;
    });
  }

  /**
   * Rebuilds a read model from the outbox (D-233, SPIKE-14): fills the next version up to the
   * current head, catches up, compares with the sources, switches readers in one statement,
   * catches up once more and removes the old version. Only the model's own replay runs, never a
   * subscriber, so nothing that notifies or creates tasks runs twice.
   */
  async function rebuildReadModel(name: string): Promise<{ version: number; difference: number }> {
    const model: ReadModelDefinition | undefined = readModels.get(name);
    if (!model) throw new Error(`no read model named ${name} is registered`);
    const version = await inTransaction(async (client) => {
      const next = (await readModelVersion(client, model.name, model.table)) + 1;
      await model.clear(kyselyOn(client) as SystemDb, next);
      return next;
    });
    const replayFrom = async (after: string, upTo: string | null) => {
      let last = after;
      for (;;) {
        const events = await inTransaction(async (client) => {
          const rows = await readEventsAfter(client, model.events, last, 1000);
          const inRange =
            upTo === null ? rows : rows.filter((r) => BigInt(r.outboxId) <= BigInt(upTo));
          if (inRange.length) await model.replay(kyselyOn(client), version, inRange.map(toEvent));
          return inRange;
        });
        if (!events.length) return last;
        last = events[events.length - 1].outboxId;
      }
    };
    const head = await inTransaction((client) => outboxHead(client));
    let last = await replayFrom("0", head);
    last = await replayFrom(last, null);
    const difference = await inTransaction((client) => model.compare(kyselyOn(client), version));
    await inTransaction((client) => switchReadModel(client, model.name, version, difference));
    await replayFrom(last, null);
    await inTransaction((client) => model.clear(kyselyOn(client), version - 1));
    log?.(`read model ${name} rebuilt as version ${version}, ${difference} difference(s)`);
    return { version, difference };
  }

  let running = false;
  let synced = false;

  /** One round of work; overlapping calls are skipped. */
  async function tick(): Promise<void> {
    if (running) return;
    running = true;
    try {
      if (!synced) {
        await syncRegistry();
        synced = true;
      }
      await planRecurring();
      for (let i = 0; i < BATCH && (await deliverOne()); i++);
      for (let i = 0; i < BATCH && (await runOneJob()); i++);
      await checkDelay();
    } finally {
      running = false;
    }
  }

  return { tick, syncRegistry, deliverOne, runOneJob, planRecurring, checkDelay, rebuildReadModel };
}

export type Worker = ReturnType<typeof createWorker>;
