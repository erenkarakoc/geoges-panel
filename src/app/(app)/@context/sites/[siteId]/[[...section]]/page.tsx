import { DAY_PARAM, resolveSiteRoute } from "@/modules/sit/ui/site-context";
import { SiteContextRow } from "@/modules/sit/ui/site-context-row";

// Context row of an open site. An unknown address renders no row; the page shows the 404.
export default async function SiteContextSlot({
  params,
  searchParams,
}: PageProps<"/sites/[siteId]/[[...section]]">) {
  const { siteId, section } = await params;
  const route = resolveSiteRoute(siteId, section, (await searchParams)[DAY_PARAM]);

  return route ? <SiteContextRow route={route} /> : null;
}
