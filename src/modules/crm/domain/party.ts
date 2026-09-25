import { z } from "zod";

/**
 * The firm card (TASK-0122, REQ-CRM-004, D-027): one record per real firm, with roles.
 *
 * What a person types is checked here so the answer comes before the round trip; the database
 * checks it again. The rule that matters most — one card per firm — is the database's: the tax
 * number is unique there, and the likeness of names is judged there too (`crm.similar_parties`).
 */

export const PARTY_ROLES = ["client", "customer", "supplier", "subcontractor", "lessor"] as const;
export type PartyRole = (typeof PARTY_ROLES)[number];

export const ROLE_LABELS: Record<PartyRole, string> = {
  client: "İşveren",
  customer: "Ürün müşterisi",
  supplier: "Tedarikçi",
  subcontractor: "Taşeron",
  lessor: "Kiralayan",
};

/** What each role means, under the choice, so nobody has to guess between two of them. */
export const ROLE_NOTES: Record<PartyRole, string> = {
  client: "Bizi uygulama işine alan firma ya da idare",
  customer: "Ürün sattığımız firma",
  supplier: "Malzeme ya da hizmet aldığımız firma",
  subcontractor: "Götürü işçilik yapan ekip ya da firma",
  lessor: "Vinç, araç ya da ekipman kiraladığımız firma",
};

export type PartyStatus = "active" | "passive";

/** Spaces and dots people type into numbers ("123 456 7890") are not part of the number. */
export function cleanTaxNo(value: string): string {
  return value.replace(/[\s.]/g, "").toUpperCase();
}

/**
 * Whether a Turkish tax number (VKN, 10 digits) passes its check digit. Only a warning on the
 * form: a number that fails is most likely mistyped, but the form never blocks a firm on it.
 */
export function vknLooksValid(vkn: string): boolean {
  if (!/^\d{10}$/.test(vkn)) return false;
  const digits = [...vkn].map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const shifted = (digits[i] + 9 - i) % 10;
    let value = (shifted * 2 ** (9 - i)) % 9;
    if (shifted !== 0 && value === 0) value = 9;
    sum += value;
  }
  return (10 - (sum % 10)) % 10 === digits[9];
}

/** Whether a Turkish national id (TCKN, 11 digits, a sole trader's tax number) passes its checks. */
export function tcknLooksValid(tckn: string): boolean {
  if (!/^[1-9]\d{10}$/.test(tckn)) return false;
  const d = [...tckn].map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  const tenth = (((odd * 7 - even) % 10) + 10) % 10;
  const eleventh = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  return tenth === d[9] && eleventh === d[10];
}

/**
 * A sentence about a typed tax number, or null when there is nothing to say. Letters mean a
 * foreign firm's number, which has no Turkish check to pass.
 */
export function taxNoWarning(value: string): string | null {
  const cleaned = cleanTaxNo(value);
  if (!cleaned || !/^\d+$/.test(cleaned)) return null;
  if (cleaned.length === 10)
    return vknLooksValid(cleaned) ? null : "Bu vergi numarası hatalı görünüyor; kontrol edin.";
  if (cleaned.length === 11)
    return tcknLooksValid(cleaned) ? null : "Bu kimlik numarası hatalı görünüyor; kontrol edin.";
  return "Vergi numarası 10, şahıs firmasının kimlik numarası 11 hanedir.";
}

const optionalText = (max: number, what: string) =>
  z
    .string()
    .trim()
    .max(max, `${what} en çok ${max} karakter olabilir.`)
    .transform((value) => value || null)
    .nullish();

const email = z
  .string()
  .trim()
  .transform((value) => value || null)
  .refine((value) => value === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value), {
    message: "E-posta adresi eksik ya da hatalı.",
  })
  .nullish();

export const partyInput = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Firma unvanı en az iki harf olmalı.")
    .max(200, "Firma unvanı en çok 200 karakter olabilir."),
  taxNo: z
    .string()
    .transform(cleanTaxNo)
    .refine((value) => value === "" || /^[0-9A-Z-]{5,20}$/.test(value), {
      message: "Vergi numarası yalnız rakam ve harf içerir; 5 ile 20 karakter arasıdır.",
    })
    .refine((value) => !/^\d+$/.test(value) || value.length === 10 || value.length === 11, {
      message: "Vergi numarası 10, şahıs firmasının kimlik numarası 11 hanedir.",
    })
    .transform((value) => value || null)
    .nullish(),
  taxOffice: optionalText(80, "Vergi dairesi"),
  roles: z
    .array(z.enum(PARTY_ROLES))
    .min(1, "Firmanın en az bir rolü seçilmeli.")
    .transform((roles) => PARTY_ROLES.filter((role) => roles.includes(role))),
  city: optionalText(60, "İl"),
  address: optionalText(400, "Adres"),
  phone: optionalText(40, "Telefon"),
  email,
  note: optionalText(1000, "Not"),
});

export type PartyInput = z.infer<typeof partyInput>;

export const contactInput = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Kişinin adı en az iki harf olmalı.")
    .max(120, "Kişinin adı en çok 120 karakter olabilir."),
  title: optionalText(80, "Görev"),
  phone: optionalText(40, "Telefon"),
  email,
});

export type ContactInput = z.infer<typeof contactInput>;

/** Roles in their fixed order, as words: "İşveren, Tedarikçi". */
export function roleWords(roles: readonly string[]): string {
  return PARTY_ROLES.filter((role) => roles.includes(role))
    .map((role) => ROLE_LABELS[role])
    .join(", ");
}

/** The database's refusals in the person's words. */
export function partyMessage(failure: { code?: string; constraint?: string }): string | null {
  if (failure.code === "23505" && failure.constraint === "uq_party__tax_no")
    return "Bu vergi numarasıyla kayıtlı bir firma zaten var; yeni kart açmak yerine onun kartına rol ekleyin.";
  if (failure.code === "42501") return "Firma kaydetme yetkiniz yok.";
  if (failure.code === "23514") return "Firma bilgilerinde eksik ya da hatalı bir alan var.";
  if (failure.code === "22023") return "Özel alanlardan biri eksik ya da hatalı.";
  return null;
}
