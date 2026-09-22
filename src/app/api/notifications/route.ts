import { NextResponse } from "next/server";

import { AccessDeniedError } from "@/modules/iam";
import { markRead, notificationSummary } from "@/modules/tsk";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function respond(work: () => Promise<unknown>) {
  try {
    return NextResponse.json(await work(), { headers: NO_STORE });
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ error: "Oturum kapalı." }, { status: 401, headers: NO_STORE });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "İstek okunamadı." }, { status: 400, headers: NO_STORE });
    }
    throw error;
  }
}

/** The bell (SCR-015): unread count and the newest notifications of the signed-in person. */
export function GET() {
  return respond(() => notificationSummary());
}

/** Marks notifications read: `{ ids: [...] }` for some, `{ all: true }` for every one. */
export function POST(request: Request) {
  return respond(async () => {
    const body = (await request.json()) as { ids?: unknown; all?: unknown };
    if (body?.all === true) return { changed: await markRead(null) };
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id) => typeof id === "string") : [];
    if (!ids.length || ids.length > 100 || !ids.every((id) => UUID.test(id))) {
      throw new SyntaxError("ids");
    }
    return { changed: await markRead(ids) };
  });
}
