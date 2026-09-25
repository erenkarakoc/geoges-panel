import { type Day, parseDay, todayIn } from "@/platform/date/day";

/** What the context row says about the open site: its name and the project it belongs to. */
export type SiteSummary = { id: string; name: string; note: string };

/**
 * Sections of an open site (D-055 context row). Each one is its own address (D-064):
 * `/sites/kavakli` is "Gün", `/sites/kavakli/dokum` is "Döküm". Slugs are Turkish because they
 * are what people see in the address bar and share.
 */
export const siteSections = [
  { value: "day", slug: "", label: "Gün" },
  { value: "pour", slug: "dokum", label: "Döküm" },
  { value: "assembly", slug: "montaj", label: "Montaj" },
  { value: "strip", slug: "serit", label: "Şerit" },
  { value: "timesheet", slug: "puantaj", label: "Puantaj" },
  { value: "stock", slug: "stok", label: "Stok" },
  { value: "documents", slug: "belgeler", label: "Belgeler" },
] as const;

export type SiteSection = (typeof siteSections)[number];

/** Search parameter holding the chosen day; absent means today. */
export const DAY_PARAM = "gun";

export type SiteRoute = { site: SiteSummary; section: SiteSection; day: Day; today: Day };

/**
 * Reads `/sites/[siteId]/[[...section]]?gun=` once, for both the page and the context row, so
 * the two can never disagree. `site` is the site the address names as the person may see it
 * (null when there is none for them); `null` back means the address does not exist.
 */
export function resolveSiteRoute(
  site: SiteSummary | null,
  sectionSlugs: readonly string[] | undefined,
  dayParam: string | string[] | undefined,
  now: Date = new Date(),
): SiteRoute | null {
  const slugs = sectionSlugs ?? [];
  const section =
    slugs.length <= 1 ? siteSections.find((item) => item.slug === (slugs[0] ?? "")) : undefined;

  if (!site || !section) {
    return null;
  }

  const today = todayIn(undefined, now);
  const requested = parseDay(typeof dayParam === "string" ? dayParam : undefined);
  // A future day has no record to show; fall back to today instead of an empty screen.
  const day = requested && requested <= today ? requested : today;

  return { site, section, day, today };
}

export function siteSectionHref(siteId: string, section: SiteSection): `/${string}` {
  return section.slug ? `/sites/${siteId}/${section.slug}` : `/sites/${siteId}`;
}
