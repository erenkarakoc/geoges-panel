/**
 * How a target line reads (TASK-0123 step 2): "P-150 · Tam panel — 100 adet (225 m²)",
 * "40x4 · Şerit, 6 m boy — 900 m", "Harpuşta — 50". Shared by the card, the editor and the diff.
 */

export type TargetNames = {
  panel: Readonly<Record<string, string>>;
  panelArea: Readonly<Record<string, number>>;
  strip: Readonly<Record<string, string>>;
  workItem: Readonly<Record<string, string>>;
};

type Line = {
  kind: "panel" | "strip" | "work_item";
  panelTypeId: string | null;
  stripTypeId: string | null;
  stripLengthM: number | null;
  workItemId: string | null;
};

const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 3 });

/** What the line is about, without its amount. */
export function targetSubject(line: Line, names: TargetNames): string {
  if (line.kind === "panel") return names.panel[line.panelTypeId ?? ""] ?? "Tanımsız panel tipi";
  if (line.kind === "strip")
    return `${names.strip[line.stripTypeId ?? ""] ?? "Tanımsız şerit tipi"}, ${number.format(line.stripLengthM ?? 0)} m boy`;
  return names.workItem[line.workItemId ?? ""] ?? "Tanımsız iş kalemi";
}

/** The amount in its unit: pieces with their area for panels, metres for strips. */
export function targetAmount(line: Line, amount: number | null, names: TargetNames): string {
  if (amount === null) return "—";
  if (line.kind === "panel") {
    const area = names.panelArea[line.panelTypeId ?? ""];
    return area
      ? `${number.format(amount)} adet (${number.format(amount * area)} m²)`
      : `${number.format(amount)} adet`;
  }
  if (line.kind === "strip") return `${number.format(amount)} m`;
  return number.format(amount);
}
