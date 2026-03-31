"use client";

import { useState } from "react";
import { HDate } from "@hebcal/core";
import { HEBREW_MONTH_NAMES, GREGORIAN_MONTH_NAMES } from "@/lib/hebrew-calendar";
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
  reminderDaysBefore: number;
};

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "ANNIVERSARY", label: "Anniversary" },
  { value: "YAHRZEIT", label: "Yahrzeit" },
  { value: "CUSTOM", label: "Custom" },
];

export default function EventForm({
  initialGregorianDate,
  initialHebrewDate,
  primaryCalendar,
  onSave,
  onCancel,
}: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("CUSTOM");
  const [notes, setNotes] = useState("");
  const [canonicalCalendar, setCanonicalCalendar] = useState<"HEBREW" | "GREGORIAN">(primaryCalendar);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(0);
  const [saving, setSaving] = useState(false);

  // Gregorian date state
  const [gregMonth, setGregMonth] = useState(
    initialGregorianDate ? initialGregorianDate.getMonth() + 1 : 1
  );
  const [gregDay, setGregDay] = useState(
    initialGregorianDate ? initialGregorianDate.getDate() : 1
  );

  // Hebrew date state
  const [hebMonth, setHebMonth] = useState(
    initialHebrewDate ? initialHebrewDate.getMonth() : 7 // Tishrei default
  );
  const [hebDay, setHebDay] = useState(
    initialHebrewDate ? initialHebrewDate.getDate() : 1
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const payload: EventPayload = {
      title: title.trim(),
      type,
      notes: notes.trim(),
      canonicalCalendar,
      reminderDaysBefore,
      ...(canonicalCalendar === "HEBREW"
        ? { hebrewDay: hebDay, hebrewMonth: hebMonth }
        : { gregorianMonth: gregMonth, gregorianDay: gregDay }),
    };

    await onSave(payload);
    setSaving(false);
  }

  // Build Hebrew month options (include Adar II only if needed — we always show it for user input)
  const hebrewMonthOptions = Object.entries(HEBREW_MONTH_NAMES).map(([num, name]) => ({
    value: Number(num),
    label: name,
  }));

  const daysInGregMonth = new Date(2024, gregMonth, 0).getDate(); // 2024 = leap year, safe for Feb
  const daysInHebMonth = 30; // Show 1-30, let the engine clamp at save time

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
          placeholder="e.g. Grandma Rose's birthday"
          required
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Type</label>
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

      {/* Calendar system for this event */}
      <div>
        <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
          Track by
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["GREGORIAN", "HEBREW"] as const).map((cal) => (
            <button
              key={cal}
              type="button"
              onClick={() => setCanonicalCalendar(cal)}
              className={cn(
                "rounded-lg border py-2 text-sm font-medium transition-colors",
                canonicalCalendar === cal
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
              )}
            >
              {cal === "GREGORIAN" ? "English date" : "Hebrew date"}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          {canonicalCalendar === "HEBREW"
            ? "This event will recur on the same Hebrew date each year."
            : "This event will recur on the same English date each year."}
        </p>
      </div>

      {/* Date entry */}
      {canonicalCalendar === "GREGORIAN" ? (
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Date</label>
          <div className="flex gap-2">
            <select
              value={gregMonth}
              onChange={(e) => setGregMonth(Number(e.target.value))}
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {GREGORIAN_MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
            <select
              value={gregDay}
              onChange={(e) => setGregDay(Number(e.target.value))}
              className="w-20 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {Array.from({ length: daysInGregMonth }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
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
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {hebrewMonthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={hebDay}
              onChange={(e) => setHebDay(Number(e.target.value))}
              className="w-20 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {Array.from({ length: daysInHebMonth }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
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
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
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
          {saving ? "Saving…" : "Save event"}
        </button>
      </div>
    </form>
  );
}
