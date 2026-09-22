/**
 * The live signal contract (ADR-018, D-240, SPIKE-13). A signal says only *what kind of thing*
 * changed for the person; it never carries a count, a record or a place. The screen then asks for
 * the data with the person's own permission. Shared by the server stream and the browser.
 */

export const SIGNAL_TYPES = ["notifications", "tasks"] as const;
export type SignalType = (typeof SIGNAL_TYPES)[number];

export function isSignalType(value: unknown): value is SignalType {
  return typeof value === "string" && (SIGNAL_TYPES as readonly string[]).includes(value);
}

/** Reconnect hint the browser's EventSource uses after a network drop (SPIKE-13: 1 s). */
export const RETRY_MS = 1_000;

/** Keep-alive comment interval; below the usual 30-60 s idle cut of proxies (SPIKE-13 limit 1). */
export const KEEPALIVE_MS = 20_000;

/** One SSE frame: the event name and the type, nothing else (SPIKE-13 C11). */
export function signalFrame(type: SignalType): string {
  return `event: signal\ndata: ${type}\n\n`;
}

export const OPEN_FRAME = `retry: ${RETRY_MS}\n\n`;
export const KEEPALIVE_FRAME = ": keepalive\n\n";
