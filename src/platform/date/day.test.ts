import { describe, expect, it } from "vitest";

import { addDays, formatDayLong, formatDayShort, parseDay, todayIn } from "@/platform/date/day";

describe("parseDay", () => {
  it("accepts real calendar days only", () => {
    expect(parseDay("2026-09-16")).toBe("2026-09-16");
    expect(parseDay("2026-02-30")).toBeNull();
    expect(parseDay("16.09.2026")).toBeNull();
    expect(parseDay(undefined)).toBeNull();
  });
});

describe("addDays", () => {
  it("crosses month and year ends", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("todayIn", () => {
  it("uses the company time zone, not UTC", () => {
    // 22:30 UTC on 16 September is already 17 September in Istanbul (UTC+3).
    expect(todayIn("Europe/Istanbul", new Date("2026-09-16T22:30:00Z"))).toBe("2026-09-17");
  });
});

describe("formatting", () => {
  it("writes Turkish day names", () => {
    expect(formatDayShort("2026-09-16")).toBe("16 Eyl");
    expect(formatDayLong("2026-09-16")).toBe("16 Eylül 2026 Çarşamba");
  });
});
