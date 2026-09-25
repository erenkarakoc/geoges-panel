import { DURATION } from "@/modules/wfl/domain/definition";

/**
 * A waiting time as a person would say it (TASK-0119).
 *
 * The definition stores a duration the way the architecture writes one — `PT8H`, `P2D` — because
 * that is what the engine, the scheduler and the tests read. Nobody should have to type it: the
 * panel asks for a number and a unit, and these two functions are the only place the two forms meet.
 */

export type DurationUnit = "minute" | "hour" | "day";

export type DurationParts = { amount: number; unit: DurationUnit };

const MINUTES: Record<DurationUnit, number> = { day: 1440, hour: 60, minute: 1 };

/** How many minutes a stored duration is, or null when it is not one. */
export function durationMinutes(value: string | null | undefined): number | null {
  if (!value || !DURATION.test(value)) return null;
  const days = /(\d+)D/.exec(value);
  const hours = /T(?:(\d+)H)?/.exec(value);
  const minutes = /(?:H|T)(\d+)M/.exec(value);
  return (
    Number(days?.[1] ?? 0) * 1440 + Number(hours?.[1] ?? 0) * 60 + Number(minutes?.[1] ?? 0) || null
  );
}

/**
 * The stored duration as a number and a unit, in the largest unit that comes out whole — so eight
 * hours reads as eight hours and ninety minutes reads as ninety minutes, not as 1.5 of anything.
 */
export function durationToParts(value: string | null | undefined): DurationParts {
  const total = durationMinutes(value);
  if (!total) return { amount: 8, unit: "hour" };
  if (total % 1440 === 0) return { amount: total / 1440, unit: "day" };
  if (total % 60 === 0) return { amount: total / 60, unit: "hour" };
  return { amount: total, unit: "minute" };
}

/** The same thing the other way round, in the form the engine reads. */
export function partsToDuration(parts: DurationParts): string {
  const amount = Math.max(1, Math.round(parts.amount || 0));
  const total = amount * MINUTES[parts.unit];
  if (parts.unit === "day") return `P${amount}D`;
  if (total % 60 === 0) return `PT${total / 60}H`;
  return `PT${total}M`;
}
