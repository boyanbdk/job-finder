import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RELEVANCE_FLOOR as FLOOR } from "@/lib/profile";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const status = sp.get("status") || "active"; // active = everything except hidden
  const source = sp.get("source") || "";
  const q = (sp.get("q") || "").trim();
  const min = parseInt(sp.get("min") || "0", 10) || 0;
  const sort = sp.get("sort") || "score";
  const onlyNew = sp.get("new") === "1";
  const showAll = sp.get("all") === "1"; // bypass the relevance gate

  const where: Record<string, unknown> = {};
  if (onlyNew) {
    where.isNew = true;
    where.status = { not: "hidden" };
  } else if (status === "active") where.status = { not: "hidden" };
  else if (status !== "all") where.status = status;
  if (source) where.source = source;

  // The "can actually apply" gate applies to the browseable views (All / New)
  // unless the user asks to Show all. Saved/Applied/Hidden are never gated.
  const gate = !showAll && (onlyNew || status === "active");
  let effMin = min;
  if (gate) {
    where.eligible = true;
    where.senior = false;
    effMin = Math.max(min, FLOOR);
  }
  if (effMin > 0) where.score = { gte: effMin };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { company: { contains: q } },
      { tags: { contains: q } },
      { description: { contains: q } },
    ];
  }

  const orderBy =
    sort === "date"
      ? [{ postedAt: "desc" as const }, { score: "desc" as const }]
      : [{ score: "desc" as const }, { postedAt: "desc" as const }];

  const jobs = await prisma.job.findMany({ where, orderBy, take: 300 });

  const notHidden = { status: { not: "hidden" } };
  const relevantWhere = { ...notHidden, eligible: true, senior: false, score: { gte: FLOOR } };
  const [relevant, totalActive, saved, applied, fresh, agg] = await Promise.all([
    prisma.job.count({ where: relevantWhere }),
    prisma.job.count({ where: notHidden }),
    prisma.job.count({ where: { status: "saved" } }),
    prisma.job.count({ where: { status: "applied" } }),
    prisma.job.count({ where: { ...relevantWhere, isNew: true } }),
    prisma.job.aggregate({ _max: { fetchedAt: true } }),
  ]);

  return NextResponse.json({
    jobs,
    counts: {
      all: relevant,
      saved,
      applied,
      fresh,
      filtered: Math.max(0, totalActive - relevant),
      totalActive,
    },
    floor: FLOOR,
    lastRefreshAt: agg._max.fetchedAt,
  });
}
