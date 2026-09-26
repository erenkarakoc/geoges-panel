import Link from "next/link";
import { ArchiveIcon, ArrowLeftIcon, WorkflowIcon } from "lucide-react";

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
  behind = [],
  archive = false,
  archivedCount = 0,
}: {
  flows: readonly FlowSummary[];
  create: (name: string) => Promise<{ error: string | null; key: string | null }>;
  /** Copies whose template has moved on; they are told, never changed (REQ-WFL-027). */
  behind?: readonly string[];
  /** Whether this is the archive: flows removed after they had run (D-293). */
  archive?: boolean;
  /** How many flows are in the archive, for the way into it. */
  archivedCount?: number;
}) {
  if (archive && !flows.length) {
    return (
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ArchiveIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle aria-level={2} role="heading">
            Arşiv boş
          </EmptyTitle>
          <EmptyDescription>
            Çalışmış bir akış kaldırıldığında buraya gelir; geçmişiyle birlikte saklanır ve geri
            getirilebilir.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/admin/workflows" />} variant="outline">
            <ArrowLeftIcon aria-hidden="true" />
            Akışlara dön
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

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
          {archivedCount ? <ArchiveLink count={archivedCount} /> : null}
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <Frame className="w-full">
      <FrameHeader className="flex-row items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <FrameTitle>{archive ? "Arşivdeki akışlar" : "Akışlar"}</FrameTitle>
          <FrameDescription>
            {archive
              ? 'Çalıştıktan sonra kaldırılan akışlar. Onay kararları, görevleri ve çalışma günlüğü saklanır; bir akışı açıp "Arşivden geri getir" ile listeye döndürebilirsiniz.'
              : "Şirketin süreçleri. Bir akışı açmak tasarımcıyı açar; yayımlanmış bir sürüm düzenlenmez, düzenlemeye başlamak yeni bir taslak açar."}
          </FrameDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {archive ? (
            <Button render={<Link href="/admin/workflows" />} variant="outline">
              <ArrowLeftIcon aria-hidden="true" />
              Akışlara dön
            </Button>
          ) : (
            <>
              {archivedCount ? <ArchiveLink count={archivedCount} /> : null}
              <NewFlowButton create={create} />
            </>
          )}
        </div>
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
                  {behind.includes(flow.key) ? (
                    <Badge variant="info">Şablonun yeni sürümü var</Badge>
                  ) : null}
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
                  <span className="flex flex-wrap items-center gap-1.5">
                    <FlowState flow={flow} />
                    {behind.includes(flow.key) ? (
                      <Badge variant="info">Şablonun yeni sürümü var</Badge>
                    ) : null}
                  </span>
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

/** The way into the archive; shown only when something is in it. */
function ArchiveLink({ count }: { count: number }) {
  return (
    <Button render={<Link href="/admin/workflows?arsiv=1" />} variant="ghost">
      <ArchiveIcon aria-hidden="true" />
      Arşiv ({count})
    </Button>
  );
}

/** Published, draft, both, turned off or archived — what a flow is right now. */
function FlowState({ flow }: { flow: FlowSummary }) {
  if (flow.archivedAt) return <Badge variant="secondary">Arşivde</Badge>;
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
