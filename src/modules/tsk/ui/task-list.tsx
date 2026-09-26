import { ListChecksIcon, PlusIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TaskView } from "@/modules/tsk/data/tsk-store";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  taskGroup,
  type TaskPriority,
  type TaskSummary,
} from "@/modules/tsk/domain/tasks";
import { ShareBar } from "@/platform/ui/chart/chart";
import { REST, SERIES } from "@/platform/ui/chart/colors";

export const TASKS_ROUTE = "/tasks";
export const NEW_TASK_ROUTE = "/tasks/new";

const dueFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "medium",
});

const VIEWS: { value: TaskView; label: string; ownerOnly?: boolean }[] = [
  { value: "mine", label: "Bana verilenler" },
  { value: "given", label: "Verdiklerim" },
  { value: "all", label: "Tümü", ownerOnly: true },
];

const PRIORITY_BADGE: Record<TaskPriority, "outline" | "secondary" | "warning" | "error"> = {
  low: "outline",
  normal: "secondary",
  high: "warning",
  critical: "error",
};

// How the list divides (D-297). "Gecikti" wears the error colour it wears on its badge.
const GROUPS: { key: ReturnType<typeof taskGroup>; label: string; color: string }[] = [
  { color: "var(--destructive)", key: "overdue", label: "Gecikti" },
  { color: SERIES[0], key: "today", label: "Bugün" },
  { color: SERIES[1], key: "awaiting", label: "Onay bekliyor" },
  { color: SERIES[2], key: "upcoming", label: "İleride" },
  { color: REST, key: "closed", label: "Kapandı" },
];

function viewHref(view: TaskView, showClosed: boolean) {
  const params = new URLSearchParams();
  if (view !== "mine") params.set("gorunum", view);
  if (showClosed) params.set("kapananlar", "1");
  const query = params.toString();
  return query ? `${TASKS_ROUTE}?${query}` : TASKS_ROUTE;
}

/** The other person of a row: whom it was given to, or who gave it. */
function personOf(task: TaskSummary, view: TaskView) {
  if (view === "given") return task.assigneeName;
  return task.sourceType === "manual" ? (task.givenByName ?? "Bilinmeyen kişi") : "Sistem";
}

/** The status cell: late tasks say so first (REQ-TSK-007, SCREEN_STATES "vurgulu"). */
function StatusBadge({ task, now }: { task: TaskSummary; now: Date }) {
  const group = taskGroup(task, now);
  if (group === "overdue") return <Badge variant="error">Gecikti</Badge>;
  if (group === "today") return <Badge variant="info">Bugün</Badge>;
  if (task.status === "reported_done") return <Badge variant="warning">Onay bekliyor</Badge>;
  if (task.status === "closed") return <Badge variant="success">{STATUS_LABELS.closed}</Badge>;
  return <Badge variant="outline">{STATUS_LABELS[task.status]}</Badge>;
}

/**
 * SCR-013 Görevler (REQ-TSK-007, REQ-TSK-008). Late tasks are always on top; every task opens
 * its own screen, which leads on to where the work is done and says why it is here. The view
 * and "kapananlar" travel in the address.
 */
export function TaskList({
  tasks,
  view,
  showClosed,
  canSeeAll,
}: {
  tasks: readonly TaskSummary[];
  view: TaskView;
  showClosed: boolean;
  canSeeAll: boolean;
}) {
  const now = new Date();
  const other = view === "given" ? "Sorumlu" : "Veren";

  return (
    <Frame className="w-full">
      <FrameHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FrameTitle>Görevler</FrameTitle>
          <FrameDescription>
            Geciken görevler her zaman en üstte durur. Göreve tıklayınca ayrıntısı ve işin
            yapılacağı yer açılır.
          </FrameDescription>
        </div>
        <Button render={<Link href={NEW_TASK_ROUTE} />}>
          <PlusIcon aria-hidden="true" />
          Görev ver
        </Button>
      </FrameHeader>

      <FramePanel className="flex flex-col gap-4">
        <nav aria-label="Görev listesi" className="flex flex-wrap items-center gap-2">
          {VIEWS.filter((v) => !v.ownerOnly || canSeeAll).map((v) => (
            <Button
              aria-current={v.value === view ? "page" : undefined}
              className="h-11 md:h-8"
              key={v.value}
              render={<Link href={viewHref(v.value, showClosed)} />}
              size="sm"
              variant={v.value === view ? "secondary" : "ghost"}
            >
              {v.label}
            </Button>
          ))}
          <Button
            className="ms-auto h-11 md:h-8"
            render={<Link href={viewHref(view, !showClosed)} />}
            size="sm"
            variant="ghost"
          >
            {showClosed ? "Kapananları gizle" : "Kapananları göster"}
          </Button>
        </nav>

        {tasks.length > 0 ? (
          <ShareBar
            label="Görevlerin durumu"
            parts={GROUPS.filter((group) => group.key !== "closed" || showClosed).map((group) => ({
              color: group.color,
              key: group.key,
              label: group.label,
              value: tasks.filter((task) => taskGroup(task, now) === group.key).length,
            }))}
            unit="görev"
          />
        ) : null}

        {tasks.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ListChecksIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle aria-level={2} role="heading">
                {view === "given" ? "Açık verdiğiniz görev yok" : "Açık göreviniz yok"}
              </EmptyTitle>
              <EmptyDescription>
                {view === "given"
                  ? "Verdiğiniz görevler kapanana kadar burada izlenir."
                  : "Size verilen görevler burada listelenir."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button render={<Link href={NEW_TASK_ROUTE} />} variant="outline">
                Görev ver
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            {/* A phone shows one card per task: five columns would scroll sideways under a
                thumb, and the daily screens must work on site (DESIGN_SYSTEM_RULES section 8). */}
            <ul className="flex flex-col gap-2 md:hidden">
              {tasks.map((task) => (
                <li key={task.id}>
                  <Link
                    className="flex min-h-16 flex-col gap-1.5 rounded-lg border p-3 transition-colors active:bg-accent/50"
                    href={`${TASKS_ROUTE}/${task.id}`}
                  >
                    <span className="font-medium">{task.title}</span>
                    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <StatusBadge now={now} task={task} />
                      {task.priority === "normal" || task.priority === "low" ? null : (
                        <Badge variant={PRIORITY_BADGE[task.priority]}>
                          {PRIORITY_LABELS[task.priority]}
                        </Badge>
                      )}
                      {task.dueAt ? <span>{dueFormat.format(task.dueAt)}</span> : null}
                      <span>
                        {other}: {personOf(task, view)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Görev</TableHead>
                  <TableHead>{other}</TableHead>
                  <TableHead>Son tarih</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="max-w-96 whitespace-normal">
                      <Link
                        className="font-medium underline-offset-4 hover:underline"
                        href={`${TASKS_ROUTE}/${task.id}`}
                      >
                        {task.title}
                      </Link>
                    </TableCell>
                    <TableCell>{personOf(task, view)}</TableCell>
                    <TableCell>{task.dueAt ? dueFormat.format(task.dueAt) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={PRIORITY_BADGE[task.priority]}>
                        {PRIORITY_LABELS[task.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge now={now} task={task} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </FramePanel>
    </Frame>
  );
}
