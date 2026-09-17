"use client";

import { CheckCircle2Icon, FlagIcon } from "lucide-react";
import { useState } from "react";

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
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { toastManager } from "@/components/ui/toast";
import { sampleApprovals } from "@/modules/wfl/ui/sample-approvals";

/**
 * Approval centre (§4) in queue mode: one record fills the screen and a decision brings in the
 * next one, instead of sending the approver back to a list every time. The screen empties as
 * the work gets done, and an empty screen is the goal (D-070).
 *
 * The decisions are not recorded anywhere yet — WFL has no data — so each one says so and moves
 * on. Sample data, marked as such.
 */
export function ApprovalQueue() {
  const [index, setIndex] = useState(0);
  const record = sampleApprovals[index];

  const decide = (decision: string) => {
    toastManager.add({
      type: "info",
      title: "Bu işlem henüz hazır değil",
      description: `"${decision}" kararı, onay akışı geliştirildiğinde kaydedilecek.`,
    });
    setIndex(index + 1);
  };

  if (!record) {
    return (
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CheckCircle2Icon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle aria-level={2} role="heading">
            Bugün temiz
          </EmptyTitle>
          <EmptyDescription>
            Onayınızı bekleyen kayıt kalmadı. Boş ekran, biten işin göstergesidir.
          </EmptyDescription>
        </EmptyHeader>
        <Button className="mt-4" onClick={() => setIndex(0)} variant="outline">
          Kuyruğu baştan göster
        </Button>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Karar verdiğinizde sıradaki kayıt kendiliğinden gelir.
        </p>
        <Badge variant="outline">
          {index + 1} / {sampleApprovals.length}
        </Badge>
      </div>

      <Frame>
        <FrameHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <FrameTitle>{record.title}</FrameTitle>
            <Badge title="Gerçek veri bağlanana kadar örnek kayıtlar gösterilir" variant="outline">
              Örnek veri
            </Badge>
          </div>
          <FrameDescription>
            {record.site} · {record.person} · {record.submittedAt}
          </FrameDescription>
        </FrameHeader>
        <FramePanel>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {record.facts.map((fact) => (
              <div className="flex items-baseline gap-3" key={fact.label}>
                <dt className="w-28 shrink-0 text-sm text-muted-foreground">{fact.label}</dt>
                <dd className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
                  {fact.value}
                  {fact.flagged ? (
                    <Badge size="sm" variant="warning">
                      <FlagIcon aria-hidden="true" />
                      kontrol
                    </Badge>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </FramePanel>
        <FrameFooter className="flex flex-wrap gap-2">
          <Button onClick={() => decide("Onayla")}>Onayla</Button>
          <Button onClick={() => decide("Düzeltme iste")} variant="outline">
            Düzeltme iste
          </Button>
          <Button className="ms-auto" onClick={() => setIndex(index + 1)} variant="ghost">
            Sonraki
          </Button>
        </FrameFooter>
      </Frame>

      <p className="text-sm text-muted-foreground">
        Kuyrukta {Math.max(sampleApprovals.length - index - 1, 0)} kayıt kaldı.
      </p>
    </div>
  );
}
