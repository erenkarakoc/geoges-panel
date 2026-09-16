import type { Metadata } from "next";

import { CockpitOverview } from "@/modules/rpt/ui/cockpit-overview";
import { previewAccessPolicy } from "@/platform/access/access-policy";

export const metadata: Metadata = { title: "Cockpit" };

export default function DashboardPage() {
  return <CockpitOverview access={previewAccessPolicy} />;
}
