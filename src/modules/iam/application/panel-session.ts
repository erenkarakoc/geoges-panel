import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";

import { deviceLabel } from "@/modules/iam/application/device-label";
import {
  revokeSession,
  startSession,
  useSession,
  type DbIdentity,
} from "@/modules/iam/data/account-security-store";

/**
 * The panel's own session, beside the provider's token (TASK-0112, D-230, D-272).
 *
 * Supabase says who somebody is; how long the panel lets them stay is the panel's own rule —
 * thirty days at most, over after three days unused, gone the moment the account is disabled. The
 * row in `iam.session` is that rule, and this cookie is the only thing that points at it: the
 * browser never learns anything else about it, and nothing but the server can read it.
 *
 * The cookie is not an identity. Whoever holds it still needs the provider's own session, and the
 * row still has to belong to the same person, which `readPanelSession` and the access service
 * check together.
 */

export const SESSION_COOKIE = "geoges_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Starts the panel's session and hands the browser the only pointer to it. */
export async function openPanelSession(
  identity: DbIdentity,
  secondFactor: boolean,
): Promise<string> {
  const label = deviceLabel((await headers()).get("user-agent"));
  const sessionId = await startSession(identity, { deviceLabel: label, secondFactor });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
  return sessionId;
}

/**
 * This request's panel session, or null when there is none left. Reading it is also what keeps it
 * alive, so a person who uses the panel never runs into the idle limit; the database writes that
 * at most once every five minutes.
 */
export const readPanelSession = cache(
  async (): Promise<{
    sessionId: string;
    userId: string;
    secondFactorAt: Date | null;
    expiresAt: Date;
  } | null> => {
    const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!sessionId || !UUID.test(sessionId)) return null;
    const live = await useSession(sessionId);
    return live ? { sessionId, ...live } : null;
  },
);

/** Ends this browser's session and takes the pointer back. */
export async function closePanelSession(identity: DbIdentity): Promise<void> {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  jar.delete(SESSION_COOKIE);
  if (sessionId && UUID.test(sessionId)) {
    await revokeSession(identity, sessionId, "signed_out");
  }
}
