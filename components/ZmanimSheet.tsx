"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zmanim, GeoLocation, HebrewCalendar, flags } from "@hebcal/core";

type Props = {
  date: Date;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  timezone: string;
  onClose: () => void;
};

type ZmanimRow = {
  label: string;
  sub?: string;
  time: string;
  special?: boolean;
};

const BASE_ZMANIM: {
  label: string;
  sub?: string;
  method: (z: Zmanim) => Date | null;
}[] = [
  { label: "Alot HaShachar", sub: "Dawn", method: (z) => z.alotHaShachar() },
  { label: "Misheyakir", sub: "Earliest tallit & tefillin", method: (z) => z.misheyakir() },
  { label: "Netz HaChamah", sub: "Sunrise", method: (z) => z.sunrise() },
  { label: "Sof Zman Kriat Shema", sub: "GRA", method: (z) => z.sofZmanShma() },
  { label: "Sof Zman Kriat Shema", sub: "Magen Avraham", method: (z) => z.sofZmanShmaMGA() },
  { label: "Sof Zman Tefila", sub: "GRA", method: (z) => z.sofZmanTfilla() },
  { label: "Chatzot", sub: "Halachic noon", method: (z) => z.chatzot() },
  { label: "Mincha Gedola", sub: "Earliest Mincha", method: (z) => z.minchaGedola() },
  { label: "Mincha Ketana", method: (z) => z.minchaKetana() },
  { label: "Plag HaMincha", method: (z) => z.plagHaMincha() },
  // index 10 — candle lighting inserted here when relevant
  { label: "Shkiah", sub: "Sunset", method: (z) => z.sunset() },
  { label: "Tzet HaKochavim", sub: "Nightfall", method: (z) => z.tzeit() },
  // Havdalah appended here when relevant
];

function formatTime(date: Date | null, timezone: string): string {
  if (!date) return "—";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  });
}

export default function ZmanimSheet({ date, latitude, longitude, timezone, onClose }: Props) {
  const router = useRouter();
  const [locationName, setLocationName] = useState<string | null>(null);

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
      .then((r) => r.json())
      .then((data) => {
        const label = [data.city || data.locality, data.countryName].filter(Boolean).join(", ");
        if (label) setLocationName(label);
      })
      .catch(() => {});
  }, [latitude, longitude]);

  const rows = useMemo((): ZmanimRow[] | null => {
    if (latitude == null || longitude == null) return null;
    try {
      const gloc = new GeoLocation(null, latitude, longitude, 0, timezone);
      const z = new Zmanim(gloc, date, false);

      const dayOfWeek = date.getDay(); // 0=Sun … 5=Fri, 6=Sat

      // Check if tomorrow starts a Yom Tov (Erev Yom Tov)
      const tomorrow = new Date(date);
      tomorrow.setDate(date.getDate() + 1);
      const tomorrowEvents = HebrewCalendar.calendar({ start: tomorrow, end: tomorrow, il: false });
      const isErevYomTov = dayOfWeek !== 5 && tomorrowEvents.some(e => !!(e.getFlags() & flags.CHAG));

      // Check if today is Yom Tov (Motzei Yom Tov — applies after nightfall)
      const todayEvents = HebrewCalendar.calendar({ start: date, end: date, il: false });
      const isYomTov = dayOfWeek !== 6 && todayEvents.some(e => !!(e.getFlags() & flags.CHAG));

      const isCandleLightingDay = dayOfWeek === 5 || isErevYomTov;
      const isHavdalahDay = dayOfWeek === 6 || isYomTov;

      // Build base rows
      const result: ZmanimRow[] = BASE_ZMANIM.map(row => ({
        label: row.label,
        sub: row.sub,
        time: formatTime(row.method(z), timezone),
      }));

      // Insert candle lighting before Shkiah (index 10)
      if (isCandleLightingDay) {
        const sunset = z.sunset();
        const candleTime = sunset ? new Date(sunset.getTime() - 18 * 60 * 1000) : null;
        result.splice(10, 0, {
          label: "Hadlakat Nerot",
          sub: "Candle lighting · 18 min before sunset",
          time: formatTime(candleTime, timezone),
          special: true,
        });
      }

      // Append Havdalah after Tzet HaKochavim
      if (isHavdalahDay) {
        result.push({
          label: "Havdalah",
          sub: "Tzet HaKochavim",
          time: formatTime(z.tzeit(), timezone),
          special: true,
        });
      }

      return result;
    } catch {
      return null;
    }
  }, [date, latitude, longitude, timezone]);

  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-auto bg-[var(--card)] rounded-t-2xl p-5 pb-8 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">Zmanim</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{dateLabel}</p>
              {locationName && (
                <p className="text-sm text-[var(--foreground)] mt-0.5">{locationName}</p>
              )}
            </div>
            <button
              onClick={() => { onClose(); router.push("/settings"); }}
              className="text-xs text-[var(--muted-foreground)] underline shrink-0 mt-1 min-h-[auto] min-w-[auto]"
            >
              Change location
            </button>
          </div>
        </div>

        {rows == null ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Zmanim require your location. Add your coordinates in Settings to enable this feature.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {rows.map((row, i) => (
              <li key={i} className="flex items-center justify-between py-2.5">
                <div>
                  <div className={row.special
                    ? "text-sm font-semibold text-[var(--primary)]"
                    : "text-sm font-medium text-[var(--foreground)]"
                  }>
                    {row.label}
                  </div>
                  {row.sub && (
                    <div className="text-xs text-[var(--muted-foreground)]">{row.sub}</div>
                  )}
                </div>
                <div className={row.special
                  ? "text-sm font-semibold text-[var(--primary)] tabular-nums"
                  : "text-sm font-medium text-[var(--foreground)] tabular-nums"
                }>
                  {row.time}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
