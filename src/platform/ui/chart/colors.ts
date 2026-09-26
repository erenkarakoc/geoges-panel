/**
 * Chart colours (D-297), in a plain module so a server component can hand them to a chart: a
 * constant read from a "use client" file is only a reference on the server, not the string.
 */

/** Series colours in their fixed order; a chart never cycles past the fifth. */
export const SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

/** A quiet fill for "the rest": what is left, not started, missing. */
export const REST = "var(--color-input)";
