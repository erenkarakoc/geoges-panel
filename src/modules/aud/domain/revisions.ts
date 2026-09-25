import { z } from "zod";

/**
 * Revision request rules that need no database (TASK-0109, REQ-AUD-007…010, D-265): building the
 * list of changed fields, what a screen may show of a request, and the words of each state.
 */

export type RevisionStatus = "pending" | "approved" | "rejected" | "stale";

export const REVISION_STATUS_LABELS: Record<RevisionStatus, string> = {
  pending: "Karar bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  stale: "Kayıt değişmiş, yeniden talep gerekiyor",
};

/** One field of a request: what it holds today and what it should hold. */
export type RevisionChange = {
  field: string;
  /** Turkish name of the field, for the approval screen. */
  label?: string;
  old: unknown;
  new: unknown;
};

export const REVISION_RULE_MESSAGES: Record<string, string> = {
  "aud.not_revisable": "Bu kayıt türü için revizyon talebi açılamaz.",
  "aud.may_not_request": "Bu kayıt için değişiklik isteme yetkiniz yok.",
  "aud.no_changes": "En az bir alan seçin.",
  "aud.field_not_revisable": "Seçilen alan revizyona açık değil.",
  "aud.revision_open": "Bu kayıt için zaten karar bekleyen bir talep var.",
  "aud.not_found": "Talep bulunamadı.",
  "aud.not_approver": "Bu talebi karara bağlama yetkiniz yok.",
  "aud.reason_required": "Reddetme gerekçesi zorunludur.",
  "aud.revision_not_approved": "Düzeltme hareketi yalnız onaylanmış talebe bağlanır.",
  "aud.no_delete": "Revizyon talebi silinmez.",
  "aud.revision_fixed": "Talebin kaydı, alanları ve gerekçesi değişmez.",
  "aud.revision_decided": "Karara bağlanmış talep yeniden beklemeye alınmaz.",
};

/**
 * The fields that actually change, as the request stores them. A field asked for with the value
 * it already holds is left out, so an approver never reads "X → X"; asking for nothing at all is
 * refused by the caller.
 */
export function buildChanges(
  current: Readonly<Record<string, unknown>>,
  wanted: Readonly<Record<string, unknown>>,
  fields: readonly { code: string; label?: string }[],
): RevisionChange[] {
  const changes: RevisionChange[] = [];
  for (const field of fields) {
    if (!Object.hasOwn(wanted, field.code)) continue;
    const before = current[field.code] ?? null;
    const after = wanted[field.code] ?? null;
    if (same(before, after)) continue;
    changes.push({ field: field.code, label: field.label, old: before, new: after });
  }
  return changes;
}

/** Two values are the same for a request when they read the same; dates compare as instants. */
function same(a: unknown, b: unknown): boolean {
  if (a instanceof Date || b instanceof Date) {
    return instant(a) === instant(b);
  }
  if (typeof a === "object" && a !== null && typeof b === "object" && b !== null) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return a === b;
}

const instant = (value: unknown) =>
  value instanceof Date ? value.getTime() : new Date(String(value)).getTime();

/** What a value looks like on the approval screen; nothing is ever shown as "[object Object]". */
export function showValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Whether the values a request was made against still hold. The owning module compares the
 * record as it is now; a record that moved on makes the request stale rather than overwriting
 * someone else's work (D-265).
 */
export function stillCurrent(
  changes: readonly RevisionChange[],
  current: Readonly<Record<string, unknown>>,
): boolean {
  return changes.every((change) => same(current[change.field] ?? null, change.old ?? null));
}

export const submitRevisionSchema = z.object({
  recordSchema: z.string().regex(/^[a-z]{2,3}$/),
  recordTable: z.string().regex(/^[a-z][a-z0-9_]*$/),
  recordId: z.guid(),
  reason: z
    .string()
    .trim()
    .min(1, "Neden değişmesi gerektiğini yazın.")
    .max(2000, "Gerekçe en çok 2000 karakter olabilir."),
});

export const decideRevisionSchema = z.object({
  id: z.guid(),
  approve: z.boolean(),
  reason: z.string().trim().max(2000).optional(),
});
