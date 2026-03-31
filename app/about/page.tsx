"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const STACK = [
  {
    category: "Framework",
    items: [
      {
        name: "Next.js 16",
        description: "React framework with App Router. Handles routing, server components, and API routes. Deployed as a serverless application.",
      },
      {
        name: "React 19",
        description: "UI library. All calendar views, forms, and sheets are React client components.",
      },
      {
        name: "TypeScript 5",
        description: "Strict typing throughout — components, API routes, and the calendar engine all share typed interfaces.",
      },
    ],
  },
  {
    category: "Styling",
    items: [
      {
        name: "Tailwind CSS 4",
        description: "Utility-first CSS. Theme tokens (--primary, --border, etc.) are defined as CSS variables for light/dark mode support.",
      },
      {
        name: "Lucide React",
        description: "Icon set used for navigation arrows, the bell, settings gear, and the + FAB.",
      },
    ],
  },
  {
    category: "Hebrew calendar",
    items: [
      {
        name: "@hebcal/core 6",
        description: "The engine behind all Hebrew date math — conversions, leap year detection, Adar I/II handling, days-in-month, and sunset times via Zmanim and GeoLocation.",
      },
    ],
  },
  {
    category: "Authentication",
    items: [
      {
        name: "Clerk 7",
        description: "Handles sign-in via email and phone (SMS). Provides session management and the account management widget in Settings.",
      },
    ],
  },
  {
    category: "Database",
    items: [
      {
        name: "Supabase",
        description: "Hosted PostgreSQL database. Stores users, events, and notifications. Session pooler (port 5432) used for both migrations and runtime queries.",
      },
      {
        name: "Prisma 7",
        description: "ORM and schema manager. Uses the driver adapter pattern (@prisma/adapter-pg) required in Prisma 7 for connection pooling. Schema lives in prisma/schema.prisma; the generated client is imported from lib/generated/prisma/client.",
      },
    ],
  },
  {
    category: "Deployment",
    items: [
      {
        name: "Vercel",
        description: "Hosts the production app at luach.vercel.app. Each push to main triggers an automatic deployment. Environment variables (database URL, Clerk keys) are managed via the Vercel dashboard.",
      },
    ],
  },
];

export default function AboutPage() {
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
        <h1 className="text-lg font-bold text-[var(--foreground)]">About Luach</h1>
      </header>

      <div className="p-5 space-y-8">
        <div>
          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            Luach is a mobile-first Hebrew calendar app for tracking annual events — birthdays, anniversaries, and yahrzeits — across both the Hebrew and Gregorian calendar systems.
          </p>
        </div>

        <div className="rounded-xl bg-[var(--secondary)] px-4 py-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted-foreground)]">Product Owner</span>
            <span className="font-medium text-[var(--foreground)]">Seth Dimbert</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted-foreground)]">Software Engineer</span>
            <span className="font-medium text-[var(--foreground)]">Claude (Anthropic)</span>
          </div>
        </div>

        {STACK.map((section) => (
          <div key={section.category}>
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
              {section.category}
            </div>
            <div className="space-y-3">
              {section.items.map((item) => (
                <div key={item.name}>
                  <div className="text-sm font-semibold text-[var(--foreground)]">{item.name}</div>
                  <div className="text-sm text-[var(--muted-foreground)] mt-0.5 leading-relaxed">
                    {item.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
