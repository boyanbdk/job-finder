// One-off: add two BG-eligible, no-calls AI-data / localization PLATFORMS as
// Saved entries (side-income / bridge lane — variable pay, not the anchor).
// Upserts ONLY these two by (source, externalId) so existing saves/applications
// are untouched. Run from job-finder root:  npx tsx prisma/save-platforms.ts
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { scoreJob, classifyEligible, classifySenior } from "../src/lib/profile";

const dbPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "dev.db");
const prisma = new PrismaClient({ datasources: { db: { url: `file:${dbPath}` } } });

const PLATFORMS = [
  {
    externalId: "welodata-community",
    title: "AI Language-Data & Evaluation Contributor (BG↔EN linguist / AI trainer)",
    company: "Welo Data (Welocalize)",
    url: "https://welodata.ai/join-the-community/",
    location: "Worldwide (Remote)",
    salary: "Project-based (variable)",
    description:
      "Worldwide remote contributor community for multilingual AI: LLM-output evaluation, data annotation, and linguist / AI-trainer projects — text-based, async, no calls. Direct match for Boyan's Bulgarian↔English + AI-evaluation edge. Apply, then create a Welo Works account and complete screening/assessments.",
    flag: "side-income · variable pay",
  },
  {
    externalId: "rws-trainai-community",
    title: "TrainAI Community — Rater / Annotator / Linguist",
    company: "RWS TrainAI",
    url: "https://www.rws.com/artificial-intelligence/train-ai-data-services/trainai-community/",
    location: "Worldwide (Remote, part-time)",
    salary: "Project-based (variable)",
    description:
      "RWS's 100,000+ member AI-data community (raters, annotators, linguists; 400+ language variants across 175+ countries, Bulgaria included). Remote, part-time, work-from-home, text/async, no calls, no joining fee, 18+. Matches his BG↔EN linguist + AI-rating lane.",
    flag: "side-income · variable pay",
  },
];

async function main() {
  for (const p of PLATFORMS) {
    const { score, matched } = scoreJob({
      title: p.title,
      company: p.company,
      location: p.location,
      description: p.description,
    });
    const chips = p.flag ? [p.flag, ...matched] : matched;
    const data = {
      title: p.title,
      company: p.company,
      url: p.url,
      location: p.location,
      salary: p.salary,
      description: p.description,
      score,
      matched: chips.join(", "),
      eligible: classifyEligible(p.title, p.location),
      senior: classifySenior(p.title, p.description),
      status: "saved",
      isNew: false,
      fetchedAt: new Date(),
    };
    await prisma.job.upsert({
      where: { source_externalId: { source: "Curated", externalId: p.externalId } },
      update: data,
      create: { source: "Curated", externalId: p.externalId, ...data },
    });
    console.log(`saved  [${score}]  ${p.company} — ${p.title}`);
  }
  const saved = await prisma.job.count({ where: { status: "saved" } });
  console.log(`\nSaved bucket now holds ${saved} roles.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
