import "server-only";

import type { SignalType } from "./signals";

/**
 * Hands signals from the worker to the open streams of this server process (ADR-018). Today the
 * worker runs in the same process as the web server (D-259), so an in-memory hub is enough; it is
 * kept on globalThis because the instrumentation hook and the route handlers are bundled
 * separately. With several server processes the hub is fed by PostgreSQL LISTEN/NOTIFY instead
 * (D-263, DEF-008); its two functions stay the same.
 */

type Listener = (type: SignalType) => void;

type Hub = Map<string, Set<Listener>>;

const globalForSignals = globalThis as unknown as { geogesSignalHub?: Hub };

function hub(): Hub {
  globalForSignals.geogesSignalHub ??= new Map();
  return globalForSignals.geogesSignalHub;
}

/** Listens to one person's signals; returns the function that stops listening. */
export function listenForSignals(userId: string, listener: Listener): () => void {
  const listeners = hub().get(userId) ?? new Set<Listener>();
  listeners.add(listener);
  hub().set(userId, listeners);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) hub().delete(userId);
  };
}

/** Tells every open stream of one person that something of this type changed. */
export function sendSignal(userId: string, type: SignalType): void {
  for (const listener of hub().get(userId) ?? []) {
    try {
      listener(type);
    } catch {
      // A stream that closed while we wrote to it is removed by its own abort handler.
    }
  }
}

/** Open streams per person, for tests and diagnostics. */
export function openStreamCount(userId: string): number {
  return hub().get(userId)?.size ?? 0;
}
