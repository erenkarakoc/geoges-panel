"use client";

import { AlertTriangleIcon, CheckIcon, PlayIcon, UploadIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { reportEndText, reportStepText } from "@/modules/wfl/domain/report-text";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * The dry run and the publish (SCR-196, REQ-WFL-025, REQ-WFL-023/024, TASK-0119, D-284).
 *
 * The dry run is the engine's own loop with a sink that writes nothing, and the engine runs on the
 * worker — so the screen **asks** for a run and then watches for the evidence row, which is written
 * bound to this definition's content hash. Publishing needs a passed run of exactly this
 * definition, and the database is what refuses otherwise; this screen only says so earlier.
 */

export type DryRunState = {
  error: string | null;
  waiting: boolean;
  passed: boolean | null;
  current: boolean;
  steps: {
    stepId: string;
    type: string;
    outcome: string;
    status?: "done" | "failed" | "waiting";
    about?: string;
    at?: string | null;
    owner?: string | null;
  }[];
  ends: string | null;
  failure: string | null;
  at: number | null;
};

export type PublishSummary = {
  error: string | null;
  version: number | null;
  liveVersion: number | null;
  runningOnLive: number;
};

export type DesignerActions = {
  runDryRun: (versionId: string) => Promise<DryRunState>;
  readDryRun: (versionId: string) => Promise<DryRunState>;
  publishSummary: (versionId: string) => Promise<PublishSummary>;
  publish: (input: { key: string; versionId: string }) => Promise<{
    error: string | null;
    published: boolean;
  }>;
};

/** How long the screen keeps watching for the worker's answer before it says it gave up. */
const WATCH_MS = 30_000;
const WATCH_EVERY_MS = 1_200;

export function FlowActions({
  flowKey,
  versionId,
  published,
  ready,
  dirty,
  actions,
  initial,
  names,
  people,
}: {
  flowKey: string;
  versionId: string;
  /** Whether the version on screen is the published one; a published version is never republished. */
  published: boolean;
  /** Whether the definition has no complaints from the schema (ADMINISTRATION section 3). */
  ready: boolean;
  /** Whether there are edits the database has not been told about yet. */
  dirty: boolean;
  actions: DesignerActions;
  initial: DryRunState;
  /** What each step is called on this screen, so the report never shows an id. */
  names: ReadonlyMap<string, string>;
  /** Who is who, so "kime düşer" is a person's name rather than an account number. */
  people: ReadonlyMap<string, string>;
}) {
  const [dryRun, setDryRun] = useState<DryRunState>(initial);
  const [report, setReport] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [summary, setSummary] = useState<PublishSummary | null>(null);
  const [result, setResult] = useState<{ error: string | null; published: boolean } | null>(null);
  const [asking, startAsking] = useTransition();
  const [publishing, startPublishing] = useTransition();
  const watcher = useRef<ReturnType<typeof setInterval> | null>(null);

  useActionToast(
    result ?? {},
    result?.error
      ? { type: "error", title: result.error }
      : result?.published
        ? { type: "success", title: "Akış yayımlandı." }
        : null,
  );

  const stopWatching = useCallback(() => {
    if (watcher.current) clearInterval(watcher.current);
    watcher.current = null;
  }, []);

  useEffect(() => stopWatching, [stopWatching]);

  /** Watches for the worker's answer: the evidence row for this very definition. */
  const watch = useCallback(() => {
    stopWatching();
    const until = Date.now() + WATCH_MS;
    watcher.current = setInterval(async () => {
      const state = await actions.readDryRun(versionId);
      if (state.current) {
        setDryRun(state);
        stopWatching();
        return;
      }
      if (Date.now() > until) {
        setDryRun({
          ...state,
          error: "Deneme sonucu gelmedi; arka plan işçisi çalışmıyor olabilir.",
          waiting: false,
        });
        stopWatching();
      }
    }, WATCH_EVERY_MS);
  }, [actions, stopWatching, versionId]);

  const ask = () => {
    setReport(true);
    startAsking(async () => {
      const state = await actions.runDryRun(versionId);
      setDryRun(state);
      if (!state.error && !state.current) watch();
    });
  };

  const openConfirmation = () => {
    setConfirming(true);
    setSummary(null);
    startPublishing(async () => setSummary(await actions.publishSummary(versionId)));
  };

  const confirm = () => {
    startPublishing(async () => {
      const answer = await actions.publish({ key: flowKey, versionId });
      setResult(answer);
      if (!answer.error) setConfirming(false);
    });
  };

  const passedNow = dryRun.passed === true && dryRun.current;

  return (
    <>
      {passedNow ? (
        <Badge variant="success">
          <CheckIcon aria-hidden="true" />
          Deneme geçti
        </Badge>
      ) : null}

      <Button disabled={!ready || dirty || asking} onClick={ask} type="button" variant="outline">
        <PlayIcon />
        Deneme çalıştır
      </Button>

      <Button disabled={!passedNow || published || dirty} onClick={openConfirmation} type="button">
        <UploadIcon />
        Yayımla
      </Button>

      <Dialog onOpenChange={setReport} open={report}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Deneme çalıştırması</DialogTitle>
            <DialogDescription>
              Akış baştan sona yürütülür, koşullar gerçek veriyle cevaplanır ve her adımın kime
              düşeceği hesaplanır. Hiçbir kayıt, görev, onay ya da bildirim oluşmaz.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 px-4 pb-4">
            {dryRun.error ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/8 p-3 text-sm">
                {dryRun.error}
              </p>
            ) : null}

            {dryRun.waiting && !dryRun.error ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                Deneme sıraya alındı; sonucu birkaç saniye içinde gelir.
              </p>
            ) : null}

            {dryRun.steps.length > 0 ? (
              <ScrollArea className="max-h-72 rounded-md border">
                <ol className="divide-y">
                  {dryRun.steps.map((step, index) => (
                    <li
                      className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm"
                      key={`${step.stepId}-${index}`}
                    >
                      <span className="font-medium">{names.get(step.stepId) ?? "Adım"}</span>
                      <span className="flex flex-col items-end text-xs text-muted-foreground">
                        <span>{reportStepText(step, names)}</span>
                        {step.owner ? (
                          <span>{people.get(step.owner) ?? "bir kişiye"} düşer</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ol>
              </ScrollArea>
            ) : null}

            {reportEndText(dryRun.ends) ? (
              <p className="text-sm">
                {reportEndText(dryRun.ends)}
                {dryRun.failure ? ` ${dryRun.failure}` : ""}
              </p>
            ) : null}

            {dryRun.passed === false && !dryRun.error ? (
              <p className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/8 p-3 text-sm">
                <AlertTriangleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                Bu tanım denemeden geçmedi; düzeltilene kadar yayımlanamaz.
              </p>
            ) : null}

            <p className="text-xs text-muted-foreground">
              Deneme şimdilik boş bir örnek kayıtla çalışır: örnek kayıt seçimi, kullanıcının kendi
              kayıt türlerini tanımlaması ile birlikte gelecek.
            </p>
          </div>
        </DialogPopup>
      </Dialog>

      <AlertDialog onOpenChange={setConfirming} open={confirming}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu sürüm yayımlansın mı?</AlertDialogTitle>
            <AlertDialogDescription>
              {summary
                ? summary.error
                  ? summary.error
                  : `${summary.version}. sürüm yayına alınır${
                      summary.liveVersion
                        ? `; bugünkü ${summary.liveVersion}. sürüm geçmişe taşınır`
                        : ""
                    }. Yürüyen ${summary.runningOnLive} çalışma başladığı sürümle devam eder. Yayın denetim kaydına yazılır ve sahiplere bildirilir.`
                : "Özet hazırlanıyor…"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Vazgeç</AlertDialogClose>
            <Button
              disabled={!summary || Boolean(summary.error)}
              loading={publishing}
              onClick={confirm}
            >
              Yayımla
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
