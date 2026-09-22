import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DAY_PARAM, resolveSiteRoute } from "@/modules/sit/ui/site-context";
import { SiteSectionPlaceholder } from "@/modules/sit/ui/site-section-placeholder";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

type SitePageProps = PageProps<"/sites/[siteId]/[[...section]]">;

export async function generateMetadata({ params }: SitePageProps): Promise<Metadata> {
  const { siteId, section } = await params;
  const route = resolveSiteRoute(siteId, section, undefined);
  return { title: route ? `${route.site.name} · ${route.section.label}` : undefined };
}

// Sample site detail (D-064); its sections and day live in the context row (`@context`).
export default async function SitePage({ params, searchParams }: SitePageProps) {
  if (!isModuleEnabled("SIT")) return <FeatureOff />;

  const { siteId, section } = await params;
  const route = resolveSiteRoute(siteId, section, (await searchParams)[DAY_PARAM]);

  if (!route) {
    notFound();
  }

  return <SiteSectionPlaceholder route={route} />;
}
