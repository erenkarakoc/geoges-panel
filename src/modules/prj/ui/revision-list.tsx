"use client";

import { FileStackIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import type { Revision } from "@/modules/prj/data/revision-store";
import { REVISION_STATUS_LABELS } from "@/modules/prj/domain/revision";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * Revizyonlar (SCR-023 → SCR-024, TASK-0123 step 2): the project's revisions, newest first. A new
 * one starts as a copy of the last approved revision; one is open at a time (D-136, D-292).
 */

type Result = { error: string | null; id?: string | null };

const day = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" });

export function RevisionList({
  projectId,
  revisions,
  canEdit,
  open,
}: {
  projectId: string;
  revisions: readonly Revision[];
  canEdit: boolean;
  open: (reason: string) => Promise<Result>;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const openOne = revisions.find((one) => one.status !== "approved");
  const first = revisions.length === 0;
  const href = (revisionId: string) => `/projects/${projectId}/revisions/${revisionId}`;

  const submit = () =>
    start(async () => {
      const said = await open(reason);
      setResult(said);
      if (!said.error && said.id) {
        setAdding(false);
        router.push(href(said.id));
      }
    });

  const addButton =
    canEdit && !openOne ? (
      <Button className="max-md:h-11" onClick={() => setAdding(true)} size="sm">
        <PlusIcon aria-hidden="true" />
        {first ? "İlk revizyonu aç" : "Yeni revizyon aç"}
      </Button>
    ) : null;

  return (
    <>
      {first ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileStackIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle aria-level={2} role="heading">
              Revizyon yok
            </EmptyTitle>
            <EmptyDescription>
              Duvarlar ve hedefler revizyonla girilir; onaylanan revizyon onay gününden geçerli
              olur.
            </EmptyDescription>
          </EmptyHeader>
          {addButton ? <EmptyContent>{addButton}</EmptyContent> : null}
        </Empty>
      ) : (
        <Frame>
          <FrameHeader className="flex-row items-center justify-between gap-3">
            <FrameTitle>Revizyonlar</FrameTitle>
            {addButton}
          </FrameHeader>
          <FramePanel>
            <ul className="divide-y">
              {revisions.map((revision) => (
                <li key={revision.id}>
                  <Link
                    className="flex min-h-14 flex-col gap-1 py-3 hover:underline"
                    href={href(revision.id)}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      Rev.{revision.revisionNo}
                      <Badge variant={revision.status === "approved" ? "success" : "outline"}>
                        {REVISION_STATUS_LABELS[revision.status]}
                      </Badge>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {revision.reason}
                      {revision.validFrom
                        ? ` · ${day.format(new Date(`${revision.validFrom}T12:00:00`))} tarihinden geçerli`
                        : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </FramePanel>
        </Frame>
      )}

      <Dialog onOpenChange={setAdding} open={adding}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>{first ? "İlk revizyonu aç" : "Yeni revizyon aç"}</DialogTitle>
            <DialogDescription>
              {first
                ? "Rev.0 projenin ilk hedefleridir; duvarları ve hedefleri bu taslağa girersiniz."
                : "Taslak, geçerli revizyonun duvarları ve hedefleriyle başlar; değişiklikleri üzerine yaparsınız."}
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <Field>
              <FieldLabel htmlFor="revision-reason">Neden</FieldLabel>
              <Input
                id="revision-reason"
                onChange={(event) => setReason(event.currentTarget.value)}
                placeholder={first ? "İlk proje hedefleri" : "Kurum onayı sonrası statik revizyon"}
                value={reason}
              />
              <FieldDescription>Revizyon geçmişinde ve onay kuyruğunda görünür.</FieldDescription>
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button disabled={reason.trim().length < 3} loading={pending} onClick={submit}>
              Aç
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
