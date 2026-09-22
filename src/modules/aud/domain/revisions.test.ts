import { describe, expect, it } from "vitest";

import {
  buildChanges,
  decideRevisionSchema,
  showValue,
  stillCurrent,
  submitRevisionSchema,
} from "./revisions";

const fields = [
  { code: "quantity", label: "Miktar" },
  { code: "note", label: "Not" },
  { code: "poured_on", label: "Döküm tarihi" },
];

describe("what a request asks to change (REQ-AUD-008, D-265)", () => {
  it("keeps only the fields that really change and carries their Turkish names", () => {
    const current = { quantity: 40, note: "ilk", poured_on: new Date("2026-09-20T00:00:00Z") };
    const wanted = { quantity: 42, note: "ilk", poured_on: new Date("2026-09-20T00:00:00Z") };
    expect(buildChanges(current, wanted, fields)).toEqual([
      { field: "quantity", label: "Miktar", old: 40, new: 42 },
    ]);
  });

  it("ignores a field nobody asked about and a field the register does not open", () => {
    const changes = buildChanges({ quantity: 1, price: 10 }, { price: 99 }, fields);
    expect(changes).toEqual([]);
  });

  it("reads an empty value as nothing, not as a change", () => {
    expect(buildChanges({ note: null }, { note: undefined }, fields)).toEqual([]);
    expect(buildChanges({ note: null }, { note: "yazıldı" }, fields)).toEqual([
      { field: "note", label: "Not", old: null, new: "yazıldı" },
    ]);
  });
});

describe("a record that moved on (D-265)", () => {
  it("is still current while the old values hold, and stale once one of them changed", () => {
    const changes = [
      { field: "quantity", old: 40, new: 42 },
      { field: "note", old: null, new: "düzeltildi" },
    ];
    expect(stillCurrent(changes, { quantity: 40, note: null })).toBe(true);
    expect(stillCurrent(changes, { quantity: 41, note: null })).toBe(false);
  });
});

describe("what the approval screen shows", () => {
  it("never prints an empty value or an object as code", () => {
    expect(showValue(null)).toBe("—");
    expect(showValue("")).toBe("—");
    expect(showValue(true)).toBe("Evet");
    expect(showValue(false)).toBe("Hayır");
    expect(showValue(new Date("2026-09-20T10:00:00Z"))).toBe("2026-09-20");
    expect(showValue(12.5)).toBe("12.5");
  });
});

describe("the forms (AUD-K4)", () => {
  it("asks for a reason on every request and refuses a refusal without one", () => {
    const record = { recordSchema: "sit", recordTable: "daily_log", recordId: crypto.randomUUID() };
    expect(submitRevisionSchema.safeParse({ ...record, reason: "  " }).success).toBe(false);
    expect(submitRevisionSchema.safeParse({ ...record, reason: "yanlış girilmiş" }).success).toBe(
      true,
    );
    const id = crypto.randomUUID();
    expect(decideRevisionSchema.parse({ id, approve: true }).approve).toBe(true);
    expect(decideRevisionSchema.safeParse({ id, approve: false, reason: "x" }).success).toBe(true);
  });
});
