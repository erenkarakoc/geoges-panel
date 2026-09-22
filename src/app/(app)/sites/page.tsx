import type { Metadata } from "next";

import { SampleSiteList } from "@/modules/sit/ui/sample-site-list";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Şantiyeler" };

// Sample site list until the SIT module is built (D-064).
export default function SitesPage() {
  if (!isModuleEnabled("SIT")) return <FeatureOff />;

  return <SampleSiteList />;
}
