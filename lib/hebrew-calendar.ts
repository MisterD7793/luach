/**
 * Hebrew calendar engine using @hebcal/core.
 * All conversion, display, and recurrence logic lives here.
 */

import { HDate, months, Zmanim, GeoLocation } from "@hebcal/core";

// Re-export months so other files import from one place
export { months };

// Hebrew month names in English transliteration
export const HEBREW_MONTH_NAMES: Record<number, string> = {
  [months.NISAN]: "Nisan",
  [months.IYYAR]: "Iyyar",
  [months.SIVAN]: "Sivan",
  [months.TAMUZ]: "Tamuz",
  [months.AV]: "Av",
  [months.ELUL]: "Elul",
  [months.TISHREI]: "Tishrei",
  [months.CHESHVAN]: "Cheshvan",
  [months.KISLEV]: "Kislev",
  [months.TEVET]: "Tevet",
  [months.SHVAT]: "Shvat",
  [months.ADAR_I]: "Adar I",
  [months.ADAR_II]: "Adar II",
};

export const GREGORIAN_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Get today's Hebrew date, accounting for sunset.
 * After sunset, the Hebrew date is already the next day.
 */
export function getTodayHebrew(
  timezone: string,
  latitude?: number | null,
  longitude?: number | null
): HDate {
  const now = new Date();

  if (latitude != null && longitude != null) {
    try {
      const gloc = new GeoLocation(null, latitude, longitude, 0, timezone);
      const zmanim = new Zmanim(gloc, now, false);
      const sunset = zmanim.sunset();
      if (sunset && now > sunset) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return new HDate(tomorrow);
      }
    } catch {
      // fall through to timezone heuristic
    }
    return new HDate(now);
  }

  // Approximate via local hour: if >= 19 (7 PM) assume post-sunset.
  // This is a rough heuristic when lat/lon isn't available.
  const localTimeStr = now.toLocaleString("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: timezone,
  });
  const localHour = parseInt(localTimeStr);

  if (!isNaN(localHour) && localHour >= 19) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new HDate(tomorrow);
  }

  return new HDate(now);
}

/**
 * Convert a Gregorian date to HDate.
 * Pass afterSunset=true if the event occurred after sunset — the Hebrew date
 * has already advanced to the next day by that point.
 */
export function gregorianToHebrew(date: Date, afterSunset = false): HDate {
  if (afterSunset) {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return new HDate(next);
  }
  return new HDate(date);
}

/**
 * Convert an HDate to a JavaScript Date (returns the Gregorian date).
 */
export function hebrewToGregorian(hdate: HDate): Date {
  return hdate.greg();
}

/**
 * Given a Hebrew month+day (annual recurring), find the next Gregorian
 * occurrence on or after `fromDate`, handling leap year rules.
 *
 * Leap year rules for yahrzeit/birthdays (per halacha):
 * - If the original date was stored as ADAR_I and the target year is NOT a
 *   leap year, the event falls in ADAR_II (which is the only Adar that year).
 * - If stored as ADAR_II and the target year is not a leap year, also falls in ADAR_II.
 */
export function nextHebrewOccurrence(
  hebrewMonth: number,
  hebrewDay: number,
  fromDate: Date = new Date()
): Date {
  const fromHDate = new HDate(fromDate);
  let year = fromHDate.getFullYear();

  for (let attempt = 0; attempt < 3; attempt++) {
    const resolvedMonth = resolveHebrewMonth(hebrewMonth, year);
    const daysInMonth = HDate.daysInMonth(resolvedMonth, year);
    const day = Math.min(hebrewDay, daysInMonth);

    try {
      const candidate = new HDate(day, resolvedMonth, year);
      const candidateGreg = candidate.greg();
      if (candidateGreg >= fromDate) {
        return candidateGreg;
      }
    } catch {
      // invalid date for this year, skip
    }

    year++;
  }

  // Fallback
  const resolvedMonth = resolveHebrewMonth(hebrewMonth, year);
  const daysInMonth = HDate.daysInMonth(resolvedMonth, year);
  return new HDate(Math.min(hebrewDay, daysInMonth), resolvedMonth, year).greg();
}

/**
 * Resolve which Hebrew month to use in a given year, handling Adar in non-leap years.
 * In non-leap years there is only one Adar (ADAR_II = month 13 in the library,
 * but accessed as ADAR_I=12 when monthsInYear=12).
 */
function resolveHebrewMonth(storedMonth: number, year: number): number {
  const isLeap = HDate.isLeapYear(year);
  if (!isLeap && storedMonth === months.ADAR_I) {
    // In a non-leap year, only Adar exists (no Adar I/II distinction)
    return months.ADAR_II;
  }
  return storedMonth;
}

/**
 * Given a Gregorian month+day (annual recurring), find the next occurrence
 * on or after `fromDate`.
 */
export function nextGregorianOccurrence(
  gregorianMonth: number,
  gregorianDay: number,
  fromDate: Date = new Date()
): Date {
  const year = fromDate.getFullYear();

  for (const y of [year, year + 1]) {
    const candidate = new Date(y, gregorianMonth - 1, gregorianDay);
    if (candidate >= fromDate) {
      return candidate;
    }
  }

  return new Date(year + 1, gregorianMonth - 1, gregorianDay);
}

/**
 * Format an HDate for display, e.g. "15 Nisan 5785"
 */
export function formatHebrewDate(hdate: HDate, includeYear = false): string {
  const month = HEBREW_MONTH_NAMES[hdate.getMonth()] ?? hdate.getMonth().toString();
  const day = hdate.getDate();
  if (includeYear) return `${day} ${month} ${hdate.getFullYear()}`;
  return `${day} ${month}`;
}

/**
 * Format a Gregorian Date for display, e.g. "April 15" or "April 15, 2025"
 */
export function formatGregorianDate(date: Date, includeYear = false): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

/**
 * Get all days in a Gregorian month as { gregorianDate, hebrewDate } pairs.
 */
export function getMonthDates(year: number, month: number): Array<{
  gregorianDate: Date;
  hebrewDate: HDate;
}> {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const gregorianDate = new Date(year, month - 1, i + 1);
    return { gregorianDate, hebrewDate: new HDate(gregorianDate) };
  });
}

/**
 * Get the Hebrew month/year that a given Gregorian month most belongs to
 * (uses the 15th of the month as the midpoint).
 */
export function getHebrewMonthForGregorianMonth(
  year: number,
  month: number
): { hebrewMonth: number; hebrewYear: number; monthName: string } {
  const midpoint = new HDate(new Date(year, month - 1, 15));
  return {
    hebrewMonth: midpoint.getMonth(),
    hebrewYear: midpoint.getFullYear(),
    monthName: HEBREW_MONTH_NAMES[midpoint.getMonth()] ?? "",
  };
}

/**
 * Returns the weeks (arrays of 7 days) for a given Gregorian month,
 * padded with nulls so weeks always start on Sunday.
 */
export function getCalendarWeeks(year: number, month: number): Array<Array<{
  gregorianDate: Date;
  hebrewDate: HDate;
} | null>> {
  const days = getMonthDates(year, month);
  const firstDayOfWeek = days[0].gregorianDate.getDay(); // 0 = Sunday

  const padded: Array<{ gregorianDate: Date; hebrewDate: HDate } | null> = [
    ...Array(firstDayOfWeek).fill(null),
    ...days,
  ];

  while (padded.length % 7 !== 0) padded.push(null);

  const weeks: Array<Array<{ gregorianDate: Date; hebrewDate: HDate } | null>> = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  return weeks;
}
