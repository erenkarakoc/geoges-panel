import { ListChecksIcon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/**
 * "Görevlerim" (§25.4). There is no task engine yet, so the screen shows its empty state. The
 * sample list was removed at the owner's request (D-106); the real list — late, today, next —
 * is built with the engine, and every task must lead to the flow, step and record that opened
 * it (D-087).
 */
export function TaskList() {
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ListChecksIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle aria-level={2} role="heading">
          Açık göreviniz yok
        </EmptyTitle>
        <EmptyDescription>Size atanan görevler burada listelenir.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
