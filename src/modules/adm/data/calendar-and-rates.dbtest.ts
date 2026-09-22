/**
 * Calendar and exchange rates against the real database (TASK-0106, REQ-ADM-010…015, D-140,
 * SPIKE-11). Rates and calendar rows can never be changed or deleted, so every test runs in an
 * admin transaction that is rolled back; the fetch job runs there with a fake CBRT and a set
 * clock. `npm run test:db`.
 */
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connectAdmin } from "../../../../scripts/db-admin.mjs";
import type {
  BulletinResult,
  ExchangeRateProvider,
} from "@/platform/exchange-rates/exchange-rates";
import { kyselyOn, type PooledClient } from "@/platform/db/run-as-user";

import {
  readAddBusinessDays,
  readIsBusinessDay,
  readRateFor,
  runExchangeRateFetch,
} from "./calendar-and-rates";

const SITE = "0192f0c1-0106-7000-8000-000000000101";

let admin: pg.Client;
const db = () => kyselyOn<unknown>(admin as unknown as PooledClient);

async function rolledBack(work: () => Promise<void>) {
  await admin.query("begin");
  try {
    await work();
  } finally {
    await admin.query("rollback");
  }
}

async function attempt(query: string, params: unknown[] = []) {
  await admin.query("savepoint a");
  try {
    await admin.query(query, params);
    await admin.query("release savepoint a");
    return "no error";
  } catch (e) {
    await admin.query("rollback to savepoint a");
    const err = e as { hint?: string; code?: string };
    return err.hint ?? err.code ?? "no code";
  }
}

/** A CBRT stand-in: answers per day from a script and records what it was asked. */
function fakeCbrt(answers: Record<string, BulletinResult | BulletinResult[]>) {
  const asked: string[] = [];
  const provider: ExchangeRateProvider = {
    async fetchBulletin(day) {
      asked.push(day);
      const answer = answers[day] ?? { kind: "not_published" };
      return Array.isArray(answer) ? (answer.shift() ?? { kind: "not_published" }) : answer;
    },
  };
  return { provider, asked };
}

const published = (day: string, usd: number): BulletinResult => ({
  kind: "published",
  bulletinOn: day,
  rates: [
    { currency: "USD", rate: usd },
    { currency: "JPY", rate: 0.307666 },
  ],
});

/** Istanbul wall-clock time as an instant. */
const at = (local: string) => new Date(`${local}+03:00`);

/** Marks every bulletin of the week before a day as already received, so only that day is due. */
async function receivedBefore(day: string) {
  await admin.query(
    `insert into adm.exchange_rate_fetch (bulletin_on, received_at, last_outcome)
     select d::date, now(), 'received'
       from generate_series($1::date - 8, $1::date - 1, interval '1 day') as d
     on conflict (bulletin_on) do update set received_at = now()`,
    [day],
  );
}

beforeAll(async () => {
  admin = await connectAdmin();
});

afterAll(async () => {
  await admin?.end();
});

describe("business days (REQ-ADM-010…012)", () => {
  it("skips weekends and full-day holidays; a half-day eve is a working day", async () => {
    await rolledBack(async () => {
      expect(await readIsBusinessDay(db(), "2026-03-19")).toBe(true); // Ramazan eve, half day
      expect(await readIsBusinessDay(db(), "2026-03-20")).toBe(false); // Ramazan 1st day
      expect(await readIsBusinessDay(db(), "2030-06-15")).toBe(false); // Saturday
      expect(await readAddBusinessDays(db(), "2026-03-18", 2)).toBe("2026-03-23");
      expect(await readAddBusinessDays(db(), "2026-03-23", -2)).toBe("2026-03-18");
    });
  });

  it("uses a site's own calendar over the company's, from its start date", async () => {
    await rolledBack(async () => {
      await admin.query(
        `insert into adm.working_calendar (scope_type, scope_id, valid_from, office_start, office_end,
                                           field_start, field_end, weekend_days, reason)
         values ('site', $1, '2026-06-01', '08:00', '17:00', '07:00', '19:00', '{7}', 'cumartesi çalışılır')`,
        [SITE],
      );
      expect(await readIsBusinessDay(db(), "2030-06-15", { siteId: SITE })).toBe(true);
      expect(await readIsBusinessDay(db(), "2026-05-16", { siteId: SITE })).toBe(false); // before
      expect(await readIsBusinessDay(db(), "2030-06-15")).toBe(false); // company unchanged
      expect(await attempt("update adm.working_calendar set salary_day = 5")).toBe(
        "adm.calendar_immutable",
      );
    });
  });
});

describe("the rate of a day (D-140, REQ-ADM-013…015)", () => {
  it("is the previous business day's bulletin, a manual rate first, never an older one", async () => {
    await rolledBack(async () => {
      await admin.query(
        `select adm.record_tcmb_rates('2030-06-14', '[{"currency":"USD","rate":48.6116}]')`,
      );
      // Monday 17 June uses Friday's bulletin.
      expect(await readRateFor(db(), "USD", "2030-06-17")).toMatchObject({
        rate: 48.6116,
        source: "tcmb",
        bulletinOn: "2030-06-14",
      });
      // Tuesday uses Monday's bulletin, which is missing: the amount waits.
      expect(await readRateFor(db(), "USD", "2030-06-18")).toBeNull();
      expect(await readRateFor(db(), "TRY", "2030-06-18")).toBeNull();

      await admin.query("select set_config('app.user_id', $1, true)", [
        "0192f0c1-0106-7000-8000-000000000001",
      ]);
      expect(
        await attempt("select adm.enter_manual_rate('USD', '2030-06-14', 49, 'banka kuru')"),
      ).toBe("42501"); // an unknown person holds no manage permission
      await admin.query("select set_config('app.user_id', '', true)");
      await admin.query(
        `insert into adm.exchange_rate (currency, bulletin_on, buying_rate, source, reason)
         values ('USD', '2030-06-14', 49, 'manual', 'banka kuru')`,
      );
      expect(await readRateFor(db(), "USD", "2030-06-17")).toMatchObject({
        rate: 49,
        source: "manual",
      });
      expect(
        await attempt(
          `insert into adm.exchange_rate (currency, bulletin_on, buying_rate, source)
           values ('USD', '2030-06-14', 50, 'manual')`,
        ),
      ).toBe("23514"); // a manual rate needs its reason
      expect(await attempt("update adm.exchange_rate set buying_rate = 1")).toBe(
        "adm.exchange_rate_immutable",
      );
    });
  });
});

describe("the daily CBRT fetch (SPIKE-11)", () => {
  const outboxFor = async (day: string) =>
    (
      await admin.query("select event_code from core.outbox where sequence_key = $1 order by id", [
        `adm:exchange_rate:${day}`,
      ])
    ).rows.map((r) => r.event_code);

  it("writes the day's bulletin at the first attempt and announces it", async () => {
    await rolledBack(async () => {
      await receivedBefore("2030-06-14");
      const cbrt = fakeCbrt({ "2030-06-14": published("2030-06-14", 48.6116) });
      await runExchangeRateFetch(db(), cbrt.provider, at("2030-06-14T16:05:00"));
      expect(cbrt.asked).toEqual(["2030-06-14"]);
      expect(await readRateFor(db(), "JPY", "2030-06-17")).toMatchObject({ rate: 0.307666 });
      expect(await outboxFor("2030-06-14")).toEqual(["exchange_rate.received"]);
      // Nothing more to ask once it is in.
      await runExchangeRateFetch(db(), cbrt.provider, at("2030-06-14T16:15:00"));
      expect(cbrt.asked).toEqual(["2030-06-14"]);
    });
  });

  it("asks nothing before the fetch hour or on a weekend", async () => {
    await rolledBack(async () => {
      await receivedBefore("2030-06-15");
      const cbrt = fakeCbrt({});
      await runExchangeRateFetch(db(), cbrt.provider, at("2030-06-14T15:50:00"));
      await runExchangeRateFetch(db(), cbrt.provider, at("2030-06-15T16:30:00"));
      await runExchangeRateFetch(db(), cbrt.provider, at("2030-06-16T16:30:00"));
      expect(cbrt.asked).toEqual([]);
    });
  });

  it("retries after 10, 30 and 60 minutes and announces a missing rate once", async () => {
    await rolledBack(async () => {
      await receivedBefore("2030-06-14");
      const cbrt = fakeCbrt({});
      const times = [
        "16:00", // attempt 1
        "16:05", // not due
        "16:10", // attempt 2 (10 min)
        "16:30", // not due (30 min after 16:10 is 16:40)
        "16:40", // attempt 3
        "17:30", // not due (60 min after 16:40 is 17:40)
        "17:40", // attempt 4: final, missing announced
        "18:00", // not due (an hour after the final attempt)
      ];
      for (const time of times)
        await runExchangeRateFetch(db(), cbrt.provider, at(`2030-06-14T${time}:00`));
      expect(cbrt.asked).toEqual(["2030-06-14", "2030-06-14", "2030-06-14", "2030-06-14"]);
      expect(await outboxFor("2030-06-14")).toEqual(["exchange_rate.missing"]);
      expect(await readRateFor(db(), "USD", "2030-06-17")).toBeNull();

      // Later that evening the bulletin appears: written, announced, the day completes.
      const late = fakeCbrt({ "2030-06-14": published("2030-06-14", 48.6116) });
      await runExchangeRateFetch(db(), late.provider, at("2030-06-14T18:45:00"));
      expect(await outboxFor("2030-06-14")).toEqual([
        "exchange_rate.missing",
        "exchange_rate.received",
      ]);
    });
  });

  it("never writes another day's bulletin (trap 1)", async () => {
    await rolledBack(async () => {
      await receivedBefore("2030-06-17");
      const cbrt = fakeCbrt({ "2030-06-17": { kind: "wrong_day", bulletinOn: "2030-06-14" } });
      await runExchangeRateFetch(db(), cbrt.provider, at("2030-06-17T16:00:00"));
      expect(await readRateFor(db(), "USD", "2030-06-18")).toBeNull();
      const { rows } = await admin.query(
        "select last_outcome, attempts from adm.exchange_rate_fetch where bulletin_on = '2030-06-17'",
      );
      expect(rows[0]).toEqual({ last_outcome: "wrong_day", attempts: 1 });
    });
  });

  it("fills in a past business day the server missed", async () => {
    await rolledBack(async () => {
      await receivedBefore("2030-06-12");
      await admin.query(
        `insert into adm.exchange_rate_fetch (bulletin_on, received_at) values
           ('2030-06-14', now()), ('2030-06-17', now())
         on conflict (bulletin_on) do update set received_at = now()`,
      );
      const cbrt = fakeCbrt({ "2030-06-13": published("2030-06-13", 48.5) });
      await runExchangeRateFetch(db(), cbrt.provider, at("2030-06-17T09:00:00"));
      expect(cbrt.asked).toEqual(["2030-06-12", "2030-06-13"]);
      expect(await readRateFor(db(), "USD", "2030-06-14")).toMatchObject({ rate: 48.5 });
    });
  });
});
