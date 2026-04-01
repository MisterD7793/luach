"use client";

import { useRouter } from "next/navigation";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)] mb-3">
        {title}
      </h2>
      <div className="text-[var(--foreground)] text-sm leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <div className="flex-1 px-8 pt-16 pb-8 max-w-lg mx-auto w-full">

        {/* Wordmark */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Luach</h1>
          <p className="text-[var(--muted-foreground)] text-base">
            Your Jewish lifecycle calendar
          </p>
        </div>

        <Section title="What Luach does">
          <p>
            Luach tracks the events that matter most in Jewish life — birthdays, anniversaries,
            and yahrzeits — and follows them across both the Hebrew and Gregorian calendars,
            automatically, every year.
          </p>
        </Section>

        <Section title="How events work">
          <p>
            When you add a birthday or anniversary, Luach creates two linked events: one
            anchored to the Hebrew date, one to the English date. Each recurs independently
            on its own calendar. Each sends its own reminder. You never miss either.
          </p>
          <p>
            Yahrzeits are Hebrew-only — the Hebrew date is what matters. If you know the
            English date, enter it and Luach converts it for you, accounting for whether
            it was before or after sunset.
          </p>
        </Section>

        <Section title="Jewish holidays">
          <p>
            Luach displays Jewish holidays directly on the calendar. Major holidays,
            Rosh Chodesh, Chanukah, Sefirat HaOmer, and more — all customizable by category.
            Choose Diaspora or Israel schedule.
          </p>
          <p>
            Find holiday settings under Settings → Jewish holidays.
          </p>
        </Section>

        <Section title="Do this first">
          <p>
            Open <strong>Settings</strong> and confirm your time zone — this determines when
            the Hebrew date changes at sunset. If you want accurate Zmanim (halachic times),
            add your location there too.
          </p>
        </Section>

        <Section title="Then do this">
          <p>
            Tap the <strong>+</strong> button to add your first event. A birthday or yahrzeit
            is a good place to start.
          </p>
        </Section>

      </div>

      {/* CTA */}
      <div className="px-8 pb-12 max-w-lg mx-auto w-full">
        <button
          onClick={() => router.push("/")}
          className="w-full rounded-xl bg-[var(--primary)] text-white py-4 text-base font-semibold"
        >
          Open my calendar
        </button>
      </div>
    </div>
  );
}
