// Offline re-score: recompute score/matched/eligible/senior for every stored job
// using the current rules in src/lib/profile.ts — no network fetch required.
// Run from the job-finder root:  npx tsx prisma/rescore.ts
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { scoreJob, classifyEligible, classifySenior, RELEVANCE_FLOOR } from "../src/lib/profile";

const dbPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "dev.db");
const prisma = new PrismaClient({ datasources: { db: { url: `file:${dbPath}` } } });

async function main() {
  const all = await prisma.job.findMany();
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

  const relevant = await prisma.job.findMany({
    where: { status: { not: "hidden" }, eligible: true, senior: false, score: { gte: RELEVANCE_FLOOR } },
    orderBy: [{ score: "desc" }, { postedAt: "desc" }],
  });
  const anchors = relevant.filter((j) => j.matched.includes("⚓ anchor"));

  console.log(`\nRe-scored ${all.length} jobs.`);
  console.log(`Relevant (eligible · not-senior · score≥${RELEVANCE_FLOOR}): ${relevant.length}`);
  console.log(`⚓ Anchor candidates: ${anchors.length}\n`);

  console.log("=== TOP 20 RELEVANT ===");
  for (const j of relevant.slice(0, 20)) {
    const a = j.matched.includes("⚓ anchor") ? "⚓" : "  ";
    console.log(`${a} ${String(j.score).padStart(3)}  ${j.title.slice(0, 52).padEnd(52)} | ${(j.location || "").slice(0, 22)}`);
  }

  console.log("\n=== TOP 10 ⚓ ANCHORS ===");
  for (const j of anchors.slice(0, 10)) {
    console.log(`   ${String(j.score).padStart(3)}  ${j.title.slice(0, 50).padEnd(50)} | ${j.company.slice(0, 24)}`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
