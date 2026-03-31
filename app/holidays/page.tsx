"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_HOLIDAY_SETTINGS, type HolidaySettings } from "@/lib/holidays";
import Footer from "@/components/Footer";

type ToggleRowProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
};

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--border)] last:border-0">
      <div>
        <div className="text-sm font-medium text-[var(--foreground)]">{label}</div>
        {description && (
          <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
          checked ? "bg-[var(--primary)]" : "bg-[var(--border)]"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export default function HolidaysPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<HolidaySettings>(DEFAULT_HOLIDAY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/user").then(r => r.json()).then(u => {
      if (u.holidaySettings) {
        setSettings({ ...DEFAULT_HOLIDAY_SETTINGS, ...u.holidaySettings });
      }
      setLoading(false);
    });
  }, []);

  async function update(patch: Partial<HolidaySettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holidaySettings: next }),
    });
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] max-w-lg mx-auto">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
        <button onClick={() => router.back()} className="p-1 min-h-[auto] min-w-[auto]">
          <ChevronLeft size={20} className="text-[var(--foreground)]" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[var(--foreground)]">Jewish holidays</h1>
        </div>
        {saving && <span className="text-xs text-[var(--muted-foreground)]">Saving…</span>}
      </header>

      {loading ? (
        <div className="p-8 text-center text-[var(--muted-foreground)]">Loading…</div>
      ) : (
        <div className="p-5 space-y-6">
          <ToggleRow
            label="Show holidays on calendar"
            checked={settings.enabled}
            onChange={(val) => update({ enabled: val })}
          />

          {settings.enabled && (
            <>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Schedule</div>
                <div className="grid grid-cols-2 gap-2">
                  {(["Diaspora", "Israel"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => update({ il: s === "Israel" })}
                      className={cn(
                        "rounded-lg border py-2 text-sm font-medium transition-colors",
                        (s === "Israel") === settings.il
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                          : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Categories</div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4">
                  <ToggleRow label="Major holidays" description="Rosh Hashana, Yom Kippur, Pesach, Shavuot, Sukkot…" checked={settings.major} onChange={(val) => update({ major: val })} />
                  <ToggleRow label="Minor holidays" description="Chanukah, Purim, Tu B'Shvat, Lag B'Omer…" checked={settings.minor} onChange={(val) => update({ minor: val })} />
                  <ToggleRow label="Rosh Chodesh" description="New month" checked={settings.roshChodesh} onChange={(val) => update({ roshChodesh: val })} />
                  <ToggleRow label="Minor fasts" description="17 Tammuz, Fast of Gedaliah…" checked={settings.minorFasts} onChange={(val) => update({ minorFasts: val })} />
                  <ToggleRow label="Special Shabbatot" description="Shabbat Shekalim, Zachor, Parah, HaChodesh…" checked={settings.specialShabbatot} onChange={(val) => update({ specialShabbatot: val })} />
                  <ToggleRow label="Modern holidays" description="Yom HaShoah, Yom HaZikaron, Yom HaAtzmaut…" checked={settings.modern} onChange={(val) => update({ modern: val })} />
                  <ToggleRow label="Days of the Omer" checked={settings.omer} onChange={(val) => update({ omer: val })} />
                  <ToggleRow label="Yom Kippur Katan" checked={settings.yomKippurKatan} onChange={(val) => update({ yomKippurKatan: val })} />
                  <ToggleRow label="Weekly Torah portion" checked={settings.parsha} onChange={(val) => update({ parsha: val })} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
      <Footer />
    </div>
  );
}
