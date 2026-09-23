#!/usr/bin/env node
/**
 * Requests a source-projection rebuild from the running worker (TASK-0110, D-247).
 *
 * The buckets are kept up to date as records are written, so this is for the moments when that
 * cannot be trusted: after a restore, after a projection changed what a record puts into search,
 * or when a check says a bucket and its postings disagree. The worker stages the registered
 * sources, compares the published rows and records the new version in one transaction.
 *
 *   npm run search:rebuild            queues a versioned source rebuild
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

    const source = await client.query(
      "select 1 from core.event_subscription where subscriber = 'core.search-index'",
    );
    if (!source.rowCount) {
      console.error("Arama kaynağı henüz kayıtlı değil; modül kaydını ekleyip işlemciyi başlatın.");
      process.exitCode = 1;
      return;
    }
    const result = await client.query(
      "select core.schedule_job('core.search-rebuild', now(), $1, '{}'::jsonb) as id",
      [`search-rebuild:${crypto.randomUUID()}`],
    );
    console.log(`kaynaklardan yeniden kurma kuyruğa alındı: ${result.rows[0].id}`);
    console.log(
      "Tamamlanma ve hata durumu: npm run jobs:status. Kuyruğa alınması, tamamlandığı anlamına gelmez.",
    );
  } catch (error) {
    console.error(safeError(error));
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

await main();
