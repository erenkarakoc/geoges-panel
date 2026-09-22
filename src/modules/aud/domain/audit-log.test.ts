import { describe, expect, it } from "vitest";

import {
  auditActorLabel,
  auditEventLabel,
  auditLogQuery,
  auditLogRange,
  auditTargetLabel,
  parseAuditLogFilters,
} from "./audit-log";

const PERSON = "0192f0c1-0000-7000-8000-000000000001";

describe("audit log filters (SCR-193)", () => {
  it("reads the Turkish query parameters", () => {
    expect(
      parseAuditLogFilters({
        kisi: PERSON,
        islem: "role_assignment.",
        kayit: "iam.user",
        baslangic: "2026-09-01",
        bitis: "2026-09-22",
        sayfa: "3",
      }),
    ).toEqual({
      actorId: PERSON,
      eventPrefix: "role_assignment.",
      targetTable: "iam.user",
      fromDay: "2026-09-01",
      toDay: "2026-09-22",
      page: 3,
    });
  });

  it("drops invalid or unknown values instead of failing", () => {
    expect(
      parseAuditLogFilters({
        kisi: "x",
        islem: "drop.",
        kayit: "",
        baslangic: "22.09.2026",
        sayfa: "0",
      }),
    ).toEqual({
      actorId: null,
      eventPrefix: null,
      targetTable: null,
      fromDay: null,
      toDay: null,
      page: 1,
    });
  });

  it("turns calendar days into Istanbul instants with an inclusive end day", () => {
    const { from, to } = auditLogRange(
      parseAuditLogFilters({ baslangic: "2026-09-22", bitis: "2026-09-22" }),
    );
    expect(from?.toISOString()).toBe("2026-09-21T21:00:00.000Z");
    expect(to?.toISOString()).toBe("2026-09-22T21:00:00.000Z");
  });

  it("writes the address back without empty values or the first page", () => {
    const filters = parseAuditLogFilters({ islem: "user.", sayfa: "2" });
    expect(auditLogQuery(filters)).toBe("?islem=user.&sayfa=2");
    expect(auditLogQuery(filters, 1)).toBe("?islem=user.");
    expect(auditLogQuery(parseAuditLogFilters({}))).toBe("");
  });
});

describe("audit log labels", () => {
  it("names known events in Turkish and shows unknown codes as they are", () => {
    expect(auditEventLabel("role_assignment.created")).toBe("Rol atandı");
    expect(auditEventLabel("sit.unknown")).toBe("sit.unknown");
    expect(auditTargetLabel("iam", "user")).toBe("Kullanıcı");
    expect(auditTargetLabel(null, null)).toBeNull();
    expect(auditActorLabel("x", "geoges-admin")).toBe("geoges-admin");
    expect(auditActorLabel("x", null)).toBe("Kaldırılmış hesap");
    expect(auditActorLabel(null, null)).toBe("Sistem");
  });
});
