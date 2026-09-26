"use client";

import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  CopyIcon,
  HistoryIcon,
  MoreHorizontalIcon,
  PowerIcon,
  PowerOffIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
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
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toastManager } from "@/components/ui/toast";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * The designer header's "…" (ADMINISTRATION section 3): a copy to work on, closing the flow, and
 * the versions it has had.
 *
 * Closing is not deleting and the wording says so: nothing new starts, what is already running
 * finishes where it is (REQ-WFL-024). The reason is asked for, because a flow somebody turned off
 * without saying why is the sort of thing people argue about a year later.
 *
 * Removing follows the owner's rule (D-293): a flow that never ran is deleted, one that ran is
 * archived with its history, and the menu says which before anybody presses it.
 */

export type FlowVersionRow = { version: number; status: string; publishedAt: number | null };

export type FlowMenuActions = {
  copy: (flowKey: string) => Promise<{ error: string | null; key: string | null }>;
  /** Only offered for a flow that came from a template (REQ-WFL-027). */
  resetToTemplate: (flowKey: string) => Promise<{ error: string | null; reset: boolean }>;
  close: (input: { key: string; reason: string }) => Promise<{
    error: string | null;
    closed: boolean;
  }>;
  versions: (flowKey: string) => Promise<FlowVersionRow[]>;
  remove: (input: { key: string; reason: string }) => Promise<{
    error: string | null;
    said: "deleted" | "archived" | null;
  }>;
  restore: (flowKey: string) => Promise<{ error: string | null }>;
  reopen: (flowKey: string) => Promise<{ error: string | null }>;
};

/** Where the flow stands, which decides what the menu offers. */
export type FlowMenuState = {
  closed: boolean;
  archived: boolean;
  /** A flow that ran is archived rather than deleted (D-293). */
  hasRun: boolean;
};

const STATUS: Record<string, string> = {
  draft: "taslak",
  published: "yayında",
  superseded: "geçmiş",
};

const day = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });

export function FlowMenu({
  flowKey,
  actions,
  state,
  fromTemplate = false,
}: {
  flowKey: string;
  actions: FlowMenuActions;
  state: FlowMenuState;
  /** Whether this flow is a copy of a template; only then is resetting to it offered. */
  fromTemplate?: boolean;
}) {
  const router = useRouter();
  const [history, setHistory] = useState<FlowVersionRow[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [closing, setClosing] = useState(false);
  const [removing, setRemoving] = useState(false);
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

  const resetToTemplate = () => {
    start(async () => {
      const answer = await actions.resetToTemplate(flowKey);
      setResult(answer);
      if (answer.reset) router.refresh();
    });
  };

  const openHistory = () => {
    setShowHistory(true);
    setHistory(null);
    start(async () => setHistory(await actions.versions(flowKey)));
  };

  const remove = () => {
    start(async () => {
      const answer = await actions.remove({ key: flowKey, reason });
      setResult(answer);
      if (answer.said) {
        toastManager.add({
          type: "success",
          title: answer.said === "deleted" ? "Akış silindi" : "Akış arşive kaldırıldı",
        });
      }
      if (answer.said === "deleted") router.push("/admin/workflows");
      if (answer.said === "archived") {
        setRemoving(false);
        setReason("");
        router.refresh();
      }
    });
  };

  /** Restoring from the archive and reopening a closed flow ask nothing: both can be undone. */
  const flip = (run: (key: string) => Promise<{ error: string | null }>) => {
    start(async () => {
      const answer = await run(flowKey);
      setResult(answer);
      if (!answer.error) router.refresh();
    });
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
          {fromTemplate ? (
            <MenuItem disabled={pending} onClick={resetToTemplate}>
              <RotateCcwIcon aria-hidden="true" />
              Şablona sıfırla
            </MenuItem>
          ) : null}
          <MenuItem onClick={openHistory}>
            <HistoryIcon aria-hidden="true" />
            Sürüm geçmişi
          </MenuItem>
          {state.archived ? (
            <MenuItem disabled={pending} onClick={() => flip(actions.restore)}>
              <ArchiveRestoreIcon aria-hidden="true" />
              Arşivden geri getir
            </MenuItem>
          ) : state.closed ? (
            <MenuItem disabled={pending} onClick={() => flip(actions.reopen)}>
              <PowerIcon aria-hidden="true" />
              Yeniden aç
            </MenuItem>
          ) : (
            <MenuItem onClick={() => setClosing(true)}>
              <PowerOffIcon aria-hidden="true" />
              Akışı kapat
            </MenuItem>
          )}
          {state.archived ? null : (
            <>
              <MenuSeparator />
              <MenuItem onClick={() => setRemoving(true)} variant="destructive">
                {state.hasRun ? (
                  <ArchiveIcon aria-hidden="true" />
                ) : (
                  <Trash2Icon aria-hidden="true" />
                )}
                {state.hasRun ? "Arşive kaldır" : "Akışı sil"}
              </MenuItem>
            </>
          )}
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

      <AlertDialog onOpenChange={setRemoving} open={removing}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {state.hasRun ? "Bu akış arşive kaldırılsın mı?" : "Bu akış silinsin mi?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {state.hasRun
                ? "Bu akış daha önce çalıştı. Onay kararları, görevleri ve çalışma günlüğü kayıt olduğu için silinmez: akış kapatılır ve listeden kalkar. Arşivden geri getirilebilir."
                : "Bu akış hiç çalışmadı. Bütün sürümleriyle birlikte tamamen silinir; geri alınamaz. Silindiği ve sebebi denetim kaydında kalır."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-4 pb-2">
            <Field>
              <FieldLabel htmlFor="remove-reason">
                {state.hasRun ? "Neden arşive kaldırılıyor?" : "Neden siliniyor?"}
              </FieldLabel>
              <Input
                id="remove-reason"
                onChange={(event) => setReason(event.currentTarget.value)}
                placeholder={state.hasRun ? "Artık kullanılmıyor" : "Deneme için açılmıştı"}
                value={reason}
              />
              <FieldDescription>Bu cümle denetim kaydında kalır.</FieldDescription>
            </Field>
          </div>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Vazgeç</AlertDialogClose>
            <Button
              disabled={reason.trim().length < 3}
              loading={pending}
              onClick={remove}
              variant="destructive"
            >
              {state.hasRun ? "Arşive kaldır" : "Sil"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>

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
