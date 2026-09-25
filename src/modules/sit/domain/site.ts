import { z } from "zod";

/**
 * The site card (TASK-0123 step 1, REQ-SIT-001, D-138, D-292 rule 3). A site belongs to one
 * project and never moves; the database refuses the move, this only checks what is typed.
 */

export const WORK_MODELS = ["in_house", "subcontracted"] as const;
export type WorkModel = (typeof WORK_MODELS)[number];

export const WORK_MODEL_LABELS: Record<WorkModel, string> = {
  in_house: "Kendi ekibimiz",
  subcontracted: "Taşeron",
};

const optionalId = z
  .string()
  .transform((value) => value || null)
  .refine((value) => value === null || z.uuid().safeParse(value).success, {
    message: "Seçim geçersiz.",
  })
  .nullish();

const coordinate = (min: number, max: number, what: string) =>
  z
    .string()
    .trim()
    .transform((value) => (value ? Number(value.replace(",", ".")) : null))
    .refine((value) => value === null || (Number.isFinite(value) && value >= min && value <= max), {
      message: `${what} ${min} ile ${max} arasında bir sayı olmalı.`,
    })
    .nullish();

export const siteInput = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Şantiye adı en az iki harf olmalı.")
      .max(120, "Şantiye adı en çok 120 karakter olabilir."),
    code: z
      .string()
      .trim()
      .max(40, "Kod en çok 40 karakter olabilir.")
      .transform((value) => value || null)
      .nullish(),
    workModel: z.enum(WORK_MODELS, { error: "İş modeli seçilmeli." }),
    subcontractorPartyId: optionalId,
    coordinatorUserId: optionalId,
    entryOwnerUserId: optionalId,
    city: z
      .string()
      .trim()
      .max(60, "İl en çok 60 karakter olabilir.")
      .transform((value) => value || null)
      .nullish(),
    latitude: coordinate(-90, 90, "Enlem"),
    longitude: coordinate(-180, 180, "Boylam"),
  })
  .refine((value) => value.workModel !== "subcontracted" || Boolean(value.subcontractorPartyId), {
    message: "Taşeron şantiyesinde taşeron firma seçilmeli.",
    path: ["subcontractorPartyId"],
  })
  .transform((value) => ({
    ...value,
    subcontractorPartyId: value.workModel === "subcontracted" ? value.subcontractorPartyId : null,
  }));

export type SiteInput = z.infer<typeof siteInput>;

export function siteMessage(failure: {
  code?: string;
  constraint?: string;
  hint?: string;
}): string | null {
  if (failure.hint === "sit.site_project_fixed")
    return "Şantiye başka bir projeye taşınamaz; yanlış açıldıysa pasifleştirin.";
  if (failure.code === "23505" && failure.constraint === "uq_site__project_name")
    return "Bu projede bu adla bir şantiye zaten var.";
  if (failure.code === "42501") return "Bu projede şantiye açma ya da değiştirme yetkiniz yok.";
  if (failure.code === "23514") return "Şantiye bilgilerinde eksik ya da hatalı bir alan var.";
  return null;
}
