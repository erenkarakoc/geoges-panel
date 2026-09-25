import { z } from "zod";

/**
 * Production definitions (TASK-0121, REQ-ADM-002…004): the shapes the daily site log's casting,
 * installation, strip and consumption rows are built from.
 *
 * What makes a definition valid lives twice on purpose, and only for what a person types: the forms
 * check it here so the answer comes before the round trip, and the database checks it again because
 * it is the one that cannot be walked around. The rules that are not about typing — a panel's area,
 * a type's fixed size, a recipe's dates — are the database's alone.
 */

const code = z
  .string()
  .trim()
  .min(1, "Kod boş olamaz.")
  .max(40, "Kod en çok 40 karakter olabilir.");

const name = z
  .string()
  .trim()
  .min(1, "Ad boş olamaz.")
  .max(120, "Ad en çok 120 karakter olabilir.");

const positive = (what: string) =>
  z.coerce.number({ error: `${what} bir sayı olmalı.` }).positive(`${what} sıfırdan büyük olmalı.`);

export const panelTypeInput = z
  .object({
    code,
    name,
    widthM: positive("En"),
    heightM: positive("Boy"),
    series: z.string().trim().max(40).optional().or(z.literal("")),
    step: z.coerce.number().int().optional(),
  })
  .refine((value) => !value.series || value.step !== undefined, {
    message: "Seri verildiyse kademe de verilmeli.",
    path: ["step"],
  });

export type PanelTypeInput = z.infer<typeof panelTypeInput>;

export const stripTypeInput = z.object({
  code,
  name,
  widthMm: positive("Genişlik"),
  thicknessMm: positive("Kalınlık"),
  holeCount: z.coerce.number().int().min(0, "Delik sayısı eksi olamaz.").default(0),
  standardLengthsM: z.array(positive("Standart boy")).default([]),
});

export type StripTypeInput = z.infer<typeof stripTypeInput>;

export const OUTPUT_KINDS = ["casting", "installation", "strip_installation"] as const;
export type OutputKind = (typeof OUTPUT_KINDS)[number];

export const PER_UNITS = ["piece", "m2", "m"] as const;
export type PerUnit = (typeof PER_UNITS)[number];

/** Which units one unit of output may be counted in, per kind of output (migration 0061). */
export const UNITS_FOR: Record<OutputKind, readonly PerUnit[]> = {
  casting: ["piece", "m2"],
  installation: ["piece", "m2"],
  strip_installation: ["m", "piece"],
};

export const recipeLineInput = z
  .object({
    outputKind: z.enum(OUTPUT_KINDS),
    panelTypeId: z.guid().nullish(),
    stripTypeId: z.guid().nullish(),
    perUnit: z.enum(PER_UNITS),
    materialItemId: z.guid({ error: "Sarf malzeme seçilmeli." }),
    qtyPerUnit: z.coerce
      .number({ error: "Miktar bir sayı olmalı." })
      .min(0, "Miktar eksi olamaz; kullanılmayacaksa sıfır yazılır."),
    validFrom: z.iso.date({ error: "Geçerlilik tarihi seçilmeli." }),
    reason: z.string().trim().min(3, "Neden en az üç harf olmalı.").max(300),
  })
  .refine((line) => UNITS_FOR[line.outputKind].includes(line.perUnit), {
    message: "Bu üretim türü bu birimle sayılmaz.",
    path: ["perUnit"],
  })
  .refine(
    (line) => (line.outputKind === "strip_installation" ? !line.panelTypeId : !line.stripTypeId),
    { message: "Tip, üretim türüne uymuyor.", path: ["outputKind"] },
  );

export type RecipeLineInput = z.infer<typeof recipeLineInput>;

/**
 * A number the way a person in Türkiye types it: "1,5" and "1.5" are the same, and a stray space is
 * nobody's mistake. Anything else is not a number, and the form says so in its own words.
 */
export function decimal(text: string | number | null | undefined): number {
  if (typeof text === "number") return text;
  const plain = String(text ?? "")
    .replace(/\s/g, "")
    .replace(",", ".");
  return plain === "" ? Number.NaN : Number(plain);
}

/** A panel's area, the way the database computes it (ADM-K2) — for a form's live preview only. */
export function panelArea(widthM: number, heightM: number): number {
  return Math.round(widthM * heightM * 10_000) / 10_000;
}

/** A strip's total length from its piece length and count (REQ-SIT-022) — never typed. */
export function stripLength(lengthM: number, count: number): number {
  return Math.round(lengthM * count * 1000) / 1000;
}

export const OUTPUT_LABELS: Record<OutputKind, string> = {
  casting: "Panel dökümü",
  installation: "Panel montajı",
  strip_installation: "Şerit montajı",
};

export const UNIT_LABELS: Record<PerUnit, string> = {
  m: "metre başına",
  m2: "m² başına",
  piece: "adet başına",
};

/** What the database says when it refuses, in a sentence a person reads. */
export function productionMessage(hint: string | undefined): string | null {
  if (hint === "adm.type_identity_fixed") {
    return "Kullanılan bir tipin kodu ve ölçüsü değişmez; farklı ölçü için yeni tip ekleyin.";
  }
  if (hint === "adm.recipe_append_only") {
    return "Reçete satırı değiştirilmez; yeni bir tarihten geçerli yeni satır ekleyin.";
  }
  return null;
}
