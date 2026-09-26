"use client";

import type React from "react";

import { Meter, MeterIndicator, MeterTrack } from "@/components/ui/meter";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { REST, SERIES } from "@/platform/ui/chart/colors";

export { REST, SERIES };

/**
 * The panel's charts (D-066, D-226, D-297): an approved custom element, because COSS has none.
 * Drawn from plain elements — at these sizes a bar is a box — so they take the theme tokens
 * directly and stay crisp at any width. Every chart writes its numbers as text too (a legend
 * with values, a value beside each bar, or a screen-reader table), never tells series apart by
 * colour alone, keeps a 2px gap between touching marks, and shows a tooltip on hover or focus.
 */

const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0, style: "percent" });

export const formatNumber = (value: number) => number.format(value);

function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-2.5 shrink-0 rounded-[3px]"
      style={{ background: color }}
    />
  );
}

/** A mark with a tooltip; focusable so the tooltip is reachable without a mouse. */
function Mark({
  tip,
  className,
  style,
  children,
}: {
  tip: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              "block outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
            style={style}
            tabIndex={0}
          >
            {children}
          </span>
        }
      />
      <TooltipPopup>{tip}</TooltipPopup>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------------------------
// One bar split into parts: how a whole divides (walls by state, tasks by status, done and left).
// ---------------------------------------------------------------------------------------------

export type Part = { key: string; label: string; value: number; color?: string };

export function ShareBar({
  label,
  parts,
  unit = "",
  className,
}: {
  /** What the bar is about; read out with the numbers. */
  label: string;
  parts: readonly Part[];
  unit?: string;
  className?: string;
}) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  const shown = parts.filter((part) => part.value > 0);
  const colorOf = (part: Part, index: number) => part.color ?? SERIES[index % SERIES.length];
  const text = (value: number) => `${number.format(value)}${unit ? ` ${unit}` : ""}`;

  return (
    <figure className={cn("flex flex-col gap-2", className)}>
      <figcaption className="sr-only">
        {label}: {parts.map((part) => `${part.label} ${text(part.value)}`).join(", ")}
      </figcaption>
      <div aria-hidden="true" className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-[4px]">
        {total === 0 ? (
          <span className="block h-full w-full rounded-[4px]" style={{ background: REST }} />
        ) : (
          shown.map((part) => (
            <Mark
              className="h-full first:rounded-s-[4px] last:rounded-e-[4px]"
              key={part.key}
              style={{
                background: colorOf(part, parts.indexOf(part)),
                flexGrow: part.value,
                flexBasis: 0,
                minWidth: 4,
              }}
              tip={`${part.label}: ${text(part.value)} (${percent.format(part.value / total)})`}
            />
          ))
        )}
      </div>
      <ul
        aria-hidden="true"
        className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
      >
        {parts.map((part, index) => (
          <li className="flex items-center gap-1.5" key={part.key}>
            <Swatch color={colorOf(part, index)} />
            {part.label}
            <span className="font-medium text-foreground tabular-nums">{text(part.value)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

// ---------------------------------------------------------------------------------------------
// Horizontal bars, one row per thing, with the value written beside it (targets by type, before
// and after a revision). Two series draw two thin bars in a row, with a legend above.
// ---------------------------------------------------------------------------------------------

export type BarRow = {
  key: string;
  label: string;
  values: readonly (number | null)[];
  /** How each value reads; defaults to the number. */
  valueText?: readonly string[];
};

export function BarList({
  label,
  rows,
  series,
  className,
}: {
  label: string;
  rows: readonly BarRow[];
  /** Names of the series when a row carries more than one value. */
  series?: readonly string[];
  className?: string;
}) {
  const max = Math.max(0, ...rows.flatMap((row) => row.values.map((value) => value ?? 0)));
  const many = (series?.length ?? 0) > 1;
  const textOf = (row: BarRow, index: number) =>
    row.valueText?.[index] ??
    (row.values[index] === null ? "—" : number.format(row.values[index]!));

  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <figcaption className="sr-only">{label}</figcaption>
      {many ? (
        <ul aria-hidden="true" className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
          {series!.map((name, index) => (
            <li className="flex items-center gap-1.5" key={name}>
              <Swatch color={SERIES[index]} />
              {name}
            </li>
          ))}
        </ul>
      ) : null}
      <table className="sr-only">
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              {row.values.map((_, index) => (
                <td key={index}>
                  {many ? `${series![index]}: ` : ""}
                  {textOf(row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul aria-hidden="true" className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"
            key={row.key}
          >
            <span className="col-span-2 truncate text-xs text-muted-foreground">{row.label}</span>
            <div className="flex flex-col gap-0.5">
              {row.values.map((value, index) => (
                <Mark
                  className={cn("rounded-e-[4px]", many ? "h-1.5" : "h-2.5")}
                  key={index}
                  style={{
                    background: value ? SERIES[index] : "transparent",
                    width: max > 0 && value ? `max(4px, ${(value / max) * 100}%)` : 0,
                  }}
                  tip={`${row.label}${many ? ` · ${series![index]}` : ""}: ${textOf(row, index)}`}
                />
              ))}
            </div>
            <span className="text-right text-xs font-medium tabular-nums">
              {row.values.map((_, index) => textOf(row, index)).join(" → ")}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

// ---------------------------------------------------------------------------------------------
// Columns over days: how much happened each day (runs, events). Several series stack.
// ---------------------------------------------------------------------------------------------

export type Column = { key: string; label: string; values: readonly number[] };

export function ColumnChart({
  label,
  columns,
  series,
  unit = "",
  className,
}: {
  label: string;
  columns: readonly Column[];
  series: readonly string[];
  unit?: string;
  className?: string;
}) {
  const totals = columns.map((column) => column.values.reduce((sum, value) => sum + value, 0));
  const max = Math.max(0, ...totals);
  const text = (value: number) => `${number.format(value)}${unit ? ` ${unit}` : ""}`;
  const edge = [0, Math.floor((columns.length - 1) / 2), columns.length - 1];

  return (
    <figure className={cn("flex flex-col gap-2", className)}>
      <figcaption className="sr-only">{label}</figcaption>
      {series.length > 1 ? (
        <ul aria-hidden="true" className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
          {series.map((name, index) => (
            <li className="flex items-center gap-1.5" key={name}>
              <Swatch color={SERIES[index]} />
              {name}
              <span className="font-medium text-foreground tabular-nums">
                {text(columns.reduce((sum, column) => sum + (column.values[index] ?? 0), 0))}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <table className="sr-only">
        <thead>
          <tr>
            <th scope="col">Gün</th>
            {series.map((name) => (
              <th key={name} scope="col">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {columns.map((column) => (
            <tr key={column.key}>
              <th scope="row">{column.label}</th>
              {column.values.map((value, index) => (
                <td key={index}>{text(value)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div aria-hidden="true" className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground tabular-nums">
          {max > 0 ? `En çok ${text(max)}` : "Bu aralıkta kayıt yok"}
        </span>
        <div className="flex h-28 items-end gap-0.5 border-b border-border">
          {columns.map((column) => (
            <Mark
              className="flex h-full min-w-0 flex-1 flex-col-reverse gap-0.5 overflow-hidden"
              key={column.key}
              tip={
                <span className="flex flex-col">
                  <span className="font-medium">{column.label}</span>
                  {series.map((name, s) => (
                    <span key={name}>
                      {series.length > 1 ? `${name}: ` : ""}
                      {text(column.values[s] ?? 0)}
                    </span>
                  ))}
                </span>
              }
            >
              {column.values.map((value, s) =>
                value > 0 ? (
                  <span
                    className="block w-full last:rounded-t-[4px]"
                    key={s}
                    style={{ background: SERIES[s], height: `${(value / max) * 100}%` }}
                  />
                ) : null,
              )}
            </Mark>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          {[...new Set(edge)].map((index) => (
            <span key={index}>{columns[index]?.label}</span>
          ))}
        </div>
      </div>
    </figure>
  );
}

// ---------------------------------------------------------------------------------------------
// How much of something is done: COSS's meter with the count beside it.
// ---------------------------------------------------------------------------------------------

export function DoneMeter({
  label,
  done,
  total,
  unit,
  className,
}: {
  /** Read out with the numbers ("Tamamlanan duvar"). */
  label: string;
  done: number;
  total: number;
  unit: string;
  className?: string;
}) {
  if (total === 0) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <Meter
      aria-label={`${label}: ${number.format(done)} / ${number.format(total)} ${unit}`}
      className={cn("min-w-28 gap-1", className)}
      max={total}
      value={done}
    >
      <span aria-hidden="true" className="text-xs text-muted-foreground tabular-nums">
        {number.format(done)} / {number.format(total)} {unit}
      </span>
      <MeterTrack className="h-1.5 rounded-[4px]">
        <MeterIndicator className="rounded-[4px]" style={{ background: SERIES[0] }} />
      </MeterTrack>
    </Meter>
  );
}
