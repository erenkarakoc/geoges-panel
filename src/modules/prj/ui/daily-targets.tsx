"use client";

import { PencilIcon, TargetIcon } from "lucide-react";
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
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DailyTargetFrame, DailyTargetLine } from "@/modules/prj/data/daily-target-store";
import {
  DAILY_MEASURE_LABELS,
  DAILY_MEASURES,
  noTargetReason,
  TARGET_END_BASIS_LABELS,
  type DailyMeasure,
} from "@/modules/prj/domain/daily-target";
import { targetSubject, type TargetNames } from "@/modules/prj/ui/target-text";
import { useActionToast } from "@/platform/ui/feedback/use-action-toast";

/**
 * A site's targets of a day (TASK-0123 step 3, REQ-PRJ-011): the work left divided by the working
 * days left, line by line, with the corrections a site's manager made and who made them.
 */

type Line = DailyTargetLine & { correctedBy: string | null };

type Result = { error: string | null };

export type CorrectionValue = {
  measure: DailyMeasure;
  panelTypeId: string | null;
  stripTypeId: string | null;
  stripLengthM: number | null;
  workItemId: string | null;
  corrected: string;
  reason: string;
};

const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });
const endDay = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

const BY_BASIS = {
  contract: "Sözleşmedeki bitişe göre",
  management: "Yönetim hedef bitişine göre",
  theoretical: "Teorik bitişe göre",
} as const;

const kindOf = (measure: DailyMeasure) =>
  measure === "strip_install" ? "strip" : measure === "work_item" ? "work_item" : "panel";

/** The amount in its unit: pieces with their area for panels, metres for strips. */
function amountText(line: Line, amount: number | null) {
  if (amount === null) return "—";
  if (line.measure === "strip_install") return `${number.format(amount)} m`;
  if (line.measure === "work_item") return number.format(amount);
  return line.unitAreaM2
    ? `${number.format(amount)} adet · ${number.format(amount * line.unitAreaM2)} m²`
    : `${number.format(amount)} adet`;
}

export function DailyTargets({
  frame,
  lines,
  names,
  mayCorrect,
  correct,
}: {
  frame: DailyTargetFrame;
  lines: readonly Line[];
  names: TargetNames;
  mayCorrect: boolean;
  correct: (value: CorrectionValue) => Promise<Result>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Line | null>(null);
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();

  useActionToast(result ?? {}, result?.error ? { type: "error", title: result.error } : null);

  const why = noTargetReason(frame);
  const subject = (line: Line) => targetSubject({ ...line, kind: kindOf(line.measure) }, names);

  const open = (line: Line) => {
    setEditing(line);
    setValue(line.isCorrected && line.corrected !== null ? String(line.corrected) : "");
    setReason("");
  };

  const submit = () => {
    if (!editing) return;
    start(async () => {
      const said = await correct({
        corrected: value,
        measure: editing.measure,
        panelTypeId: editing.panelTypeId,
        reason,
        stripLengthM: editing.stripLengthM,
        stripTypeId: editing.stripTypeId,
        workItemId: editing.workItemId,
      });
      setResult(said);
      if (!said.error) {
        setEditing(null);
        router.refresh();
      }
    });
  };

  if (lines.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TargetIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle aria-level={2} role="heading">
            Günün hedefi yok
          </EmptyTitle>
          <EmptyDescription>
            {why ?? "Bu şantiyenin duvarlarına geçerli revizyonda hedef girilmemiş."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const summary =
    frame.basis && frame.endOn
      ? `${BY_BASIS[frame.basis]} (${endDay.format(new Date(`${frame.endOn}T00:00:00Z`))}) · ${frame.daysLeft} iş günü kaldı`
      : "Projede bitiş tarihi girilmemiş.";

  return (
    <>
      <Frame>
        <FrameHeader>
          <FrameTitle>Günün hedefleri</FrameTitle>
          <FrameDescription>
            {summary}
            {frame.chosenBasis && frame.chosenBasis !== frame.basis
              ? ` Şantiye için seçilen "${TARGET_END_BASIS_LABELS[frame.chosenBasis]}" girilmediğinden sıradaki tarih kullanıldı.`
              : ""}
          </FrameDescription>
        </FrameHeader>
        {why ? (
          <FramePanel>
            <p className="text-sm text-muted-foreground">{why}</p>
          </FramePanel>
        ) : null}
        {DAILY_MEASURES.map((measure) => {
          const group = lines.filter((line) => line.measure === measure);
          if (group.length === 0) return null;
          return (
            <FramePanel key={measure}>
              <h3 className="mb-2 text-sm font-medium">{DAILY_MEASURE_LABELS[measure]}</h3>
              <ul className="divide-y">
                {group.map((line) => {
                  const target = line.isCorrected ? line.corrected : line.calculated;
                  return (
                    <li
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
                      key={`${line.panelTypeId ?? line.stripTypeId ?? line.workItemId}-${line.stripLengthM ?? ""}`}
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5 max-sm:basis-full">
                        <span className="text-sm">{subject(line)}</span>
                        <span className="text-xs text-muted-foreground">
                          Kalan iş: {amountText(line, line.remaining)}
                          {line.isCorrected
                            ? ` · Hesaplanan: ${amountText(line, line.calculated)}`
                            : ""}
                        </span>
                        {line.isCorrected ? (
                          <span className="text-xs text-muted-foreground">
                            {line.correctedBy ?? "Bir yetkili"} düzeltti: {line.correctionReason}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-sm font-medium tabular-nums max-sm:me-auto">
                        {amountText(line, target)}
                      </span>
                      {line.isCorrected ? <Badge variant="outline">Düzeltildi</Badge> : null}
                      {mayCorrect && frame.businessDay ? (
                        <Button
                          aria-label={`${DAILY_MEASURE_LABELS[line.measure]}: ${subject(line)} hedefini düzelt`}
                          className="max-md:size-11"
                          onClick={() => open(line)}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <PencilIcon aria-hidden="true" />
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </FramePanel>
          );
        })}
      </Frame>

      <Dialog onOpenChange={(next) => !next && setEditing(null)} open={editing !== null}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Hedefi düzelt</DialogTitle>
            <DialogDescription>
              {editing
                ? `${DAILY_MEASURE_LABELS[editing.measure]} · ${subject(editing)}. Hesaplanan: ${amountText(editing, editing.calculated)}.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogPanel className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="target-corrected">
                {editing?.measure === "strip_install"
                  ? "Günün hedefi (metre)"
                  : editing?.measure === "work_item"
                    ? "Günün hedefi"
                    : "Günün hedefi (adet)"}
              </FieldLabel>
              <Input
                id="target-corrected"
                inputMode="decimal"
                onChange={(event) => setValue(event.currentTarget.value)}
                value={value}
              />
              <FieldDescription>Boş bırakırsanız hesaplanan değere döner.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="target-reason">Neden</FieldLabel>
              <Textarea
                id="target-reason"
                onChange={(event) => setReason(event.currentTarget.value)}
                value={reason}
              />
              <FieldDescription>Hesaplanan değer düzeltmeyle birlikte saklanır.</FieldDescription>
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Vazgeç</DialogClose>
            <Button loading={pending} onClick={submit}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
