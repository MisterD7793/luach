"use client";

import { useState, useEffect } from "react";
import { HDate } from "@hebcal/core";
import {
  HEBREW_MONTH_NAMES,
  GREGORIAN_MONTH_NAMES,
  gregorianToHebrew,
  hebrewToGregorian,
} from "@/lib/hebrew-calendar";
import { cn } from "@/lib/utils";

type EventType = "BIRTHDAY" | "ANNIVERSARY" | "YAHRZEIT" | "CUSTOM";

type Props = {
  initialGregorianDate?: Date;
  initialHebrewDate?: HDate;
  primaryCalendar: "HEBREW" | "GREGORIAN";
  onSave: (event: EventPayload) => Promise<void>;
  onCancel: () => void;
};

export type EventPayload = {
  title: string;
  type: EventType;
  notes: string;
  canonicalCalendar: "HEBREW" | "GREGORIAN";
  hebrewDay?: number;
  hebrewMonth?: number;
  gregorianMonth?: number;
  gregorianDay?: number;
  gregorianYear?: number;
  hebrewYear?: number;
  afterSunset?: boolean;
  reminderDaysBefore: number;
};

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "ANNIVERSARY", label: "Anniversary" },
  { value: "YAHRZEIT", label: "Yahrzeit" },
  { value: "CUSTOM", label: "Custom" },
];

const THIS_YEAR = new Date().getFullYear();
const GREGORIAN_YEARS = Array.from({ length: 150 }, (_, i) => THIS_YEAR - i);
const HEBREW_YEARS = Array.from({ length: 200 }, (_, i) => 5785 - 110 + i);

function hebrewMonthOptions(year: number) {
  const isLeap = HDate.isLeapYear(year);
  return Object.entries(HEBREW_MONTH_NAMES)
    .map(([num, name]) => ({ value: Number(num), label: name }))
    .filter(({ value }) => isLeap || value !== 12);
}

export default function EventForm({
  initialGregorianDate,
  initialHebrewDate,
  primaryCalendar,
  onSave,
  onCancel,
}: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("BIRTHDAY");
  const [notes, setNotes] = useState("");
  const [reminderDaysBefore, setReminderDaysBefore] = useState(7);
  const [saving, setSaving] = useState(false);

  // For BIRTHDAY/ANNIVERSARY/CUSTOM: which calendar does the user want to enter?
  // For YAHRZEIT: this is just the "entry format" — we always store Hebrew.
  const [entryCalendar, setEntryCalendar] = useState<"HEBREW" | "GREGORIAN">(
    primaryCalendar
  );
  const [afterSunset, setAfterSunset] = useState(false);

  // Gregorian date state
  const [gregYear, setGregYear] = useState(
    initialGregorianDate?.getFullYear() ?? THIS_YEAR
  );
  const [gregMonth, setGregMonth] = useState(
    initialGregorianDate ? initialGregorianDate.getMonth() + 1 : 1
  );
  const [gregDay, setGregDay] = useState(initialGregorianDate?.getDate() ?? 1);

  // Hebrew date state
  const [hebYear, setHebYear] = useState(
    initialHebrewDate?.getFullYear() ?? 5785
  );
  const [hebMonth, setHebMonth] = useState(
    initialHebrewDate?.getMonth() ?? 7
  );
  const [hebDay, setHebDay] = useState(initialHebrewDate?.getDate() ?? 1);

  // Cross-calendar preview (always shown)
  const [crossCalPreview, setCrossCalPreview] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (entryCalendar === "GREGORIAN") {
        const d = new Date(gregYear, gregMonth - 1, gregDay);
        const hd = gregorianToHebrew(d, afterSunset);
        const monthName = HEBREW_MONTH_NAMES[hd.getMonth()];
        setCrossCalPreview(`${hd.getDate()} ${monthName} ${hd.getFullYear()}`);
      } else {
        const hd = new HDate(hebDay, hebMonth, hebYear);
        const gd = hebrewToGregorian(hd);
        setCrossCalPreview(
          gd.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        );
      }
    } catch {
      setCrossCalPreview(null);
    }
  }, [entryCalendar, gregYear, gregMonth, gregDay, hebYear, hebMonth, hebDay, afterSunset]);

  // Clamp day when month/year changes
  useEffect(() => {
    const max = new Date(gregYear, gregMonth, 0).getDate();
    if (gregDay > max) setGregDay(max);
  }, [gregYear, gregMonth, gregDay]);

  useEffect(() => {
    const max = HDate.daysInMonth(hebMonth, hebYear);
    if (hebDay > max) setHebDay(max);
  }, [hebYear, hebMonth, hebDay]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    // For YAHRZEIT: always canonical Hebrew regardless of entry calendar.
    // For CUSTOM: use the entry calendar as canonical.
    // For BIRTHDAY/ANNIVERSARY: canonical = entry calendar (API creates the pair).
    const canonicalCalendar =
      type === "YAHRZEIT" ? "HEBREW" : entryCalendar;

    const payload: EventPayload = {
      title: title.trim(),
      type,
      notes: notes.trim(),
      canonicalCalendar,
      reminderDaysBefore,
      afterSunset: entryCalendar === "GREGORIAN" ? afterSunset : false,
      ...(entryCalendar === "GREGORIAN"
        ? { gregorianMonth: gregMonth, gregorianDay: gregDay, gregorianYear: gregYear }
        : { hebrewDay: hebDay, hebrewMonth: hebMonth, hebrewYear: hebYear }),
    };

    await onSave(payload);
    setSaving(false);
  }

  const daysInGregMonth = new Date(gregYear, gregMonth, 0).getDate();
  const daysInHebMonth = HDate.daysInMonth(hebMonth, hebYear);
  const monthOpts = hebrewMonthOptions(hebYear);

  const selectClass =
    "rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";

  // What will be created?
  const pairedLabel =
    type === "BIRTHDAY" || type === "ANNIVERSARY"
      ? entryCalendar === "GREGORIAN"
        ? `"${title.trim() || "…"}" + "${title.trim() || "…"} (Hebrew)" — two events, both with reminders`
        : `"${title.trim() || "…"}" + "${title.trim() || "…"} (English)" — two events, both with reminders`
      : type === "YAHRZEIT"
      ? "One event on the Hebrew calendar only"
      : "One event";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
          Name *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Grandma Rose's Birthday"
          required
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
          Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_TYPES.map((et) => (
            <button
              key={et.value}
              type="button"
              onClick={() => setType(et.value)}
              className={cn(
                "rounded-lg border py-2 text-sm font-medium transition-colors",
                type === et.value
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
              )}
            >
              {et.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entry calendar — label changes for yahrzeit */}
      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
          {type === "YAHRZEIT" ? "Enter date as" : "Enter date as"}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["GREGORIAN", "HEBREW"] as const).map((cal) => (
            <button
              key={cal}
              type="button"
              onClick={() => setEntryCalendar(cal)}
              className={cn(
                "rounded-lg border py-2 text-sm font-medium transition-colors",
                entryCalendar === cal
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
              )}
            >
              {cal === "GREGORIAN" ? "English date" : "Hebrew date"}
            </button>
          ))}
        </div>
        {type === "YAHRZEIT" && (
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Yahrzeit is always tracked by Hebrew date. Enter whichever you know.
          </p>
        )}
      </div>

      {/* Date entry */}
      {entryCalendar === "GREGORIAN" ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--foreground)]">
            Date
          </label>
          <div className="flex gap-2">
            <select
              value={gregMonth}
              onChange={(e) => setGregMonth(Number(e.target.value))}
              className={cn(selectClass, "flex-1")}
            >
              {GREGORIAN_MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={gregDay}
              onChange={(e) => setGregDay(Number(e.target.value))}
              className={cn(selectClass, "w-16")}
            >
              {Array.from({ length: daysInGregMonth }, (_, i) => i + 1).map(
                (d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                )
              )}
            </select>
            <select
              value={gregYear}
              onChange={(e) => setGregYear(Number(e.target.value))}
              className={cn(selectClass, "w-24")}
            >
              {GREGORIAN_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Sunset toggle */}
          <button
            type="button"
            onClick={() => setAfterSunset((v) => !v)}
            className={cn(
              "w-full rounded-lg border py-2 text-sm font-medium transition-colors text-left px-3",
              afterSunset
                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
            )}
          >
            {afterSunset ? "✓ After sunset" : "Before sunset (tap to change)"}
          </button>
          <p className="text-xs text-[var(--muted-foreground)]">
            The Hebrew date changes at sunset. If this happened after sunset,
            the Hebrew date is one day later.
          </p>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
            Hebrew date
          </label>
          <div className="flex gap-2">
            <select
              value={hebMonth}
              onChange={(e) => setHebMonth(Number(e.target.value))}
              className={cn(selectClass, "flex-1")}
            >
              {monthOpts.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={hebDay}
              onChange={(e) => setHebDay(Number(e.target.value))}
              className={cn(selectClass, "w-16")}
            >
              {Array.from({ length: daysInHebMonth }, (_, i) => i + 1).map(
                (d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                )
              )}
            </select>
            <select
              value={hebYear}
              onChange={(e) => setHebYear(Number(e.target.value))}
              className={cn(selectClass, "w-24")}
            >
              {HEBREW_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Cross-calendar preview */}
      {crossCalPreview && (
        <p className="text-xs text-[var(--muted-foreground)] -mt-1">
          {entryCalendar === "GREGORIAN" ? "Hebrew: " : "English: "}
          <span className="font-medium text-[var(--foreground)]">
            {crossCalPreview}
          </span>{" "}
          <span>(for the year entered)</span>
        </p>
      )}

      {/* What gets created */}
      {title.trim() && (
        <div className="rounded-lg bg-[var(--secondary)] px-3 py-2">
          <p className="text-xs text-[var(--muted-foreground)]">
            Will create: <span className="text-[var(--foreground)]">{pairedLabel}</span>
          </p>
        </div>
      )}

      {/* Reminder */}
      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
          Remind me
        </label>
        <select
          value={reminderDaysBefore}
          onChange={(e) => setReminderDaysBefore(Number(e.target.value))}
          className={cn(selectClass, "w-full")}
        >
          <option value={0}>On the day</option>
          <option value={1}>1 day before</option>
          <option value={3}>3 days before</option>
          <option value={7}>1 week before</option>
          <option value={14}>2 weeks before</option>
          <option value={30}>1 month before</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
          placeholder="Optional notes…"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-[var(--border)] py-3 text-sm font-medium text-[var(--foreground)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="flex-1 rounded-lg bg-[var(--primary)] text-white py-3 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
