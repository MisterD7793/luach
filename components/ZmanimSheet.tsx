"use client";

import { useMemo } from "react";
import { Zmanim, GeoLocation } from "@hebcal/core";

type Props = {
  date: Date;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  timezone: string;
  onClose: () => void;
};

const ZMANIM_ROWS: {
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
  { label: "Shkiah", sub: "Sunset", method: (z) => z.sunset() },
  { label: "Tzet HaKochavim", sub: "Nightfall", method: (z) => z.tzeit() },
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
  const rows = useMemo(() => {
    if (latitude == null || longitude == null) return null;
    try {
      const gloc = new GeoLocation(null, latitude, longitude, 0, timezone);
      const z = new Zmanim(gloc, date, false);
      return ZMANIM_ROWS.map((row) => ({
        label: row.label,
        sub: row.sub,
        time: formatTime(row.method(z), timezone),
      }));
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
          <h2 className="text-lg font-bold text-[var(--foreground)]">Zmanim</h2>
          <p className="text-sm text-[var(--muted-foreground)]">{dateLabel}</p>
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
                  <div className="text-sm font-medium text-[var(--foreground)]">{row.label}</div>
                  {row.sub && (
                    <div className="text-xs text-[var(--muted-foreground)]">{row.sub}</div>
                  )}
                </div>
                <div className="text-sm font-medium text-[var(--foreground)] tabular-nums">
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
