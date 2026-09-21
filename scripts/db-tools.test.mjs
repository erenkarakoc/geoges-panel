import { createHash, createHmac, pbkdf2Sync } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { parseConnectionString, parseEnv, safeError } from "./db-admin.mjs";
import { appUrl, scramVerifier } from "./db-app-role.mjs";
import { applicationSchemas } from "./db-backup.mjs";
import {
  BACKUP_MAX_AGE_MS,
  backupProblem,
  checksum,
  latestBackupTime,
  planMigrations,
  readMigrations,
} from "./db-migrate.mjs";

let dir;
function folder(files) {
  dir = mkdtempSync(join(tmpdir(), "db-tools-"));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
}
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

const file = (name, sql = `-- ${name}\n`) => ({ name, sql, checksum: checksum(sql) });

describe("migration runner (TASK-0101)", () => {
  it("reads migrations in name order with their down files", () => {
    const found = readMigrations(
      folder({
        "0002_b.sql": "-- irreversible: drops a column\nb",
        "0001_a.sql": "a",
        "0001_a.down.sql": "undo a",
      }),
    );
    expect(found.map((m) => [m.name, m.down])).toEqual([
      ["0001_a.sql", "undo a"],
      ["0002_b.sql", null],
    ]);
  });

  it("requires a down file or a stated reason why there is none", () => {
    expect(() => readMigrations(folder({ "0001_a.sql": "a" }))).toThrow(
      /needs 0001_a\.down\.sql or an "-- irreversible/,
    );
    rmSync(dir, { recursive: true });
    expect(() => readMigrations(folder({ "0001_a.sql": "-- irreversible:\na" }))).toThrow(/needs/);
  });

  it("rejects a down file without its migration", () => {
    expect(() =>
      readMigrations(folder({ "0001_a.sql": "a", "0001_a.down.sql": "", "0002_b.down.sql": "" })),
    ).toThrow(/0002_b\.down\.sql has no matching migration/);
  });

  it("finds every migration in the repository reversible or explained", () => {
    expect(readMigrations().length).toBeGreaterThan(0);
  });

  it("rejects badly named files and duplicate numbers", () => {
    expect(() => readMigrations(folder({ "1_a.sql": "-- irreversible: x" }))).toThrow(
      /0001_short_name/,
    );
    rmSync(dir, { recursive: true });
    expect(() =>
      readMigrations(
        folder({ "0001_a.sql": "-- irreversible: x", "0001_b.sql": "-- irreversible: x" }),
      ),
    ).toThrow(/share number 0001/);
  });

  it("ignores line endings in the checksum", () => {
    expect(checksum("a\r\nb\r\n")).toBe(checksum("a\nb\n"));
  });

  it("returns only the files not yet applied", () => {
    const files = [file("0001_a.sql"), file("0002_b.sql")];
    const pending = planMigrations(files, [{ name: "0001_a.sql", checksum: files[0].checksum }]);
    expect(pending.map((f) => f.name)).toEqual(["0002_b.sql"]);
  });

  it("stops when an applied file changed", () => {
    expect(() =>
      planMigrations([file("0001_a.sql", "edited")], [{ name: "0001_a.sql", checksum: "old" }]),
    ).toThrow(/changed after it was applied/);
  });

  it("stops when an applied file is missing", () => {
    expect(() => planMigrations([], [{ name: "0001_a.sql", checksum: "x" }])).toThrow(
      /missing from db\/migrations/,
    );
  });

  it("stops when a new file sorts before an applied one", () => {
    const b = file("0002_b.sql");
    expect(() =>
      planMigrations([file("0001_a.sql"), b], [{ name: "0002_b.sql", checksum: b.checksum }]),
    ).toThrow(/sorts before the applied 0002_b.sql/);
  });
});

describe("pre-migration dump rule (TASK-0101, D-255)", () => {
  const now = Date.parse("2026-09-21T12:00:00Z");

  it("needs no dump while the environment holds only test data", () => {
    expect(backupProblem({ realData: false, pendingCount: 1, backupTime: null, now })).toBeNull();
  });

  it("needs a dump once the environment holds real data", () => {
    expect(backupProblem({ realData: true, pendingCount: 1, backupTime: null, now })).toMatch(
      /no dump found/,
    );
  });

  it("refuses a dump older than an hour and accepts a fresh one", () => {
    const old = now - BACKUP_MAX_AGE_MS - 1;
    expect(backupProblem({ realData: true, pendingCount: 1, backupTime: old, now })).toMatch(
      /older than an hour/,
    );
    expect(
      backupProblem({ realData: true, pendingCount: 1, backupTime: now - 60_000, now }),
    ).toBeNull();
  });

  it("finds the newest non-empty dump", () => {
    const d = folder({ "a.dump": "x", "b.dump": "", "c.txt": "x" });
    const t = new Date("2026-09-21T10:00:00Z");
    utimesSync(join(d, "a.dump"), t, t);
    expect(latestBackupTime(d)).toBe(t.getTime());
    mkdirSync(join(d, "empty"));
    expect(latestBackupTime(join(d, "empty"))).toBeNull();
  });

  it("dumps our schemas, not the provider's", () => {
    expect(applicationSchemas(["auth", "core", "storage", "pg_toast", "sit", "public"])).toEqual([
      "core",
      "public",
      "sit",
    ]);
  });
});

describe("runtime role password (TASK-0101)", () => {
  it("stores a SCRAM-SHA-256 verifier that matches the password", () => {
    const salt = Buffer.from("W22ZaJ0SNY7soEsUEjb6gQ==", "base64");
    const verifier = scramVerifier("pencil", salt);
    const [, iterations, saltB64, storedKey, serverKey] =
      /^SCRAM-SHA-256\$(\d+):([^$]+)\$([^:]+):(.+)$/.exec(verifier);
    expect(iterations).toBe("4096");
    expect(saltB64).toBe("W22ZaJ0SNY7soEsUEjb6gQ==");
    // Independent recomputation of RFC 5802 keys.
    const salted = pbkdf2Sync("pencil", salt, 4096, 32, "sha256");
    const clientKey = createHmac("sha256", salted).update("Client Key").digest();
    expect(storedKey).toBe(createHash("sha256").update(clientKey).digest("base64"));
    expect(serverKey).toBe(createHmac("sha256", salted).update("Server Key").digest("base64"));
    // RFC 7677 section 3 exchange: the server signature derived from this ServerKey matches.
    const nonce = "rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0";
    const authMessage = `n=user,r=rOprNGfwEbeRWgbNEkqO,r=${nonce},s=${saltB64},i=4096,c=biws,r=${nonce}`;
    const signature = createHmac("sha256", Buffer.from(serverKey, "base64"))
      .update(authMessage)
      .digest("base64");
    expect(signature).toBe("6rriTRBi23WpRR/wtup+mMhUZUn/dB5nLTJRsjl95G4=");
    expect(verifier).not.toContain("pencil");
  });

  it("builds the pooler user name from the admin connection", () => {
    const url = appUrl("postgresql://postgres.abcref:p(a)ss@host.example:6543/postgres", "PW");
    expect(url).toBe("postgresql://geoges_app.abcref:PW@host.example:6543/postgres");
    expect(appUrl("postgresql://postgres:x@db.local:5432/geoges", "PW")).toBe(
      "postgresql://geoges_app:PW@db.local:5432/geoges",
    );
  });
});

describe("admin helpers (TASK-0101)", () => {
  it("parses dotenv lines with quotes and comments", () => {
    expect(parseEnv("# c\nA=1\nB=\"two words\"\nC='x=y'\n")).toEqual({
      A: "1",
      B: "two words",
      C: "x=y",
    });
  });

  it("splits a connection string whose password is not URL-encoded", () => {
    expect(parseConnectionString("postgresql://u.ref:a?b(c),d@h:6543/postgres")).toEqual({
      user: "u.ref",
      password: "a?b(c),d",
      host: "h",
      port: 6543,
      database: "postgres",
    });
  });

  it("prints server messages but only the code of connection errors", () => {
    expect(safeError({ code: "42501", message: "permission denied for table x" })).toBe(
      "42501: permission denied for table x",
    );
    expect(safeError({ code: "ENOTFOUND", message: "getaddrinfo ENOTFOUND secret.host" })).toBe(
      "ENOTFOUND",
    );
    expect(
      safeError({ code: "28P01", message: 'password authentication failed for user "x"' }),
    ).toBe("28P01");
  });
});
