import { sql } from "kysely";
import type { SystemDb } from "@/platform/jobs/types";
import type { SearchProjection } from "@/platform/search/search";
import { assertSearchIntegrity } from "./search-integrity";

/** All functions run on the worker's existing transaction: readers see old data until commit. */
export async function beginSearchRebuild(db: SystemDb, eventCodes: readonly string[]) {
  const isolation = await sql<{
    level: string;
  }>`select current_setting('transaction_isolation') as level`.execute(db);
  if (isolation.rows[0].level !== "read committed")
    throw new Error("Search rebuild requires READ COMMITTED to catch concurrent source changes");
  await sql`select pg_advisory_xact_lock(hashtextextended('geoges.search_index', 0))`.execute(db);
  await sql`create temporary table geoges_search_stage (
    record_schema text not null, record_table text not null, record_id uuid not null,
    projection jsonb not null, primary key (record_schema, record_table, record_id)
  ) on commit drop`.execute(db);
  // Sequence allocation is not commit order. Remember visibility, not just max(outbox.id).
  await sql`create temporary table geoges_search_seen_events (id bigint primary key) on commit drop`.execute(
    db,
  );
  await sql`insert into pg_temp.geoges_search_seen_events
    select id from core.outbox where event_code = any(${eventCodes}::text[])`.execute(db);
  const result = await sql<{ version: number }>`insert into core.read_model (name, active_table)
    values ('core.search', 'core.search_row') on conflict (name) do update
    set active_table = excluded.active_table returning version + 1 as version`.execute(db);
  return result.rows[0].version;
}

export type SearchCatchup = { events: number; highWatermark: string };
export type SearchChange = {
  id: string;
  code: string;
  recordId: string | null;
  payload: Record<string, unknown>;
};

/** Materialize a finite visibility cut in ONE statement; late commits remain normal deliveries. */
export async function captureSearchChanges(
  db: SystemDb,
  eventCodes: readonly string[],
): Promise<SearchCatchup> {
  await sql`create temporary table geoges_search_changes (
    id bigint primary key, event_code text not null, record_id uuid, payload jsonb not null
  ) on commit drop`.execute(db);
  const result = await sql<SearchCatchup>`with visible as materialized (
    select id from core.outbox
    where event_code = any(${eventCodes}::text[])
  ), changed as materialized (
    select v.id from visible v
    where not exists (select from pg_temp.geoges_search_seen_events s where s.id = v.id)
  ), captured as (
    insert into pg_temp.geoges_search_changes
    select o.id, o.event_code, o.record_id, o.payload from changed c join core.outbox o on o.id = c.id
    returning geoges_search_changes.id
  ) select (select count(*)::int from captured) as events,
    coalesce((select max(id) from visible), 0)::text as "highWatermark"`.execute(db);
  return result.rows[0];
}

export async function readSearchChanges(db: SystemDb, after: string, limit: number) {
  // Qualify the bigint: ORDER BY id would bind to the text output alias and sort lexically.
  const result = await sql<SearchChange>`select c.id::text, c.event_code as code,
    c.record_id as "recordId", c.payload from pg_temp.geoges_search_changes c
    where c.id > ${after}::bigint order by c.id limit ${limit}`.execute(db);
  return result.rows;
}

/** Replace a staged source projection, returning the exact change in staged row count. */
export async function refreshSearchStage(
  db: SystemDb,
  record: { schema: string; table: string },
  id: string,
  projection: SearchProjection | null,
) {
  if (!projection) {
    const removed = await sql`delete from pg_temp.geoges_search_stage
      where record_schema = ${record.schema} and record_table = ${record.table}
        and record_id = ${id}::uuid returning record_id`.execute(db);
    return -removed.rows.length;
  }
  const updated =
    await sql`update pg_temp.geoges_search_stage set projection = ${JSON.stringify(projection)}::jsonb
    where record_schema = ${record.schema} and record_table = ${record.table}
      and record_id = ${id}::uuid returning record_id`.execute(db);
  if (updated.rows.length) return 0;
  await stageSearchBatch(db, record, [{ id, projection }]);
  return 1;
}

export async function stageSearchBatch(
  db: SystemDb,
  record: { schema: string; table: string },
  rows: readonly { id: string; projection: SearchProjection }[],
) {
  if (!rows.length) return;
  await sql`insert into pg_temp.geoges_search_stage
    select ${record.schema}, ${record.table}, x.id, x.projection
    from jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) as x(id uuid, projection jsonb)`.execute(
    db,
  );
}

export async function publishSearchStage(
  db: SystemDb,
  records: readonly { schema: string; table: string }[],
  version: number,
  expectedCount: number,
  catchup: SearchCatchup,
) {
  const count = await sql<{
    n: number;
  }>`select count(*)::int as n from pg_temp.geoges_search_stage`.execute(db);
  if (count.rows[0].n !== expectedCount)
    throw new Error("Search staging count differs from the sources");
  // Drop derived rows that disappeared from this source. No business record is touched.
  for (const record of records) {
    await sql`select count(core.remove_search_row(r.record_schema, r.record_table, r.record_id))
      from core.search_row r where r.record_schema = ${record.schema} and r.record_table = ${record.table}
      and not exists (select from pg_temp.geoges_search_stage s where s.record_schema = r.record_schema
        and s.record_table = r.record_table and s.record_id = r.record_id)`.execute(db);
  }
  await sql`select count(core.index_search_row(record_schema, record_table, record_id,
    projection->>'recordType', projection->>'title', projection->>'secondary', projection->>'text',
    projection->>'linkPath', (projection->>'siteId')::uuid, (projection->>'projectId')::uuid,
    (projection->>'ownerUserId')::uuid, coalesce(projection->>'dataClass', 'internal'), null, ${version}))
    from pg_temp.geoges_search_stage`.execute(db);
  // Recreate helpers too: an orphan id in a damaged bucket is not repaired by per-row upserts.
  await sql`select core.rebuild_search_buckets()`.execute(db);
  await sql`delete from core.search_word`.execute(db);
  await sql`insert into core.search_word (word, record_type, record_count)
    select word, record_type, count(*)::int from core.search_posting group by word, record_type`.execute(
    db,
  );
  const result = await sql<{ difference: number }>`select count(*)::int as difference
    from pg_temp.geoges_search_stage s left join core.search_row r
      on r.record_schema = s.record_schema and r.record_table = s.record_table and r.record_id = s.record_id
    where r.id is null or row(r.record_type, r.title, r.secondary, r.search_text, r.link_path,
      r.site_id, r.project_id, r.record_owner_user_id, r.data_class, r.projection_version,
      r.normalization_version)
      is distinct from row(s.projection->>'recordType', s.projection->>'title', s.projection->>'secondary',
        core.fold_tr(coalesce(s.projection->>'text', '')), s.projection->>'linkPath',
        (s.projection->>'siteId')::uuid, (s.projection->>'projectId')::uuid,
        (s.projection->>'ownerUserId')::uuid, coalesce(s.projection->>'dataClass', 'internal'), ${version}::int,
        core.search_normalization_version())`.execute(db);
  const difference = result.rows[0].difference;
  if (difference) throw new Error("Search publication differs from the staged sources");
  await assertSearchIntegrity(db);
  await sql`update core.read_model set version = ${version}, rebuilt_at = now(), last_difference = 0
    where name = 'core.search'`.execute(db);
  await sql`select aud.record_event('read_model.rebuilt', 'core', 'read_model', null,
    jsonb_build_object('name', 'core.search', 'version', ${version}::int, 'difference', 0,
      'caught_up_events', ${catchup.events}::int, 'outbox_watermark', ${catchup.highWatermark}::text))`.execute(
    db,
  );
  return { version, count: expectedCount, difference, catchup };
}
