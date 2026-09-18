import type { Metadata } from "next";

import { ApprovalQueue } from "@/modules/wfl/ui/approval-queue";

export const metadata: Metadata = { title: "Onaylar" };

// Approval centre (§4). Empty until the workflow engine exists; sample records removed (D-106).
export default function ApprovalsPage() {
  return <ApprovalQueue />;
}
