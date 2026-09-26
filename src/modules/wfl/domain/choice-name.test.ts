import { describe, expect, it } from "vitest";

import { recordEntityOf, unknownChoiceName } from "./choice-name";

const written = {
  "daily_site_log.submitted": "Günlük kayıt onaya gönderildi",
  "daily_site_log.expense_total": "Günün saha harcaması",
  "weighbridge.difference_percent": "Kantar farkı",
  "client_progress_payment.create_draft": "Taslak hakediş hazırla",
};

describe("a stored choice the designer cannot offer", () => {
  it("takes the requirements' name for an event of a module not built yet", () => {
    expect(unknownChoiceName("daily_site_log.submitted", "event", { written })).toBe(
      "Günlük kayıt onaya gönderildi (modülü henüz kurulmadı)",
    );
  });

  it("reads a condition's record field as the trigger record's own field", () => {
    const context = { written, recordEntity: "daily_site_log" };
    expect(unknownChoiceName("record.expense_total", "field", context)).toBe(
      "Günün saha harcaması (modülü henüz kurulmadı)",
    );
  });

  it("shortens an event's record name until the field is known", () => {
    const context = { written, recordEntity: "weighbridge_difference" };
    expect(unknownChoiceName("record.difference_percent", "field", context)).toBe(
      "Kantar farkı (modülü henüz kurulmadı)",
    );
  });

  it("does not call a built module's field unbuilt", () => {
    const context = {
      written,
      recordEntity: "daily_site_log",
      built: new Set(["daily_site_log.expense_total"]),
    };
    expect(unknownChoiceName("record.expense_total", "field", context)).toBe(
      "Günün saha harcaması",
    );
  });

  it("names a draft to open by the module's own action", () => {
    expect(unknownChoiceName("fin.client_progress_payment", "recordType", { written })).toBe(
      "Taslak hakediş hazırla (modülü henüz kurulmadı)",
    );
  });

  it("says whether a record state is unknown or its module is not built", () => {
    expect(unknownChoiceName("client_approved", "status", { written })).toBe(
      "Modülü henüz kurulmamış bir durum",
    );
    expect(unknownChoiceName("gone", "status", { written, statesOffered: true })).toBe(
      "Tanımsız durum",
    );
  });

  it("never shows the code, even when nothing names it", () => {
    expect(unknownChoiceName("progress_claim.approved", "event", { written })).toBe(
      "Tanımsız olay",
    );
    expect(unknownChoiceName("record.owner", "relation", { written })).toBe("Tanımsız ilişki");
    expect(unknownChoiceName("XYZ", "role", { written })).toBe("Kaldırılmış rol");
    expect(unknownChoiceName("quote.send", "transition", { written })).toBe(
      "Modülü henüz kurulmamış bir işlem",
    );
    expect(unknownChoiceName("sit.active_sites", "list", { written })).toBe(
      "Modülü henüz kurulmamış bir liste",
    );
  });

  it("finds the record a trigger event is about", () => {
    expect(recordEntityOf("daily_site_log.submitted")).toBe("daily_site_log");
    expect(recordEntityOf(undefined)).toBeUndefined();
    expect(recordEntityOf("nodot")).toBeUndefined();
  });
});
