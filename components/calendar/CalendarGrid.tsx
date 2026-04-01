"use client";

import { useMemo } from "react";
import { HDate } from "@hebcal/core";
import { Flame } from "lucide-react";
import {
  getCalendarWeeks,
  HEBREW_MONTH_NAMES,
  GREGORIAN_MONTH_NAMES,
  getHebrewMonthForGregorianMonth,
} from "@/lib/hebrew-calendar";
import { type HolidayEntry } from "@/lib/holidays";
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
  holidays: Map<string, HolidayEntry>;
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
  holidays,
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
                return <div key={di} style={{ minHeight: 72 }} />;
              }

              const { gregorianDate, hebrewDate } = day;
              const isToday = gregorianDate.toDateString() === todayStr;
              const dayEvents = getEventsForDate(gregorianDate, hebrewDate, events);

              const dateKey = gregorianDate.toISOString().slice(0, 10);
              const holidayEntry = holidays.get(dateKey);
              const isHoliday = !!holidayEntry?.visual;
              const isOmerLine = !!holidayEntry?.line;

              // Candle lighting: Fridays and Erev Yom Tov (day before a visual holiday, not Saturday)
              const dow = gregorianDate.getDay();
              const isFriday = dow === 5;
              const isSaturday = dow === 6;
              const tomorrowDate = new Date(gregorianDate);
              tomorrowDate.setDate(gregorianDate.getDate() + 1);
              const tomorrowKey = tomorrowDate.toISOString().slice(0, 10);
              const isErevYomTov = !isSaturday && !!holidays.get(tomorrowKey)?.visual;
              const showCandle = isFriday || isErevYomTov;

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
                  style={{ minHeight: 72 }}
                  className={cn(
                    "flex flex-col items-center rounded-lg transition-colors pt-2 bg-[var(--card)] hover:bg-[var(--secondary)]",
                    isToday && "ring-2 ring-[var(--primary)] ring-inset"
                  )}
                >
                  {/* Date band — amber on holidays, plain otherwise */}
                  <div className={cn(
                    "w-full flex flex-col items-center py-0.5 relative",
                    isHoliday && "bg-amber-200 dark:bg-amber-800/70"
                  )}>
                  {showCandle && (
                    <Flame
                      size={10}
                      style={{ position: "absolute", top: 2, right: 2, zIndex: 10, color: "rgb(245 158 11)" }}
                      aria-hidden
                    />
                  )}
                    {isOmerLine && (
                      <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "rgb(217 119 6)" /* amber-600 */ }} />
                    )}
                    <span className={cn(
                      "text-sm font-semibold leading-tight",
                      isHoliday ? "text-amber-950 dark:text-amber-50" : "text-[var(--foreground)]"
                    )}>
                      {primaryLabel}
                    </span>
                    <span className={cn(
                      "text-[10px] leading-tight text-center",
                      isHoliday ? "text-amber-800 dark:text-amber-200" : "text-[var(--muted-foreground)]"
                    )}>
                      {hebrewMonthName && primaryCalendar === "GREGORIAN"
                        ? `${secondaryLabel} ${hebrewMonthName}`
                        : secondaryLabel
                      }
                    </span>
                  </div>

                  {/* Spacer + event dots pinned to bottom */}
                  <div className="flex-1 flex items-end justify-center pb-2">
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 flex-wrap justify-center">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <span
                            key={ev.id}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              EVENT_TYPE_COLORS[ev.type] ?? "bg-gray-400"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
