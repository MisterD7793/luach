# Luach

A mobile-first Hebrew calendar web app for tracking meaningful annual events — birthdays, anniversaries, yahrzeits, and custom occasions — via the Jewish calendar.

## What it does

The Jewish calendar is lunisolar: months follow the moon, years follow the sun, and a day begins at sunset. This means a yahrzeit or birthday on the Hebrew calendar falls on a different Gregorian date every year. Luach handles this correctly.

### Core features

- **Dual calendar display** — Every date shows both the Gregorian and Hebrew date. Toggle which is "primary" at any time; the layout stays Sunday–Saturday regardless.
- **Event tracking with canonical calendars** — Each event is stored as either a Hebrew-date event or a Gregorian-date event. A yahrzeit entered as *25 Kislev* will always appear on 25 Kislev, recalculated to the correct English date each year. An anniversary entered as *June 14* will always appear on June 14, with its Hebrew date shown alongside.
- **Event types** — Birthday, Anniversary, Yahrzeit, Custom.
- **Leap year handling** — Adar I / Adar II edge cases are handled per halachic convention.
- **Sunset-aware Hebrew date** — The Hebrew date changes at sunset, not midnight. Luach uses the user's timezone (and optionally lat/lon) to display the correct Hebrew date at any given moment.
- **In-app reminders** — Notifications are generated for upcoming events, with configurable lead time (same day through one month before).

### Planned

- Push notifications and email reminders
- Hebrew calendar primary view (months displayed in Hebrew order)
- Event editing and deletion from the calendar
- Sharing events with family members

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Hebrew calendar | `@hebcal/core` |
| Auth | Clerk (email + SMS/phone) |
| Database | PostgreSQL via Prisma 7 |
| Hosting | Vercel + Supabase |

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Clerk](https://clerk.com) application with email and phone/SMS enabled

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/MisterD7793/luach.git
   cd luach
   npm install
   ```

2. Copy `.env` and fill in your keys:
   ```
   DATABASE_URL=postgresql://...        # from Supabase
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...
   ```

3. Run the database migration:
   ```bash
   npx prisma migrate dev --name init
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) on your phone or in a mobile-sized browser window.
