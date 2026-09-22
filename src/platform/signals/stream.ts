import "server-only";

import { listenForSignals } from "./hub";
import { KEEPALIVE_FRAME, KEEPALIVE_MS, OPEN_FRAME, signalFrame } from "./signals";

/**
 * The SSE response of one person's signal stream (ADR-018). The route handler proves who is
 * asking; this only turns the hub's signals into frames until the browser goes away.
 */
export function signalStreamResponse(userId: string, abort: AbortSignal): Response {
  const encoder = new TextEncoder();
  let stop = () => {};

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          stop();
        }
      };
      write(OPEN_FRAME);
      const unlisten = listenForSignals(userId, (type) => write(signalFrame(type)));
      const keepAlive = setInterval(() => write(KEEPALIVE_FRAME), KEEPALIVE_MS);
      stop = () => {
        clearInterval(keepAlive);
        unlisten();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };
      if (abort.aborted) stop();
      else abort.addEventListener("abort", stop, { once: true });
    },
    cancel() {
      stop();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Proxies must not buffer the stream (SPIKE-13 limit 1).
      "X-Accel-Buffering": "no",
    },
  });
}
