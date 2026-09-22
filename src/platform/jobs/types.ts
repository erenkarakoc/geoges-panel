import type { Kysely } from "kysely";

/**
 * What modules hand to the event backbone (TASK-0104, EVENT_BACKBONE.md, D-259). Modules export
 * these from their `index.ts`; `src/jobs/registry.ts` collects them. Handlers run on the
 * worker's connection inside the transaction that also marks the work done, so an effect and
 * its "done" mark commit together or not at all (SPIKE-03).
 */

export type SystemDb = Kysely<unknown>;

export type DeliveredEvent = {
  id: string;
  code: string;
  version: number;
  module: string;
  record: { schema: string; table: string; id: string } | null;
  payload: Record<string, unknown>;
  actorUserId: string | null;
  occurredAt: Date;
};

export type HandlerContext = {
  /** Version of a read model that live updates write to (D-233). */
  readModelVersion(name: string): Promise<number>;
};

export type EventSubscriber = {
  /** `<module>.<name>`, unique; together with the event it makes a repeat harmless. */
  name: string;
  events: readonly string[];
  /**
   * May it run again during a read model rebuild? Only read-model feeders are; anything that
   * creates tasks, notifications, ledger rows or messages is not (D-234).
   */
  replayable: boolean;
  handle(db: SystemDb, event: DeliveredEvent, context: HandlerContext): Promise<void>;
};

/** "Every day at HH:MM Istanbul time" or "every N minutes". */
export type Recurrence = { dailyAt: string } | { everyMinutes: number };

export type JobDefinition = {
  /** `<module>.<name>`. */
  type: string;
  recurrence?: Recurrence;
  run(db: SystemDb, job: { runAt: Date; payload: Record<string, unknown> }): Promise<void>;
};

/**
 * A read model (D-233, SPIKE-14). Its table has a `model_version` column; a rebuild fills the
 * next version from the outbox, compares it with the sources, and switches readers to it in one
 * statement. Rows are kept per source record and only a newer event may change them.
 */
export type ReadModelDefinition = {
  /** `<module>.<name>`. */
  name: string;
  /** `schema.table` holding every version. */
  table: string;
  events: readonly string[];
  /** Applies a batch of events (in outbox order) to one version, set-based. */
  replay(db: SystemDb, version: number, events: readonly DeliveredEvent[]): Promise<void>;
  /** Number of rows of a version that disagree with their sources. */
  compare(db: SystemDb, version: number): Promise<number>;
  /** Removes every row of a version. */
  clear(db: SystemDb, version: number): Promise<void>;
};

export type JobRegistry = {
  subscribers: readonly EventSubscriber[];
  jobs: readonly JobDefinition[];
  readModels: readonly ReadModelDefinition[];
};
