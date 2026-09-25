"use client";

import { CopyIcon, HistoryIcon, MoreHorizontalIcon, PowerOffIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * The designer header's "…" (ADMINISTRATION section 3): a copy to work on, closing the flow, and
 * the versions it has had.
 *
 * Closing is not deleting and the wording says so: nothing new starts, what is already running
 * finishes where it is (REQ-WFL-024). The reason is asked for, because a flow somebody turned off
 * without saying why is the sort of thing people argue about a year later.
 */

export type FlowVersionRow = { version: number; status: string; publishedAt: number | null };

export type FlowMenuActions = {
  copy: (flowKey: string) => Promise<{ error: string | null; key: string | null }>;
  close: (input: { key: string; reason: string }) => Promise<{
    error: string | null;
    closed: boolean;
  }>;
  versions: (flowKey: string) => Promise<FlowVersionRow[]>;
};

const STATUS: Record<string, string> = {
  draft: "taslak",
  published: "yayında",
  superseded: "geçmiş",
};

const day = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });

export function FlowMenu({ flowKey, actions }: { flowKey: string; actions: FlowMenuActions }) {
  const router = useRouter();
  const [history, setHistory] = useState<FlowVersionRow[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [closing, setClosing] = useState(false);
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<{ error: string | null } | null>(null);
  const [pending, start] = useTransition();

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const copy = () => {
    start(async () => {
      const answer = await actions.copy(flowKey);
      setResult(answer);
      if (answer.key) router.push(`/admin/workflows/${answer.key}`);
    });
  };

  const openHistory = () => {
    setShowHistory(true);
    setHistory(null);
    start(async () => setHistory(await actions.versions(flowKey)));
  };

  const close = () => {
    start(async () => {
      const answer = await actions.close({ key: flowKey, reason });
      setResult(answer);
      if (answer.closed) {
        setClosing(false);
        setReason("");
        router.refresh();
      }
    });
  };

  return (
    <>
      <Menu>
        <MenuTrigger render={<Button aria-label="Akış işlemleri" size="icon" variant="outline" />}>
          <MoreHorizontalIcon aria-hidden="true" />
        </MenuTrigger>
        <MenuPopup align="end">
          <MenuItem disabled={pending} onClick={copy}>
            <CopyIcon aria-hidden="true" />
            Kopyasını çıkar
          </MenuItem>
          <MenuItem onClick={openHistory}>
            <HistoryIcon aria-hidden="true" />
            Sürüm geçmişi
          </MenuItem>
          <MenuItem onClick={() => setClosing(true)}>
            <PowerOffIcon aria-hidden="true" />
            Akışı kapat
          </MenuItem>
        </MenuPopup>
      </Menu>

      <Dialog onOpenChange={setShowHistory} open={showHistory}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Sürüm geçmişi</DialogTitle>
            <DialogDescription>
              Yürüyen bir çalışma başladığı sürümle devam eder; bu yüzden geçmiş sürümler silinmez.
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-4">
            {history === null ? (
              <p className="text-sm text-muted-foreground">Geçmiş okunuyor…</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz bir sürüm yok.</p>
            ) : (
              <ScrollArea className="max-h-72 rounded-md border">
                <ul className="divide-y">
                  {history.map((row) => (
                    <li
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                      key={row.version}
                    >
                      <span className="tabular-nums">{row.version}. sürüm</span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        {row.publishedAt ? day.format(row.publishedAt) : "yayımlanmadı"}
                        <Badge variant={row.status === "published" ? "success" : "outline"}>
                          {STATUS[row.status] ?? row.status}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>
        </DialogPopup>
      </Dialog>

      <AlertDialog onOpenChange={setClosing} open={closing}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu akış kapatılsın mı?</AlertDialogTitle>
            <AlertDialogDescription>
              Kapatılan akış yeni bir şey başlatmaz; yürüyen çalışmalar bulundukları yerden devam
              eder. Sebep denetim kaydına yazılır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-4 pb-2">
            <Field>
              <FieldLabel htmlFor="close-reason">Neden kapatılıyor?</FieldLabel>
              <Input
                id="close-reason"
                onChange={(event) => setReason(event.currentTarget.value)}
                placeholder="Yerine yeni akış geldi"
                value={reason}
              />
              <FieldDescription>Bu cümle akışın geçmişinde kalır.</FieldDescription>
            </Field>
          </div>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Vazgeç</AlertDialogClose>
            <Button
              disabled={reason.trim().length < 3}
              loading={pending}
              onClick={close}
              variant="destructive"
            >
              Kapat
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
