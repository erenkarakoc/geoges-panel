import { NextResponse, type NextRequest } from "next/server";

import { todayRoute, verifyRecoveryToken } from "@/modules/iam";

/** Only in-app paths may be used as a redirect target, so the link cannot bounce elsewhere. */
function safeNextPath(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : todayRoute;
}

/**
 * Target of the password reset e-mail (PKCE). Exchanges `token_hash` for a session and sends the
 * visitor on to the new-password screen; expired links go back to the request form.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");

  if (tokenHash && (await verifyRecoveryToken(tokenHash))) {
    return NextResponse.redirect(new URL(safeNextPath(searchParams.get("next")), origin));
  }

  return NextResponse.redirect(new URL("/reset-password?expired=1", origin));
}
