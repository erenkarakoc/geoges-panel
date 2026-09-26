import Link from "next/link";
import { WorkflowIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Empty,
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
import { stepTypeLabel } from "@/modules/wfl/domain/graph";
import { ColumnChart, type Column } from "@/platform/ui/chart/chart";

/**
 * The working log (SCR-197, REQ-WFL-034, TASK-0120).
 *
 * What every run did, and where the ones that are still going are waiting. Nothing here is the
 * engine's own vocabulary: a step is named the way the palette names it and a state is a Turkish
 * word, because this screen is read when somebody is asking "what happened to my record".
 */

export type RunCard = {
  id: string;
  flowName: string;
  version: number;
  status: string;
  trigger: string;
  startedAt: number;
  endedAt: number | null;
  failure: string | null;
  waitingOn: string | null;
  waitingWho: string | null;
};

const STATE: Record<string, { label: string; tone: "success" | "info" | "warning" | "error" }> = {
  done: { label: "bitti", tone: "success" },
  failed: { label: "durdu", tone: "error" },
  running: { label: "yürüyor", tone: "info" },
  stopped: { label: "kapatıldı", tone: "warning" },
};

const TRIGGER: Record<string, string> = {
  clock: "saatle",
  event: "olayla",
  manual: "elle",
  threshold: "eşikle",
};

const moment = new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" });

export function RunLog({
  runs,
  days,
  outcomes,
}: {
  runs: readonly RunCard[];
  /** Runs started on each of the last days, by outcome (D-297). */
  days: readonly Column[];
  outcomes: readonly string[];
}) {
  if (runs.length === 0) {
    return (
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WorkflowIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle aria-level={2} role="heading">
            Henüz çalışma yok
          </EmptyTitle>
          <EmptyDescription>
            Bir akış yayımlanıp tetiklendiğinde her çalışması buraya düşer: hangi adımdan nereye
            gittiği, kimi beklediği ve neyle bittiği.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Frame className="w-full">
      <FrameHeader>
        <FrameTitle>Çalışma günlüğü</FrameTitle>
        <FrameDescription>
          Akışların çalışmaları. Bir çalışmayı açmak adım adım ne olduğunu gösterir.
        </FrameDescription>
      </FrameHeader>
      <FramePanel>
        <h3 className="mb-2 text-sm font-medium">Son 14 günde başlayan çalışmalar</h3>
        <ColumnChart
          columns={days}
          label="Son 14 günde başlayan çalışmalar, sonuca göre"
          series={outcomes}
          unit="çalışma"
        />
      </FramePanel>
      <FramePanel>
        <ul className="flex flex-col gap-2 lg:hidden">
          {runs.map((run) => (
            <li key={run.id}>
              <Link
                className="flex min-h-16 flex-col gap-1.5 rounded-lg border p-3 transition-colors active:bg-accent/50"
                href={`/admin/workflows/runs/${run.id}`}
              >
                <span className="font-medium">{run.flowName}</span>
                <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <RunState status={run.status} />
                  <span>{moment.format(run.startedAt)}</span>
                  {run.waitingOn ? <span>· {run.waitingOn} bekliyor</span> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Table className="hidden lg:table">
          <TableHeader>
            <TableRow>
              <TableHead>Akış</TableHead>
              <TableHead>Nasıl başladı</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Beklediği adım</TableHead>
              <TableHead>Başlangıç</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell>
                  <Link
                    className="font-medium underline-offset-4 hover:underline"
                    href={`/admin/workflows/runs/${run.id}`}
                  >
                    {run.flowName}
                  </Link>
                  <span className="block text-xs text-muted-foreground">{run.version}. sürüm</span>
                </TableCell>
                <TableCell>{TRIGGER[run.trigger] ?? run.trigger}</TableCell>
                <TableCell>
                  <RunState status={run.status} />
                  {run.failure ? (
                    <span className="block text-xs text-muted-foreground">{run.failure}</span>
                  ) : null}
                </TableCell>
                <TableCell>
                  {run.waitingOn ? (
                    <span className="flex flex-col">
                      <span>{run.waitingOn}</span>
                      {run.waitingWho ? (
                        <span className="text-xs text-muted-foreground">{run.waitingWho}</span>
                      ) : null}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{moment.format(run.startedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FramePanel>
    </Frame>
  );
}

function RunState({ status }: { status: string }) {
  const state = STATE[status];
  // A state this screen has no word for is still never shown as its code (owner 2026-09-26).
  if (!state) return <Badge variant="outline">Bilinmeyen durum</Badge>;
  return <Badge variant={state.tone === "error" ? "error" : state.tone}>{state.label}</Badge>;
}

export type VisitCard = {
  stepLabel: string;
  stepType: string;
  status: string;
  said: string;
  who: string | null;
  enteredAt: number;
  leftAt: number | null;
};

/** One run, step by step: what each step did, who it fell to and how long it took. */
export function RunTimeline({
  run,
  visits,
}: {
  run: RunCard & { record: string | null };
  visits: readonly VisitCard[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <Frame>
        <FrameHeader>
          <FrameTitle>{run.flowName}</FrameTitle>
          <FrameDescription>
            {run.version}. sürüm · {TRIGGER[run.trigger] ?? run.trigger} başladı ·{" "}
            {moment.format(run.startedAt)}
            {run.endedAt ? ` · ${moment.format(run.endedAt)} bitti` : ""}
          </FrameDescription>
        </FrameHeader>
        <FramePanel className="flex flex-col gap-2">
          <span className="flex flex-wrap items-center gap-2 text-sm">
            <RunState status={run.status} />
            {run.waitingOn ? <span>{run.waitingOn} adımında bekliyor</span> : null}
            {run.waitingWho ? (
              <span className="text-muted-foreground">({run.waitingWho})</span>
            ) : null}
          </span>
          {run.failure ? (
            <p className="rounded-md border border-warning/40 bg-warning/8 p-3 text-sm">
              {run.failure}
            </p>
          ) : null}
          {run.record ? <p className="text-sm text-muted-foreground">{run.record}</p> : null}
        </FramePanel>
      </Frame>

      <Frame>
        <FrameHeader>
          <FrameTitle>Adımlar</FrameTitle>
          <FrameDescription>
            Akışın bu çalışmada gittiği yol, sırayla. Bir adım birden çok kez geçilmiş olabilir:
            düzeltmeye dönen bir onay aynı adıma geri gelir.
          </FrameDescription>
        </FrameHeader>
        <FramePanel>
          <ol className="flex flex-col gap-0 divide-y">
            {visits.map((visit, index) => (
              <li className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0" key={index}>
                <span className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{visit.stepLabel}</span>
                  <span className="text-xs text-muted-foreground">
                    {moment.format(visit.enteredAt)}
                    {visit.leftAt ? ` → ${moment.format(visit.leftAt)}` : " → sürüyor"}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {stepTypeLabel(visit.stepType)} · {visit.said}
                  {visit.who ? ` · ${visit.who}` : ""}
                </span>
              </li>
            ))}
          </ol>
        </FramePanel>
      </Frame>
    </div>
  );
}
