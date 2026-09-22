import { NextResponse, type NextRequest } from "next/server";

import { signInIdentity } from "@/modules/iam";
import { searchFor } from "@/platform/search/service";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * What the palette finds in records (SCR-016, REQ-NFR-012): read with the person's own
 * permission, so a record they may not see is in no result and in no count. The query itself is
 * never logged.
 */
export async function GET(request: NextRequest) {
  const signedIn = await signInIdentity();
  if (!signedIn) {
    return NextResponse.json({ error: "Oturum kapalı." }, { status: 401, headers: NO_STORE });
  }
  const query = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 200);
  return NextResponse.json(await searchFor(signedIn.identity, query), { headers: NO_STORE });
}
