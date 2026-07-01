import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchAllJobs } from "@/lib/sources";
import { scoreJob, classifyEligible, classifySenior } from "@/lib/profile";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const { jobs, bySource, errors } = await fetchAllJobs();

  // Clear previous "just added" flags so the 🆕 badge reflects only this pull.
  await prisma.job.updateMany({ data: { isNew: false } });

  let upserts = 0;
  for (const j of jobs) {
    // Store only the RAW listing fields here; derived fields (score/eligibility/
    // seniority) are computed in the reconcile pass below so every row — including
    // listings that have aged off the boards — always reflects the current rules.
    const raw = {
      title: j.title,
      company: j.company,
      url: j.url,
      location: j.location,
      tags: j.tags.join(", "),
      salary: j.salary,
      description: j.description,
      postedAt: j.postedAt,
    };
    try {
      await prisma.job.upsert({
        where: { source_externalId: { source: j.source, externalId: j.externalId } },
        // status is intentionally NOT in `update` so your saved/applied/hidden marks survive
        update: { ...raw, fetchedAt: new Date() },
        create: { source: j.source, externalId: j.externalId, status: "new", isNew: true, ...raw },
      });
      upserts++;
    } catch {
      /* skip a malformed row */
    }
  }

  // Reconcile derived fields for EVERY stored row (not just the ones re-fetched
  // this run). This keeps aged-off listings correctly classified and lets rule
  // changes take effect across the whole DB on the next refresh.
  const all = await prisma.job.findMany({
    select: { id: true, title: true, company: true, location: true, tags: true, description: true },
  });
  for (const r of all) {
    const { score, matched } = scoreJob({
      title: r.title,
      company: r.company,
      location: r.location,
      tags: r.tags ? r.tags.split(", ") : [],
      description: r.description,
    });
    await prisma.job.update({
      where: { id: r.id },
      data: {
        score,
        matched: matched.join(", "),
        eligible: classifyEligible(r.title, r.location),
        senior: classifySenior(r.title, r.description),
      },
    });
  }

  const [total, newCount] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { isNew: true } }),
  ]);
  return NextResponse.json({ ok: true, fetched: jobs.length, upserts, newCount, total, bySource, errors });
}
