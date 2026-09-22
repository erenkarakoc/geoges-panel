"use client";

import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";

import { connectSignals, shareAcrossTabs } from "./client";
import type { SignalType } from "./signals";

type Listener = () => void;
type Registry = Map<SignalType, Set<Listener>>;

const SignalContext = createContext<Registry | null>(null);

export const SIGNALS_URL = "/api/signals";

/**
 * Opens the person's signal stream once for the whole panel (one per browser, shared by tabs) and
 * calls the screens that listen. A screen reloads its data on its signal, and also whenever the
 * stream (re)opens or the browser comes back online, because signals missed meanwhile are not
 * replayed (SPIKE-13).
 */
export function SignalProvider({ children }: { children: ReactNode }) {
  const [registry] = useState<Registry>(() => new Map());

  useEffect(() => {
    const call = (type?: SignalType) => {
      for (const [key, set] of registry) {
        if (type && key !== type) continue;
        for (const listener of set) listener();
      }
    };
    const connection = shareAcrossTabs(
      "geoges-signals",
      { onOpen: () => call(), onSignal: (type) => call(type) },
      (handlers) =>
        connectSignals(SIGNALS_URL, handlers, {
          open: (url) => new EventSource(url, { withCredentials: true }),
        }),
    );
    const online = () => call();
    window.addEventListener("online", online);
    return () => {
      window.removeEventListener("online", online);
      connection.close();
    };
  }, [registry]);

  return <SignalContext.Provider value={registry}>{children}</SignalContext.Provider>;
}

/** Calls `onChange` when something of this type changed for the person (or may have). */
export function useSignal(type: SignalType, onChange: () => void) {
  const registry = useContext(SignalContext);
  const latest = useRef(onChange);

  useEffect(() => {
    latest.current = onChange;
  });

  useEffect(() => {
    if (!registry) return;
    const listener = () => latest.current();
    const set = registry.get(type) ?? new Set<Listener>();
    set.add(listener);
    registry.set(type, set);
    return () => {
      set.delete(listener);
    };
  }, [registry, type]);
}
