import { NextResponse } from "next/server";

import { AccessDeniedError } from "@/modules/iam";
import { forgetPushBrowser, pushSettings, rememberPushBrowser } from "@/modules/tsk";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Phone notifications (REQ-TSK-010): the browser asks for the public key and its own state,
 * then hands over the address the push service gave it. The private key never leaves the
 * server and no stored key is ever sent back.
 */
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

/** `?endpoint=` tells whether this browser is already switched on. */
export function GET(request: Request) {
  return respond(() => {
    const endpoint = new URL(request.url).searchParams.get("endpoint");
    return pushSettings(endpoint);
  });
}

export function POST(request: Request) {
  return respond(async () => {
    const body = (await request.json()) as {
      endpoint?: unknown;
      keys?: { p256dh?: unknown; auth?: unknown };
    };
    const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
    const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh : "";
    const auth = typeof body?.keys?.auth === "string" ? body.keys.auth : "";
    if (!endpoint.startsWith("https://") || !p256dh || !auth) throw new SyntaxError("subscription");
    await rememberPushBrowser({
      endpoint,
      p256dh,
      auth,
      userAgent: request.headers.get("user-agent"),
    });
    return { saved: true };
  });
}

export function DELETE(request: Request) {
  return respond(async () => {
    const body = (await request.json()) as { endpoint?: unknown };
    const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
    if (!endpoint) throw new SyntaxError("endpoint");
    return { removed: await forgetPushBrowser(endpoint) };
  });
}
