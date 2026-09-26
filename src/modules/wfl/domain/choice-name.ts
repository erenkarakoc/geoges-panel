/**
 * What the designer calls a stored choice that is not among the things it can offer (owner
 * 2026-09-26: a code is never shown to a person).
 *
 * The company's templates are written for the whole panel, so a copy can name an event, a field, a
 * record state or a list of a module that arrives in a later slice — `daily_site_log.submitted`,
 * `client_approved` — and a flow can keep a role that was since retired. The select then has nothing
 * to show but the stored value. Instead it shows the name the requirements gave the thing and says
 * the module is not built yet; when even that is missing it says the choice is unknown rather than
 * printing the code.
 */

import { resolveFieldCode } from "@/modules/wfl/domain/condition-value";

export type ChoiceKind =
  | "event"
  | "field"
  | "relation"
  | "role"
  | "person"
  | "permission"
  | "flow"
  | "status"
  | "recordType"
  | "list"
  | "transition";

const UNKNOWN: Record<ChoiceKind, string> = {
  event: "Tanımsız olay",
  field: "Tanımsız bilgi",
  relation: "Tanımsız ilişki",
  role: "Kaldırılmış rol",
  person: "Kaldırılmış kişi",
  permission: "Kaldırılmış yetki",
  flow: "Silinmiş akış",
  status: "Tanımsız durum",
  recordType: "Tanımsız kayıt türü",
  list: "Modülü henüz kurulmamış bir liste",
  transition: "Modülü henüz kurulmamış bir işlem",
};

const NOT_BUILT = "(modülü henüz kurulmadı)";

export type ChoiceContext = {
  /** Every capability name the requirements define, built or not (`capability-names.json`). */
  written: Readonly<Record<string, string>>;
  /**
   * The record the flow is about — the part before the dot of its trigger event — so that a
   * condition's `record.amount` is read as that record's amount.
   */
  recordEntity?: string;
  /** The codes of the events and fields that are built, whose names need no "not built yet". */
  built?: ReadonlySet<string>;
  /** Whether the module owning the flow's record offers its states (for a record state). */
  statesOffered?: boolean;
};

export function unknownChoiceName(value: string, kind: ChoiceKind, context: ChoiceContext): string {
  const { written, recordEntity, built = new Set<string>() } = context;
  if (kind === "status") {
    return context.statesOffered ? UNKNOWN.status : "Modülü henüz kurulmamış bir durum";
  }
  if (kind === "recordType") {
    // A flow opens a draft through the module's `<record>.create_draft` action (D-095).
    const table = value.slice(value.indexOf(".") + 1);
    const name = written[`${table}.create_draft`];
    return name ? `${name} ${NOT_BUILT}` : UNKNOWN.recordType;
  }
  if (kind !== "event" && kind !== "field") return UNKNOWN[kind];
  const code =
    kind === "field"
      ? resolveFieldCode(value, (one) => Boolean(written[one]), recordEntity)
      : written[value]
        ? value
        : undefined;
  if (!code) return UNKNOWN[kind];
  return built.has(code) ? written[code] : `${written[code]} ${NOT_BUILT}`;
}

/** The record a trigger event is about: `daily_site_log.submitted` → `daily_site_log`. */
export function recordEntityOf(event: unknown): string | undefined {
  if (typeof event !== "string") return undefined;
  const dot = event.indexOf(".");
  return dot > 0 ? event.slice(0, dot) : undefined;
}
