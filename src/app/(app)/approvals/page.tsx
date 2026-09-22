import type { Metadata } from "next";

import { ApprovalQueue } from "@/modules/wfl/ui/approval-queue";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";
import { APPROVAL_TABS, ScreenTabs } from "@/platform/ui/nav/screen-tabs";

export const metadata: Metadata = { title: "Onaylar" };

// Approval centre (§4). Empty until the workflow engine exists; sample records removed (D-106).
export default function ApprovalsPage() {
  if (!isModuleEnabled("WFL")) return <FeatureOff />;

  return (
    <div className="flex flex-col gap-4">
      <ScreenTabs current="/approvals" label="Onay ekranı" tabs={APPROVAL_TABS} />
      <ApprovalQueue />
    </div>
  );
}
