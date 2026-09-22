import { sql } from "kysely";

import { runAsUser, type DbIdentity } from "@/platform/db";
import type { SystemDb } from "@/platform/jobs/types";
import type { SearchHit, SearchProjection } from "@/platform/search/search";

/**
 * The search index in the database (TASK-0110, ADR-017, D-266). Reading runs as the signed-in
 * person, so row level security decides what exists for them — an unauthorised record shows in
 * no result and in no count. Writing runs on the worker's connection, inside the transaction
 * that also marks the event delivered.
 *
 * The tables live in `core`, so the SQL lives here with the rest of the platform's own queries
 * (PORTS_AND_SERVICES section 2), not in a module's data layer.
 */

type HitRow = {
  record_schema: string;
  record_table: string;
  record_id: string;
  record_type: string;
  title: string;
  secondary: string | null;
  link_path: string;
  rank: number;
};

const toHit = (row: HitRow): SearchHit => ({
  recordSchema: row.record_schema,
  recordTable: row.record_table,
  recordId: row.record_id,
  recordType: row.record_type,
  title: row.title,
  secondary: row.secondary,
  linkPath: row.link_path,
  rank: Number(row.rank),
});

/** Records holding every word of the query that the person may see (REQ-NFR-012). */
export function searchRecords(
  identity: DbIdentity,
  query: string,
  options: { types?: readonly string[] | null; limit?: number } = {},
) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<HitRow>`
      select * from core.search_records(${query}, ${options.types ?? null}::text[],
                                        ${options.limit ?? 20})`.execute(db);
    return rows.map(toHit);
  });
}

/**
 * The closest word the person's own vocabulary holds, for a word nobody wrote that way, or null
 * when nothing is near enough (D-247).
 */
export function suggestWord(identity: DbIdentity, word: string, types?: readonly string[] | null) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ word: string | null }>`
      select core.search_suggest(${word}, ${types ?? null}::text[]) as word`.execute(db);
    return rows[0]?.word ?? null;
  });
}

/** Writes one record's search row and its words; the worker's connection (D-266). */
export async function indexSearchRow(
  db: SystemDb,
  record: { schema: string; table: string; id: string },
  projection: SearchProjection,
  occurredAt: Date | null,
): Promise<string> {
  const { rows } = await sql<{ id: string }>`
    select core.index_search_row(${record.schema}, ${record.table}, ${record.id}::uuid,
                                 ${projection.recordType}, ${projection.title},
                                 ${projection.secondary ?? null}, ${projection.text},
                                 ${projection.linkPath}, ${projection.siteId ?? null}::uuid,
                                 ${projection.projectId ?? null}::uuid,
                                 ${projection.ownerUserId ?? null}::uuid,
                                 ${projection.dataClass ?? "internal"},
                                 ${occurredAt}::timestamptz, 1) as id`.execute(db);
  return rows[0].id;
}

/** Takes a record out of search; the record itself is the module's business. */
export async function removeSearchRow(
  db: SystemDb,
  record: { schema: string; table: string; id: string },
): Promise<boolean> {
  const { rows } = await sql<{ done: boolean }>`
    select core.remove_search_row(${record.schema}, ${record.table},
                                  ${record.id}::uuid) as done`.execute(db);
  return rows[0].done;
}
