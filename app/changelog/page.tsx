"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Footer from "@/components/Footer";

const VERSIONS = [
  {
    version: "0.6.2",
    name: "Guest Banner",
    date: "April 5, 2026",
    changes: [
      "Guest mode banner now has a yellow background for better visibility",
    ],
  },
  {
    version: "0.6.1",
    name: "Guest Mode Polish",
    date: "April 5, 2026",
    changes: [
      "Guest banner now clarifies that your location is set to Jerusalem and that events and settings are not saved",
      "Welcome page added to the footer alongside About, Coming Soon, and Version History",
      "About, Coming Soon, Version History, and Welcome pages are now publicly accessible without signing in",
    ],
  },
  {
    version: "0.6.0",
    name: "Guest Mode",
    date: "April 5, 2026",
    changes: [
      "Luach now has a guest mode — no account required to explore the app",
      "New visitors see the welcome screen first, with options to create an account or continue as a guest",
      "Guest mode loads the full calendar with holidays, Zmanim, and navigation, defaulting to Jerusalem",
      "A banner on the guest calendar explains the limitations and links to sign in",
      "Guest choice is remembered across visits — no need to choose again on return",
    ],
  },
  {
    version: "0.5.0",
    name: "Go to Date",
    date: "April 4, 2026",
    changes: [
      "Tap the month/year header to jump directly to any month — choose a month and year from a picker sheet instead of paging through arrows. Works in both Gregorian and Hebrew calendar modes.",
    ],
  },
  {
    version: "0.4.4",
    name: "Zmanim for Any Day",
    date: "April 4, 2026",
    changes: [
      "Tap any day on the calendar to open the day detail sheet, then tap the clock icon to see Zmanim for that specific date — not just today. Thanks to Gedaliah Dimbert for the bug report.",
      "Fixed a build reliability issue where the Prisma client was not being regenerated on every Vercel deployment, causing intermittent build failures.",
    ],
  },
  {
    version: "0.4.3",
    name: "Candle Lighting",
    date: "April 1, 2026",
    changes: [
      "Small amber dot on calendar cells marks Fridays and Erev Yom Tov — a quick visual cue for candle lighting days",
      "Zmanim sheet now includes Hadlakat Nerot (candle lighting, 18 min before sunset) on Fridays and Erev Yom Tov, and Havdalah on Motzei Shabbat and Motzei Yom Tov",
    ],
  },
  {
    version: "0.4.2",
    name: "First Impressions",
    date: "April 1, 2026",
    changes: [
      "Welcome screen shown to new users after registration — explains how Luach works, the dual-calendar event model, and what to do first",
      "Sign-in page now explains why an account is required before showing the login form",
    ],
  },
  {
    version: "0.4.1",
    name: "Layout Fix",
    date: "March 31, 2026",
    changes: [
      "Calendar grid and all page content now run full-width on mobile — removed a max-width constraint that was adding unnecessary margins on both sides of every page",
    ],
  },
  {
    version: "0.4.0",
    name: "Jewish Holidays",
    date: "March 31, 2026",
    changes: [
      "Jewish holidays displayed on the calendar — an amber band behind the date numbers marks holiday days, creating a visual ribbon across multi-day holidays like Pesach and Sukkot",
      "Sefirat HaOmer displayed as a thin contrasting line at the bottom of the band, running continuously from Pesach through Shavuot — visible on both plain and holiday cells",
      "Parsha and Yom Kippur Katan are informational only — appear in the day detail sheet when enabled, but do not mark the calendar",
      "Holiday settings page with category toggles: Major Holidays, Minor Holidays, Rosh Chodesh, Minor Fasts, Special Shabbatot, Modern Holidays, Sefirat HaOmer, Yom Kippur Katan, Weekly Torah Portion",
      "Diaspora and Israel schedule support",
      "Tapping a holiday day shows the holiday name in the day detail sheet",
    ],
  },
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
    <div className="min-h-screen bg-[var(--background)] w-full">
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
