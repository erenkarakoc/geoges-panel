/**
 * Company-local calendar arithmetic (CONVENTIONS section 5). Turkey keeps UTC+3 all year (no
 * daylight saving since 2016). Business days are counted in Turkish local time, never in UTC:
 * at 02:30 on a Monday in Istanbul it is still Sunday in UTC (SPIKE-11, correction 1).
 */
const OFFSET_MS = 3 * 60 * 60_000;

/** The Istanbul calendar day of an instant, as YYYY-MM-DD. */
export function istanbulDay(at: Date): string {
  return new Date(at.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

/** Minutes since Istanbul midnight of an instant. */
export function istanbulMinutes(at: Date): number {
  const local = new Date(at.getTime() + OFFSET_MS);
  return local.getUTCHours() * 60 + local.getUTCMinutes();
}

/** "HH:MM" as minutes since midnight. */
export function minutesOf(time: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) throw new Error(`not a HH:MM time: ${time}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

/** A calendar day moved by whole days (YYYY-MM-DD in, YYYY-MM-DD out). */
export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
