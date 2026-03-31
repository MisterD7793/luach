import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getAuthorizedEvent(eventId: string, clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return null;

  const event = await prisma.event.findFirst({
    where: { id: eventId, userId: user.id },
  });
  return event;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const event = await getAuthorizedEvent(id, userId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await req.json();
  const updated = await prisma.event.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const event = await getAuthorizedEvent(id, userId);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
