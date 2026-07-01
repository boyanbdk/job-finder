// One-off: hand-curated ANCHOR roles (stable, full-time, fully-remote, TEXT-only)
// pushed straight into the Saved bucket so they show in the app's Saved tab.
// Mirrors refresh.ts: rows are scored through the app's own profile logic so
// scores/chips/eligibility stay consistent. Run from job-finder root:
//   npx tsx prisma/save-anchors.ts
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { scoreJob, classifyEligible, classifySenior } from "../src/lib/profile";

const dbPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "dev.db");
const prisma = new PrismaClient({ datasources: { db: { url: `file:${dbPath}` } } });

// Curated, web-sourced anchors. Descriptions are accurate and carry the channel
// signals (email/chat/non-phone) so the scorer reflects reality.
const ANCHORS: {
  externalId: string;
  title: string;
  company: string;
  url: string;
  location: string;
  salary: string;
  description: string;
  flag?: string; // optional visible verify-chip prepended to matched
}[] = [
  {
    externalId: "automattic-happiness-engineer",
    title: "Happiness Engineer – Customer Support & Success",
    company: "Automattic",
    url: "https://job-boards.greenhouse.io/automatticcareers/jobs/6216089",
    location: "Worldwide (Remote)",
    salary: "$40,000–$68,000 USD",
    description:
      "100% remote, NO geographic restrictions — Automattic is fully distributed and async. Full-time. Help WordPress.com / WooCommerce customers via email and live chat (text-based, non-phone); peer support over Slack. ~6 self-scheduled hours/day, open vacation policy. Requires hands-on WordPress/WooCommerce experience (build a couple of real sites first). The gold-standard async text-support anchor.",
  },
  {
    externalId: "visme-support-agent-tier1",
    title: "Support Agent (Tier 1)",
    company: "Visme",
    url: "https://www.visme.co/jobs/support-agent-tier-1/",
    location: "Remote (Worldwide)",
    salary: "$17–$22 / hr",
    description:
      "Fully remote, explicitly NON-PHONE. Answer support tickets and live chat for a SaaS visual-content / design platform; strong written English required. Full-time or part-time, Mon–Fri predefined shifts, occasional weekend ticket check-in (2–3 weekends/mo). Requires ~1 year of SaaS customer support experience. Clean text-only anchor.",
  },
  {
    externalId: "humansignal-trainer-support",
    title: "AI Trainer Onboarding and Support Specialist",
    company: "HumanSignal",
    url: "https://job-boards.greenhouse.io/humansignal/jobs/5700065004",
    location: "Remote",
    salary: "$60,000–$80,000",
    description:
      "Remote support role at an AI data company (makers of Label Studio). First point of contact for a global community of AI trainers via email, chat and internal platforms; troubleshoot, onboard, maintain help docs, track support metrics. Full-time; fixed schedule may include night/weekend shifts. Pairs the support anchor with his AI domain.",
    flag: "⚠ verify-region",
  },
  {
    externalId: "kraken-client-engagement",
    title: "Customer Support / Client Engagement Specialist",
    company: "Kraken",
    url: "https://jobs.ashbyhq.com/kraken.com",
    location: "Remote (Worldwide)",
    salary: "—",
    description:
      "Fully remote, globally distributed crypto exchange. Customer support via Zendesk, email and live chat channels (text-based, non-phone). English fluency; willingness to work evenings/weekends. Crypto/trading domain is a direct interest match. Careers board rotates listings — filter for 'Client Engagement' / 'Customer Support' and check the specific role's region.",
    flag: "⚠ verify EU-eligible",
  },
];

async function main() {
  // 1) Upsert the curated web anchors into Saved.
  for (const a of ANCHORS) {
    const { score, matched } = scoreJob({
      title: a.title,
      company: a.company,
      location: a.location,
      description: a.description,
    });
    const chips = a.flag ? [a.flag, ...matched] : matched;
    const data = {
      title: a.title,
      company: a.company,
      url: a.url,
      location: a.location,
      salary: a.salary,
      description: a.description,
      score,
      matched: chips.join(", "),
      eligible: classifyEligible(a.title, a.location),
      senior: classifySenior(a.title, a.description),
      status: "saved",
      isNew: false,
      fetchedAt: new Date(),
    };
    await prisma.job.upsert({
      where: { source_externalId: { source: "Curated", externalId: a.externalId } },
      update: data,
      create: { source: "Curated", externalId: a.externalId, ...data },
    });
    console.log(`saved  [${score}]  ${a.company} — ${a.title}`);
  }

  // 2) Promote the two genuine anchors already in the DB to Saved, tagging a
  //    channel-verify chip (both could hide phone work — confirm before applying).
  for (const id of [27116, 31079]) {
    const row = await prisma.job.findUnique({ where: { id } });
    if (!row) {
      console.log(`skip   #${id} not found`);
      continue;
    }
    const matched = row.matched ? row.matched.split(", ") : [];
    if (!matched.includes("⚠ verify-channel")) matched.unshift("⚠ verify-channel");
    await prisma.job.update({
      where: { id },
      data: { status: "saved", matched: matched.join(", ") },
    });
    console.log(`saved  [${row.score}]  ${row.company} — ${row.title}`);
  }

  const saved = await prisma.job.count({ where: { status: "saved" } });
  console.log(`\nSaved bucket now holds ${saved} roles.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
