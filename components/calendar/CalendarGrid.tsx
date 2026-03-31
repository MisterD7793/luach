"use client";

import { useMemo } from "react";
import { HDate } from "@hebcal/core";
import {
  getCalendarWeeks,
  HEBREW_MONTH_NAMES,
  GREGORIAN_MONTH_NAMES,
  getHebrewMonthForGregorianMonth,
} from "@/lib/hebrew-calendar";
import { cn } from "@/lib/utils";

type Event = {
  id: string;
  title: string;
  type: string;
  canonicalCalendar: "HEBREW" | "GREGORIAN";
  hebrewDay?: number | null;
  hebrewMonth?: number | null;
  gregorianMonth?: number | null;
  gregorianDay?: number | null;
};

type Props = {
  year: number;
  month: number; // 1-12 Gregorian
  primaryCalendar: "HEBREW" | "GREGORIAN";
  events: Event[];
  todayGregorian: Date;
  onDayClick: (date: Date, hebrewDate: HDate) => void;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getEventsForDate(
  date: Date,
  hebrewDate: HDate,
  events: Event[]
): Event[] {
  return events.filter((event) => {
    if (event.canonicalCalendar === "HEBREW") {
      if (!event.hebrewMonth || !event.hebrewDay) return false;
      return (
        hebrewDate.getMonth() === event.hebrewMonth &&
        hebrewDate.getDate() === event.hebrewDay
      );
    } else {
      if (!event.gregorianMonth || !event.gregorianDay) return false;
      return (
        date.getMonth() + 1 === event.gregorianMonth &&
        date.getDate() === event.gregorianDay
      );
    }
  });
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  BIRTHDAY: "bg-blue-500",
  ANNIVERSARY: "bg-rose-500",
  YAHRZEIT: "bg-stone-600",
  CUSTOM: "bg-emerald-500",
};

export default function CalendarGrid({
  year,
  month,
  primaryCalendar,
  events,
  todayGregorian,
  onDayClick,
}: Props) {
  const weeks = useMemo(() => getCalendarWeeks(year, month), [year, month]);
  const hebrewMonthInfo = useMemo(
    () => getHebrewMonthForGregorianMonth(year, month),
    [year, month]
  );

  const todayStr = todayGregorian.toDateString();

  return (
    <div className="w-full">
      {/* Day name headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-[var(--muted-foreground)] py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar weeks */}
      <div className="space-y-px">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-px">
            {week.map((day, di) => {
              if (!day) {
                return <div key={di} className="aspect-square" />;
              }

              const { gregorianDate, hebrewDate } = day;
              const isToday = gregorianDate.toDateString() === todayStr;
              const dayEvents = getEventsForDate(gregorianDate, hebrewDate, events);

              const primaryLabel =
                primaryCalendar === "GREGORIAN"
                  ? gregorianDate.getDate().toString()
                  : hebrewDate.getDate().toString();

              const secondaryLabel =
                primaryCalendar === "GREGORIAN"
                  ? hebrewDate.getDate().toString()
                  : gregorianDate.getDate().toString();

              // Show Hebrew month name on 1st of Hebrew month
              const showHebrewMonthName = hebrewDate.getDate() === 1;
              const hebrewMonthName = showHebrewMonthName
                ? HEBREW_MONTH_NAMES[hebrewDate.getMonth()]
                : null;

              return (
                <button
                  key={di}
                  onClick={() => onDayClick(gregorianDate, hebrewDate)}
                  className={cn(
                    "flex flex-col items-center justify-start pt-1 pb-1 px-0.5 rounded-lg min-h-[56px] transition-colors",
                    isToday
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--foreground)]"
                  )}
                >
                  {/* Primary date number */}
                  <span className={cn("text-sm font-semibold leading-tight", isToday && "text-white")}>
                    {primaryLabel}
                  </span>

                  {/* Secondary date number */}
                  <span className={cn(
                    "text-[10px] leading-tight",
                    isToday ? "text-blue-100" : "text-[var(--muted-foreground)]"
                  )}>
                    {secondaryLabel}
                    {hebrewMonthName && primaryCalendar === "GREGORIAN" && (
                      <span className="block text-[9px] leading-none">{hebrewMonthName}</span>
                    )}
                  </span>

                  {/* Event dots */}
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isToday ? "bg-white" : EVENT_TYPE_COLORS[ev.type] ?? "bg-gray-400"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
