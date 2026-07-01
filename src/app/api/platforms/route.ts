import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TIER_RANK: Record<string, number> = { start_now: 0, apply_now: 1, build: 2 };

export async function GET() {
  const platforms = await prisma.platform.findMany();
  platforms.sort((a, b) => {
    const t = (TIER_RANK[a.tier] ?? 9) - (TIER_RANK[b.tier] ?? 9);
    if (t !== 0) return t;
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return NextResponse.json({ platforms });
}
