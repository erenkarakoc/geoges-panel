import { z } from "zod";

/**
 * A site's daily targets (TASK-0123 step 3, REQ-PRJ-011, D-137, D-292 rule 4). The database works
 * them out (`prj.daily_targets`); this module names what it returns and checks a correction
 * before it is sent.
 */

export const DAILY_MEASURES = [
  "panel_cast",
  "panel_install",
  "strip_install",
  "work_item",
] as const;
export type DailyMeasure = (typeof DAILY_MEASURES)[number];

export const DAILY_MEASURE_LABELS: Record<DailyMeasure, string> = {
  panel_cast: "Panel döküm",
  panel_install: "Panel montaj",
  strip_install: "Şerit montaj",
  work_item: "Diğer iş kalemleri",
};

export const TARGET_END_BASES = ["management", "theoretical", "contract"] as const;
export type TargetEndBasis = (typeof TARGET_END_BASES)[number];

export const TARGET_END_BASIS_LABELS: Record<TargetEndBasis, string> = {
  contract: "Sözleşmedeki bitiş",
  management: "Yönetim hedef bitişi",
  theoretical: "Teorik bitiş",
};

/** Why a day has no calculated target, or null when it has one. */
export function noTargetReason(frame: {
  businessDay: boolean;
  endOn: string | null;
  daysLeft: number;
  revisionId: string | null;
}): string | null {
  if (!frame.revisionId) return "Projenin onaylı bir revizyonu yok; hedefler revizyonla gelir.";
  if (!frame.businessDay) return "Bu gün çalışma takviminde iş günü değil; hedef verilmez.";
  if (!frame.endOn) return "Projede bitiş tarihi girilmemiş; hedef hesaplanamaz.";
  if (frame.daysLeft === 0) return "Bitiş tarihi geçti; kalan iş günü yok.";
  return null;
}

const amount = z
  .string()
  .trim()
  .transform((value) => (value ? Number(value.replace(",", ".")) : null))
  .refine((value) => value === null || (Number.isFinite(value) && value >= 0), {
    message: "Hedef sıfır ya da daha büyük bir sayı olmalı.",
  });

export const correctionInput = z.object({
  measure: z.enum(DAILY_MEASURES),
  panelTypeId: z.guid().nullable(),
  stripTypeId: z.guid().nullable(),
  stripLengthM: z.number().positive().nullable(),
  workItemId: z.guid().nullable(),
  /** Empty returns the line to its calculation. */
  corrected: amount,
  reason: z.string().trim().min(3, "Düzeltmenin nedenini yazın."),
});

export type CorrectionInput = z.infer<typeof correctionInput>;

/** The database's refusals in the person's words. */
export function dailyTargetMessage(failure: { code?: string; hint?: string }): string | null {
  if (failure.hint === "prj.past_day_target") return "Geçmiş bir günün hedefi düzeltilmez.";
  if (failure.hint === "prj.not_a_business_day") return "İş günü olmayan güne hedef verilmez.";
  if (failure.hint === "prj.no_such_target") return "Bu günün hedeflerinde böyle bir satır yok.";
  if (failure.code === "42501") return "Bu şantiyenin hedeflerini düzeltme yetkiniz yok.";
  if (failure.code === "23514") return "Düzeltmede eksik ya da hatalı bir alan var.";
  return null;
}
