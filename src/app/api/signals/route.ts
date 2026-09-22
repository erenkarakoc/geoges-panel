import { signInIdentity } from "@/modules/iam";
import { signalStreamResponse } from "@/platform/signals/stream";

export const dynamic = "force-dynamic";

/**
 * The signed-in person's live signal stream (ADR-018, D-240, SPIKE-13). It says only which kind
 * of thing changed; the screens read the data themselves with the person's permission. A signed-
 * out request gets 401, which closes the browser's EventSource; the client wrapper then retries
 * with growing waits.
 */
export async function GET(request: Request) {
  const signedIn = await signInIdentity();
  if (!signedIn) return new Response(null, { status: 401 });
  return signalStreamResponse(signedIn.identity.userId, request.signal);
}
