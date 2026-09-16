export const SITE_SCOPE_COOKIE = "site_scope";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** The remembered site if the current seat may still choose it, otherwise its first site. */
export function resolveSiteScope(value: string | undefined, sites: readonly string[]): string {
  return value && sites.includes(value) ? value : (sites[0] ?? "");
}

/** Remembers the chosen site, so every page with a site selector opens on it (D-062). */
export function rememberSiteScope(site: string): void {
  document.cookie = `${SITE_SCOPE_COOKIE}=${encodeURIComponent(site)}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}
