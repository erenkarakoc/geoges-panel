import { NextResponse, type NextRequest } from "next/server";
import { signInIdentity } from "@/modules/iam";
import { searchFor } from "@/platform/search/service";
import { searchTypes } from "@/records";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const signedIn = await signInIdentity();
  if (!signedIn)
    return NextResponse.json({ error: "Oturum kapalı." }, { status: 401, headers: NO_STORE });
  const query = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 200);
  try {
    return NextResponse.json(await searchFor(signedIn.identity, query, searchTypes), {
      headers: NO_STORE,
    });
  } catch {
    return NextResponse.json(
      { error: "Arama şu anda kullanılamıyor." },
      { status: 503, headers: NO_STORE },
    );
  }
}
