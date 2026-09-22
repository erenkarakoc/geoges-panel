/**
 * Development-only: a browser that cannot open its own console (a phone on the local network)
 * sends what went wrong here, so it shows in the dev server's output. Never in production: the
 * route answers 404 there, and nothing calls it from a production build.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response(null, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const what = String(body.kind ?? "note");
  const where = String(body.url ?? "");
  const device = String(body.userAgent ?? "").slice(0, 160);
  const detail = String(body.message ?? "").slice(0, 2000);
  console.warn(`[tarayıcı: ${what}] ${where}\n  cihaz: ${device}\n  ${detail}`);
  return new Response(null, { status: 204 });
}
