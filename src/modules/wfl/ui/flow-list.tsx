import Link from "next/link";
import { WorkflowIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import type { FlowSummary } from "@/modules/wfl/data/flow-store";
import { NewFlowButton } from "@/modules/wfl/ui/new-flow-button";

/**
 * The company's flows (SCR-195, TASK-0119). The minimal list the designer is reached from:
 * templates and the "new flows" tab are TASK-0120's, and are deliberately absent rather than
 * shown empty.
 */

const day = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" });

const TRIGGER_LABELS: Record<string, string> = {
  event: "Olay",
  clock: "Saat",
  threshold: "Eşik",
  manual: "Elle",
};

export function FlowList({
  flows,
  create,
}: {
  flows: readonly FlowSummary[];
  create: (name: string) => Promise<{ error: string | null; key: string | null }>;
}) {
  if (!flows.length) {
    return (
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WorkflowIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle aria-level={2} role="heading">
            Henüz akış yok
          </EmptyTitle>
          <EmptyDescription>
            Bir akış, şirketin bir sürecini adım adım yürütür: olay olduğunda başlar, onay veya
            görev bekler, sonra devam eder.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <NewFlowButton create={create} variant="outline" />
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <Frame className="w-full">
      <FrameHeader className="flex-row items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <FrameTitle>Akışlar</FrameTitle>
          <FrameDescription>
            Şirketin süreçleri. Bir akışı açmak tasarımcıyı açar; yayımlanmış bir sürüm düzenlenmez,
            düzenlemeye başlamak yeni bir taslak açar.
          </FrameDescription>
        </div>
        <NewFlowButton create={create} />
      </FrameHeader>
      <FramePanel>
        <ul className="flex flex-col gap-2 lg:hidden">
          {flows.map((flow) => (
            <li key={flow.key}>
              <Link
                className="flex min-h-16 flex-col gap-1.5 rounded-lg border p-3 transition-colors active:bg-accent/50"
                href={`/admin/workflows/${flow.key}`}
              >
                <span className="font-medium">{flow.name}</span>
                <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <FlowState flow={flow} />
                  <span>{TRIGGER_LABELS[flow.trigger ?? ""] ?? "—"}</span>
                  {flow.publishedAt ? <span>{day.format(flow.publishedAt)}</span> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Table className="hidden lg:table">
          <TableHeader>
            <TableRow>
              <TableHead>Akış</TableHead>
              <TableHead>Tetik</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Sürüm</TableHead>
              <TableHead>Son yayın</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flows.map((flow) => (
              <TableRow key={flow.key}>
                <TableCell>
                  <Link
                    className="font-medium underline-offset-4 hover:underline"
                    href={`/admin/workflows/${flow.key}`}
                  >
                    {flow.name}
                  </Link>
                </TableCell>
                <TableCell>{TRIGGER_LABELS[flow.trigger ?? ""] ?? "—"}</TableCell>
                <TableCell>
                  <FlowState flow={flow} />
                </TableCell>
                <TableCell className="tabular-nums">
                  {flow.publishedVersion ?? flow.draftVersion ?? "—"}
                </TableCell>
                <TableCell>{flow.publishedAt ? day.format(flow.publishedAt) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FramePanel>
    </Frame>
  );
}

/** Published, draft, both, or turned off — the four things a flow can be right now. */
function FlowState({ flow }: { flow: FlowSummary }) {
  if (flow.disabledAt) return <Badge variant="secondary">Kapalı</Badge>;
  if (flow.publishedVersion && flow.draftVersion) {
    return (
      <span className="flex flex-wrap items-center gap-1.5">
        <Badge variant="success">Yayında</Badge>
        <Badge variant="outline">Taslak var</Badge>
      </span>
    );
  }
  if (flow.publishedVersion) return <Badge variant="success">Yayında</Badge>;
  return <Badge variant="outline">Taslak</Badge>;
}
