/**
 * Holiday calculation using @hebcal/core HebrewCalendar.
 * Returns holidays for a given Gregorian month, filtered by user preferences.
 */

import { HebrewCalendar, flags } from "@hebcal/core";

export type HolidaySettings = {
  enabled: boolean;
  il: boolean; // Israel vs Diaspora schedule
  major: boolean; // Yom Tov + Major fasts (Yom Kippur, Tisha B'Av)
  minor: boolean; // Minor holidays (Chanukah, Purim, etc.)
  roshChodesh: boolean;
  minorFasts: boolean; // Minor fasts (17 Tammuz, etc.)
  specialShabbatot: boolean;
  modern: boolean; // Yom HaShoah, Yom HaAtzmaut, etc.
  omer: boolean;
  yomKippurKatan: boolean;
  parsha: boolean; // Weekly Torah portion
};

export const DEFAULT_HOLIDAY_SETTINGS: HolidaySettings = {
  enabled: true,
  il: false,
  major: true,
  minor: true,
  roshChodesh: true,
  minorFasts: true,
  specialShabbatot: true,
  modern: true,
  omer: false,
  yomKippurKatan: false,
  parsha: false,
};

export type HolidayEntry = {
  /** Date string in format "YYYY-MM-DD" for fast lookup */
  dateKey: string;
  name: string;
};

/**
 * Returns a map of dateKey → holiday name for a given Gregorian year/month,
 * filtered by the user's holiday settings.
 */
export function getHolidaysForMonth(
  year: number,
  month: number, // 1-12
  settings: HolidaySettings
): Map<string, string> {
  const result = new Map<string, string>();
  if (!settings.enabled) return result;

  const events = HebrewCalendar.calendar({
    year,
    isHebrewYear: false,
    month,
    il: settings.il,
    sedrot: settings.parsha,
    omer: settings.omer,
    yomKippurKatan: settings.yomKippurKatan,
  });

  for (const ev of events) {
    const f = ev.getFlags();

    // Skip Israel-only events if using Diaspora schedule
    if (!settings.il && f & flags.IL_ONLY) continue;
    // Skip Diaspora-only events if using Israel schedule
    if (settings.il && f & flags.CHUL_ONLY) continue;

    // Determine which category this event belongs to
    const isMajor = !!(f & flags.CHAG) || !!(f & flags.MAJOR_FAST);
    const isMinor = !!(f & flags.MINOR_HOLIDAY);
    const isRoshChodesh = !!(f & flags.ROSH_CHODESH);
    const isMinorFast = !!(f & flags.MINOR_FAST);
    const isSpecialShabbat = !!(f & flags.SPECIAL_SHABBAT);
    const isModern = !!(f & flags.MODERN_HOLIDAY);
    const isOmer = !!(f & flags.OMER_COUNT);
    const isYomKippurKatan = !!(f & flags.YOM_KIPPUR_KATAN);
    const isParsha = !!(f & flags.PARSHA_HASHAVUA);

    const include =
      (isMajor && settings.major) ||
      (isMinor && settings.minor) ||
      (isRoshChodesh && settings.roshChodesh) ||
      (isMinorFast && settings.minorFasts) ||
      (isSpecialShabbat && settings.specialShabbatot) ||
      (isModern && settings.modern) ||
      (isOmer && settings.omer) ||
      (isYomKippurKatan && settings.yomKippurKatan) ||
      (isParsha && settings.parsha);

    if (!include) continue;

    const greg = ev.getDate().greg();
    const key = greg.toISOString().slice(0, 10);
    // Only store the first (most significant) holiday per day
    if (!result.has(key)) {
      result.set(key, ev.render("en"));
    }
  }

  return result;
}

/** Convert a Date to a "YYYY-MM-DD" key */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
