import { siteCard } from "@/modules/sit";
import { DAY_PARAM, resolveSiteRoute } from "@/modules/sit/ui/site-context";
import { SiteContextRow } from "@/modules/sit/ui/site-context-row";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Context row of an open site. An unknown address renders no row; the page shows the 404.
export default async function SiteContextSlot({
  params,
  searchParams,
}: PageProps<"/sites/[siteId]/[[...section]]">) {
  const { siteId, section } = await params;
  const found = UUID.test(siteId) ? await siteCard(siteId) : null;
  const route = resolveSiteRoute(
    found ? { id: found.id, name: found.name, note: found.projectName } : null,
    section,
    (await searchParams)[DAY_PARAM],
  );

  return route ? <SiteContextRow route={route} /> : null;
}
