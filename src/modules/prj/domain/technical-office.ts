import { z } from "zod";

/**
 * Technical office items and the supply matrix (TASK-0123 step 4, REQ-PRJ-004, REQ-PRJ-005,
 * D-298). What a person types is checked here; the database holds the rules that matter — an
 * item's delivery day, a matrix row that is never changed and never dated into the past.
 */

export const OFFICE_STATUSES = ["open", "in_progress", "delivered", "cancelled"] as const;
export type OfficeStatus = (typeof OFFICE_STATUSES)[number];

export const OFFICE_STATUS_LABELS: Record<OfficeStatus, string> = {
  cancelled: "İptal",
  delivered: "Teslim edildi",
  in_progress: "Devam ediyor",
  open: "Açık",
};

export const RESPONSIBILITIES = ["client", "geoges", "client_deducts"] as const;
export type Responsibility = (typeof RESPONSIBILITIES)[number];

/** The three answers of REQ-PRJ-004, in its own words. */
export const RESPONSIBILITY_LABELS: Record<Responsibility, string> = {
  client: "İşveren karşılar",
  client_deducts: "İşveren karşılar, GEOGES hakedişinden keser",
  geoges: "GEOGES karşılar",
};

/** Whether an item is late on a day: past its due day and neither delivered nor cancelled. */
export function isOverdue(
  item: { status: OfficeStatus; dueOn: string | null },
  today: string,
): boolean {
  return (
    (item.status === "open" || item.status === "in_progress") && !!item.dueOn && item.dueOn < today
  );
}

const optionalId = z
  .string()
  .transform((value) => value || null)
  .refine((value) => value === null || z.guid().safeParse(value).success, {
    message: "Seçim geçersiz.",
  })
  .nullish();

const optionalDay = z
  .string()
  .trim()
  .transform((value) => value || null)
  .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Tarih geçersiz.",
  })
  .nullish();

export const officeItemInput = z.object({
  typeItemId: z.guid({ error: "İşin türü seçilmeli." }),
  title: z
    .string()
    .trim()
    .min(2, "İşin adı en az iki harf olmalı.")
    .max(200, "İşin adı en çok 200 karakter olabilir."),
  assigneeUserId: optionalId,
  dueOn: optionalDay,
  note: z
    .string()
    .trim()
    .max(2000, "Not en çok 2000 karakter olabilir.")
    .transform((value) => value || null)
    .nullish(),
});

export type OfficeItemInput = z.infer<typeof officeItemInput>;

export const supplyInput = z.object({
  itemId: z.guid({ error: "Kalem seçilmeli." }),
  responsibility: z.enum(RESPONSIBILITIES, { error: "Kimin karşıladığı seçilmeli." }),
  validFrom: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerlilik tarihi seçilmeli."),
  note: z
    .string()
    .trim()
    .max(500, "Not en çok 500 karakter olabilir.")
    .transform((value) => value || null)
    .nullish(),
});

export type SupplyInput = z.infer<typeof supplyInput>;

/** The database's refusals in the person's words. */
export function officeMessage(failure: {
  code?: string;
  constraint?: string;
  hint?: string;
}): string | null {
  if (failure.hint === "prj.supply_backdated")
    return "Matris değişikliği bugün ya da sonrası için, son satırdan sonraki bir tarihle girilir; geçmiş dönem yeniden yazılmaz.";
  if (failure.code === "23505" && failure.constraint === "uq_supply_responsibility__day")
    return "Bu kalem için aynı günden geçerli bir satır zaten var.";
  if (failure.code === "42501") return "Bu projede bu işlemi yapma yetkiniz yok.";
  if (failure.code === "23503") return "Seçilen tür, kalem ya da kişi bulunamadı.";
  if (failure.code === "23514") return "Bilgilerde eksik ya da hatalı bir alan var.";
  return null;
}
