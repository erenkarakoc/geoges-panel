import type { SearchResultGroup } from "@/platform/search/search";

export type SearchAnswer = {
  groups: SearchResultGroup[];
  corrected: string | null;
  failedGroups?: { type: string; label: string }[];
};

/** Debounce and cancellation belong together: even a transport ignoring abort cannot publish. */
export function startRecordSearch(
  query: string,
  receive: (answer: SearchAnswer) => void,
  failed: () => void,
  request: typeof fetch = fetch,
  recentPaths?: readonly string[],
) {
  const controller = new AbortController();
  const timer = setTimeout(async () => {
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
