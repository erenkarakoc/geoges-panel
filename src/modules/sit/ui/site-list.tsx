import { ChevronRightIcon, MapPinnedIcon } from "lucide-react";
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
import { WORK_MODEL_LABELS, type WorkModel } from "@/modules/sit/domain/site";

/**
 * Şantiyeler (SCR-026, TASK-0123 step 1): the sites the person may see, each opening its context
 * row. The indicators of REQ-SIT-001 — progress, the day's production, waiting approvals — arrive
 * with the site screen (TASK-0128); sites are opened from their project's card.
 */

type Row = {
  id: string;
  name: string;
  projectName: string;
  workModel: WorkModel;
  city: string | null;
  status: "active" | "passive";
};

export function SiteList({ sites }: { sites: readonly Row[] }) {
  if (sites.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPinnedIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle aria-level={1} role="heading">
            Görebileceğiniz şantiye yok
          </EmptyTitle>
          <EmptyDescription>
            Şantiyeler projenin kartından açılır; size atanan şantiyeler burada görünür.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/projects" />} variant="outline">
            Projelere git
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <Frame className="w-full max-w-3xl">
      <FrameHeader>
        <FrameTitle>Şantiyeler</FrameTitle>
        <FrameDescription>
          Bir şantiye açıldığında üst çubuğun altında bölümleri ve gün seçimi görünür.
        </FrameDescription>
      </FrameHeader>
      {sites.map((site) => (
        <FramePanel className="p-0" key={site.id}>
          <Link
            className="flex min-h-14 items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/50"
            href={`/sites/${site.id}`}
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium">{site.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {[site.projectName, WORK_MODEL_LABELS[site.workModel], site.city]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            {site.status === "passive" ? <Badge variant="secondary">Pasif</Badge> : null}
            <ChevronRightIcon aria-hidden="true" className="size-4 text-muted-foreground" />
          </Link>
        </FramePanel>
      ))}
    </Frame>
  );
}
