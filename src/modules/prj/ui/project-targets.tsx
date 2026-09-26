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
import { BarList, ShareBar } from "@/platform/ui/chart/chart";
import { REST, SERIES } from "@/platform/ui/chart/colors";
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

  // How far the walls have got (D-297): one hue, darker as a wall moves on, the rest quiet.
  const byStatus = (status: WallStatus) =>
    current.walls.filter((wall) => wall.status === status).length;
  const wallParts = [
    { color: SERIES[0], key: "completed", label: "Tamamlandı", value: byStatus("completed") },
    {
      color: `color-mix(in srgb, ${SERIES[0]} 45%, transparent)`,
      key: "in_progress",
      label: "Devam ediyor",
      value: byStatus("in_progress"),
    },
    { color: REST, key: "not_started", label: "Başlamadı", value: byStatus("not_started") },
  ];
  const panelRows = [...totals.entries()]
    .filter(([key]) => key.startsWith("p:"))
    .map(([key, total]) => ({
      key,
      label: total.label,
      valueText: [targetAmount(total.line, total.amount, names)],
      values: [total.amount],
    }))
    .sort((a, b) => b.values[0] - a.values[0]);
  const stripRows = [...totals.entries()]
    .filter(([key]) => key.startsWith("s:"))
    .map(([key, total]) => ({
      key,
      label: total.label,
      valueText: [`${number.format(total.amount)} m`],
      values: [total.amount],
    }))
    .sort((a, b) => b.values[0] - a.values[0]);

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
        {current.walls.length > 0 ? (
          <FramePanel>
            <h3 className="mb-2 text-sm font-medium">
              Duvarlar: {byStatus("completed")} / {current.walls.length} tamamlandı
            </h3>
            <ShareBar label="Duvarların durumu" parts={wallParts} unit="duvar" />
          </FramePanel>
        ) : null}
        {totals.size === 0 ? (
          <FramePanel>
            <p className="text-sm text-muted-foreground">Bu revizyonda hedef satırı yok.</p>
          </FramePanel>
        ) : null}
        {panelRows.length > 0 ? (
          <FramePanel>
            <h3 className="mb-3 text-sm font-medium">Panel hedefi, tipe göre</h3>
            <BarList label="Panel hedefi, tipe göre (adet)" rows={panelRows} />
          </FramePanel>
        ) : null}
        {stripRows.length > 0 ? (
          <FramePanel>
            <h3 className="mb-3 text-sm font-medium">Şerit hedefi, tipe göre</h3>
            <BarList label="Şerit hedefi, tipe göre (metre)" rows={stripRows} />
          </FramePanel>
        ) : null}
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
