import { MapPinnedIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { SiteRoute } from "@/modules/sit/ui/site-context";
import { formatDayLong } from "@/platform/date/day";

/** Body of a sample site section until the SIT module is built. */
export function SiteSectionPlaceholder({ route }: { route: SiteRoute }) {
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MapPinnedIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle aria-level={1} role="heading">
          {route.site.name} · {route.section.label}
        </EmptyTitle>
        <EmptyDescription>
          {formatDayLong(route.day)}. {route.site.note}.
        </EmptyDescription>
        <div className="mt-4 flex gap-2">
          <Badge variant="outline">Örnek veri</Badge>
          <Badge variant="outline">Henüz geliştirilmedi</Badge>
        </div>
      </EmptyHeader>
    </Empty>
  );
}
