import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { siteCard } from "@/modules/sit";
import { DAY_PARAM, resolveSiteRoute, type SiteSummary } from "@/modules/sit/ui/site-context";
import { SiteSectionPlaceholder } from "@/modules/sit/ui/site-section-placeholder";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

type SitePageProps = PageProps<"/sites/[siteId]/[[...section]]">;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The site the address names, as the person may see it; null when there is none for them. */
async function openSite(siteId: string): Promise<SiteSummary | null> {
  if (!UUID.test(siteId)) return null;
  const found = await siteCard(siteId);
  return found ? { id: found.id, name: found.name, note: found.projectName } : null;
}

export async function generateMetadata({ params }: SitePageProps): Promise<Metadata> {
  const { siteId, section } = await params;
  const route = resolveSiteRoute(await openSite(siteId), section, undefined);
  return { title: route ? `${route.site.name} · ${route.section.label}` : undefined };
}

// An open site (TASK-0123); its sections and day live in the context row (`@context`). What each
// section holds arrives with the daily site log (TASK-0127) and the site screen (TASK-0128).
export default async function SitePage({ params, searchParams }: SitePageProps) {
  if (!isModuleEnabled("SIT")) return <FeatureOff />;

  const { siteId, section } = await params;
  const route = resolveSiteRoute(await openSite(siteId), section, (await searchParams)[DAY_PARAM]);

  if (!route) {
    notFound();
  }

  return <SiteSectionPlaceholder route={route} />;
}
