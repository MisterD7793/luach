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
      <div className="flex-1">
        <div className="text-sm font-medium text-[var(--foreground)]">{label}</div>
        {description && (
          <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          position: "relative",
          display: "inline-block",
          flexShrink: 0,
          width: 44,
          height: 24,
          minHeight: 0,
          minWidth: 0,
          borderRadius: 12,
          border: "none",
          padding: 0,
          cursor: "pointer",
          backgroundColor: checked ? "var(--primary)" : "#d1d5db",
          transition: "background-color 0.2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            transition: "left 0.2s",
          }}
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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/user").then(r => r.json()).then(u => {
      if (u.holidaySettings) {
        setSettings({ ...DEFAULT_HOLIDAY_SETTINGS, ...u.holidaySettings });
      }
      setLoading(false);
    });
  }, []);

  function toggle(patch: Partial<HolidaySettings>) {
    setSettings(prev => ({ ...prev, ...patch }));
  }

  async function save() {
    setSaving(true);
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holidaySettings: settings }),
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
        <h1 className="text-lg font-bold text-[var(--foreground)] flex-1">Jewish holidays</h1>
      </header>

      {loading ? (
        <div className="p-8 text-center text-[var(--muted-foreground)]">Loading…</div>
      ) : (
        <div className="p-5 space-y-6">
          <ToggleRow
            label="Show holidays on calendar"
            checked={settings.enabled}
            onChange={(val) => toggle({ enabled: val })}
          />

          {settings.enabled && (
            <>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Schedule</div>
                <div className="grid grid-cols-2 gap-2">
                  {(["Diaspora", "Israel"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => toggle({ il: s === "Israel" })}
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
                  <ToggleRow label="Major holidays" description="Rosh Hashana, Yom Kippur, Pesach, Shavuot, Sukkot…" checked={settings.major} onChange={(val) => toggle({ major: val })} />
                  <ToggleRow label="Minor holidays" description="Chanukah, Purim, Tu B'Shvat, Lag B'Omer…" checked={settings.minor} onChange={(val) => toggle({ minor: val })} />
                  <ToggleRow label="Rosh Chodesh" description="New month" checked={settings.roshChodesh} onChange={(val) => toggle({ roshChodesh: val })} />
                  <ToggleRow label="Minor fasts" description="17 Tammuz, Fast of Gedaliah…" checked={settings.minorFasts} onChange={(val) => toggle({ minorFasts: val })} />
                  <ToggleRow label="Special Shabbatot" description="Shabbat Shekalim, Zachor, Parah, HaChodesh…" checked={settings.specialShabbatot} onChange={(val) => toggle({ specialShabbatot: val })} />
                  <ToggleRow label="Modern holidays" description="Yom HaShoah, Yom HaZikaron, Yom HaAtzmaut…" checked={settings.modern} onChange={(val) => toggle({ modern: val })} />
                  <ToggleRow label="Days of the Omer" checked={settings.omer} onChange={(val) => toggle({ omer: val })} />
                  <ToggleRow label="Yom Kippur Katan" checked={settings.yomKippurKatan} onChange={(val) => toggle({ yomKippurKatan: val })} />
                  <ToggleRow label="Weekly Torah portion" checked={settings.parsha} onChange={(val) => toggle({ parsha: val })} />
                </div>
              </div>
            </>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-lg bg-[var(--primary)] text-white py-3 font-medium disabled:opacity-50"
          >
            {saved ? "Saved!" : saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
      <Footer />
    </div>
  );
}
