import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Create or update user profile
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { timezone, primaryCalendar, latitude, longitude } = await req.json();

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId, timezone, primaryCalendar, latitude, longitude },
    update: { timezone, primaryCalendar, latitude, longitude },
  });

  return NextResponse.json(user);
}

// Get current user profile
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(user);
}

// Update specific fields
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();

  try {
    const user = await prisma.user.update({
      where: { clerkId: userId },
      data,
    });
    return NextResponse.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("PATCH /api/user error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
