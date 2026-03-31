"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Footer from "@/components/Footer";

const VERSIONS = [
  {
    version: "0.3.1",
    name: "Bug Fixes",
    date: "March 31, 2026",
    changes: [
      "Fixed duplicate month header — month and year now appear once in the navigation bar, with the secondary calendar shown below it",
    ],
  },
  {
    version: "0.3.0",
    name: "Halachic Times",
    date: "March 31, 2026",
    changes: [
      "Daily Zmanim — tap the clock icon on the Today strip to see halachic times for the day",
      "Location picker in Settings — use your device's location (works worldwide) or enter a US zip code",
      "Zmanim card shows your city and a quick link to change location for travellers",
      "Footer with About, Coming Soon, and Version History links on every page",
      "Coming Soon page listing planned features",
      "Add event from day view now pre-fills the form with that day's date",
    ],
  },
  {
    version: "0.2.0",
    name: "Public Beta",
    date: "March 31, 2026",
    changes: [
      "First public beta — app is now live at luach.misterd.net",
      "Custom domain configured (luach.misterd.net) via Vercel and Clerk Production instance",
      "Switched from Clerk Development to Clerk Production for real user authentication",
      "Google sign-in enabled via custom Google OAuth credentials",
      "Added changelog and About pages, both linked from Settings",
      "Fixed: tapping \"Add event on this day\" now pre-fills the form with the selected date on whichever calendar is active",
    ],
  },
  {
    version: "0.1.0",
    name: "Event Entry",
    date: "March 31, 2026",
    changes: [
      "Birthdays and anniversaries now create two events automatically — one on the Hebrew date, one on the English date, both with reminders",
      "Yahrzeits are Hebrew-only; you can enter the English date as a lookup tool and we convert it",
      "Added before/after sunset toggle when entering an English date — the Hebrew day changes at sunset",
      "Added year picker to both English and Hebrew date entry",
      "Fixed Hebrew date derivation to use the year you entered, not the current year",
      "Cross-calendar date preview shown as you type",
    ],
  },
  {
    version: "0.0.9",
    name: "First Deployment",
    date: "March 31, 2026",
    changes: [
      "Connected live PostgreSQL database (Supabase)",
      "Connected authentication (Clerk — email and phone sign-in)",
      "Deployed to Vercel at luach.vercel.app",
      "App fully functional end-to-end for the first time",
    ],
  },
  {
    version: "0.0.1",
    name: "Scaffold",
    date: "March 30, 2026",
    changes: [
      "Initial project scaffold",
      "Calendar grid showing both Hebrew and Gregorian dates on every cell",
      "Toggle between Hebrew-primary and English-primary calendar view",
      "Sunday–Saturday layout regardless of which calendar is primary",
      "Hebrew date changes at sunset (timezone-aware)",
      "Event types: Birthday, Anniversary, Yahrzeit, Custom",
      "Events stored with a canonical calendar — Hebrew-date events recur on the same Hebrew date each year, English-date events on the same English date",
      "Leap year handling for Adar I / Adar II",
      "In-app notification feed with configurable reminder lead time",
      "Onboarding flow for timezone and default calendar preference",
      "Settings page",
    ],
  },
];

export default function ChangelogPage() {
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
        <h1 className="text-lg font-bold text-[var(--foreground)]">Version history</h1>
      </header>

      <div className="p-5 space-y-8">
        {VERSIONS.map((v) => (
          <div key={v.version}>
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-base font-bold text-[var(--foreground)]">
                v{v.version}
              </span>
              <span className="text-base font-semibold text-[var(--primary)]">
                {v.name}
              </span>
              <span className="text-sm text-[var(--muted-foreground)]">{v.date}</span>
            </div>
            <ul className="space-y-2 mt-3">
              {v.changes.map((change, i) => (
                <li key={i} className="flex gap-2 text-sm text-[var(--foreground)]">
                  <span className="text-[var(--muted-foreground)] mt-0.5 shrink-0">–</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}
