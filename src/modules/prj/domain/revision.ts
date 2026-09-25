import { z } from "zod";

/**
 * Walls and targets as they are typed (TASK-0123 step 2, REQ-PRJ-006). The database keeps the
 * rules that are not about typing — only a draft changes, a wall on its own project's site, a
 * type of another project refused.
 */

export const WALL_STATUSES = ["not_started", "in_progress", "completed"] as const;

export const WALL_STATUS_LABELS: Record<(typeof WALL_STATUSES)[number], string> = {
  completed: "Tamamlandı",
  in_progress: "Devam ediyor",
  not_started: "Başlamadı",
};

export const REVISION_STATUS_LABELS = {
  approved: "Onaylı",
  draft: "Taslak",
  submitted: "Onayda",
} as const;

export const TARGET_KIND_LABELS = {
  panel: "Panel",
  strip: "Çelik şerit",
  work_item: "Diğer iş kalemi",
} as const;

/** "1,5" as it is typed here; empty stays empty. */
export function decimalOrNull(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const cleaned = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : Number.NaN;
}

const positiveOrNull = (what: string) =>
  z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((value) => decimalOrNull(value ?? null))
    .refine((value) => value === null || (!Number.isNaN(value) && value > 0), {
      message: `${what} sıfırdan büyük bir sayı olmalı.`,
    });

const amount = (what: string) =>
  z
    .union([z.string(), z.number()])
    .transform((value) => decimalOrNull(value))
    .refine((value) => value !== null && !Number.isNaN(value) && value >= 0, {
      message: `${what} sıfır ya da daha büyük bir sayı olmalı.`,
    })
    .transform((value) => value as number);

export const wallInput = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Duvar kodu boş olamaz.")
    .max(40, "Kod en çok 40 karakter olabilir."),
  name: z
    .string()
    .trim()
    .min(2, "Duvar adı en az iki harf olmalı.")
    .max(120, "Duvar adı en çok 120 karakter olabilir."),
  siteId: z.guid({ error: "Duvarın şantiyesi seçilmeli." }),
  lengthM: positiveOrNull("Uzunluk"),
  heightM: positiveOrNull("Yükseklik"),
});

export type WallInput = z.infer<typeof wallInput>;

export const targetInput = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("panel"),
    wallId: z.guid(),
    panelTypeId: z.guid({ error: "Panel tipi seçilmeli." }),
    qty: amount("Adet"),
  }),
  z.object({
    kind: z.literal("strip"),
    wallId: z.guid(),
    stripTypeId: z.guid({ error: "Şerit tipi seçilmeli." }),
    stripLengthM: positiveOrNull("Şerit boyu").refine((value) => value !== null, {
      message: "Şerit boyu seçilmeli.",
    }),
    lengthM: amount("Metraj"),
  }),
  z.object({
    kind: z.literal("work_item"),
    wallId: z.guid(),
    workItemId: z.guid({ error: "İş kalemi seçilmeli." }),
    qty: amount("Miktar"),
  }),
]);

export type TargetInput = z.infer<typeof targetInput>;

/** The database's refusals in the technical office's words. */
export function revisionMessage(failure: {
  code?: string;
  constraint?: string;
  hint?: string;
}): string | null {
  switch (failure.hint) {
    case "prj.revision_frozen":
      return "Yalnız taslak revizyon değişir; onaya giden ya da onaylanan revizyon için yeni revizyon açın.";
    case "prj.revision_transition":
      return "Revizyon bu duruma geçemez.";
    case "prj.revision_approved_by_flow":
      return "Revizyon onay akışıyla onaylanır.";
    case "prj.type_of_other_project":
      return "Bu tip başka bir projeye özel; bu projede kullanılamaz.";
  }
  if (failure.code === "23505" && failure.constraint === "uq_project_revision__open")
    return "Bu projede açık bir revizyon zaten var; önce onu tamamlayın.";
  if (failure.code === "23505" && failure.constraint === "uq_revision_wall__wall")
    return "Bu duvar bu revizyonda zaten var.";
  if (failure.code === "23503")
    return "Duvar yalnız bu projenin şantiyelerinden birine bağlanabilir.";
  if (failure.code === "42501") return "Bu projede revizyon yetkiniz yok.";
  if (failure.code === "23514") return "Bilgilerde eksik ya da hatalı bir alan var.";
  return null;
}
