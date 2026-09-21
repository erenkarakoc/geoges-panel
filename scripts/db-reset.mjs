#!/usr/bin/env node
/**
 * The two reset commands (TASK-0076, D-246, ENVIRONMENTS section 4a, LOCAL_SETUP section 7).
 *
 *   npm run db:reset:data     empties sample business data; configuration stays
 *   npm run db:reset:config   exports the configuration to a file first, then returns
 *                             configuration and factory data to factory state; asks first
 *
 * Both run in one transaction, remove sample people (flagged rows in `system` tables, D-256)
 * and the field history of everything removed (D-258), record the reset in the audit log,
 * rebuild factory data (db/seeds) afterwards, and refuse once the environment is marked as
 * holding real data. Real accounts are never removed.
 */
import { pathToFileURL } from "node:url";

import { confirmed, connectAdmin, safeError } from "./db-admin.mjs";
import {
  SEEDS_DIR,
  assertNoRealData,
  emptyLayers,
  purgeHistory,
  recordToolEvent,
  removeSampleRows,
  runSqlFolder,
} from "./db-layers.mjs";
import { writeExport } from "./config-transfer.mjs";

export const RESET_LAYERS = {
  data: ["business"],
  config: ["business", "config", "seed"],
};

/** One reset in one transaction; `schemas` and `seedsDir` let tests work on a probe schema. */
export async function reset(client, mode, { schemas = null, seedsDir = SEEDS_DIR } = {}) {
  const layers = RESET_LAYERS[mode];
  if (!layers) throw new Error(`bilinmeyen sıfırlama: ${mode}`);
  await client.query("begin");
  try {
    await assertNoRealData(client);
    const emptied = await emptyLayers(client, layers, schemas);
    const samples = await removeSampleRows(client, schemas);
    const historyRemoved = await purgeHistory(client, emptied);
    const seeded = await runSqlFolder(client, seedsDir);
    // The audit log keeps every reset (D-258); it is never emptied itself.
    await recordToolEvent(client, `environment.reset_${mode}`, {
      emptied_tables: emptied.length,
      sample_rows_removed: samples.removed,
      history_rows_removed: historyRemoved,
    });
    await client.query("commit");
    return { emptied, samples, historyRemoved, seeded };
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  }
}

async function run(mode) {
  if (mode === "config") {
    console.log(
      "Yapılandırma fabrika ayarına dönecek: akışlar, katalog kalemleri, eşikler, özel alanlar ve roller. Önce bir dışa aktarım dosyası alınacak.",
    );
    if (!(await confirmed("SIFIRLA"))) throw new Error("onay verilmedi; hiçbir şey değişmedi");
  }
  const client = await connectAdmin();
  try {
    if (mode === "config") {
      const out = await writeExport(client);
      console.log(`yedek dışa aktarım: ${out.path} (${out.tables} tablo, ${out.rows} satır)`);
    }
    const { emptied, samples, seeded } = await reset(client, mode);
    console.log(
      `boşaltılan tablo: ${emptied.length}; silinen örnek kişi satırı: ${samples.removed}; başlangıç verisi dosyası: ${seeded.length}`,
    );
    console.log(mode === "data" ? "örnek iş verisi temizlendi" : "yapılandırma fabrika ayarında");
  } finally {
    await client.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const mode = process.argv.includes("--config") ? "config" : "data";
  run(mode).catch((error) => {
    console.error(`sıfırlama durdu — ${error.code ? safeError(error) : error.message}`);
    process.exitCode = 1;
  });
}
