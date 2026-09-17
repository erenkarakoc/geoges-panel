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
import { sampleSites } from "@/modules/sit/ui/site-context";

/** Şantiyeler page until the SIT module exists: sample sites that open the context row. */
export function SampleSiteList() {
  return (
    <Frame className="w-full max-w-2xl">
      <FrameHeader>
        <div className="flex items-center justify-between gap-2">
          <FrameTitle>Şantiyeler</FrameTitle>
          <Badge variant="outline">Örnek veri</Badge>
        </div>
        <FrameDescription>
          Bir şantiye açıldığında üst çubuğun altında bölümleri ve gün seçimi görünür.
        </FrameDescription>
      </FrameHeader>
      {sampleSites.map((site) => (
        <FramePanel className="p-0" key={site.id}>
          <Link
            className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-accent/50"
            href={`/sites/${site.id}`}
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium">{site.name}</span>
              <span className="truncate text-xs text-muted-foreground">{site.note}</span>
            </span>
            <ChevronRightIcon aria-hidden="true" className="size-4 text-muted-foreground" />
          </Link>
        </FramePanel>
      ))}
    </Frame>
  );
}
