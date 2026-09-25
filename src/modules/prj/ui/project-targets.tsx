"use client";

import { BrickWallIcon, MoreHorizontalIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import type { RevisionWall, WallStatus, WallTarget } from "@/modules/prj/data/revision-store";
import { WALL_STATUS_LABELS, WALL_STATUSES } from "@/modules/prj/domain/revision";
import { targetAmount, targetSubject, type TargetNames } from "@/modules/prj/ui/target-text";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * Duvarlar ve hedefler (SCR-023, TASK-0123 step 2): what the revision valid today says. The
 * project's target is the sum of its walls (PRJ-K2) — shown, never typed; changing it is a new
 * revision (D-136).
 */

type Result = { error: string | null };

const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 3 });
const day = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" });

export function ProjectTargets({
  current,
  names,
  siteNames,
  canMark,
  markWall,
}: {
  current: {
    revision: { revisionNo: number; validFrom: string | null };
    walls: readonly RevisionWall[];
    targets: readonly WallTarget[];
  } | null;
  names: TargetNames;
  siteNames: Readonly<Record<string, string>>;
  canMark: boolean;
  markWall: (wallId: string, status: WallStatus) => Promise<Result>;
}) {
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);
  const [, start] = useTransition();
  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  if (!current) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BrickWallIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle aria-level={2} role="heading">
            Onaylı hedef yok
          </EmptyTitle>
          <EmptyDescription>
            Duvarlar ve hedefler ilk revizyonla (Rev.0) girilir; onaylanınca burada görünür.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  // The project total, per panel type and per strip type: the sum of the walls (PRJ-K2).
  const totals = new Map<string, { label: string; amount: number; line: WallTarget }>();
  for (const target of current.targets) {
    if (target.kind === "work_item") continue;
    const key = target.kind === "panel" ? `p:${target.panelTypeId}` : `s:${target.stripTypeId}`;
    const amount = (target.kind === "panel" ? target.qty : target.lengthM) ?? 0;
    const label =
      target.kind === "panel"
        ? targetSubject(target, names)
        : (names.strip[target.stripTypeId ?? ""] ?? "Tanımsız şerit tipi");
    const was = totals.get(key);
    totals.set(key, { amount: (was?.amount ?? 0) + amount, label, line: target });
  }

  const mark = (wallId: string, status: WallStatus) =>
    start(async () => {
      const said = await markWall(wallId, status);
      setResult(said);
      if (!said.error) router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <Frame>
        <FrameHeader>
          <FrameTitle>Proje hedefi</FrameTitle>
          <FrameDescription>
            Rev.{current.revision.revisionNo}
            {current.revision.validFrom
              ? `, ${day.format(new Date(`${current.revision.validFrom}T12:00:00`))} tarihinden geçerli`
              : ""}
            . Duvarların toplamıdır; değişiklik yeni revizyonla yapılır.
          </FrameDescription>
        </FrameHeader>
        <FramePanel>
          {totals.size === 0 ? (
            <p className="text-sm text-muted-foreground">Bu revizyonda hedef satırı yok.</p>
          ) : (
            <ul className="divide-y">
              {[...totals.values()].map((total) => (
                <li className="flex justify-between gap-3 py-2 text-sm" key={total.label}>
                  <span>{total.label}</span>
                  <span className="shrink-0 tabular-nums">
                    {total.line.kind === "panel"
                      ? targetAmount(total.line, total.amount, names)
                      : `${number.format(total.amount)} m`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </FramePanel>
      </Frame>

      {current.walls.map((wall) => {
        const lines = current.targets.filter((target) => target.wallId === wall.wallId);
        return (
          <Frame key={wall.wallId}>
            <FrameHeader className="flex-row items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <FrameTitle>
                  {wall.code} · {wall.name}
                </FrameTitle>
                <FrameDescription>
                  {[
                    siteNames[wall.siteId],
                    wall.lengthM ? `${number.format(wall.lengthM)} m uzunluk` : null,
                    wall.heightM ? `${number.format(wall.heightM)} m yükseklik` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </FrameDescription>
                <Badge
                  className="self-start"
                  variant={wall.status === "completed" ? "success" : "outline"}
                >
                  {WALL_STATUS_LABELS[wall.status]}
                </Badge>
              </div>
              {canMark ? (
                <Menu>
                  <MenuTrigger
                    render={
                      <Button
                        aria-label="Duvar durumu"
                        className="max-md:size-11"
                        size="icon-sm"
                        variant="ghost"
                      />
                    }
                  >
                    <MoreHorizontalIcon aria-hidden="true" />
                  </MenuTrigger>
                  <MenuPopup align="end">
                    {WALL_STATUSES.filter((status) => status !== wall.status).map((status) => (
                      <MenuItem key={status} onClick={() => mark(wall.wallId, status)}>
                        {WALL_STATUS_LABELS[status]} olarak işaretle
                      </MenuItem>
                    ))}
                  </MenuPopup>
                </Menu>
              ) : null}
            </FrameHeader>
            <FramePanel>
              {lines.length === 0 ? (
                <p className="text-sm text-muted-foreground">Bu duvarın hedefi yok.</p>
              ) : (
                <ul className="divide-y">
                  {lines.map((line) => (
                    <li className="flex justify-between gap-3 py-2 text-sm" key={line.id}>
                      <span className="min-w-0">{targetSubject(line, names)}</span>
                      <span className="shrink-0 tabular-nums">
                        {targetAmount(line, line.kind === "strip" ? line.lengthM : line.qty, names)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </FramePanel>
          </Frame>
        );
      })}
    </div>
  );
}
