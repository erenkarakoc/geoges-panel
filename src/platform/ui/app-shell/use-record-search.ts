"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { toastManager } from "@/components/ui/toast";
import { isSearchable } from "@/platform/search/search";
import { startRecordSearch, type SearchAnswer } from "./record-search-request";

type Snapshot = { query: string; attempt: number; answer: SearchAnswer | null; failed: boolean };
const subscribe = (changed: () => void) => {
  window.addEventListener("online", changed);
  window.addEventListener("offline", changed);
  return () => {
    window.removeEventListener("online", changed);
    window.removeEventListener("offline", changed);
  };
};

/** Only the current, still-open query may publish a response. No results persist on disk. */
export function useRecordSearch(query: string, open: boolean) {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const enabled = open && isSearchable(query);
  useEffect(() => {
    if (!enabled || !online) return;
    const cancel = startRecordSearch(
      query,
      (answer) => setSnapshot({ query, attempt, answer, failed: false }),
      () => {
        setSnapshot({ query, attempt, answer: null, failed: true });
        toastManager.add({ type: "error", title: "Kayıt araması yüklenemedi." });
      },
    );
    return () => {
      cancel();
      setSnapshot(null);
    };
  }, [query, enabled, online, attempt]);
  const current =
    enabled && online && snapshot?.query === query && snapshot.attempt === attempt
      ? snapshot
      : null;
  return {
    groups: current?.answer?.groups ?? [],
    corrected: current?.answer?.corrected ?? null,
    status: !enabled
      ? "idle"
      : !online
        ? "offline"
        : !current
          ? "loading"
          : current.failed
            ? "error"
            : "ready",
    retry: () => setAttempt((value) => value + 1),
  };
}
