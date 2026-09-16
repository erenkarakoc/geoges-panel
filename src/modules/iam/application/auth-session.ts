import type { AuthSession } from "@/modules/iam/domain/auth-provider";
import { createSupabaseAuthProvider } from "@/modules/iam/infrastructure/supabase/supabase-auth-provider";
import { createSupabaseServerClient } from "@/platform/supabase/server-client";

/**
 * Verified session for server components and route handlers. Backed by `getClaims`, so the
 * token signature is checked; `getSession` is never used for access decisions (M0 plan §6).
 */
export async function readAuthSession(): Promise<AuthSession | null> {
  const auth = createSupabaseAuthProvider(await createSupabaseServerClient());

  return auth.getSession();
}
