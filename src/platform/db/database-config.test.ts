import { describe, expect, it } from "vitest";

import { readDatabaseConfig } from "./database-config";

const URL_OK =
  "postgresql://geoges_app.abc:s3cret-_x@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";
const readCa = () => "-----BEGIN CERTIFICATE-----";

describe("runtime database settings (TASK-0101)", () => {
  it("connects as the runtime role with the certificate verified", () => {
    const cfg = readDatabaseConfig({ DATABASE_APP_URL: URL_OK }, readCa);
    expect(cfg).toMatchObject({
      host: "aws-0-eu-west-1.pooler.supabase.com",
      port: 6543,
      database: "postgres",
      user: "geoges_app.abc",
      ssl: { rejectUnauthorized: true, servername: "aws-0-eu-west-1.pooler.supabase.com" },
    });
  });

  it("refuses to start without the runtime connection string", () => {
    expect(() => readDatabaseConfig({}, readCa)).toThrow(/DATABASE_APP_URL is missing/);
  });

  it("refuses the admin user", () => {
    expect(() =>
      readDatabaseConfig(
        { DATABASE_APP_URL: URL_OK.replace("geoges_app.abc", "postgres.abc") },
        readCa,
      ),
    ).toThrow(/restricted runtime role/);
  });

  it("refuses to connect unverified when the certificate is missing", () => {
    expect(() =>
      readDatabaseConfig({ DATABASE_APP_URL: URL_OK }, () => {
        throw new Error("ENOENT");
      }),
    ).toThrow(/root certificate not found/);
  });

  it("reads the certificate from DATABASE_CA_CERT_PATH when set", () => {
    let asked = "";
    readDatabaseConfig({ DATABASE_APP_URL: URL_OK, DATABASE_CA_CERT_PATH: "own/ca.crt" }, (p) => {
      asked = p;
      return "cert";
    });
    expect(asked).toBe("own/ca.crt");
  });

  it("finds the pinned certificate in the repository by default", () => {
    const cfg = readDatabaseConfig({ DATABASE_APP_URL: URL_OK });
    expect(String((cfg.ssl as { ca: string }).ca)).toContain("BEGIN CERTIFICATE");
  });
});
