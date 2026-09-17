"use client";

import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { tr } from "@daypicker/react/locale";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import { addDays, type Day, formatDayLong, formatDayShort } from "@/platform/date/day";

export type ContextSection = { value: string; label: string; href: `/${string}` };

/** How many days the strip shows around the chosen day. */
const STRIP_LENGTH = 5;

function dayToLocalDate(day: Day): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
}

function localDateToDay(date: Date): Day {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Second header row (D-055, TASK-0034). A page renders it only while an object is open — a
 * screen without one has no row at all, so the layout stays exactly as it was.
 * Left: the object's name and its sections, each its own address. Right: the day, as a strip
 * with ‹ › and a calendar for older days (D-064). The day travels in `?{dayParam}=`; today
 * leaves the address clean.
 */
export function ContextBar({
  title,
  sections,
  activeSection,
  day,
  today,
  dayParam,
}: {
  title: string;
  sections: readonly ContextSection[];
  activeSection: string;
  day: Day;
  today: Day;
  dayParam: string;
}) {
  const router = useRouter();
  const [calendarOpen, setCalendarOpen] = useState(false);
  // On a phone the strip scrolls, and the section you are in can start off screen. Bring it
  // into view whenever it changes, so the row always says where you are.
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [activeSection]);
  const activeHref = sections.find((section) => section.value === activeSection)?.href ?? "/";

  const withDay = (href: string, target: Day) =>
    target === today ? href : `${href}?${dayParam}=${target}`;

  // The strip ends one day after the chosen day, but never after today.
  const stripEnd = addDays(day, 1) <= today ? addDays(day, 1) : today;
  const strip = Array.from({ length: STRIP_LENGTH }, (_, index) =>
    addDays(stripEnd, index - STRIP_LENGTH + 1),
  );
  const nextDay = addDays(day, 1);

  return (
    <div className="flex h-11 shrink-0 items-center gap-3 border-b bg-background px-4">
      <span className="hidden shrink-0 text-sm font-semibold md:inline">{title}</span>
      {/*
       * The strip scrolls sideways when the sections do not fit. `overflow-x-auto` alone also
       * turns the vertical axis into `auto`, and the reserved scrollbars made the nav taller
       * than the row, so both are pinned here and the scrollbar itself is hidden.
       */}
      <nav
        aria-label={`${title} bölümleri`}
        className="min-w-0 [scrollbar-width:none] self-stretch overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden"
      >
        <Tabs value={activeSection}>
          <TabsList variant="underline">
            {sections.map((section) => (
              <TabsTab
                key={section.value}
                nativeButton={false}
                render={
                  <Link
                    href={withDay(section.href, day)}
                    ref={section.value === activeSection ? activeTabRef : undefined}
                  />
                }
                value={section.value}
              >
                {section.label}
              </TabsTab>
            ))}
          </TabsList>
        </Tabs>
      </nav>

      <div className="ms-auto flex shrink-0 items-center gap-1">
        <Button
          aria-label="Önceki gün"
          render={<Link href={withDay(activeHref, addDays(day, -1))} />}
          size="icon-xs"
          variant="ghost"
        >
          <ChevronLeftIcon aria-hidden="true" />
        </Button>
        <div className="hidden items-center gap-1 lg:flex">
          {strip.map((stripDay) => (
            <Button
              aria-current={stripDay === day ? "date" : undefined}
              key={stripDay}
              render={<Link href={withDay(activeHref, stripDay)} />}
              size="xs"
              variant={stripDay === day ? "secondary" : "ghost"}
            >
              {stripDay === today ? "Bugün" : formatDayShort(stripDay)}
            </Button>
          ))}
        </div>
        {nextDay <= today ? (
          <Button
            aria-label="Sonraki gün"
            render={<Link href={withDay(activeHref, nextDay)} />}
            size="icon-xs"
            variant="ghost"
          >
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        ) : (
          <Button aria-label="Sonraki gün" disabled size="icon-xs" variant="ghost">
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        )}
        <Popover onOpenChange={setCalendarOpen} open={calendarOpen}>
          <PopoverTrigger
            render={
              <Button aria-label={`Gün seç: ${formatDayLong(day)}`} size="xs" variant="outline" />
            }
          >
            <CalendarIcon aria-hidden="true" />
            <span className="lg:hidden">{formatDayShort(day)}</span>
          </PopoverTrigger>
          <PopoverPopup align="end">
            <Calendar
              disabled={{ after: dayToLocalDate(today) }}
              locale={tr}
              mode="single"
              onSelect={(date) => {
                if (date) {
                  setCalendarOpen(false);
                  router.push(withDay(activeHref, localDateToDay(date)));
                }
              }}
              selected={dayToLocalDate(day)}
              defaultMonth={dayToLocalDate(day)}
            />
          </PopoverPopup>
        </Popover>
      </div>
    </div>
  );
}
