import type { Metadata } from "next";

import { listSites } from "@/modules/sit";
import { SiteList } from "@/modules/sit/ui/site-list";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Şantiyeler" };

/** SCR-026 — the sites the person may see (TASK-0123 step 1); the search's "Tümünü gör" too. */
export default async function SitesPage() {
  if (!isModuleEnabled("SIT")) return <FeatureOff />;

  return <SiteList sites={await listSites()} />;
}
