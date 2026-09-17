import type { Metadata } from "next";

import { SampleSiteList } from "@/modules/sit/ui/sample-site-list";

export const metadata: Metadata = { title: "Şantiyeler" };

// Sample site list until the SIT module is built (D-064).
export default function SitesPage() {
  return <SampleSiteList />;
}
