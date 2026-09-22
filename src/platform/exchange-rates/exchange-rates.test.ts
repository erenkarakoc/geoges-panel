import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createTcmbProvider, parseTcmbBulletin, tcmbBulletinUrl } from "./exchange-rates";

// The CBRT's public bulletin of 18 September 2026, kept so CI needs no network.
const BULLETIN = readFileSync(join(import.meta.dirname, "fixtures/tcmb-18092026.xml"), "utf8");

const respond = (status: number, body = "") =>
  (async () => new Response(body, { status })) as unknown as typeof fetch;

describe("TCMB bulletin (SPIKE-11)", () => {
  it("builds the dated address from a local day", () => {
    expect(tcmbBulletinUrl("2026-09-18")).toBe(
      "https://www.tcmb.gov.tr/kurlar/202609/18092026.xml",
    );
  });

  it("reads the day from Tarih (dd.mm.yyyy), not the US-ordered Date", () => {
    expect(parseTcmbBulletin(BULLETIN).bulletinOn).toBe("2026-09-18");
  });

  it("gives buying rates per one unit, dividing by Unit", () => {
    const rates = new Map(parseTcmbBulletin(BULLETIN).rates.map((r) => [r.currency, r.rate]));
    expect(rates.get("USD")).toBe(48.6116);
    expect(rates.get("EUR")).toBe(55.7981);
    expect(rates.get("JPY")).toBe(0.307666);
    expect(rates.size).toBe(22);
  });

  it("takes a 404 as 'no bulletin' and refuses another day's bulletin", async () => {
    await expect(
      createTcmbProvider({ fetchImpl: respond(404) }).fetchBulletin("2026-09-20"),
    ).resolves.toEqual({ kind: "not_published" });
    await expect(
      createTcmbProvider({ fetchImpl: respond(200, BULLETIN) }).fetchBulletin("2026-09-21"),
    ).resolves.toEqual({ kind: "wrong_day", bulletinOn: "2026-09-18" });
    const ok = await createTcmbProvider({ fetchImpl: respond(200, BULLETIN) }).fetchBulletin(
      "2026-09-18",
    );
    expect(ok.kind).toBe("published");
  });

  it("reports a server error or a broken file as a failure, never as rates", async () => {
    await expect(
      createTcmbProvider({ fetchImpl: respond(503) }).fetchBulletin("2026-09-18"),
    ).resolves.toEqual({ kind: "failed", reason: "HTTP 503" });
    const broken = await createTcmbProvider({ fetchImpl: respond(200, "<html/>") }).fetchBulletin(
      "2026-09-18",
    );
    expect(broken.kind).toBe("failed");
  });
});
