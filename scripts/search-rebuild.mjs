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

async function main() {
  const client = await connectAdmin();
  try {
    await client.query("begin read only");
    await client.query("set local statement_timeout = '60s'");
    const result = await client.query("select * from core.search_integrity()");
    const report = result.rows[0];
    await client.query("commit");
    console.log(`arama satırı: ${report.search_rows}`);
    console.log(`uyuşmayan satır: ${report.row_mismatches}`);
    console.log(`uyuşmayan eşleme: ${report.posting_mismatches}`);
    console.log(`uyuşmayan kova: ${report.bucket_mismatches}`);
    console.log(`uyuşmayan sözlük girdisi: ${report.vocabulary_mismatches}`);

    if (CHECK_ONLY) {
      process.exitCode = [
        report.row_mismatches,
        report.posting_mismatches,
        report.bucket_mismatches,
        report.vocabulary_mismatches,
      ].some((count) => BigInt(count) !== 0n)
        ? 1
        : 0;
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
    const scheduled = await client.query(
      "select core.schedule_job('core.search-rebuild', now(), $1, '{}'::jsonb) as id",
      [`search-rebuild:${crypto.randomUUID()}`],
    );
    console.log(`kaynaklardan yeniden kurma kuyruğa alındı: ${scheduled.rows[0].id}`);
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
