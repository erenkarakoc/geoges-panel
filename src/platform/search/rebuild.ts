import "server-only";
import {
  beginSearchRebuild,
  captureSearchChanges,
  publishSearchStage,
  readSearchChanges,
  refreshSearchStage,
  stageSearchBatch,
} from "@/platform/db/search-rebuild-store";
import type { JobDefinition, SystemDb } from "@/platform/jobs/types";
import { searchRecordId, type SearchRegistration } from "./indexer";

const BATCH_SIZE = 250;
/** Rebuild from source projections only. No event subscribers or notification effects are replayed. */
export async function rebuildSearch(db: SystemDb, registrations: readonly SearchRegistration[]) {
  if (!registrations.length) throw new Error("No search source is registered");
  const sources = new Set<string>();
  for (const entry of registrations) {
    const key = `${entry.record.schema}.${entry.record.table}`;
    if (sources.has(key) || !entry.scan)
      throw new Error("Search sources need one unique, pageable scanner each");
    sources.add(key);
  }
  const eventCodes = [
    ...new Set(registrations.flatMap((entry) => [...entry.events, ...(entry.removedBy ?? [])])),
  ];
  const version = await beginSearchRebuild(db, eventCodes);
  let count = 0;
  for (const entry of registrations) {
    let afterId: string | null = null;
    for (;;) {
      const rows = await entry.scan!(db, afterId, BATCH_SIZE);
      if (!rows.length) break;
      if (rows.length > BATCH_SIZE) throw new Error("Search source exceeded its page size");
      let previous = afterId;
      for (const row of rows) {
        if (
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(row.id) ||
          (previous && row.id <= previous)
        ) {
          throw new Error("Search source pagination must advance in UUID order");
        }
        if (row.projection.recordType.split(".")[0] !== entry.record.schema)
          throw new Error("Search type belongs to another module");
        previous = row.id;
      }
      await stageSearchBatch(db, entry.record, rows);
      count += rows.length;
      afterId = rows[rows.length - 1].id;
    }
  }
  const catchup = await captureSearchChanges(db, eventCodes);
  let afterEvent = "0";
  let caught = 0;
  for (;;) {
    const changes = await readSearchChanges(db, afterEvent, BATCH_SIZE);
    if (!changes.length) break;
    for (const change of changes) {
      const id = searchRecordId(change.payload, change.recordId);
      if (!id) continue;
      for (const entry of registrations) {
        if (!entry.events.includes(change.code) && !entry.removedBy?.includes(change.code))
          continue;
        const projection = await entry.project(db, id);
        if (projection && projection.recordType.split(".")[0] !== entry.record.schema)
          throw new Error("Search type belongs to another module");
        count += await refreshSearchStage(db, entry.record, id, projection);
      }
    }
    caught += changes.length;
    afterEvent = changes[changes.length - 1].id;
  }
  if (caught !== catchup.events)
    throw new Error("Search catch-up did not consume its captured events");
  return publishSearchStage(
    db,
    registrations.map((entry) => entry.record),
    version,
    count,
    catchup,
  );
}

export const SEARCH_REBUILD_JOB = "core.search-rebuild";
export function searchRebuildJob(registrations: readonly SearchRegistration[]): JobDefinition {
  return {
    type: SEARCH_REBUILD_JOB,
    async run(db) {
      await rebuildSearch(db, registrations);
    },
  };
}
