import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Pinged by a Vercel cron (see vercel.json) to keep the free-tier Supabase
// project from auto-pausing after 7 days of inactivity.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
