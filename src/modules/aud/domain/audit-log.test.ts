import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  AUDIT_EVENT_LABELS,
  AUDIT_TARGET_TABLES,
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
  it("names known events in Turkish and never shows a raw code", () => {
    expect(auditEventLabel("role_assignment.created")).toBe("Rol atandı");
    expect(auditEventLabel("sit.unknown")).toBe("Diğer işlem");
    expect(auditTargetLabel("iam", "user")).toBe("Kullanıcı");
    expect(auditTargetLabel("sit", "unknown")).toBe("Diğer kayıt");
    expect(auditTargetLabel(null, null)).toBeNull();
    expect(auditActorLabel("x", "geoges-admin")).toBe("geoges-admin");
    expect(auditActorLabel("x", null)).toBe("Kaldırılmış hesap");
    expect(auditActorLabel(null, null)).toBe("Sistem");
  });

  /**
   * Seen on the screen on 2026-09-24: the account-security events of TASK-0112 arrived in the log
   * with no Turkish name, so the owner's own log read `sign_in.locked`. Writing an event and
   * naming it are two places, and only the screen shows that one was forgotten.
   */
  it("names the account-security events too", () => {
    expect(auditEventLabel("sign_in.locked")).toBe("Giriş kilitlendi");
    expect(auditEventLabel("two_factor.enrolled")).toBe("İki adımlı doğrulama kuruldu");
    expect(auditEventLabel("two_factor.reset")).toBe("İki adımlı doğrulama sıfırlandı");
  });

  /**
   * The owner saw `workflow.template_reset` and `approval.decided` in the log on 2026-09-26, two
   * days after the same slip with the account-security events: a module writes a new event and
   * nobody names it. So the names are checked against every place that writes the log — the
   * migrations, the seeds, the admin scripts and the code — and a new code without a name stops the
   * commit instead of reaching the screen.
   */
  it("names every event and record type the panel writes to the log", () => {
    const written = auditLogWrites();
    // Built from parts where they are written, so no literal carries the whole code.
    for (const code of ["user.signed_in", "user.signed_out"]) written.codes.add(code); // iam.note_session
    for (const code of ["environment.reset_data", "environment.reset_config"])
      written.codes.add(code); // db-reset.mjs
    expect(written.codes.size).toBeGreaterThan(30);
    expect([...written.codes].filter((c) => !(c in AUDIT_EVENT_LABELS))).toEqual([]);
    const named = new Set<string>(AUDIT_TARGET_TABLES.map((t) => t.value));
    expect([...written.targets].filter((t) => !named.has(t))).toEqual([]);
  });
});

const ROOT = resolve(import.meta.dirname, "../../../..");

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

/**
 * Every event code and `schema.table` target written to `aud.audit_log`, read from the source:
 * `aud.record_event(…)` calls, direct inserts, the admin tools' `recordToolEvent(…)` and the
 * `kind :=` / `code :=` assignments of the trigger functions that pick the code.
 */
function auditLogWrites(): { codes: Set<string>; targets: Set<string> } {
  const files = [
    ...filesUnder(join(ROOT, "db/migrations")).filter(
      (f) => f.endsWith(".sql") && !f.endsWith(".down.sql"),
    ),
    ...filesUnder(join(ROOT, "db/seeds")),
    ...filesUnder(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs") && !f.includes(".test.")),
    ...filesUnder(join(ROOT, "src")).filter((f) => /\.tsx?$/.test(f) && !/\.(db)?test\./.test(f)),
  ];
  const first = String.raw`\s*(case\b[\s\S]*?\bend|'[^']*'|"[^"]*"|[^,()]+)`;
  const target = String.raw`\s*,\s*(?:'([a-z]+)'|[^,]+)\s*,\s*(?:'([a-z_]+)')?`;
  const patterns = [
    new RegExp(String.raw`aud\.record_event\(` + first + target, "g"),
    new RegExp(String.raw`insert into aud\.audit_log\s*\([^)]*\)\s*values\s*\(` + first, "g"),
    new RegExp(String.raw`recordToolEvent\(\s*\w+\s*,` + first, "g"),
    /\b(?:kind|code)\s*:=([^;]*)/g,
  ];
  const codes = new Set<string>();
  const targets = new Set<string>();
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const pattern of patterns) {
      for (const m of source.matchAll(pattern)) {
        for (const literal of m[1].matchAll(/['"]([a-z_]+\.[a-z_]+)['"]/g)) codes.add(literal[1]);
        if (m[2] && m[3]) targets.add(`${m[2]}.${m[3]}`);
      }
    }
    // A direct insert names its target by column, in any order.
    for (const m of source.matchAll(
      /insert into aud\.audit_log\s*\(([^)]*)\)\s*values\s*\(([^;]*)/g,
    )) {
      const columns = m[1].split(",").map((c) => c.trim());
      const values = m[2].split(/,(?![^(]*\))/).map((v) => v.trim());
      const schema = values[columns.indexOf("target_schema")] ?? "";
      const table = values[columns.indexOf("target_table")] ?? "";
      if (/^'[a-z]+'$/.test(schema) && /^'[a-z_]+'$/.test(table)) {
        targets.add(`${schema.slice(1, -1)}.${table.slice(1, -1)}`);
      }
    }
  }
  return { codes, targets };
}
