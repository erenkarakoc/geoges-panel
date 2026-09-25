import type { SearchResultGroup } from "@/platform/search/search";

export type SearchAnswer = {
  groups: SearchResultGroup[];
  corrected: string | null;
  failedGroups?: { type: string; label: string }[];
};

/**
 * Debounce and cancellation belong together: even a transport ignoring abort cannot publish.
 *
 * Only a request that is still on its way is aborted. Aborting one that never started or has already
 * finished stops nothing — and Chrome 153 reported exactly that as an unhandled "signal is aborted
 * without reason" on every navigation, because the recent-page check of the previous page had long
 * since answered when the page changed (2026-09-25). A superseded answer is still never published:
 * that is the `cancelled` flag's job, not the signal's.
 */
export function startRecordSearch(
  query: string,
  receive: (answer: SearchAnswer) => void,
  failed: () => void,
  request: typeof fetch = fetch,
  recentPaths?: readonly string[],
) {
  const controller = new AbortController();
  let started = false;
  let settled = false;
  let cancelled = false;

  const timer = setTimeout(async () => {
    started = true;
    try {
      const response = await request(
        recentPaths ? "/api/search/recent" : `/api/search?q=${encodeURIComponent(query)}`,
        {
          signal: controller.signal,
          cache: "no-store",
          ...(recentPaths
            ? {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(recentPaths),
              }
            : {}),
        },
      );
      if (!response.ok) {
        // Nobody reads this body, so it is let go now rather than left for a later abort to error.
        await response.body?.cancel().catch(() => {});
        throw new Error("Search unavailable");
      }
      const answer: SearchAnswer = await response.json();
      if (!cancelled) receive(answer);
    } catch {
      if (!cancelled) failed();
    } finally {
      settled = true;
    }
  }, 200);

  return () => {
    cancelled = true;
    clearTimeout(timer);
    if (started && !settled) {
      controller.abort(new DOMException("Arama yenisiyle değişti.", "AbortError"));
    }
  };
}
