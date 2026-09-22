import { NextResponse } from "next/server";

import { AccessDeniedError } from "@/modules/iam";
import { appState, noteApp } from "@/modules/tsk";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

async function respond(work: () => Promise<unknown>) {
  try {
    return NextResponse.json(await work(), { headers: NO_STORE });
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ error: "Oturum kapalı." }, { status: 401, headers: NO_STORE });
    }
    throw error;
  }
}

/** Where the signed-in person stands with the panel on their Home Screen (TASK-0113). */
export function GET() {
  return respond(() => appState());
}

/**
 * What the screen saw: that the window was shown, or that the panel is running from the Home
 * Screen. Both are safe to repeat and nothing else about the device is kept.
 */
export function POST(request: Request) {
  return respond(async () => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const platform = body.platform;
    await noteApp({
      introShown: body.introShown === true,
      onHomeScreen: body.onHomeScreen === true,
      platform: typeof platform === "string" ? platform : null,
    });
    return { ok: true };
  });
}
