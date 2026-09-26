/**
 * How a condition asks for the value it compares with (owner 2026-09-26).
 *
 * "Hangi değerle?" used to be a text box, so a person had to know that a project at completion is
 * written `completion`. A field says what kind of value it holds — a choice, a number, yes/no, a
 * person — and the designer asks for exactly that: a list to pick from, a number with its unit, or
 * Evet/Hayır. The comparisons offered follow the kind too, since "greater than" means nothing for a
 * project stage. Only a plain text field is still typed, because its value is free text.
 */

export type ValueKind = "choice" | "number" | "boolean" | "person" | "date" | "text";

export type ValueShape = {
  kind: ValueKind;
  /** What a number is counted in, said next to the box: "TL", "%", "gün". */
  unit?: string;
};

export type ValueOption = { code: string; name: string };

/** The engine's own answers to an approval (D-099), for the `approval.decision` field. */
export const APPROVAL_DECISIONS: readonly ValueOption[] = [
  { code: "approve", name: "Onayla" },
  { code: "reject", name: "Reddet" },
  { code: "return", name: "Düzeltmeye geri gönder" },
];

/** Evet/Hayır, stored as the true and false the engine compares. */
export const YES_NO: readonly ValueOption[] = [
  { code: "true", name: "Evet" },
  { code: "false", name: "Hayır" },
];

const BUILT: Record<string, ValueKind> = {
  boolean: "boolean",
  choice: "choice",
  date: "date",
  list: "choice",
  number: "number",
  person: "person",
  scope: "choice",
  text: "text",
};

/**
 * A field's shape from its type: the code catalog's word (`choice`, `number` …) for a built module,
 * the requirements' Turkish word (`seçim`, `tutar`, `sayı (%)` …) for one that is not built yet.
 */
export function valueShapeOf(type: string | undefined): ValueShape {
  if (!type) return { kind: "text" };
  if (BUILT[type]) return { kind: BUILT[type] };
  const word = type.toLocaleLowerCase("tr-TR");
  if (word.startsWith("seçim") || word.startsWith("liste") || word.startsWith("kapsam")) {
    return { kind: "choice" };
  }
  if (word.startsWith("şantiye")) return { kind: "choice" };
  if (word.startsWith("evet")) return { kind: "boolean" };
  if (word.startsWith("kişi")) return { kind: "person" };
  if (word.startsWith("tarih")) return { kind: "date" };
  if (word.startsWith("tutar")) return { kind: "number", unit: "TL" };
  if (word.startsWith("sayı")) {
    const inside = /\(([^)]+)\)/.exec(word)?.[1];
    if (inside === "%") return { kind: "number", unit: "%" };
    if (inside === "gün") return { kind: "number", unit: "gün" };
    if (inside === "saat") return { kind: "number", unit: "saat" };
    if (inside === "0–100") return { kind: "number", unit: "0 ile 100 arası" };
    return { kind: "number" };
  }
  return { kind: "text" };
}

/** The comparisons that mean something for a kind of value. */
export function comparisonsFor(kind: ValueKind): readonly string[] {
  if (kind === "number" || kind === "date") return ["=", "!=", ">", ">=", "<", "<="];
  if (kind === "text") return ["=", "!=", "exists"];
  return ["=", "!="];
}

/**
 * The catalog field a condition's field stands for. `record.stage` in a flow about a project is the
 * project's stage; the event may be named after a narrower thing than the record
 * (`weighbridge_difference.exceeded` is about a weighing, whose field is
 * `weighbridge.difference_percent`), so the record's name is shortened a word at a time until the
 * field is known.
 */
export function resolveFieldCode(
  value: string,
  known: (code: string) => boolean,
  recordEntity: string | undefined,
): string | undefined {
  if (known(value)) return value;
  if (!value.startsWith("record.") || !recordEntity) return undefined;
  const field = value.slice("record.".length);
  let entity = recordEntity;
  while (entity) {
    if (known(`${entity}.${field}`)) return `${entity}.${field}`;
    entity = entity.includes("_") ? entity.slice(0, entity.lastIndexOf("_")) : "";
  }
  return undefined;
}
