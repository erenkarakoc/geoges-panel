"use client";

import { CheckCircle2Icon, FlagIcon, InboxIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import {
  approvalQueue,
  type RolePersona,
  type TodayCard,
} from "@/sandbox/navigation/navigation-prototype-data";

const toneClassName: Record<TodayCard["tone"], string> = {
  danger: "text-destructive-foreground",
  neutral: "text-foreground",
  success: "text-success-foreground",
  warning: "text-warning-foreground",
};

/** "Bugün" — composed per role (D-056). */
export function TodayScreen({ persona }: { persona: RolePersona }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium">{persona.todayTitle}</h1>
        <p className="text-sm text-muted-foreground">{persona.todayLead}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {persona.todayCards.map((card) => (
          <Card key={card.id}>
            <CardHeader>
              <CardTitle className="text-sm">{card.title}</CardTitle>
              {card.value ? (
                <p className={`font-mono text-lg tabular-nums ${toneClassName[card.tone]}`}>
                  {card.value}
                </p>
              ) : null}
              <CardDescription>{card.note}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{persona.todayNextStep}</p>
    </section>
  );
}

/**
 * Approval queue in queue mode: acting on a record pulls in the next one instead of returning
 * to a list. Demonstration only — the method itself is still open (OQ-027).
 */
export function ApprovalQueueScreen({ persona }: { persona: RolePersona }) {
  const [index, setIndex] = useState(0);
  // The badge and the queue must agree, so the role's count decides how long the queue is.
  const queue = approvalQueue.slice(0, persona.approvalCount);
  const item = queue[index];
  const remaining = queue.length - index;

  if (!item) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CheckCircle2Icon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Bugün temiz</EmptyTitle>
          <EmptyDescription>
            Kuyrukta bekleyen kayıt kalmadı. Boş ekran, biten işin göstergesidir.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium">Onay kuyruğu</h1>
          <p className="text-sm text-muted-foreground">
            Karar verdiğinizde sıradaki kayıt kendiliğinden gelir.
          </p>
        </div>
        <Badge variant="outline">
          {index + 1} / {queue.length}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{item.title}</CardTitle>
          <CardDescription>
            {item.site} · {item.person}
          </CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-2 px-6 pb-6">
          <Separator />
          <dl className="grid gap-2 py-2 sm:grid-cols-2">
            {item.summary.map((row) => (
              <div className="flex items-baseline gap-2" key={row.label}>
                <dt className="w-24 shrink-0 text-sm text-muted-foreground">{row.label}</dt>
                <dd className="flex items-center gap-1.5 text-sm">
                  {row.value}
                  {row.flagged ? (
                    <Badge size="sm" variant="warning">
                      <FlagIcon aria-hidden="true" />
                      kontrol
                    </Badge>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIndex(index + 1)}>Onayla</Button>
            <Button onClick={() => setIndex(index + 1)} variant="outline">
              Düzeltme iste
            </Button>
            <Button className="ms-auto" onClick={() => setIndex(index + 1)} variant="ghost">
              Sonraki
            </Button>
          </div>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">
        Kuyrukta {Math.max(remaining - 1, 0)} kayıt kaldı.
      </p>
    </section>
  );
}

export function TasksScreen({ persona }: { persona: RolePersona }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium">Görevler</h1>
        <p className="text-sm text-muted-foreground">
          Sisteme düşen ve size atanan işler (§25.4). Bildirimden gelindiğinde doğrudan işin içine
          düşülür.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: persona.taskCount }, (_, taskIndex) => (
          <Card key={taskIndex}>
            <CardHeader>
              <CardTitle className="text-sm">
                {taskIndex === 0
                  ? "Eksik zayi fotoğrafını tamamla"
                  : `Örnek görev ${taskIndex + 1}`}
              </CardTitle>
              <CardDescription>
                {taskIndex === 0 ? "Kavaklı Şantiyesi · bugün" : "Örnek veri"}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}

/** An open object: the toolbar grows a context row while this screen is shown. */
export function SiteScreen({ persona }: { persona: RolePersona }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-medium">Kavaklı Şantiyesi</h1>
        <p className="text-sm text-muted-foreground">
          Üst çubuktaki ikinci satır yalnız bu ekranda görünür: şantiyenin bölümleri ve gün şeridi.
          Modüller arası zıplamaya gerek kalmaz.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">15 Eylül günlük kaydı</CardTitle>
          <CardDescription>
            {persona.id === "site-engineer" || persona.id === "crew-lead"
              ? "Taslak — tamamlanınca tek eylemle onaya gider (§9.6)."
              : "Onay bekliyor — koordinatör kuyruğunda."}
          </CardDescription>
        </CardHeader>
      </Card>
      <p className="text-sm text-muted-foreground">
        Örnek veri; ekranın kendisi Phase 02&apos;de tasarlanacak.
      </p>
    </section>
  );
}

export function ModuleScreen({ label }: { label: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{label}</EmptyTitle>
        <EmptyDescription>
          Bu modüle ikinci bir menü sütunu açılmadan gelindi: raydaki grup ikonundan ya da ⌘K
          paletinden tek adımda.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
