import { NextResponse, type NextRequest } from "next/server";

import { dashboardRoute } from "@/modules/iam/application/auth-routing";
import { createSupabaseAuthProvider } from "@/modules/iam/infrastructure/supabase/supabase-auth-provider";
import { createSupabaseServerClient } from "@/platform/supabase/server-client";

/** Only in-app paths may be used as a redirect target, so the link cannot bounce elsewhere. */
function safeNextPath(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : dashboardRoute;
}

/**
 * Target of the password reset e-mail (PKCE). Exchanges `token_hash` for a session and sends the
 * visitor on to the new-password screen; expired links go back to the request form.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");

  if (tokenHash) {
    const auth = createSupabaseAuthProvider(await createSupabaseServerClient());
    const result = await auth.verifyRecoveryToken({ tokenHash });

    if (result.ok) {
      return NextResponse.redirect(new URL(safeNextPath(searchParams.get("next")), origin));
    }
  }

  return NextResponse.redirect(new URL("/reset-password?expired=1", origin));
}
