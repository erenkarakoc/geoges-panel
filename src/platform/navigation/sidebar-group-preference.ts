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
  return decodeURIComponent(value)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Which groups the rail opens with. Someone who has never touched the menu gets the first group
 * open, so the expanded rail is not a wall of closed rows (owner decision 2026-09-17). Once they
 * have opened or closed anything the cookie exists, and their choice wins — including the choice
 * to leave everything closed, which is an empty cookie rather than a missing one.
 */
export function resolveOpenGroups(
  cookieValue: string | undefined,
  firstGroupId: string | undefined,
): string[] {
  if (cookieValue === undefined) {
    return firstGroupId ? [firstGroupId] : [];
  }
  return parseOpenGroups(cookieValue);
}

/** Client-side write. Cookies are the storage, so this is a one-line document write. */
export function rememberOpenGroups(groupIds: readonly string[]): void {
  if (typeof document === "undefined") {
    return;
  }
  const value = encodeURIComponent(groupIds.join(","));
  document.cookie = `${SIDEBAR_GROUPS_COOKIE}=${value}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}
