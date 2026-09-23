#!/usr/bin/env node
/**
 * Builds the search helpers again from the rows that are already indexed (TASK-0110, D-247).
 *
 * The buckets are kept up to date as records are written, so this is for the moments when that
 * cannot be trusted: after a restore, after a projection changed what a record puts into search,
 * or when a check says a bucket and its postings disagree. It counts first, rebuilds, and counts
 * again, so the output says what changed.
 *
 *   npm run search:rebuild            rebuilds every bucket
 *   npm run search:rebuild -- --check reports disagreements without changing anything
 */
import { connectAdmin, safeError } from "./db-admin.mjs";

const CHECK_ONLY = process.argv.includes("--check");

/** Buckets that do not hold exactly the records their postings say they should. */
const DISAGREEMENTS = `
  with wanted as (
    select p.word, r.record_type, core.search_scope_key(r.site_id, r.project_id) as scope_key,
           r.data_class, array_agg(distinct r.search_document_id order by r.search_document_id) as ids
      from core.search_posting p
      join core.search_row r on r.id = p.search_row_id
     group by 1, 2, 3, 4
  )
  select count(*)::int as n
    from wanted w
    full join core.search_word_bucket b
      on b.word = w.word and b.record_type = w.record_type and b.scope_key = w.scope_key
     and b.data_class = w.data_class
   where w.ids is distinct from b.search_document_ids`;

async function main() {
  const client = await connectAdmin();
  try {
    const before = await client.query(DISAGREEMENTS);
    const rows = await client.query("select count(*)::int as n from core.search_row");
    console.log(`arama satırı: ${rows.rows[0].n}`);
    console.log(`uyuşmayan kova: ${before.rows[0].n}`);

    if (CHECK_ONLY) {
      process.exitCode = before.rows[0].n > 0 ? 1 : 0;
      return;
    }

    const built = await client.query("select core.rebuild_search_buckets() as n");
    const after = await client.query(DISAGREEMENTS);
    console.log(`kurulan kova: ${built.rows[0].n}`);
    console.log(`kalan uyuşmazlık: ${after.rows[0].n}`);
    if (after.rows[0].n > 0) {
      console.error("kovalar hâlâ uyuşmuyor; kayıtların izdüşümü gözden geçirilmeli");
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(safeError(error));
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

await main();
