import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { SecondFactorAdmin } from "@/modules/iam/domain/second-factor-admin";

/**
 * The one place the service-role key is used (TASK-0112, D-272, approved by the owner 2026-09-24).
 *
 * It can do anything in the Supabase project, so it is kept to this file, to one operation, and to
 * the server: the key is read from a variable with no `NEXT_PUBLIC_` prefix, this module is
 * `server-only`, and no session is persisted, so the client cannot be mistaken for a signed-in
 * person's. Every call reaches here from a place that has already checked who is asking and writes
 * an audit entry (`iam.note_second_factor`).
 */
export function createSupabaseSecondFactorAdmin(): SecondFactorAdmin {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing; removing a lost second factor needs it.",
    );
  }
  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    async removeFactorsOf(userId) {
      const listed = await admin.auth.admin.mfa.listFactors({ userId });
      if (listed.error) throw new Error("The account's second factors could not be read.");
      let removed = 0;
      for (const factor of listed.data?.factors ?? []) {
        const result = await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId });
        if (result.error) throw new Error("A second factor could not be removed.");
        removed += 1;
      }
      return removed;
    },
  };
}
