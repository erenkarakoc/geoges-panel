#!/usr/bin/env node
/**
 * Links an existing Supabase Auth account to the panel as a bootstrap owner (TASK-0102, D-256).
 *
 * Creates (or re-activates) the `iam.user` row with the Auth account's id, flags it as a bootstrap
 * owner and runs the factory data, which gives every bootstrap owner the owner role. Because the
 * flag lives in a `system` table, `db:reset:config` gives the owner role back by itself, so a
 * configuration reset can never lock the owner out of the panel.
 *
 *   npm run iam:bootstrap-owner -- <e-posta> [--ad "Ad Soyad"]
 */
import { pathToFileURL } from "node:url";

import { connectAdmin, safeError } from "./db-admin.mjs";
import { SEEDS_DIR, runSqlFolder } from "./db-layers.mjs";

/** Reads `<e-posta> [--ad "Ad Soyad"]`; throws a usage line when the address is missing. */
export function parseArgs(argv) {
  const email = argv.find((a) => !a.startsWith("--") && a.includes("@"));
  if (!email) throw new Error('kullanım: npm run iam:bootstrap-owner -- <e-posta> [--ad "Ad"]');
  const at = argv.indexOf("--ad");
  const name = at >= 0 ? argv[at + 1] : undefined;
  return { email: email.trim().toLowerCase(), name: name?.trim() || undefined };
}

/** Links the Auth account in one transaction and returns the panel account. */
export async function bootstrapOwner(client, { email, name }, { seedsDir = SEEDS_DIR } = {}) {
  await client.query("begin");
  try {
    const auth = await client.query(
      `select u.id,
              coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name') as name,
              exists (select from auth.mfa_factors f
                       where f.user_id = u.id and f.status = 'verified') as has_2fa
         from auth.users u where lower(u.email) = $1`,
      [email],
    );
    if (!auth.rowCount)
      throw new Error(`${email} adresiyle Supabase Auth hesabı yok; önce hesabı Supabase'de açın`);
    const account = auth.rows[0];
    const displayName = name ?? account.name ?? email.split("@")[0];
    const { rows } = await client.query(
      `insert into iam.user (id, email, display_name, auth_provider_id, must_setup_2fa,
                             is_bootstrap_owner)
       values ($1, $2, $3, $1, $4, true)
       on conflict (id) do update
          set is_bootstrap_owner = true, status = 'active', left_on = null,
              display_name = coalesce($5, iam.user.display_name)
       returning id, email, display_name`,
      [account.id, email, displayName, !account.has_2fa, name ?? null],
    );
    await runSqlFolder(client, seedsDir);
    await client.query("commit");
    return rows[0];
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  (async () => {
    const args = parseArgs(process.argv.slice(2));
    const client = await connectAdmin();
    try {
      const owner = await bootstrapOwner(client, args);
      console.log(`sahip bağlandı: ${owner.display_name} <${owner.email}> (${owner.id})`);
    } finally {
      await client.end();
    }
  })().catch((error) => {
    console.error(`durdu — ${error.code ? safeError(error) : error.message}`);
    process.exitCode = 1;
  });
}
