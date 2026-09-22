import type { Metadata } from "next";

import { ApprovalQueue } from "@/modules/wfl/ui/approval-queue";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Onaylar" };

// Approval centre (§4). Empty until the workflow engine exists; sample records removed (D-106).
export default function ApprovalsPage() {
  if (!isModuleEnabled("WFL")) return <FeatureOff />;

  return <ApprovalQueue />;
}
