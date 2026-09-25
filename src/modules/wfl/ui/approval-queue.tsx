"use client";

import {
  CheckCircle2Icon,
  CornerUpLeftIcon,
  InfoIcon,
  ThumbsUpIcon,
  XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { whyDelegated, whyMine } from "@/modules/wfl/domain/why-mine";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * The approval centre (SCR-012, REQ-WFL-012…016, TASK-0120, D-285).
 *
 * One record fills the screen and a decision opens the next without going back to a list (D-070):
 * deciding is the work, and scrolling a list between decisions is not. Every approval says why it is
 * with this person — the rule the flow used, in that person's own words (REQ-WFL-013) — and a
 * refusal or a send-back cannot be finished without a reason, which the database also refuses
 * (REQ-WFL-015), so the screen only says it earlier.
 */

export type QueueApproval = {
  id: string;
  title: string;
  createdAt: number;
  ownerRule: unknown;
  ownerUserId: string | null;
  delegated: boolean;
  flowName: string | null;
  flowVersion: number | null;
  /** Where the record lives, when the flow is about one and its own screen exists. */
  recordPath: string | null;
  recordLabel: string | null;
  returnedBefore: number;
  lastReturnReason: string | null;
};

export type QueueNames = {
  roles: Record<string, string>;
  permissions: Record<string, string>;
  relations: Record<string, string>;
  people: Record<string, string>;
};

type Decision = "approve" | "reject" | "return";

export type DecideAction = (input: {
  approvalId: string;
  decision: Decision;
  reason?: string;
}) => Promise<{ error: string | null; decided: boolean }>;

const day = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });

const ASKING: Record<Exclude<Decision, "approve">, { title: string; hint: string }> = {
  reject: {
    hint: "Ret gerekçesi kaydın geçmişinde kalır ve ilgililere bildirilir.",
    title: "Neden reddediyorsunuz?",
  },
  return: {
    hint: "Kaydı açan kişi bu cümleyi görür; neyi düzeltmesi gerektiğini açıkça yazın.",
    title: "Neyin düzeltilmesi gerekiyor?",
  },
};

export function ApprovalQueue({
  approvals,
  names,
  decide,
}: {
  approvals: readonly QueueApproval[];
  names: QueueNames;
  decide: DecideAction;
}) {
  /**
   * What has been answered on this screen already. The queue itself stays the server's list — a
   * decision elsewhere, by somebody else in the group or by the same person on their phone, arrives
   * as a fresh list — and these are the ones this screen has just dealt with.
   */
  const [answered, setAnswered] = useState<readonly string[]>([]);
  const [asking, setAsking] = useState<Exclude<Decision, "approve"> | null>(null);
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<{ error: string | null; decided: boolean } | null>(null);
  const [deciding, start] = useTransition();

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const book = useMemo(
    () => ({
      people: new Map(Object.entries(names.people)),
      permissions: new Map(Object.entries(names.permissions)),
      relations: new Map(Object.entries(names.relations)),
      roles: new Map(Object.entries(names.roles)),
    }),
    [names],
  );

  const queue = useMemo(
    () => approvals.filter((one) => !answered.includes(one.id)),
    [answered, approvals],
  );
  const current = queue[0] ?? null;

  const answer = (decision: Decision, why?: string) => {
    if (!current) return;
    start(async () => {
      const said = await decide({ approvalId: current.id, decision, reason: why });
      setResult(said);
      if (said.decided) {
        // The next one opens here, not after a trip through a list (D-070).
        setAnswered((rest) => [...rest, current.id]);
        setAsking(null);
        setReason("");
      }
    });
  };

  if (!current) {
    return (
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CheckCircle2Icon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle aria-level={2} role="heading">
            Bugün temiz
          </EmptyTitle>
          <EmptyDescription>Onayınızı bekleyen kayıt yok.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{current.title}</CardTitle>
            {current.delegated ? <Badge variant="info">Vekâleten</Badge> : null}
            {current.returnedBefore > 0 ? (
              <Badge variant="warning">{current.returnedBefore} kez düzeltmeye döndü</Badge>
            ) : null}
          </div>
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {current.delegated
              ? whyDelegated(current.ownerUserId, book)
              : whyMine(current.ownerRule, book)}
          </p>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex flex-col">
              <dt className="text-xs text-muted-foreground">Akış</dt>
              <dd>
                {current.flowName ?? "—"}
                {current.flowVersion ? ` · ${current.flowVersion}. sürüm` : ""}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs text-muted-foreground">Bekliyor</dt>
              <dd>{day.format(current.createdAt)}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs text-muted-foreground">Kayıt</dt>
              <dd>
                {current.recordPath ? (
                  <Link className="underline-offset-4 hover:underline" href={current.recordPath}>
                    {current.recordLabel ?? "Kaydı aç"}
                  </Link>
                ) : (
                  (current.recordLabel ?? "Bu akış bir kayıt üzerinde değil")
                )}
              </dd>
            </div>
          </dl>

          {current.lastReturnReason ? (
            <p className="rounded-md border border-warning/40 bg-warning/8 p-3 text-sm">
              Son düzeltme isteği: {current.lastReturnReason}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button disabled={deciding} onClick={() => answer("approve")}>
          <ThumbsUpIcon />
          Onayla
        </Button>
        <Button disabled={deciding} onClick={() => setAsking("return")} variant="outline">
          <CornerUpLeftIcon />
          Düzeltmeye gönder
        </Button>
        <Button
          disabled={deciding}
          onClick={() => setAsking("reject")}
          variant="destructive-outline"
        >
          <XCircleIcon />
          Reddet
        </Button>
        {queue.length > 1 ? (
          <span className="ms-auto self-center text-sm text-muted-foreground">
            Sırada {queue.length - 1} kayıt daha var
          </span>
        ) : null}
      </div>

      <Dialog onOpenChange={(open) => (open ? undefined : setAsking(null))} open={Boolean(asking)}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>{asking ? ASKING[asking].title : ""}</DialogTitle>
            <DialogDescription>{asking ? ASKING[asking].hint : ""}</DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-2">
            <Field>
              <FieldLabel htmlFor="decision-reason">Gerekçe</FieldLabel>
              <Textarea
                autoFocus
                id="decision-reason"
                maxLength={2000}
                onChange={(event) => setReason(event.currentTarget.value)}
                rows={4}
                value={reason}
              />
              <FieldDescription>Gerekçe yazılmadan bu işlem tamamlanamaz.</FieldDescription>
            </Field>
          </div>
          <DialogFooter>
            <Button onClick={() => setAsking(null)} variant="ghost">
              Vazgeç
            </Button>
            <Button
              disabled={reason.trim().length < 3}
              loading={deciding}
              onClick={() => (asking ? answer(asking, reason) : undefined)}
              variant={asking === "reject" ? "destructive" : "default"}
            >
              {asking === "reject" ? "Reddet" : "Düzeltmeye gönder"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
