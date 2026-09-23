import { NextResponse, type NextRequest } from "next/server";
import { signInIdentity } from "@/modules/iam";
import { recentSearchFor } from "@/platform/search/service";
import { searchTypes } from "@/records";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

/** Read-only POST: paths stay out of URLs and access logs. Only current RLS supplies titles. */
export async function POST(request: NextRequest) {
  const signedIn = await signInIdentity();
  if (!signedIn)
    return NextResponse.json({ error: "Oturum kapalı." }, { status: 401, headers: NO_STORE });
  let paths: string[];
  try {
    const body = await request.text();
    if (body.length > 6000) throw new Error();
    const data: unknown = JSON.parse(body);
    if (
      !Array.isArray(data) ||
      data.length > 5 ||
      data.some((path) => typeof path !== "string" || path.length > 1000)
    )
      throw new Error();
    paths = data;
  } catch {
    return NextResponse.json(
      { error: "Geçersiz kayıt listesi." },
      { status: 400, headers: NO_STORE },
    );
  }
  try {
    return NextResponse.json(await recentSearchFor(signedIn.identity, paths, searchTypes), {
      headers: NO_STORE,
    });
  } catch {
    return NextResponse.json(
      { error: "Son açılanlar yüklenemedi." },
      { status: 503, headers: NO_STORE },
    );
  }
}
