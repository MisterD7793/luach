import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    gregorianMonth,
    gregorianDay,
    reminderDaysBefore,
  } = body;

  if (!title || !type || !canonicalCalendar) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      userId: user.id,
      title,
      type,
      notes,
      canonicalCalendar,
      hebrewDay: hebrewDay ?? null,
      hebrewMonth: hebrewMonth ?? null,
      gregorianMonth: gregorianMonth ?? null,
      gregorianDay: gregorianDay ?? null,
      reminderDaysBefore: reminderDaysBefore ?? 0,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
