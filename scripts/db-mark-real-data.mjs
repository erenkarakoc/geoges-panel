#!/usr/bin/env node
/**
 * Marks the environment as holding real data (TASK-0076, D-246). From then on both reset commands
 * and the sample loader refuse to run. There is deliberately no command to clear the mark; it is
 * a go-live step, taken once, after asking.
 *
 *   npm run db:mark-real-data
 */
import { pathToFileURL } from "node:url";

import { confirmed, connectAdmin, safeError } from "./db-admin.mjs";

export async function markRealData(client) {
  const { rows } = await client.query(
    `update core.environment
        set real_data_started_at = coalesce(real_data_started_at, now()),
            real_data_marked_by = coalesce(real_data_marked_by, current_user)
      returning real_data_started_at`,
  );
  return rows[0].real_data_started_at;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  (async () => {
    console.log(
      "Bu ortam gerçek veri ortamı olarak işaretlenecek. Sonra iki sıfırlama komutu ve örnek veri yükleme kalıcı olarak kilitlenir.",
    );
    if (!(await confirmed("KILITLE"))) throw new Error("onay verilmedi; hiçbir şey değişmedi");
    const client = await connectAdmin();
    try {
      const at = await markRealData(client);
      console.log(`gerçek veri işareti: ${at.toISOString()}`);
    } finally {
      await client.end();
    }
  })().catch((error) => {
    console.error(`durdu — ${error.code ? safeError(error) : error.message}`);
    process.exitCode = 1;
  });
}
