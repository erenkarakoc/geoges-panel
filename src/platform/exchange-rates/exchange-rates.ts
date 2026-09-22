/**
 * `ExchangeRateProvider` port and its CBRT (TCMB) adapter (PORTS_AND_SERVICES section 1,
 * REQ-ADM-013, D-140, SPIKE-11). The adapter asks for the bulletin of a given day at its dated
 * address and trusts only the bulletin's own `Tarih` (dd.mm.yyyy) — never `today.xml`, never the
 * US-ordered `Date`. Rates are per one unit: `ForexBuying / Unit` (JPY is published per 100).
 * Nothing is sent to TCMB but the request for a public file (PORTS_AND_SERVICES section 6).
 */

export type BulletinRate = { currency: string; rate: number };

export type BulletinResult =
  | { kind: "published"; bulletinOn: string; rates: BulletinRate[] }
  /** 404: no bulletin that day (weekend, holiday, or not yet published) — not an error. */
  | { kind: "not_published" }
  /** A bulletin came, but for another day: nothing is written (SPIKE-11, trap 1). */
  | { kind: "wrong_day"; bulletinOn: string }
  | { kind: "failed"; reason: string };

export interface ExchangeRateProvider {
  /** The bulletin of one day (YYYY-MM-DD, Istanbul). */
  fetchBulletin(day: string): Promise<BulletinResult>;
}

/** https://www.tcmb.gov.tr/kurlar/YYYYMM/DDMMYYYY.xml for a YYYY-MM-DD day. */
export function tcmbBulletinUrl(day: string): string {
  const [y, m, d] = day.split("-");
  return `https://www.tcmb.gov.tr/kurlar/${y}${m}/${d}${m}${y}.xml`;
}

const TARIH = /<Tarih_Date\b[^>]*\bTarih="(\d{2})\.(\d{2})\.(\d{4})"/;
const CURRENCY = /<Currency\b[^>]*\bCurrencyCode="([A-Z]{3})"[^>]*>([\s\S]*?)<\/Currency>/g;
const UNIT = /<Unit>\s*([\d.]+)\s*<\/Unit>/;
const FOREX_BUYING = /<ForexBuying>\s*([\d.]+)\s*<\/ForexBuying>/;

/** The bulletin's day and its buying rates per one unit; currencies without a buying rate skipped. */
export function parseTcmbBulletin(xml: string): { bulletinOn: string; rates: BulletinRate[] } {
  const tarih = TARIH.exec(xml);
  if (!tarih) throw new Error("bulletin has no Tarih");
  const bulletinOn = `${tarih[3]}-${tarih[2]}-${tarih[1]}`;
  const rates: BulletinRate[] = [];
  for (const block of xml.matchAll(CURRENCY)) {
    const unit = Number(UNIT.exec(block[2])?.[1]);
    const buying = Number(FOREX_BUYING.exec(block[2])?.[1]);
    if (!unit || !buying) continue;
    rates.push({ currency: block[1], rate: Number((buying / unit).toFixed(6)) });
  }
  return { bulletinOn, rates };
}

const reasonOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function createTcmbProvider({
  fetchImpl = fetch,
  timeoutMs = 10_000,
}: { fetchImpl?: typeof fetch; timeoutMs?: number } = {}): ExchangeRateProvider {
  return {
    async fetchBulletin(day) {
      let response: Response;
      try {
        response = await fetchImpl(tcmbBulletinUrl(day), {
          signal: AbortSignal.timeout(timeoutMs),
          cache: "no-store",
        });
      } catch (error) {
        return { kind: "failed", reason: reasonOf(error) };
      }
      if (response.status === 404) return { kind: "not_published" };
      if (!response.ok) return { kind: "failed", reason: `HTTP ${response.status}` };
      try {
        const bulletin = parseTcmbBulletin(await response.text());
        if (bulletin.bulletinOn !== day) {
          return { kind: "wrong_day", bulletinOn: bulletin.bulletinOn };
        }
        if (!bulletin.rates.length) return { kind: "failed", reason: "bulletin has no rates" };
        return { kind: "published", ...bulletin };
      } catch (error) {
        return { kind: "failed", reason: reasonOf(error) };
      }
    },
  };
}
