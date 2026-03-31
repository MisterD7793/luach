import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  nextHebrewOccurrence,
  nextGregorianOccurrence,
} from "@/lib/hebrew-calendar";

// GET: Return unread notifications for the current user
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id, read: false },
    include: { event: true },
    orderBy: { eventDate: "asc" },
  });

  return NextResponse.json(notifications);
}

// POST: Mark a notification as read
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}

/**
 * POST to /api/notifications/generate — regenerates upcoming notifications
 * for all events for this user. Called on login and when events change.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { events: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lookAheadDays = 30;
  const lookAheadDate = new Date(today);
  lookAheadDate.setDate(lookAheadDate.getDate() + lookAheadDays);

  const toCreate = [];

  for (const event of user.events) {
    let nextOccurrence: Date;

    if (event.canonicalCalendar === "HEBREW" && event.hebrewMonth && event.hebrewDay) {
      nextOccurrence = nextHebrewOccurrence(event.hebrewMonth, event.hebrewDay, today);
    } else if (event.gregorianMonth && event.gregorianDay) {
      nextOccurrence = nextGregorianOccurrence(event.gregorianMonth, event.gregorianDay, today);
    } else {
      continue;
    }

    const reminderDate = new Date(nextOccurrence);
    reminderDate.setDate(reminderDate.getDate() - (event.reminderDaysBefore ?? 0));

    if (reminderDate <= lookAheadDate) {
      // Avoid duplicate notifications
      const existing = await prisma.notification.findFirst({
        where: {
          eventId: event.id,
          eventDate: nextOccurrence,
        },
      });

      if (!existing) {
        const daysUntil = Math.round(
          (nextOccurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        const message =
          daysUntil === 0
            ? `Today is ${event.title}`
            : daysUntil === 1
            ? `Tomorrow is ${event.title}`
            : `${event.title} is in ${daysUntil} days`;

        toCreate.push({
          userId: user.id,
          eventId: event.id,
          message,
          eventDate: nextOccurrence,
        });
      }
    }
  }

  if (toCreate.length > 0) {
    await prisma.notification.createMany({ data: toCreate });
  }

  return NextResponse.json({ created: toCreate.length });
}
