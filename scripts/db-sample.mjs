#!/usr/bin/env node
/**
 * Loads sample business data from db/samples (TASK-0076, LOCAL_SETUP section 7). Locked once the
 * environment holds real data. Sample files arrive with the modules; today there are none.
 *
 *   npm run db:sample
 */
import { pathToFileURL } from "node:url";

import { connectAdmin, safeError } from "./db-admin.mjs";
import { SAMPLES_DIR, assertNoRealData, runSqlFolder } from "./db-layers.mjs";

export async function loadSamples(client, dir = SAMPLES_DIR) {
  await client.query("begin");
  try {
    await assertNoRealData(client);
    const names = await runSqlFolder(client, dir);
    await client.query("commit");
    return names;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  (async () => {
    const client = await connectAdmin();
    try {
      const names = await loadSamples(client);
      console.log(names.length ? `yüklendi: ${names.join(", ")}` : "yüklenecek örnek veri yok");
    } finally {
      await client.end();
    }
  })().catch((error) => {
    console.error(`örnek veri durdu — ${error.code ? safeError(error) : error.message}`);
    process.exitCode = 1;
  });
}
