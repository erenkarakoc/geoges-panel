import { describe, expect, it } from "vitest";

import {
  backoffDelay,
  connectSignals,
  createRefresher,
  shareAcrossTabs,
  type EventSourceLike,
  type Timers,
} from "./client";
import { listenForSignals, openStreamCount, sendSignal } from "./hub";
import { isSignalType, signalFrame, SIGNAL_TYPES } from "./signals";

/** Timers run by hand, so waits can be checked without waiting. */
function manualTimers() {
  const pending: { fn: () => void; ms: number }[] = [];
  const timers: Timers = {
    setTimeout(fn, ms) {
      const entry = { fn, ms };
      pending.push(entry);
      return entry;
    },
    clearTimeout(handle) {
      const i = pending.indexOf(handle as (typeof pending)[number]);
      if (i >= 0) pending.splice(i, 1);
    },
  };
  return {
    timers,
    pending,
    runNext() {
      const next = pending.shift();
      next?.fn();
      return next?.ms;
    },
  };
}

class FakeSource implements EventSourceLike {
  readyState = 0;
  closed = false;
  private listeners = new Map<string, ((event: MessageEvent<string>) => void)[]>();
  addEventListener(type: string, listener: (event: MessageEvent<string>) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  emit(type: string, data = "") {
    for (const l of this.listeners.get(type) ?? []) l({ data } as MessageEvent<string>);
  }
  close() {
    this.closed = true;
    this.readyState = 2;
  }
}

describe("signal contract (SPIKE-13 C11)", () => {
  it("a frame names the kind only, never a count or a record", () => {
    for (const type of SIGNAL_TYPES) {
      expect(signalFrame(type)).toBe(`event: signal\ndata: ${type}\n\n`);
    }
    expect(isSignalType("notifications")).toBe(true);
    expect(isSignalType("notifications:3")).toBe(false);
    expect(isSignalType({ type: "tasks" })).toBe(false);
  });

  it("reaches only the named person's open streams", () => {
    const heard: string[] = [];
    const stopA = listenForSignals("a", (t) => heard.push(`a:${t}`));
    const stopB = listenForSignals("b", (t) => heard.push(`b:${t}`));
    sendSignal("a", "tasks");
    expect(heard).toEqual(["a:tasks"]);
    stopA();
    stopB();
    expect(openStreamCount("a")).toBe(0);
  });
});

describe("stream wrapper (SPIKE-13 carry-forward 1)", () => {
  it("reopens a stream the browser gave up on, with growing waits, and reports each open", () => {
    const clock = manualTimers();
    const sources: FakeSource[] = [];
    const opens: number[] = [];
    const signals: string[] = [];
    connectSignals(
      "/api/signals",
      { onOpen: () => opens.push(sources.length), onSignal: (t) => signals.push(t) },
      {
        open: () => {
          const s = new FakeSource();
          sources.push(s);
          return s;
        },
        timers: clock.timers,
      },
    );
    sources[0].emit("open");
    sources[0].emit("signal", "notifications");
    sources[0].emit("signal", "something-else");
    expect(signals).toEqual(["notifications"]);

    // A network drop while CONNECTING: the browser retries itself, we do nothing.
    sources[0].readyState = 0;
    sources[0].emit("error");
    expect(clock.pending).toHaveLength(0);

    // HTTP 503: the browser closes for good; we retry after 500 ms, then 1 s.
    sources[0].readyState = 2;
    sources[0].emit("error");
    expect(clock.runNext()).toBe(500);
    sources[1].readyState = 2;
    sources[1].emit("error");
    expect(clock.runNext()).toBe(1_000);
    sources[2].emit("open");
    expect(opens).toEqual([1, 3]);
  });

  it("stops retrying once closed", () => {
    const clock = manualTimers();
    const source = new FakeSource();
    const connection = connectSignals(
      "/x",
      { onOpen() {}, onSignal() {} },
      { open: () => source, timers: clock.timers },
    );
    connection.close();
    source.emit("error");
    expect(clock.pending).toHaveLength(0);
    expect(backoffDelay(99)).toBe(8_000);
  });
});

describe("one stream per browser (SPIKE-13 limit 2)", () => {
  it("a tab that stopped before the lock arrived gives it back without connecting", async () => {
    let grant: (() => Promise<void>) | null = null;
    let released = false;
    const g = globalThis as unknown as { navigator?: unknown; BroadcastChannel?: unknown };
    const saved = { navigator: g.navigator, channel: g.BroadcastChannel };
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        locks: {
          request: (_n: string, _o: unknown, cb: () => Promise<void> | void) =>
            new Promise<void>((resolve) => {
              grant = async () => {
                await cb();
                released = true;
                resolve();
              };
            }),
        },
      },
    });
    g.BroadcastChannel = class {
      onmessage: unknown = null;
      postMessage() {}
      close() {}
    };
    try {
      let connects = 0;
      const tab = shareAcrossTabs("t", { onOpen() {}, onSignal() {} }, () => {
        connects += 1;
        return { close() {} };
      });
      tab.close(); // React unmounts before the lock is granted
      await grant!();
      expect(connects).toBe(0);
      expect(released).toBe(true);
    } finally {
      Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        value: saved.navigator,
      });
      g.BroadcastChannel = saved.channel;
    }
  });
});

describe("data refresh after a signal (SPIKE-13 finding 2)", () => {
  it("retries a failed load and keeps only the newest answer", async () => {
    const clock = manualTimers();
    const applied: number[] = [];
    let calls = 0;
    const refresher = createRefresher(
      async () => {
        calls += 1;
        if (calls === 1) throw new Error("503");
        return calls;
      },
      (n) => applied.push(n),
      clock.timers,
    );
    refresher.refresh();
    await Promise.resolve();
    await Promise.resolve();
    expect(clock.pending.map((p) => p.ms)).toEqual([500]);
    clock.runNext();
    await Promise.resolve();
    await Promise.resolve();
    expect(applied).toEqual([2]);
    refresher.stop();
  });
});
