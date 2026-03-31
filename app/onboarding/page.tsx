"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Jerusalem",
  "Asia/Tel_Aviv",
  "Australia/Sydney",
  "Australia/Melbourne",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [primaryCalendar, setPrimaryCalendar] = useState<"HEBREW" | "GREGORIAN">("GREGORIAN");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone, primaryCalendar }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      setLoading(false);
      alert("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-[var(--foreground)]">Welcome to Luach</h1>
        <p className="text-[var(--muted-foreground)] mb-8">
          Let&apos;s set up your preferences. You can change these any time.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
              Your time zone
            </label>
            <p className="text-xs text-[var(--muted-foreground)] mb-2">
              Used to determine when the Hebrew date changes at sunset.
            </p>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
              Default calendar view
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["GREGORIAN", "HEBREW"] as const).map((cal) => (
                <button
                  key={cal}
                  type="button"
                  onClick={() => setPrimaryCalendar(cal)}
                  className={`rounded-lg border-2 py-3 px-4 text-sm font-medium transition-colors ${
                    primaryCalendar === cal
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                  }`}
                >
                  {cal === "GREGORIAN" ? "English (Gregorian)" : "Hebrew"}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--primary)] text-white py-3 font-medium disabled:opacity-50 transition-opacity"
          >
            {loading ? "Saving…" : "Get started"}
          </button>
        </form>
      </div>
    </div>
  );
}
