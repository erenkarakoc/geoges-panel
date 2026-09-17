/**
 * Calendar days as `YYYY-MM-DD` strings. A day is not a moment: it has no time zone once chosen,
 * so it travels safely through URLs and between server and browser. "Today" is decided in the
 * company's time zone, never the server's.
 */
export type Day = string;

export const COMPANY_TIME_ZONE = "Europe/Istanbul";

const dayPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function toUtcDate(day: Day): Date {
  const [, year, month, date] = dayPattern.exec(day) ?? [];
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(date)));
}

function fromUtcDate(date: Date): Day {
  return date.toISOString().slice(0, 10);
}

/** The value if it is a real calendar day, otherwise `null` ("2026-02-30" is not). */
export function parseDay(value: string | undefined | null): Day | null {
  if (!value || !dayPattern.test(value)) {
    return null;
  }
  return fromUtcDate(toUtcDate(value)) === value ? value : null;
}

export function todayIn(timeZone: string = COMPANY_TIME_ZONE, now: Date = new Date()): Day {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

export function addDays(day: Day, amount: number): Day {
  const date = toUtcDate(day);
  date.setUTCDate(date.getUTCDate() + amount);
  return fromUtcDate(date);
}

/** "16 Eyl" — for the day strip. */
export function formatDayShort(day: Day): string {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" })
    .format(toUtcDate(day))
    .replace(".", "");
}

/** "16 Eylül 2026 Çarşamba" — for headings and labels. */
export function formatDayLong(day: Day): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
    timeZone: "UTC",
  }).format(toUtcDate(day));
}
