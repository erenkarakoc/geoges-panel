import { z } from "zod";

/**
 * The project card (TASK-0123 step 1, REQ-PRJ-002, REQ-PRJ-003, REQ-PRJ-010, D-292).
 *
 * What a person types is checked here so the answer comes before the round trip; the database
 * checks it again. The rules that are not about typing — the stage history, a site that never
 * moves, a contract value nobody without the right receives — are the database's.
 */

/**
 * The stage catalog's own order (seed 0011). Management may add stages; one this list does not
 * know is shown after these, in the catalog's order.
 */
export const STAGE_ORDER = [
  "lead",
  "pre_study",
  "quote",
  "negotiation",
  "contract",
  "technical_design",
  "mobilisation",
  "execution",
  "progress_payments",
  "completion",
  "final_acceptance",
  "closure",
] as const;

/** Stages in the catalog, ordered: the known ones in their order, any others after them. */
export function orderStages<T extends { code: string | null }>(stages: readonly T[]): T[] {
  const place = (code: string | null) => {
    const at = STAGE_ORDER.indexOf(code as (typeof STAGE_ORDER)[number]);
    return at === -1 ? STAGE_ORDER.length : at;
  };
  return [...stages].sort((a, b) => place(a.code) - place(b.code));
}

export const CURRENCIES = ["TRY", "USD", "EUR"] as const;

const optionalText = (max: number, what: string) =>
  z
    .string()
    .trim()
    .max(max, `${what} en çok ${max} karakter olabilir.`)
    .transform((value) => value || null)
    .nullish();

const optionalDate = (what: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: `${what} geçerli bir tarih olmalı.`,
    })
    .transform((value) => value || null)
    .nullish();

const optionalId = z
  .string()
  .transform((value) => value || null)
  .refine((value) => value === null || z.guid().safeParse(value).success, {
    message: "Seçim geçersiz.",
  })
  .nullish();

/** "1.250.000,50" as it is typed here, into a number; empty stays empty. */
export function money(text: string): number | null {
  const cleaned = text.trim().replace(/\s/g, "");
  if (!cleaned) return null;
  const normal = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  const value = Number(normal);
  return Number.isFinite(value) ? value : Number.NaN;
}

export const projectInput = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Proje kodu boş olamaz.")
      .max(40, "Proje kodu en çok 40 karakter olabilir."),
    name: z
      .string()
      .trim()
      .min(2, "Proje adı en az iki harf olmalı.")
      .max(200, "Proje adı en çok 200 karakter olabilir."),
    clientPartyId: optionalId,
    authority: optionalText(200, "Kurum / idare"),
    city: optionalText(60, "İl"),
    location: optionalText(300, "Lokasyon"),
    contractNo: optionalText(80, "Sözleşme numarası"),
    contractSignedOn: optionalDate("Sözleşme tarihi"),
    contractStartOn: optionalDate("Sözleşme başlangıcı"),
    contractEndOn: optionalDate("Sözleşme bitişi"),
    theoreticalEndOn: optionalDate("Teorik bitiş"),
    managementTargetEndOn: optionalDate("Yönetim hedef bitişi"),
    coordinatorUserId: optionalId,
  })
  .refine(
    (value) =>
      !value.contractStartOn ||
      !value.contractEndOn ||
      value.contractEndOn >= value.contractStartOn,
    { message: "Sözleşme bitişi başlangıcından önce olamaz.", path: ["contractEndOn"] },
  );

export type ProjectInput = z.infer<typeof projectInput>;

export const contractInput = z.object({
  contractValue: z
    .number({ error: "Sözleşme bedeli bir sayı olmalı." })
    .nonnegative("Sözleşme bedeli eksi olamaz.")
    .nullable(),
  currency: z.enum(CURRENCIES, { error: "Para birimi seçilmeli." }),
});

export type ContractInput = z.infer<typeof contractInput>;

/**
 * The date the daily targets run to (D-292 rule 4): the one chosen for the site, else the
 * management target, else the theoretical end, else the contract end; null when none is typed.
 */
export function targetEndDate(
  project: {
    managementTargetEndOn: string | null;
    theoreticalEndOn: string | null;
    contractEndOn: string | null;
  },
  chosen?: "management" | "theoretical" | "contract" | null,
): string | null {
  const byChoice = {
    contract: project.contractEndOn,
    management: project.managementTargetEndOn,
    theoretical: project.theoreticalEndOn,
  };
  if (chosen && byChoice[chosen]) return byChoice[chosen];
  return project.managementTargetEndOn ?? project.theoreticalEndOn ?? project.contractEndOn;
}

/** The database's refusals in the person's words. */
export function projectMessage(failure: {
  code?: string;
  constraint?: string;
  hint?: string;
}): string | null {
  if (failure.code === "23505" && failure.constraint === "uq_project__code")
    return "Bu kodla bir proje zaten var.";
  if (failure.hint === "prj.unknown_stage") return "Bu aşama tanımlı değil.";
  if (failure.code === "42501") return "Bu projede değişiklik yapma yetkiniz yok.";
  if (failure.code === "23514") return "Proje bilgilerinde eksik ya da hatalı bir alan var.";
  if (failure.code === "22023") return "Özel alanlardan biri eksik ya da hatalı.";
  return null;
}
