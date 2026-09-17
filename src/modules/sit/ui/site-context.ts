import { type Day, parseDay, todayIn } from "@/platform/date/day";

/**
 * SAMPLE DATA (owner decision D-064). There is no site data yet; these three sites let the
 * context row be judged on a real-looking address. Names match the sample seats in
 * `platform/access/preview-roles.ts`. Replace with the SIT site repository.
 */
export type SampleSite = { id: string; name: string; note: string };

export const sampleSites: readonly SampleSite[] = [
  { id: "kavakli", name: "Kavaklı Şantiyesi", note: "A ve B blok istinat duvarları" },
  { id: "ilgaz", name: "Ilgaz Şantiyesi", note: "Karayolu şevi, işveren dolgusu bekleniyor" },
  { id: "sariyar", name: "Sarıyar Şantiyesi", note: "Baraj yolu donatılı duvar" },
];

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

export type SiteRoute = { site: SampleSite; section: SiteSection; day: Day; today: Day };

/**
 * Reads `/sites/[siteId]/[[...section]]?gun=` once, for both the page and the context row, so
 * the two can never disagree. `null` means the address does not exist.
 */
export function resolveSiteRoute(
  siteId: string,
  sectionSlugs: readonly string[] | undefined,
  dayParam: string | string[] | undefined,
  now: Date = new Date(),
): SiteRoute | null {
  const site = sampleSites.find((item) => item.id === siteId);
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
