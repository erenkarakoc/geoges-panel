import { describe, expect, it } from "vitest";

import { isOverdue, officeItemInput, officeMessage, supplyInput } from "./technical-office";

describe("technical office items and the supply matrix (REQ-PRJ-004, REQ-PRJ-005)", () => {
  it("calls an item late only while it is still work", () => {
    const today = "2026-09-26";
    expect(isOverdue({ dueOn: "2026-09-25", status: "open" }, today)).toBe(true);
    expect(isOverdue({ dueOn: "2026-09-25", status: "in_progress" }, today)).toBe(true);
    expect(isOverdue({ dueOn: "2026-09-26", status: "open" }, today)).toBe(false);
    expect(isOverdue({ dueOn: "2026-09-25", status: "delivered" }, today)).toBe(false);
    expect(isOverdue({ dueOn: null, status: "open" }, today)).toBe(false);
  });

  it("takes an empty person and day as none, and wants a kind", () => {
    const parsed = officeItemInput.parse({
      assigneeUserId: "",
      dueOn: "",
      title: "Statik hesap",
      typeItemId: "0192f0c1-0123-7500-8000-000000000001",
    });
    expect(parsed).toMatchObject({ assigneeUserId: null, dueOn: null });
    expect(officeItemInput.safeParse({ title: "Statik hesap", typeItemId: "" }).success).toBe(
      false,
    );
    expect(
      supplyInput.safeParse({
        itemId: "0192f0c1-0123-7500-8000-000000000001",
        responsibility: "someone",
        validFrom: "2026-09-26",
      }).success,
    ).toBe(false);
  });

  it("says why a matrix change was refused", () => {
    expect(officeMessage({ hint: "prj.supply_backdated" })).toMatch(/geçmiş dönem/);
    expect(officeMessage({ code: "42501" })).toMatch(/yetkiniz yok/);
  });
});
