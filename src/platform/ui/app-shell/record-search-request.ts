import type { SearchResultGroup } from "@/platform/search/search";

export type SearchAnswer = { groups: SearchResultGroup[]; corrected: string | null };

/** Debounce and cancellation belong together: even a transport ignoring abort cannot publish. */
export function startRecordSearch(
  query: string,
  receive: (answer: SearchAnswer) => void,
  failed: () => void,
  request: typeof fetch = fetch,
) {
  const controller = new AbortController();
  const timer = setTimeout(async () => {
    try {
      const response = await request(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Search unavailable");
      const answer: SearchAnswer = await response.json();
      if (!controller.signal.aborted) receive(answer);
    } catch {
      if (!controller.signal.aborted) failed();
    }
  }, 200);
  return () => {
    clearTimeout(timer);
    controller.abort();
  };
}
