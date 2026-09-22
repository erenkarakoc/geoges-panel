import type { Recurrence } from "./types";

/**
 * When work runs again (EVENT_BACKBONE section 4 and 7). Pure functions of the clock, so they are
 * tested without waiting. Istanbul keeps UTC+3 all year (no daylight saving since 2016).
 */

/** Waits after the 1st…4th failure; the 5th failure is final (dead letter). */
export const RETRY_MINUTES = [1, 5, 15, 60, 360] as const;
export const MAX_ATTEMPTS = 5;

/** When to try again after `failuresSoFar` + 1 failures, or null when it is dead. */
export function retryAt(failuresSoFar: number, now: Date): Date | null {
  const failures = failuresSoFar + 1;
  if (failures >= MAX_ATTEMPTS) return null;
  return new Date(now.getTime() + RETRY_MINUTES[failures - 1] * 60_000);
}

const ISTANBUL_OFFSET_MS = 3 * 60 * 60_000;
const DAY_MS = 24 * 60 * 60_000;

/** The latest occurrence at or before `now`, and the one after it. */
export function occurrences(recurrence: Recurrence, now: Date): { previous: Date; next: Date } {
  if ("everyMinutes" in recurrence) {
    const step = recurrence.everyMinutes * 60_000;
    if (!Number.isInteger(recurrence.everyMinutes) || recurrence.everyMinutes < 1)
      throw new Error(`everyMinutes must be a positive whole number`);
    const previous = new Date(Math.floor(now.getTime() / step) * step);
    return { previous, next: new Date(previous.getTime() + step) };
  }
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(recurrence.dailyAt);
  if (!match) throw new Error(`dailyAt must be HH:MM, got ${recurrence.dailyAt}`);
  const minuteOfDay = (Number(match[1]) * 60 + Number(match[2])) * 60_000;
  const local = now.getTime() + ISTANBUL_OFFSET_MS;
  let previousLocal = Math.floor(local / DAY_MS) * DAY_MS + minuteOfDay;
  if (previousLocal > local) previousLocal -= DAY_MS;
  const previous = new Date(previousLocal - ISTANBUL_OFFSET_MS);
  return { previous, next: new Date(previous.getTime() + DAY_MS) };
}

/** The idempotency key of one run: the same run is planned once, whoever plans it. */
export function runKey(type: string, runAt: Date): string {
  return `${type}@${runAt.toISOString()}`;
}
