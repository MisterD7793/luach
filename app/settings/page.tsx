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

  const [zip, setZip] = useState("");
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);
  const [zipLooking, setZipLooking] = useState(false);
  const [geoLooking, setGeoLooking] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user").then(r => r.json()).then(u => {
      setTimezone(u.timezone ?? "America/New_York");
      setPrimaryCalendar(u.primaryCalendar ?? "GREGORIAN");
      if (u.latitude != null && u.longitude != null) {
        setLocationLabel(`${u.latitude.toFixed(4)}, ${u.longitude.toFixed(4)}`);
      }
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

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLooking(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          );
          const data = await res.json();
          const label = [data.city || data.locality, data.countryName].filter(Boolean).join(", ");
          await fetch("/api/user", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: lat, longitude: lon }),
          });
          setLocationLabel(label || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        } catch {
          setGeoError("Could not save location.");
        } finally {
          setGeoLooking(false);
        }
      },
      () => {
        setGeoError("Location access was denied.");
        setGeoLooking(false);
      }
    );
  }

  async function lookupZip() {
    const z = zip.trim();
    if (!/^\d{5}$/.test(z)) {
      setZipError("Enter a 5-digit US zip code.");
      return;
    }
    setZipError(null);
    setZipLooking(true);
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${z}`);
      if (!res.ok) { setZipError("Zip code not found."); return; }
      const data = await res.json();
      const place = data.places[0];
      const lat = parseFloat(place.latitude);
      const lon = parseFloat(place.longitude);
      const label = `${place["place name"]}, ${place["state abbreviation"]}`;
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lon }),
      });
      setLocationLabel(label);
      setZip("");
    } catch {
      setZipError("Could not look up that zip code.");
    } finally {
      setZipLooking(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] w-full">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
        <button onClick={() => router.back()} className="p-1 min-h-[auto] min-w-[auto]">
          <ChevronLeft size={20} className="text-[var(--foreground)]" />
        </button>
        <h1 className="text-lg font-bold text-[var(--foreground)]">Settings</h1>
      </header>

      {loading ? (
        <div className="p-8 text-center text-[var(--muted-foreground)]">Loading…</div>
      ) : (
        <div className="p-5 space-y-8">

          {/* Section: Calendar */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)] mb-4">Calendar</div>
            <div className="space-y-6">
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
            </div>
          </div>

          {/* Section: Location */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)] mb-4">Location</div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
                Location
              </label>
              <p className="text-xs text-[var(--muted-foreground)] mb-2">
                Used for precise Zmanim calculations.
              </p>
            {locationLabel && (
              <p className="text-xs text-[var(--foreground)] mb-3">
                Current: <span className="font-medium">{locationLabel}</span>
              </p>
            )}
            <button
              onClick={useCurrentLocation}
              disabled={geoLooking}
              className="w-full rounded-lg border border-[var(--primary)] text-[var(--primary)] py-2.5 text-sm font-medium disabled:opacity-50 mb-2"
            >
              {geoLooking ? "Detecting…" : "Use my current location"}
            </button>
            {geoError && (
              <p className="text-xs text-red-500 mb-2">{geoError}</p>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs text-[var(--muted-foreground)]">or enter US zip code</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && lookupZip()}
                placeholder="e.g. 10001"
                maxLength={5}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
              <button
                onClick={lookupZip}
                disabled={zipLooking}
                className="rounded-lg bg-[var(--primary)] text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {zipLooking ? "…" : "Set"}
              </button>
            </div>
            {zipError && (
              <p className="text-xs text-red-500 mt-1">{zipError}</p>
            )}
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-lg bg-[var(--primary)] text-white py-3 font-medium disabled:opacity-50"
          >
            {saved ? "Saved!" : saving ? "Saving…" : "Save settings"}
          </button>

          {/* Section: Jewish Holidays */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)] mb-4">Jewish Holidays</div>
            <button
              onClick={() => router.push("/holidays")}
              className="w-full text-left rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium text-[var(--foreground)]"
            >
              Holiday categories and schedule →
            </button>
          </div>

          {/* Section: Account */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)] mb-4">Account</div>
            <UserButton />
          </div>

        </div>
      )}
      <Footer />
    </div>
  );
}
