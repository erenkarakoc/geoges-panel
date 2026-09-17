import type { Metadata } from "next";

import { ApprovalQueue } from "@/modules/wfl/ui/approval-queue";

export const metadata: Metadata = { title: "Onaylar" };

// Approval centre (§4) in queue mode (D-070); sample records until WFL is built.
export default function ApprovalsPage() {
  return <ApprovalQueue />;
}
