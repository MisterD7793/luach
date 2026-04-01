"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const FEATURES = [
  {
    title: "Tablet and desktop layout",
    description:
      "A fully responsive design that makes the most of larger screens — iPad, desktop, and beyond. The calendar will expand to fill the available space rather than appearing as a narrow column.",
  },
  {
    title: "Year navigation",
    description:
      "Tap the year in the month header to jump directly to any year — no more arrow-tapping through months to reach a date in the distant past.",
  },
  {
    title: "Jewish holidays",
    description:
      "Display a standard set of Jewish holidays on the calendar, opt-in by category: Major Holidays, Minor Holidays, Rosh Chodesh, Minor Fasts, Special Shabbatot, Modern Holidays (Yom HaShoah, Yom HaAtzmaut, etc.), Days of the Omer, Yizkor, and Weekly Torah portion. Choose Diaspora or Israel holiday schedule.",
  },
  {
    title: "Hebrew interface",
    description:
      "When Hebrew is your primary calendar, the app switches to Hebrew language and right-to-left layout throughout. The calendar toggle becomes a compact EN | HE switch.",
  },
  {
    title: "Daily Zmanim",
    description:
      "One tap to see the halachic times for any day — Alot HaShachar, Sunrise, Sof Zman Kriat Shema, Mincha, Shkiah, Tzet HaKochavim, and more. Times are calculated for your location.",
  },
  {
    title: "Event editing and deletion",
    description: "Edit or delete events you've already saved.",
  },
  {
    title: "Push and email reminders",
    description:
      "Receive reminders outside the app — via push notification or email — in addition to the in-app notification feed.",
  },
  {
    title: "Themes",
    description:
      "Choose from a set of color themes to personalize the app's appearance.",
  },
];

export default function FuturePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--background)] max-w-lg mx-auto">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
        <button
          onClick={() => router.back()}
          className="p-1 min-h-[auto] min-w-[auto]"
        >
          <ChevronLeft size={20} className="text-[var(--foreground)]" />
        </button>
        <h1 className="text-lg font-bold text-[var(--foreground)]">Coming soon</h1>
      </header>

      <div className="p-5 space-y-6">
        <p className="text-sm text-[var(--muted-foreground)]">
          Features planned for future releases, in no particular order.
        </p>

        {FEATURES.map((f) => (
          <div key={f.title}>
            <div className="text-sm font-semibold text-[var(--foreground)] mb-1">{f.title}</div>
            <div className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              {f.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
