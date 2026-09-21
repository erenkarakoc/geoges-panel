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

/**
 * Exchanges the `token_hash` of the password reset e-mail (PKCE) for a session. Lives here so
 * route handlers use IAM through its public surface instead of reaching its infrastructure.
 */
export async function verifyRecoveryToken(tokenHash: string): Promise<boolean> {
  const auth = createSupabaseAuthProvider(await createSupabaseServerClient());
  const result = await auth.verifyRecoveryToken({ tokenHash });

  return result.ok;
}
