import { CheckCircle2Icon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/**
 * Approval centre (§4). There is no workflow engine yet, so nothing is waiting and the screen
 * shows its empty state. The sample queue was removed at the owner's request (D-106); the real
 * screen is built with the engine in Phase 08 and must carry three outcomes — approve, reject,
 * send back — with a mandatory reason for the last two (D-099, D-107), and show why each record
 * is with this approver (D-087, D-097).
 */
export function ApprovalQueue() {
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CheckCircle2Icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle aria-level={2} role="heading">
          Bugün temiz
        </EmptyTitle>
        <EmptyDescription>Onayınızı bekleyen kayıt yok.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
