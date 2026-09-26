import type { Metadata } from "next";

import { siteWallProgress } from "@/modules/prj";
import { listSites } from "@/modules/sit";
import { SiteList } from "@/modules/sit/ui/site-list";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Şantiyeler" };

/** SCR-026 — the sites the person may see (TASK-0123 step 1); the search's "Tümünü gör" too. */
export default async function SitesPage() {
  if (!isModuleEnabled("SIT")) return <FeatureOff />;

  const sites = await listSites();
  const walls = await siteWallProgress(sites.map((site) => site.id));
  return (
    <SiteList
      sites={sites.map((site) => ({
        ...site,
        wallsCompleted: walls.get(site.id)?.completed ?? 0,
        wallsTotal: walls.get(site.id)?.total ?? 0,
      }))}
    />
  );
}
