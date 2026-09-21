import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { type TodayWork, type TodayWorkTone, todayWorkBySeat } from "@/modules/rpt/ui/today-work";
import { type AccessPolicy, filterByPermission } from "@/platform/access/access-policy";
import type { PreviewRole } from "@/platform/access/preview-roles";
import { type Indicator, indicatorRegistry } from "@/platform/today/indicator-registry";
import { formatDayLong, todayIn } from "@/platform/date/day";
import { Figure } from "@/platform/ui/format/figure";

const toneDotClassName: Record<TodayWorkTone, string> = {
  danger: "bg-destructive",
  neutral: "bg-muted-foreground",
  warning: "bg-warning",
};

function SampleBadge() {
  return (
    <Badge title="Gerçek veri bağlanana kadar örnek değerler gösterilir" variant="outline">
      Örnek veri
    </Badge>
  );
}

/** The seat's work for today: rows that each reach their own source (§3.3). */
function WorkBlock({ work }: { work: TodayWork }) {
  return (
    <section aria-label={work.title} className="min-w-0">
      <Frame className="h-full">
        <FrameHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <FrameTitle>{work.title}</FrameTitle>
            {/* Only sample rows are sample data; an empty block has nothing to label (D-106). */}
            {work.rows.length > 0 ? <SampleBadge /> : null}
          </div>
          <FrameDescription>{work.lead}</FrameDescription>
        </FrameHeader>
        {work.rows.length > 0 ? (
          work.rows.map((row) => (
            <FramePanel className="p-0" key={row.id}>
              <Link
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/50"
                href={row.href}
              >
                <span
                  aria-hidden="true"
                  className={`size-2 shrink-0 rounded-full ${toneDotClassName[row.tone]}`}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium">{row.title}</span>
                  <span className="text-xs text-muted-foreground">{row.note}</span>
                </span>
                <ChevronRightIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </Link>
            </FramePanel>
          ))
        ) : (
          <FramePanel>
            <p className="text-sm text-muted-foreground">{work.emptyText}</p>
          </FramePanel>
        )}
        <FrameFooter>
          <Button render={<Link href={work.action.href} />} size="sm" variant="outline">
            {work.action.label}
          </Button>
        </FrameFooter>
      </Frame>
    </section>
  );
}

function IndicatorGrid({ indicators }: { indicators: readonly Indicator[] }) {
  return (
    // Two columns, because this grid lives in half the screen next to the work block; a third
    // column only fits once the window is very wide.
    <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
      {indicators.map((indicator) => (
        <li key={indicator.id}>
          <Frame className="h-full">
            {/* The card stretches to the tallest in its row; the panel has to follow, or a
                short figure leaves a gap under its own surface. */}
            <FramePanel className="flex flex-1 flex-col gap-1 p-4">
              <span className="text-xs text-muted-foreground">{indicator.title}</span>
              <Figure
                className="text-lg"
                unit={indicator.sampleUnit}
                value={indicator.sampleValue ?? "—"}
              />
            </FramePanel>
          </Frame>
        </li>
      ))}
    </ul>
  );
}

/**
 * "Bugün" — every role's entry screen (D-056). Work first, figures second (D-065): the seat's
 * block and the indicators it may see share the width, and the remaining indicators wait behind
 * a fold. Charts and the site summary were taken off this screen (owner 2026-09-17).
 * The page name is the header's `h1`, so the body starts with the date instead of a heading.
 */
export function TodayOverview({ access, seat }: { access: AccessPolicy; seat: PreviewRole }) {
  const work = todayWorkBySeat[seat.id];
  const indicators = filterByPermission(indicatorRegistry, access);
  const criticalIndicators = indicators.filter((indicator) => indicator.critical);
  const otherIndicators = indicators.filter((indicator) => !indicator.critical);
  const today = todayIn();

  return (
    <>
      <p className="text-sm text-muted-foreground">
        <time dateTime={today}>{formatDayLong(today)}</time>
      </p>

      {/* Work and figures share the width from `lg` up, half and half (owner 2026-09-17). */}
      <div className="grid gap-4 lg:grid-cols-2">
        <WorkBlock work={work} />

        {criticalIndicators.length > 0 ? (
          <section aria-label="Kilit göstergeler" className="flex min-w-0 flex-col gap-3">
            <IndicatorGrid indicators={criticalIndicators} />
            {otherIndicators.length > 0 ? (
              <Collapsible>
                <CollapsibleTrigger
                  render={
                    <Button className="self-start" size="sm" variant="ghost">
                      <ChevronDownIcon
                        aria-hidden="true"
                        className="transition-transform in-data-[panel-open]:rotate-180"
                      />
                      {`Tüm göstergeler (${otherIndicators.length})`}
                    </Button>
                  }
                />
                <CollapsiblePanel className="pt-3">
                  <IndicatorGrid indicators={otherIndicators} />
                </CollapsiblePanel>
              </Collapsible>
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  );
}
