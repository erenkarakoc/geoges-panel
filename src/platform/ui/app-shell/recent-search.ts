import { isPanelPath } from "@/platform/search/search";

const key = (userId: string) => `geoges:recent-search:v1:${userId}`;
/** Session-only addresses, isolated by account. Titles and permission results are never saved. */
export function readRecentPaths(userId: string): string[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key(userId)) ?? "[]");
    return Array.isArray(value)
      ? value
          .filter((path): path is string => typeof path === "string" && isPanelPath(path))
          .slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

export function rememberRecentPath(userId: string, path: string) {
  if (!isPanelPath(path)) return;
  try {
    sessionStorage.setItem(
      key(userId),
      JSON.stringify(
        [path, ...readRecentPaths(userId).filter((other) => other !== path)].slice(0, 5),
      ),
    );
  } catch {
    /* Disabled browser storage must not prevent navigation. */
  }
}
