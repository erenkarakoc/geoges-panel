/**
 * Which module groups the user left open in the expanded rail (D-054, owner decision
 * 2026-09-16: several groups may stay open and the choice is remembered).
 *
 * Kept in a cookie rather than local storage so the server can render the rail already open and
 * the page never flashes closed groups. COSS stores its own sidebar state the same way.
 */

export const SIDEBAR_GROUPS_COOKIE = "sidebar_groups";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** Parses the cookie value; unknown ids are dropped by the caller, so this only splits. */
export function parseOpenGroups(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/** Client-side write. Cookies are the storage, so this is a one-line document write. */
export function rememberOpenGroups(groupIds: readonly string[]): void {
  if (typeof document === "undefined") {
    return;
  }
  const value = encodeURIComponent(groupIds.join(","));
  document.cookie = `${SIDEBAR_GROUPS_COOKIE}=${value}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}
