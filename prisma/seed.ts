import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Seed = {
  name: string;
  category: string;
  tier: "start_now" | "apply_now" | "build";
  url: string;
  pay: string;
  payout: string;
  eligibility: "eligible" | "verify";
  entry: string;
  mode: "async" | "voice" | "mixed";
  fit: string;
  recommended?: boolean;
};

const PLATFORMS: Seed[] = [
  // ---------- AI Data-Training ----------
  { name: "Welo Data (Welocalize)", category: "AI Data-Training", tier: "start_now", recommended: true, url: "https://careers.welocalize.com/", pay: "~$35/hr (BG evaluator)", payout: "bank / contractor", eligibility: "eligible", entry: "Apply to talent pool", mode: "async", fit: "Native Bulgarian is THE qualifier; highest verified async rate. Apply to the evergreen pool, not one expiring listing." },
  { name: "Mindrift (Toloka)", category: "AI Data-Training", tier: "start_now", recommended: true, url: "https://mindrift.ai/apply", pay: "$15–100+/hr", payout: "biweekly", eligibility: "eligible", entry: "Apply + assessment", mode: "async", fit: "Dedicated coding-agent track + DE/BG language projects. Pure async." },
  { name: "Outlier (Scale AI)", category: "AI Data-Training", tier: "apply_now", url: "https://outlier.ai/", pay: "$20–60/hr (coders)", payout: "PayPal weekly", eligibility: "verify", entry: "Signup + skills test", mode: "async", fit: "Coding/STEM queues pay best. Verify Bulgaria at the ID/location step." },
  { name: "RWS TrainAI", category: "AI Data-Training", tier: "apply_now", url: "https://jobs.lever.co/rws", pay: "$8–19/hr+", payout: "invoice / PayPal", eligibility: "eligible", entry: "Apply (freelancer)", mode: "async", fit: "BG/DE language + AI-evaluation work; reputable LSP." },
  { name: "Micro1", category: "AI Data-Training", tier: "apply_now", url: "https://www.micro1.ai/experts/opportunities", pay: "$15–40/hr", payout: "contractor", eligibility: "eligible", entry: "AI interview", mode: "mixed", fit: "Rewards coding + multilingual; once verified, work comes to you." },
  { name: "Mercor", category: "AI Data-Training", tier: "apply_now", url: "https://mercor.com/", pay: "$60–120/hr (eng)", payout: "contractor", eligibility: "eligible", entry: "AI interview", mode: "mixed", fit: "High upside if matched to a coding contract; strong Eastern-Europe presence." },
  { name: "Toloka", category: "AI Data-Training", tier: "build", url: "https://toloka.ai/tolokers/", pay: "low → high", payout: "Payoneer", eligibility: "eligible", entry: "Instant + per-task tests", mode: "async", fit: "Volume floor; chase coding/BG expert tasks. Needs a Payoneer account." },
  { name: "CrowdGen (Appen)", category: "AI Data-Training", tier: "build", url: "https://crowdgen.com/", pay: "$3–14/hr", payout: "PayPal / Payoneer / bank", eligibility: "eligible", entry: "Apply to a project", mode: "async", fit: "Easiest payout set; DE + ex-TELUS support evals. Work can be intermittent." },
  { name: "TELUS Digital AI Community", category: "AI Data-Training", tier: "build", url: "https://www.telusdigital.com/contributor", pay: "~$10/hr", payout: "PayPal / Payoneer", eligibility: "eligible", entry: "Apply", mode: "mixed", fit: "You're ex-TELUS — insider familiarity. Entry rater pay but easy in." },

  // ---------- Crowdtesting / QA ----------
  { name: "Test IO (EPAM)", category: "Crowdtesting / QA", tier: "start_now", recommended: true, url: "https://test.io/company/become-a-tester", pay: "$5–50 per bug", payout: "PayPal / Skrill / IBAN", eligibility: "eligible", entry: "Instant, no screening", mode: "async", fit: "Fastest first euros — pays straight to your IBAN. Your QA bug-reports shine." },
  { name: "uTest (Applause)", category: "Crowdtesting / QA", tier: "apply_now", url: "https://www.utest.com/", pay: "$5–50 per bug", payout: "PayPal / Payoneer / bank", eligibility: "eligible", entry: "Signup + uTest Academy", mode: "async", fit: "Biggest volume & highest long-term ceiling; scales with your rating." },
  { name: "Tester Work (Global App Testing)", category: "Crowdtesting / QA", tier: "apply_now", url: "https://testerwork.com/", pay: "per bug / ~$60 per cycle", payout: "PayPal / Upwork / Wise", eligibility: "eligible", entry: "Instant, invite by email", mode: "async", fit: "Pay stated upfront so you cherry-pick; heavy on localization/locale testing." },
  { name: "Testlio", category: "Crowdtesting / QA", tier: "apply_now", recommended: true, url: "https://www.testlio.com/join-the-community", pay: "$18–35/hr (hourly!)", payout: "PayPal / Payoneer weekly", eligibility: "eligible", entry: "Apply (selective)", mode: "mixed", fit: "Best per-hour value; your React/TS supports the higher 'scripter' tier." },
  { name: "Crowdsprint", category: "Crowdtesting / QA", tier: "build", url: "https://crowdsprint.com/tester-signup/", pay: "varies (bug / time)", payout: "PayPal", eligibility: "eligible", entry: "Instant signup", mode: "async", fit: "Easiest signup of all; good to build a track record. Lower volume." },
  { name: "99tests", category: "Crowdtesting / QA", tier: "build", url: "https://99tests.com/", pay: "per valid bug", payout: "bank / PayPal", eligibility: "eligible", entry: "Instant signup", mode: "async", fit: "Quality-weighted scoring rewards precise reports; contest-style income." },
  { name: "Ubertesters / PrimeTesters", category: "Crowdtesting / QA", tier: "build", url: "https://ubertesters.com/primetesters-community/", pay: "hourly", payout: "PayPal / Upwork", eligibility: "eligible", entry: "Manager-gated (~5 days)", mode: "mixed", fit: "QA cert path + dev knowledge lifts rate; localization projects use your languages." },
  { name: "Digivante", category: "Crowdtesting / QA", tier: "build", url: "https://www.digivante.com/crowdtesting-community/become-a-tester/", pay: "per issue + test case", payout: "verify at signup", eligibility: "verify", entry: "Qualification quiz (~1 in 10)", mode: "async", fit: "Selective; wants prior QA experience — try once you have a track record." },

  // ---------- Localization ----------
  { name: "Smartcat", category: "Localization", tier: "start_now", recommended: true, url: "https://www.smartcat.com/marketplace/", pay: "$0.02–0.06/word", payout: "PayPal / Payoneer / IBAN", eligibility: "eligible", entry: "Instant signup", mode: "async", fit: "No gatekeeping, set your own rate. Tag EN↔BG, DE↔BG, software/MTPE." },
  { name: "Unbabel", category: "Localization", tier: "start_now", url: "https://unbabel.com/", pay: "$8–18/hr (→$31)", payout: "PayPal weekly", eligibility: "eligible", entry: "Signup + 3-step test", mode: "async", fit: "MTPE post-editing for EN↔BG / DE↔BG; light, flexible, quick first paycheck." },
  { name: "Keywords Studios (games LQA)", category: "Localization", tier: "apply_now", recommended: true, url: "https://www.keywordsstudios.com/en/careers/", pay: "hourly (games)", payout: "invoice", eligibility: "eligible", entry: "Apply — filter Remote/Freelance", mode: "mixed", fit: "German-speaking remote LQA fits your DE + tech perfectly. Avoid on-site posts." },
  { name: "PTW / Side (games LQA)", category: "Localization", tier: "apply_now", url: "https://startup.jobs/company/ptw", pay: "hourly (games)", payout: "invoice", eligibility: "eligible", entry: "Apply, no experience needed", mode: "mixed", fit: "'Must be in Europe' = you qualify. German/English LQA; equipment shipped." },
  { name: "Gengo", category: "Localization", tier: "build", url: "https://gengo.com/translators/", pay: "$0.03–0.12/word", payout: "PayPal", eligibility: "eligible", entry: "Free account + test", mode: "async", fit: "Lead with EN↔BG; pass the 'Pro' test for higher rates." },
  { name: "ProZ.com", category: "Localization", tier: "build", url: "https://www.proz.com/", pay: "you negotiate", payout: "invoice clients", eligibility: "eligible", entry: "Free profile (paid optional)", mode: "async", fit: "Inbound channel; DE↔BG scarcity helps you rank. Build over time." },
  { name: "Acolad", category: "Localization", tier: "build", url: "https://www.acolad.com/us/freelance-translator/", pay: "project / per word", payout: "invoice", eligibility: "eligible", entry: "Vendor registration + vetting", mode: "async", fit: "EU-friendly LSP (owns TextMaster); software localization lanes suit your tech." },
  { name: "Lionbridge", category: "Localization", tier: "build", url: "https://www.lionbridge.com/join-our-community/", pay: "$20–40/hr equiv", payout: "multiple", eligibility: "eligible", entry: "Apply + questionnaires", mode: "async", fit: "Reputable; can be slow to activate. BG + DE marketable." },

  // ---------- Freelance Dev ----------
  { name: "Contra", category: "Freelance Dev", tier: "start_now", recommended: true, url: "https://contra.com/", pay: "you set ($15–35/hr+)", payout: "SEPA / PayPal — 0% fee", eligibility: "eligible", entry: "Instant signup", mode: "async", fit: "Zero fee protects a low intro rate. Lead with your live Next.js+Supabase apps." },
  { name: "Upwork", category: "Freelance Dev", tier: "start_now", recommended: true, url: "https://www.upwork.com/", pay: "$10–25/hr to start", payout: "EUR→bank ($0.99), ~10% fee", eligibility: "eligible", entry: "Profile approval", mode: "mixed", fit: "Target AI integration / Next.js / Supabase + DACH clients (your German)." },
  { name: "Fiverr", category: "Freelance Dev", tier: "apply_now", url: "https://www.fiverr.com/", pay: "$10–50/gig to start", payout: "Payoneer / PayPal (20% fee)", eligibility: "eligible", entry: "Instant signup", mode: "async", fit: "Productize: 'Next.js+Supabase dashboard', 'Python automation', 'fix your React app'." },
  { name: "Wellfound", category: "Freelance Dev", tier: "apply_now", recommended: true, url: "https://wellfound.com/", pay: "startup contract/junior", payout: "employer-direct (free)", eligibility: "eligible", entry: "Apply with profile", mode: "mixed", fit: "Startups value shipping over tenure — ideal for your solo-built portfolio." },
  { name: "PeoplePerHour", category: "Freelance Dev", tier: "build", url: "https://www.peopleperhour.com/", pay: "$15–30/hr", payout: "Payoneer / PayPal / bank", eligibility: "eligible", entry: "Profile approval", mode: "async", fit: "EU/UK clients + your German; post fixed-price 'Offers' to get found." },
  { name: "Freelancer.com", category: "Freelance Dev", tier: "build", url: "https://www.freelancer.com/", pay: "low (volume)", payout: "PayPal / bank (10% fee)", eligibility: "eligible", entry: "Instant signup", mode: "async", fit: "Reviews farm — quick bug fixes, scrapers, small Next.js pages." },
  { name: "Twine", category: "Freelance Dev", tier: "build", url: "https://www.twine.net/freelancers", pay: "you set ($15–40/hr)", payout: "escrow ($14/mo Pro)", eligibility: "eligible", entry: "Signup + light vetting", mode: "async", fit: "Growing AI-projects category — thinner competition for LLM-integration gigs." },

  // ---------- Research & UX ----------
  { name: "Prolific", category: "Research & UX", tier: "start_now", recommended: true, url: "https://www.prolific.com/participants", pay: "$8–15/hr", payout: "PayPal", eligibility: "eligible", entry: "Instant + full profile", mode: "async", fit: "Best effort-to-$ baseline; BG + DE are scarce demographics. Fill ALL demographics." },
  { name: "Respondent.io", category: "Research & UX", tier: "apply_now", url: "https://www.respondent.io/become-a-participant", pay: "$50–400 per session", payout: "PayPal / SEPA (Tremendous)", eligibility: "eligible", entry: "Profile + screeners", mode: "voice", fit: "Well-paid voice (meets your bar); tech-audience studies fit you. Show up reliably." },
  { name: "User Interviews", category: "Research & UX", tier: "apply_now", url: "https://www.userinterviews.com/", pay: "$30–120 per session", payout: "PayPal / prepaid", eligibility: "eligible", entry: "Apply per study", mode: "mixed", fit: "Tech/CS + multilingual fits B2B/software studies that pay top rates." },
  { name: "TestingTime", category: "Research & UX", tier: "apply_now", url: "https://www.testingtime.com/en/become-paid-test-user/", pay: "€25–80 per session", payout: "PayPal / IBAN", eligibility: "eligible", entry: "Signup + profile", mode: "voice", fit: "Set language = German to unlock the large DACH study pool (well-paid voice)." },
  { name: "Clickworker", category: "Research & UX", tier: "build", url: "https://www.clickworker.com/clickworker-job/", pay: "$3–9/hr", payout: "SEPA / PayPal / Payoneer", eligibility: "eligible", entry: "Signup + assessments", mode: "async", fit: "EU-wide; EN/DE/BG tasks pay more. Needs your tax number (TIN)." },
  { name: "Userlytics", category: "Research & UX", tier: "build", url: "https://www.userlytics.com/", pay: "$5–90 per test", payout: "PayPal", eligibility: "eligible", entry: "Signup + qualification test", mode: "mixed", fit: "Tech-literate testers preferred; EN/DE widens eligible tests." },
  { name: "PlaybookUX", category: "Research & UX", tier: "build", url: "https://www.playbookux.com/participant-platform/", pay: "$2–120 per test", payout: "PayPal", eligibility: "eligible", entry: "Signup + screeners", mode: "mixed", fit: "Multilingual platform; German/Bulgarian studies add volume." },
  { name: "Trymata", category: "Research & UX", tier: "build", url: "https://www.trymata.com/", pay: "$10 per test", payout: "PayPal", eligibility: "eligible", entry: "Signup + qualification test", mode: "async", fit: "Advanced English clears the bar; ~$24–30/hr while testing." },

  // ---------- Tutoring & Writing ----------
  { name: "Codementor", category: "Tutoring & Writing", tier: "apply_now", recommended: true, url: "https://www.codementor.io/", pay: "$30–60+/hr", payout: "PayPal / Payoneer / Wise", eligibility: "eligible", entry: "Vetted (GitHub/portfolio)", mode: "voice", fit: "Highest $/hr here — monetize your CS directly via live programming help." },
  { name: "italki (Community Tutor)", category: "Tutoring & Writing", tier: "start_now", recommended: true, url: "https://teach.italki.com/", pay: "$15–30/hr", payout: "PayPal / Payoneer", eligibility: "eligible", entry: "Community Tutor — no cert", mode: "voice", fit: "German = thin competition + premium rate (well-paid voice). Record a 1–3 min intro." },
  { name: "GoStudent", category: "Tutoring & Writing", tier: "apply_now", url: "https://www.gostudent.org/en-gb/become-a-tutor/german/", pay: "€15–25+/hr", payout: "bank (contractor)", eligibility: "verify", entry: "Quiz + video + background check", mode: "voice", fit: "Built for the German-speaking market; rate rises with lessons. Confirm BG contracting." },
  { name: "Preply", category: "Tutoring & Writing", tier: "apply_now", url: "https://preply.com/en/teach", pay: "$10–25/hr", payout: "Wise / Payoneer / PayPal", eligibility: "eligible", entry: "Profile + intro video, no cert", mode: "voice", fit: "List 3 angles — German + Programming/CS + English. High starting commission, price for it." },
  { name: "Textbroker.de", category: "Tutoring & Writing", tier: "build", url: "https://www.textbroker.de/faq/autor", pay: "0.7–4¢/word", payout: "EU bank", eligibility: "eligible", entry: "Free signup + sample text", mode: "async", fit: "Confirmed BG-payable German writing; steady volume, easy entry." },
  { name: "Alignerr (Labelbox)", category: "Tutoring & Writing", tier: "build", url: "https://www.alignerr.com/jobs", pay: "$20–40/hr", payout: "verify", eligibility: "verify", entry: "Apply + video interview", mode: "async", fit: "AI-content editing in EN/DE + coding tracks. Confirm payout/eligibility at onboarding." },
  { name: "AmazingTalker", category: "Tutoring & Writing", tier: "build", url: "https://en.amazingtalker.com/apply-to-teach", pay: "$15–28/hr (uncapped)", payout: "PayPal / Payoneer / Wise", eligibility: "eligible", entry: "Application + demo class", mode: "voice", fit: "Another outlet for German + English; uncapped pricing rewards your DE specialty." },
  { name: "Superprof", category: "Tutoring & Writing", tier: "build", url: "https://www.superprof.com/", pay: "you keep 100%", payout: "student-direct", eligibility: "eligible", entry: "Free listing, no cert", mode: "voice", fit: "Zero-commission listing for German + CS + maths in one profile." },
];

async function main() {
  for (const p of PLATFORMS) {
    const { recommended = false, ...rest } = p;
    await prisma.platform.upsert({
      where: { name: p.name },
      // On re-seed, refresh the descriptive fields but preserve your status & notes.
      update: { ...rest, recommended },
      create: { ...rest, recommended },
    });
  }
  const count = await prisma.platform.count();
  console.log(`Seeded / updated platforms. Total in DB: ${count}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
