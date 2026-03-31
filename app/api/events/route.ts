import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gregorianToHebrew, hebrewToGregorian } from "@/lib/hebrew-calendar";
import { HDate } from "@hebcal/core";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const events = await prisma.event.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const {
    title,
    type,
    notes,
    canonicalCalendar,
    hebrewDay,
    hebrewMonth,
    hebrewYear,
    gregorianMonth,
    gregorianDay,
    gregorianYear,
    afterSunset,
    reminderDaysBefore,
  } = body;

  if (!title || !type || !canonicalCalendar) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Resolve the canonical Hebrew date, accounting for sunset if entry was Gregorian
  let resolvedHebrewDay = hebrewDay ?? null;
  let resolvedHebrewMonth = hebrewMonth ?? null;

  if (canonicalCalendar === "HEBREW" && gregorianMonth && gregorianDay) {
    // Entry was Gregorian, but we need to store Hebrew (YAHRZEIT case)
    const year = gregorianYear ?? new Date().getFullYear();
    const d = new Date(year, gregorianMonth - 1, gregorianDay);
    const hd = gregorianToHebrew(d, afterSunset ?? false);
    resolvedHebrewDay = hd.getDate();
    resolvedHebrewMonth = hd.getMonth();
  }

  const primaryEvent = await prisma.event.create({
    data: {
      userId: user.id,
      title,
      type,
      notes: notes ?? null,
      canonicalCalendar,
      hebrewDay: resolvedHebrewDay,
      hebrewMonth: resolvedHebrewMonth,
      gregorianMonth: canonicalCalendar === "GREGORIAN" ? (gregorianMonth ?? null) : null,
      gregorianDay: canonicalCalendar === "GREGORIAN" ? (gregorianDay ?? null) : null,
      reminderDaysBefore: reminderDaysBefore ?? 0,
    },
  });

  // Create paired event for BIRTHDAY and ANNIVERSARY
  let pairedEvent = null;
  if (type === "BIRTHDAY" || type === "ANNIVERSARY") {
    if (canonicalCalendar === "GREGORIAN" && gregorianMonth && gregorianDay) {
      // Primary is Gregorian → derive Hebrew date for paired event
      const year = gregorianYear ?? new Date().getFullYear();
      const d = new Date(year, gregorianMonth - 1, gregorianDay);
      const hd = gregorianToHebrew(d, afterSunset ?? false);

      pairedEvent = await prisma.event.create({
        data: {
          userId: user.id,
          title: `${title} (Hebrew)`,
          type,
          notes: notes ?? null,
          canonicalCalendar: "HEBREW",
          hebrewDay: hd.getDate(),
          hebrewMonth: hd.getMonth(),
          gregorianMonth: null,
          gregorianDay: null,
          reminderDaysBefore: reminderDaysBefore ?? 0,
        },
      });
    } else if (canonicalCalendar === "HEBREW" && hebrewDay && hebrewMonth) {
      // Primary is Hebrew → derive Gregorian date for paired event
      const hd = new HDate(hebrewDay, hebrewMonth, hebrewYear ?? new HDate().getFullYear());
      const gd = hebrewToGregorian(hd);

      pairedEvent = await prisma.event.create({
        data: {
          userId: user.id,
          title: `${title} (English)`,
          type,
          notes: notes ?? null,
          canonicalCalendar: "GREGORIAN",
          hebrewDay: null,
          hebrewMonth: null,
          gregorianMonth: gd.getMonth() + 1,
          gregorianDay: gd.getDate(),
          reminderDaysBefore: reminderDaysBefore ?? 0,
        },
      });
    }
  }

  return NextResponse.json(
    { primary: primaryEvent, paired: pairedEvent },
    { status: 201 }
  );
}
