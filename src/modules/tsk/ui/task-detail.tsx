import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import type { TaskDetail, TaskHistoryEntry } from "@/modules/tsk/data/tsk-store";
import { historyLine, PRIORITY_LABELS, STATUS_LABELS, taskGroup } from "@/modules/tsk/domain/tasks";
import { TaskStepButtons, type TaskSteps } from "@/modules/tsk/ui/task-step-buttons";

const timeFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "medium",
  timeStyle: "short",
});
const dayFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "long",
});

/** Which steps the viewer sees; the database checks each again. */
function stepsFor(task: TaskDetail, viewerId: string): TaskSteps {
  const isGiver = task.givenByUserId === viewerId;
  let reopen: TaskSteps["reopen"] = null;
  if (isGiver && task.status === "reported_done") reopen = "send_back";
  if (isGiver && task.status === "closed") reopen = "reopen";
  return {
    complete: task.status === "open" && task.assigneeUserId === viewerId,
    approve: task.status === "reported_done" && isGiver,
    reopen,
  };
}

/** "Neden bende" (REQ-TSK-008): who gave it, or which problem opened it. */
function sourceText(task: TaskDetail) {
  if (task.sourceType === "manual") return `${task.givenByName ?? "Bilinmeyen kişi"} verdi.`;
  if (task.sourceType === "system")
    return `Sistem açtı (${task.sourceEventCode ?? "sistem olayı"}); sorun çözülünce kendiliğinden kapanır.`;
  return "Bir iş akışı açtı.";
}

/** The task screen every task and notification leads to (REQ-TSK-007, REQ-TSK-008). */
export function TaskDetailView({
  task,
  history,
  viewerId,
}: {
  task: TaskDetail;
  history: readonly TaskHistoryEntry[];
  viewerId: string;
}) {
  const group = taskGroup(task, new Date());
  const lines = history.flatMap((h) => {
    const text = historyLine(h);
    return text ? [{ ...h, text }] : [];
  });
  const workPath = task.linkPath !== `/tasks/${task.id}` ? task.linkPath : null;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <Button className="self-start" render={<Link href="/tasks" />} size="sm" variant="ghost">
        <ArrowLeftIcon aria-hidden="true" />
        Görevler
      </Button>
      <Frame className="w-full">
        <FrameHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {group === "overdue" ? <Badge variant="error">Gecikti</Badge> : null}
            <Badge variant={task.status === "closed" ? "success" : "outline"}>
              {STATUS_LABELS[task.status]}
            </Badge>
            <Badge variant="secondary">{PRIORITY_LABELS[task.priority]} öncelik</Badge>
          </div>
          <FrameTitle>{task.title}</FrameTitle>
          <FrameDescription>{sourceText(task)}</FrameDescription>
        </FrameHeader>
        <FramePanel className="flex flex-col gap-5">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Sorumlu</dt>
              <dd className="font-medium">{task.assigneeName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Son tarih</dt>
              <dd className="font-medium">{task.dueAt ? dayFormat.format(task.dueAt) : "Yok"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Kapanış</dt>
              <dd className="font-medium">
                {task.needsGiverApproval ? "Veren onaylayınca kapanır" : "Sorumlu kapatır"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Oluşturulma</dt>
              <dd className="font-medium">{timeFormat.format(task.createdAt)}</dd>
            </div>
          </dl>
          {task.description ? (
            <p className="text-sm whitespace-pre-line">{task.description}</p>
          ) : null}
          {workPath ? (
            <Button className="self-start" render={<Link href={workPath} />} variant="outline">
              İşin yapılacağı ekrana git
            </Button>
          ) : null}
          <TaskStepButtons steps={stepsFor(task, viewerId)} taskId={task.id} />
        </FramePanel>
      </Frame>

      <Frame className="w-full">
        <FrameHeader>
          <FrameTitle>Geçmiş</FrameTitle>
        </FrameHeader>
        <FramePanel>
          <ol className="flex flex-col gap-3 text-sm">
            {lines.map((line, index) => (
              <li className="flex flex-col" key={`${line.changedAt.getTime()}-${index}`}>
                <span>
                  <span className="font-medium">{line.changedByName ?? "Sistem"}</span> ·{" "}
                  {line.text}
                </span>
                <span className="text-muted-foreground">
                  {timeFormat.format(line.changedAt)}
                  {line.reason ? ` · ${line.reason}` : ""}
                </span>
              </li>
            ))}
          </ol>
        </FramePanel>
      </Frame>
    </div>
  );
}
