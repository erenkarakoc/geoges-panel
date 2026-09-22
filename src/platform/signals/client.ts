import { isSignalType, type SignalType } from "./signals";

/**
 * The browser side of the live signal channel (ADR-018, SPIKE-13 "Phase 07'ye taşınanlar").
 *
 * 1. `connectSignals` wraps EventSource: the browser reconnects by itself after a network drop,
 *    but closes for good on an HTTP error such as 503 (SPIKE-13 C6), so a closed stream is
 *    reopened here with growing waits. Every (re)open is reported, because signals missed
 *    meanwhile are not replayed: the screen reloads its data instead (finding 3).
 * 2. `shareAcrossTabs` keeps one stream per browser: the tab holding a Web Lock opens it and
 *    passes signals to the others over a BroadcastChannel, so seven tabs do not exhaust the six
 *    HTTP/1.1 connections a browser allows per host (SPIKE-13 limit 2).
 * 3. `createRefresher` loads data after a signal and retries a failed load with growing waits,
 *    because a signal can arrive while the data request fails (SPIKE-13 finding 2).
 */

export const BACKOFF_MS = [500, 1_000, 2_000, 4_000, 8_000] as const;

export function backoffDelay(attempt: number): number {
  return BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
}

export type SignalHandlers = {
  onSignal(type: SignalType): void;
  /** The stream opened or reopened: anything may have changed meanwhile. */
  onOpen(): void;
};

/** The parts of EventSource this wrapper uses; tests pass a fake. */
export interface EventSourceLike {
  readonly readyState: number;
  addEventListener(type: string, listener: (event: MessageEvent<string>) => void): void;
  close(): void;
}

export type Timers = {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
};

const CLOSED = 2;

export function connectSignals(
  url: string,
  handlers: SignalHandlers,
  deps: {
    open: (url: string) => EventSourceLike;
    timers?: Timers;
  },
): { close(): void } {
  const timers: Timers = deps.timers ?? {
    setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
    clearTimeout: (handle) => globalThis.clearTimeout(handle as number),
  };
  let source: EventSourceLike | null = null;
  let retry: unknown = null;
  let attempt = 0;
  let closed = false;

  const start = () => {
    retry = null;
    if (closed) return;
    const current = deps.open(url);
    source = current;
    current.addEventListener("open", () => {
      attempt = 0;
      handlers.onOpen();
    });
    current.addEventListener("signal", (event) => {
      if (isSignalType(event.data)) handlers.onSignal(event.data);
    });
    current.addEventListener("error", () => {
      // CONNECTING: the browser retries by itself. CLOSED: it gave up, so we retry.
      if (closed || current.readyState !== CLOSED || retry !== null) return;
      current.close();
      retry = timers.setTimeout(start, backoffDelay(attempt++));
    });
  };

  start();
  return {
    close() {
      closed = true;
      if (retry !== null) timers.clearTimeout(retry);
      source?.close();
    },
  };
}

type TabMessage = { kind: "signal"; type: SignalType } | { kind: "open" };

/**
 * Runs `connect` in exactly one tab and fans its signals out to every tab. Without Web Locks or
 * BroadcastChannel (old browsers) each tab simply connects on its own.
 */
export function shareAcrossTabs(
  name: string,
  handlers: SignalHandlers,
  connect: (handlers: SignalHandlers) => { close(): void },
): { close(): void } {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (!locks || typeof BroadcastChannel === "undefined") return connect(handlers);

  const channel = new BroadcastChannel(name);
  const abort = new AbortController();
  let connection: { close(): void } | null = null;

  channel.onmessage = (event: MessageEvent<TabMessage>) => {
    if (event.data.kind === "open") handlers.onOpen();
    else if (isSignalType(event.data.type)) handlers.onSignal(event.data.type);
  };

  locks
    .request(name, { signal: abort.signal }, () => {
      // Granted after this tab stopped listening: give the lock back at once.
      if (abort.signal.aborted) return;
      connection = connect({
        onOpen() {
          handlers.onOpen();
          channel.postMessage({ kind: "open" } satisfies TabMessage);
        },
        onSignal(type) {
          handlers.onSignal(type);
          channel.postMessage({ kind: "signal", type } satisfies TabMessage);
        },
      });
      // Held until this tab closes or stops listening; then the next tab takes over.
      return new Promise<void>((resolve) => {
        abort.signal.addEventListener("abort", () => resolve(), { once: true });
      });
    })
    .catch(() => {
      // Aborted while waiting for the lock: this tab was never the leader.
    });

  return {
    close() {
      abort.abort();
      connection?.close();
      channel.close();
    },
  };
}

/**
 * Loads data and hands it to `apply`; a failed load is retried with growing waits, and a newer
 * `refresh()` replaces a pending retry, so the screen ends up with the latest data.
 */
export function createRefresher<T>(
  load: () => Promise<T>,
  apply: (data: T) => void,
  timers: Timers = {
    setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
    clearTimeout: (handle) => globalThis.clearTimeout(handle as number),
  },
): { refresh(): void; stop(): void } {
  let generation = 0;
  let retry: unknown = null;
  let stopped = false;

  const run = (mine: number, attempt: number) => {
    retry = null;
    load().then(
      (data) => {
        if (!stopped && mine === generation) apply(data);
      },
      () => {
        if (stopped || mine !== generation) return;
        retry = timers.setTimeout(() => run(mine, attempt + 1), backoffDelay(attempt));
      },
    );
  };

  return {
    refresh() {
      if (stopped) return;
      generation += 1;
      if (retry !== null) timers.clearTimeout(retry);
      run(generation, 0);
    },
    stop() {
      stopped = true;
      if (retry !== null) timers.clearTimeout(retry);
    },
  };
}
