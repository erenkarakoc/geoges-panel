import { sql } from "kysely";

import { runAsUser, runSearchAsUser, type DbIdentity } from "@/platform/db";
import type { SystemDb } from "@/platform/jobs/types";
import type { SearchHit, SearchProjection } from "@/platform/search/search";

export async function lockSearchPublication(db: SystemDb) {
  await sql`select pg_advisory_xact_lock(hashtextextended('geoges.search_index', 0))`.execute(db);
}

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

/** Only visible types are used to plan per-type queries; one busy type cannot crowd out others. */
export async function searchPalette(
  identity: DbIdentity,
  query: string,
  types?: readonly string[],
) {
  const answer = await runSearchAsUser<{
    hits: HitRow[];
    corrected: string | null;
    failed_types: string[];
  }>(identity, query, types);
  return {
    hits: answer.hits.map(toHit),
    corrected: answer.corrected,
    failedTypes: answer.failed_types,
  };
}

/** Re-read recent paths with current RLS, never trust a browser's saved title or permission. */
export function readRecentSearchRecords(
  identity: DbIdentity,
  paths: readonly string[],
  types: readonly string[],
) {
  return runAsUser(identity, async (db) => {
    const result = await sql<HitRow>`
      select record_schema, record_table, record_id, record_type, title, secondary, link_path,
             0::real as rank from core.search_row
      where link_path = any(${paths}::text[]) and record_type = any(${types}::text[])
      order by array_position(${paths}::text[], link_path), id limit 5`.execute(db);
    return result.rows.map(toHit);
  });
}

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
                                 ${occurredAt}::timestamptz, null) as id`.execute(db);
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
