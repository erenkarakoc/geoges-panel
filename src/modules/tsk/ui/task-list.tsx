import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { sampleTasks, type TaskDue } from "@/modules/tsk/ui/sample-tasks";

/** Overdue first, then today, then the rest — the order §25.4 asks for. */
const sections: readonly { due: TaskDue; title: string; description: string }[] = [
  {
    due: "overdue",
    title: "Geciken",
    description: "Süresi geçti; eskalasyon kuralları bu görevlere işler (§25.3).",
  },
  { due: "today", title: "Bugün", description: "Bugün kapatılması beklenenler." },
  { due: "later", title: "Sırada", description: "Süresi yaklaşanlar." },
];

const dueBadgeVariant: Record<TaskDue, "error" | "warning" | "outline"> = {
  later: "outline",
  overdue: "error",
  today: "warning",
};

/**
 * "Görevlerim" (§25.4): what is late, what is due today, what is coming — and where each one is
 * done, because a task that does not reach its screen is just a reminder. Sample data until the
 * task engine exists.
 */
export function TaskList() {
  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => {
        const tasks = sampleTasks.filter((task) => task.due === section.due);
        if (tasks.length === 0) {
          return null;
        }

        return (
          <section aria-label={section.title} key={section.due}>
            <Frame>
              <FrameHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FrameTitle>
                    {section.title} ({tasks.length})
                  </FrameTitle>
                  <Badge
                    title="Gerçek veri bağlanana kadar örnek görevler gösterilir"
                    variant="outline"
                  >
                    Örnek veri
                  </Badge>
                </div>
                <FrameDescription>{section.description}</FrameDescription>
              </FrameHeader>
              {tasks.map((task) => (
                <FramePanel className="p-0" key={task.id}>
                  <Link
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/50"
                    href={task.href}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{task.title}</span>
                        <Badge size="sm" variant={dueBadgeVariant[task.due]}>
                          {task.dueLabel}
                        </Badge>
                      </span>
                      <span className="text-xs text-muted-foreground">{task.note}</span>
                      <span className="text-xs text-muted-foreground">{task.source}</span>
                    </span>
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  </Link>
                </FramePanel>
              ))}
            </Frame>
          </section>
        );
      })}
    </div>
  );
}
