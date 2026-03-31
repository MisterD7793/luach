"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ChevronLeft } from "lucide-react";
import Footer from "@/components/Footer";

const COMMON_TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "America/Anchorage", "Pacific/Honolulu", "Europe/London",
  "Europe/Paris", "Europe/Berlin", "Europe/Jerusalem", "Asia/Tel_Aviv",
  "Australia/Sydney", "Australia/Melbourne",
];

export default function SettingsPage() {
  const router = useRouter();
  const [timezone, setTimezone] = useState("America/New_York");
  const [primaryCalendar, setPrimaryCalendar] = useState<"HEBREW" | "GREGORIAN">("GREGORIAN");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/user").then(r => r.json()).then(u => {
      setTimezone(u.timezone ?? "America/New_York");
      setPrimaryCalendar(u.primaryCalendar ?? "GREGORIAN");
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone, primaryCalendar }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] max-w-lg mx-auto">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
        <button onClick={() => router.back()} className="p-1 min-h-[auto] min-w-[auto]">
          <ChevronLeft size={20} className="text-[var(--foreground)]" />
        </button>
        <h1 className="text-lg font-bold text-[var(--foreground)]">Settings</h1>
      </header>

      {loading ? (
        <div className="p-8 text-center text-[var(--muted-foreground)]">Loading…</div>
      ) : (
        <div className="p-5 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
              Time zone
            </label>
            <p className="text-xs text-[var(--muted-foreground)] mb-2">
              Determines when the Hebrew date changes at sunset.
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
                  className={`rounded-lg border-2 py-3 text-sm font-medium transition-colors ${
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
            onClick={save}
            disabled={saving}
            className="w-full rounded-lg bg-[var(--primary)] text-white py-3 font-medium disabled:opacity-50"
          >
            {saved ? "Saved!" : saving ? "Saving…" : "Save settings"}
          </button>

          <div className="pt-4 border-t border-[var(--border)]">
            <div className="text-sm font-medium mb-3 text-[var(--foreground)]">Account</div>
            <UserButton />
          </div>

        </div>
      )}
      <Footer />
    </div>
  );
}
