import { describe, expect, it } from "vitest";

import { addDays, istanbulDay, istanbulMinutes, minutesOf } from "./istanbul";

describe("Istanbul calendar (SPIKE-11 correction 1)", () => {
  it("counts the day in Turkish local time, not UTC", () => {
    // 02:30 Monday 21 September in Istanbul is still Sunday in UTC.
    const at = new Date("2026-09-20T23:30:00Z");
    expect(at.toISOString().slice(0, 10)).toBe("2026-09-20");
    expect(istanbulDay(at)).toBe("2026-09-21");
    expect(istanbulMinutes(at)).toBe(150);
  });

  it("reads HH:MM and moves days across month ends", () => {
    expect(minutesOf("16:00")).toBe(960);
    expect(() => minutesOf("24:00")).toThrow();
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});
