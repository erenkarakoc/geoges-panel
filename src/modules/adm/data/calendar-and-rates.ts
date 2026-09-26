import { sql, type Kysely } from "kysely";

import { runAsUser, type DbIdentity } from "@/platform/db";

import type {
  BulletinResult,
  ExchangeRateProvider,
} from "@/platform/exchange-rates/exchange-rates";
import type { JobDefinition, SystemDb } from "@/platform/jobs/types";
import { addDays, istanbulDay, istanbulMinutes, minutesOf } from "@/platform/time/istanbul";

import type { RuleScope } from "@/modules/adm/domain/configuration";

import { readRule } from "./adm-store";

/**
 * Calendar and exchange-rate data layer (TASK-0106, REQ-ADM-010…015, D-140, D-261, SPIKE-11).
 * The rules live in the database functions of migration 0008; this layer asks them and runs
 * the daily CBRT fetch.
 */

type Db = Kysely<unknown>;
type CalendarScope = Pick<RuleScope, "siteId" | "unitId">;

export async function readIsBusinessDay(db: Db, day: string, scope: CalendarScope = {}) {
  const { rows } = await sql<{ yes: boolean }>`
    select adm.is_business_day(${day}::date, ${scope.siteId ?? null}::uuid,
                               ${scope.unitId ?? null}::uuid) as yes`.execute(db);
  return rows[0].yes;
}

/** A day the Central Bank publishes: a weekday that is not a public holiday (D-296). */
export async function readIsBankDay(db: Db, day: string) {
  const { rows } = await sql<{ yes: boolean }>`
    select adm.is_bank_day(${day}::date) as yes`.execute(db);
  return rows[0].yes;
}

export async function readAddBusinessDays(
  db: Db,
  day: string,
  days: number,
  scope: CalendarScope = {},
) {
  const { rows } = await sql<{ day: string }>`
    select adm.add_business_days(${day}::date, ${days}, ${scope.siteId ?? null}::uuid,
                                 ${scope.unitId ?? null}::uuid)::text as day`.execute(db);
  return rows[0].day;
}

/**
 * The rate an amount dated `on` uses (D-140): the previous business day's bulletin, a manual rate
 * first. `null` means "kur bekliyor": the amount waits, never takes an older rate (ADM-K4). The
 * record stores `rateId` and `source` (REQ-ADM-015).
 */
export type RateForDay = {
  rateId: string;
  rate: number;
  source: "tcmb" | "manual";
  bulletinOn: string;
};

export async function readRateFor<DB>(
  db: Kysely<DB>,
  currency: string,
  on: string,
): Promise<RateForDay | null> {
  if (currency.toUpperCase() === "TRY") return null;
  const { rows } = await sql<{
    rate_id: string;
    buying_rate: string;
    source: "tcmb" | "manual";
    bulletin_on: string;
  }>`select rate_id, buying_rate, source, bulletin_on::text as bulletin_on
       from adm.rate_for(${currency}, ${on}::date)`.execute(db);
  const row = rows[0];
  return row
    ? {
        rateId: row.rate_id,
        rate: Number(row.buying_rate),
        source: row.source,
        bulletinOn: row.bulletin_on,
      }
    : null;
}

export async function insertManualRate(
  db: Db,
  rate: { currency: string; bulletinOn: string; rate: number; reason: string },
) {
  const { rows } = await sql<{ id: string }>`
    select adm.enter_manual_rate(${rate.currency}, ${rate.bulletinOn}::date, ${rate.rate},
                                 ${rate.reason}) as id`.execute(db);
  return rows[0].id;
}

/** The same questions for request code, as the signed-in person. */
export const calendarAs = {
  isBusinessDay: (identity: DbIdentity, day: string, scope?: CalendarScope) =>
    runAsUser(identity, (db: Db) => readIsBusinessDay(db, day, scope)),
  addBusinessDays: (identity: DbIdentity, day: string, days: number, scope?: CalendarScope) =>
    runAsUser(identity, (db: Db) => readAddBusinessDays(db, day, days, scope)),
  rateFor: (identity: DbIdentity, currency: string, on: string) =>
    runAsUser(identity, (db: Db) => readRateFor(db, currency, on)),
  enterManualRate: (
    identity: DbIdentity,
    rate: { currency: string; bulletinOn: string; rate: number; reason: string },
  ) => runAsUser(identity, (db: Db) => insertManualRate(db, rate)),
};

// ---------------------------------------------------------------------------------------------
// The daily CBRT fetch (SPIKE-11)
// ---------------------------------------------------------------------------------------------

/** How many past days the fetch looks back for a missing bulletin (server down, say). */
const CATCH_UP_DAYS = 7;
/** After the last planned retry, a still-missing past bulletin is asked for once an hour. */
const LATE_RETRY_MINUTES = 60;

type FetchState = { attempts: number; lastAttemptAt: Date | null; received: boolean };

async function readFetchState(db: SystemDb, day: string): Promise<FetchState> {
  const { rows } = await sql<{
    attempts: number;
    last_attempt_at: Date | null;
    received_at: Date | null;
  }>`select attempts, last_attempt_at, received_at from adm.exchange_rate_fetch
      where bulletin_on = ${day}::date`.execute(db);
  const row = rows[0];
  return {
    attempts: row?.attempts ?? 0,
    lastAttemptAt: row?.last_attempt_at ? new Date(row.last_attempt_at) : null,
    received: Boolean(row?.received_at),
  };
}

/** Whether a day with `state` is due for another attempt at `now` under `retryMinutes`. */
export function attemptDue(state: FetchState, retryMinutes: readonly number[], now: Date) {
  if (state.received) return false;
  if (state.attempts === 0 || !state.lastAttemptAt) return true;
  const wait =
    state.attempts <= retryMinutes.length ? retryMinutes[state.attempts - 1] : LATE_RETRY_MINUTES;
  return now.getTime() >= state.lastAttemptAt.getTime() + wait * 60_000;
}

/**
 * The bank days whose bulletin should exist at `now`: past ones, and today after the hour. The
 * bank's days, not the company's: a company working on Saturday gets no Saturday bulletin (D-296).
 */
async function daysToFetch(db: SystemDb, now: Date, fetchAfter: number) {
  const today = istanbulDay(now);
  const days: string[] = [];
  for (let back = CATCH_UP_DAYS; back >= 1; back--) {
    const day = addDays(today, -back);
    if (await readIsBankDay(db, day)) days.push(day);
  }
  if (istanbulMinutes(now) >= fetchAfter && (await readIsBankDay(db, today))) days.push(today);
  return days;
}

async function requireRule(db: SystemDb, key: string, on: string) {
  const rule = await readRule(db, key, on);
  if (!rule.found) throw new Error(`rule ${key} is not set; the exchange-rate fetch cannot run`);
  return rule.value;
}

/**
 * One run of the fetch. For each bank day of the last week (and today after the fetch
 * hour) whose bulletin is not stored and is due: ask the provider for that day's dated bulletin.
 * A bulletin of that day is written and announced; anything else is an attempt, and the attempt
 * after the last planned retry announces `exchange_rate.missing`, once.
 */
export async function runExchangeRateFetch(
  db: SystemDb,
  provider: ExchangeRateProvider,
  now: Date,
): Promise<{ day: string; outcome: BulletinResult["kind"] }[]> {
  const today = istanbulDay(now);
  const fetchAfter = minutesOf(
    String(await requireRule(db, "adm.exchange-rate-fetch-time", today)),
  );
  const retryMinutes = (await requireRule(
    db,
    "adm.exchange-rate-retry-minutes",
    today,
  )) as number[];
  const outcomes: { day: string; outcome: BulletinResult["kind"] }[] = [];
  for (const day of await daysToFetch(db, now, fetchAfter)) {
    const state = await readFetchState(db, day);
    if (!attemptDue(state, retryMinutes, now)) continue;
    const result = await provider.fetchBulletin(day);
    outcomes.push({ day, outcome: result.kind });
    if (result.kind === "published") {
      await sql`select adm.record_tcmb_rates(${day}::date, ${JSON.stringify(result.rates)}::jsonb)`.execute(
        db,
      );
      continue;
    }
    const final = state.attempts + 1 >= retryMinutes.length + 1;
    await sql`select adm.note_rate_attempt(${day}::date, ${result.kind}, ${final},
                                           ${now.toISOString()}::timestamptz)`.execute(db);
  }
  return outcomes;
}

/** The recurring job: every ten minutes, harmless when nothing is due (TASK-0104 worker). */
export function exchangeRateJob(
  provider: ExchangeRateProvider,
  clock: () => Date = () => new Date(),
): JobDefinition {
  return {
    type: "adm.exchange-rates",
    recurrence: { everyMinutes: 10 },
    async run(db) {
      await runExchangeRateFetch(db, provider, clock());
    },
  };
}
