// Standalone refresh: fetch from all (widened) sources, upsert, and re-score —
// mirrors src/app/api/jobs/refresh/route.ts but runs without the dev server.
// Preserves your status marks (saved/hidden/applied). Run from job-finder root:
//   npx tsx prisma/refresh.ts
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { fetchAllJobs } from "../src/lib/sources";
import { scoreJob, classifyEligible, classifySenior } from "../src/lib/profile";
import { readFileSync } from "node:fs";

// Load .env so sources.ts can read ADZUNA_APP_ID/KEY in standalone runs
// (the Next dev server loads .env automatically; this is just for `npx tsx`).
try {
  const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const dbPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "dev.db");
const prisma = new PrismaClient({ datasources: { db: { url: `file:${dbPath}` } } });

async function main() {
  const { jobs, bySource, errors } = await fetchAllJobs();
  await prisma.job.updateMany({ data: { isNew: false } });

  let upserts = 0;
  for (const j of jobs) {
    const raw = {
      title: j.title, company: j.company, url: j.url, location: j.location,
      tags: j.tags.join(", "), salary: j.salary, description: j.description, postedAt: j.postedAt,
    };
    try {
      await prisma.job.upsert({
        where: { source_externalId: { source: j.source, externalId: j.externalId } },
        update: { ...raw, fetchedAt: new Date() }, // status intentionally preserved
        create: { source: j.source, externalId: j.externalId, status: "new", isNew: true, ...raw },
      });
      upserts++;
    } catch {
      /* skip malformed row */
    }
  }

  const all = await prisma.job.findMany({
    select: { id: true, title: true, company: true, location: true, tags: true, description: true },
  });
  for (const r of all) {
    const { score, matched } = scoreJob({
      title: r.title, company: r.company, location: r.location,
      tags: r.tags ? r.tags.split(", ") : [], description: r.description,
    });
    await prisma.job.update({
      where: { id: r.id },
      data: { score, matched: matched.join(", "), eligible: classifyEligible(r.title, r.location), senior: classifySenior(r.title, r.description) },
    });
  }

  const total = await prisma.job.count();
  const newCount = await prisma.job.count({ where: { isNew: true } });
  const relevant = await prisma.job.count({ where: { status: { not: "hidden" }, eligible: true, senior: false, score: { gte: 6 } } });
  const newRelevant = await prisma.job.count({ where: { status: "new", isNew: true, eligible: true, senior: false, score: { gte: 6 } } });

  console.log("bySource:", JSON.stringify(bySource));
  if (errors.length) console.log("errors:", JSON.stringify(errors));
  console.log(`fetched=${jobs.length} upserts=${upserts} total=${total} newThisRun=${newCount} relevant=${relevant} NEW-relevant-to-triage=${newRelevant}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
