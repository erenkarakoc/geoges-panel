"use client";

import { FileDiffIcon } from "lucide-react";
import { useActionState, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
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
import { Textarea } from "@/components/ui/textarea";
import type { RevisionRequest } from "@/modules/aud/data/revision-store";
import { REVISION_STATUS_LABELS, showValue } from "@/modules/aud/domain/revisions";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * SCR-192 "Revizyon talepleri" (REQ-AUD-007…010, D-265): what somebody asks to change on a
 * locked record, with the old and the new value side by side. The approver decides here; a
 * refusal asks for its reason in a dialog, because a refusal without one is refused (AUD-K4).
 * The requester sees their own requests and what became of them.
 */

export type RevisionFormState = { error: string | null; done: string | null };

export const initialRevisionFormState: RevisionFormState = { error: null, done: null };

export type DecideAction = (
  previous: RevisionFormState,
  formData: FormData,
) => Promise<RevisionFormState>;

const when = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "medium",
  timeStyle: "short",
});

const STATUS_BADGE: Record<string, "outline" | "secondary" | "success" | "error" | "warning"> = {
  pending: "warning",
  approved: "success",
  rejected: "error",
  stale: "outline",
};

export function RevisionRequests({
  requests,
  decide,
}: {
  requests: readonly RevisionRequest[];
  decide: DecideAction;
}) {
  return (
    <Frame className="w-full">
      <FrameHeader>
        <FrameTitle>Revizyon talepleri</FrameTitle>
        <FrameDescription>
          Kilitli kayıtlarda istenen değişiklikler. Eski ve yeni değer yan yana durur; karar kaydın
          geçmişine ve denetim kaydına yazılır.
        </FrameDescription>
      </FrameHeader>

      <FramePanel className="flex flex-col gap-4">
        {requests.length === 0 ? (
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileDiffIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle aria-level={2} role="heading">
                Bekleyen revizyon talebi yok
              </EmptyTitle>
              <EmptyDescription>
                Kilitli bir kayıtta değişiklik istendiğinde burada görünür.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          requests.map((request) => (
            <RequestCard decide={decide} key={request.id} request={request} />
          ))
        )}
      </FramePanel>
    </Frame>
  );
}

function RequestCard({ request, decide }: { request: RevisionRequest; decide: DecideAction }) {
  const [state, formAction, pending] = useActionState(decide, initialRevisionFormState);
  const [refusing, setRefusing] = useState(false);

  useActionToast(
    state,
    state.error
      ? { type: "error", title: state.error }
      : state.done
        ? { type: "success", title: state.done }
        : null,
  );

  return (
    <article className="flex flex-col gap-3 rounded-lg border p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-medium">{request.label}</h3>
          <p className="text-sm text-muted-foreground">
            {request.requestedByName} · {when.format(request.createdAt)}
          </p>
        </div>
        <Badge variant={STATUS_BADGE[request.status] ?? "outline"}>
          {REVISION_STATUS_LABELS[request.status]}
        </Badge>
      </header>

      <p className="text-sm">
        <span className="text-muted-foreground">Gerekçe: </span>
        {request.reason}
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alan</TableHead>
            <TableHead>Şimdiki değer</TableHead>
            <TableHead>İstenen değer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {request.changes.map((change) => (
            <TableRow key={change.field}>
              <TableCell>{change.label ?? change.field}</TableCell>
              <TableCell className="text-muted-foreground">{showValue(change.old)}</TableCell>
              <TableCell className="font-medium">{showValue(change.new)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {request.status !== "pending" ? (
        <p className="text-sm text-muted-foreground">
          {request.decidedByName ? `${request.decidedByName} karar verdi` : "Karar verildi"}
          {request.decidedAt ? ` · ${when.format(request.decidedAt)}` : ""}
          {request.decisionReason ? ` · ${request.decisionReason}` : ""}
          {request.applyNote ? ` · ${request.applyNote}` : ""}
        </p>
      ) : null}

      {request.status === "pending" && request.canDecide ? (
        <div className="flex flex-wrap items-center gap-2">
          <Form action={formAction}>
            <input name="id" type="hidden" value={request.id} />
            <input name="approve" type="hidden" value="1" />
            <Button loading={pending} type="submit">
              Onayla ve uygula
            </Button>
          </Form>

          <Dialog onOpenChange={setRefusing} open={refusing}>
            <Button onClick={() => setRefusing(true)} variant="outline">
              Reddet
            </Button>
            <DialogPopup>
              <DialogHeader>
                <DialogTitle>Talep reddedilsin mi?</DialogTitle>
                <DialogDescription>
                  Reddetme gerekçesi talep edene bildirilir ve kaydın geçmişinde durur.
                </DialogDescription>
              </DialogHeader>
              <Form action={formAction} className="flex flex-col gap-4">
                <input name="id" type="hidden" value={request.id} />
                <input name="approve" type="hidden" value="0" />
                <Field>
                  <FieldLabel htmlFor={`reason-${request.id}`}>Gerekçe</FieldLabel>
                  <Textarea
                    id={`reason-${request.id}`}
                    name="reason"
                    placeholder="Neden reddedildiğini yazın."
                    required
                    rows={3}
                  />
                </Field>
                <DialogFooter>
                  <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
                  <Button loading={pending} type="submit" variant="destructive">
                    Reddet
                  </Button>
                </DialogFooter>
              </Form>
            </DialogPopup>
          </Dialog>
        </div>
      ) : null}
    </article>
  );
}
