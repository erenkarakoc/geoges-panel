import "server-only";

import { indexSearchRow, removeSearchRow } from "@/platform/db/search-store";
import type { EventSubscriber, SystemDb } from "@/platform/jobs/types";
import type { SearchProjector, SearchProjection } from "@/platform/search/search";
import { lockSearchPublication } from "@/platform/db/search-store";

/**
 * Keeping search up to date (TASK-0110, D-266). The module that owns a record says which of its
 * events change the record and how the record looks in search; this subscriber runs that
 * projection and writes the index in the same transaction that marks the event delivered, so
 * the index never drifts from the events. Not replayable on its own: a rebuild reads the
 * records, not the bell.
 */

export type SearchRegistration = {
  /** Where the record lives; the event's payload carries its id. */
  record: { schema: string; table: string };
  /** Events after which the record has to be read again. */
  events: readonly string[];
  /** Events after which the record leaves search (deleted, archived, made private). */
  removedBy?: readonly string[];
  project: SearchProjector;
  /** Source-owned batch projection, ordered by UUID. Required when rebuilding. */
  scan: (
    db: SystemDb,
    afterId: string | null,
    limit: number,
  ) => Promise<{ id: string; projection: SearchProjection }[]>;
};

/** The id of the record an event is about: its own field first, then the event's record. */
function recordIdOf(payload: Record<string, unknown>, fallback: string | null): string | null {
  const own = payload.record_id ?? payload.id;
  return typeof own === "string" ? own : fallback;
}

export function searchIndexer(registrations: readonly SearchRegistration[]): EventSubscriber {
  const byEvent = new Map<string, { entry: SearchRegistration; removes: boolean }[]>();
  for (const entry of registrations) {
    for (const code of entry.events) {
      byEvent.set(code, [...(byEvent.get(code) ?? []), { entry, removes: false }]);
    }
    for (const code of entry.removedBy ?? []) {
      byEvent.set(code, [...(byEvent.get(code) ?? []), { entry, removes: true }]);
    }
  }

  return {
    name: "core.search-index",
    events: [...byEvent.keys()],
    replayable: false,
    async handle(db, event) {
      await lockSearchPublication(db);
      for (const { entry } of byEvent.get(event.code) ?? []) {
        const id = recordIdOf(event.payload, event.record?.id ?? null);
        if (!id) continue;
        const record = { ...entry.record, id };
        // Always read the source, including removal events: a late event must not delete a
        // newer, visible record. An archived/deleted source projects null.
        const projection = await entry.project(db, id);
        if (!projection) {
          await removeSearchRow(db, record);
          continue;
        }
        await indexSearchRow(db, record, projection, event.occurredAt ?? null);
      }
    },
  };
}
