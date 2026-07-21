// Boyan's profile: relevance scoring + region/seniority classification.
//
// UPDATED 2026-06-26 — realigned to `income-plan.md` (2026-06-24) + career thesis
// (rev. 2026-06-25). The plan runs TWO co-equal PRIMARY income lanes, plus a native
// edge, a gap-filler bridge, and one demoted slice:
//   PRIMARY (w6)  🅰 ANCHOR = written customer/technical support via ticket/email/chat
//                            — NO voice/video calls (German TEXT is fine).
//   PRIMARY (w6)  🅱 BUILD  = no-code AI automation (n8n/Make/Zapier + GPT/Claude),
//                            sold as build-fee + monthly retainer.
//   EDGE    (w6)  localization / translation — native-Bulgarian moat.
//   BRIDGE  (w4)  AI rating / training / annotation — flexible cash only, "never the
//                 runway" → real but secondary, must not outrank the primary lanes.
//   DEMOTED (w1)  generic manual QA / game testing — "ruled out as a PRIMARY" in the
//                 plan (hardest, lowest-paid remote slice); only a faint nudge now.
// Pure-developer roles, coding-screen dev, and copywriting/content-writing are RULED
// OUT (negative). Scoring also:
//   • surfaces "⚓ anchor" roles = contract/part-time + remote/worldwide + NO calls,
//   • penalises phone/voice/call work, pure-dev titles, and copywriting/content roles,
//   • keeps Bulgarian premium; German is a full asset for TEXT support (phone sinks).
//
// Keyword lists are user-tunable. Re-score the DB after editing with either a
// refresh in the app, or offline: `npx tsx prisma/rescore.ts`.

export type ScoreInput = {
  title: string;
  company?: string;
  location?: string;
  tags?: string[];
  description?: string;
};

type KW = { kw: string; w: number };
const mk = (w: number, ...kws: string[]): KW[] => kws.map((kw) => ({ kw, w }));

const POSITIVE: KW[] = [
  // === PRIMARY LANES (w6): the two co-equal money lanes in income-plan.md =====
  ...mk(6,
    // 🅰 ANCHOR: written customer / technical support (TEXT channels only)
    "customer support", "customer service", "support specialist", "support agent",
    "email support", "chat support", "live chat", "help desk", "helpdesk",
    "content moderator", "community moderator", "moderation",
    "ticket", "ticketing", "zendesk", "freshdesk", "intercom", "service desk",
    "technical support", "application support", "trust & safety", "trust and safety",
    // German written-support cluster (German TEXT is fine; phone penalised separately)
    "kundenservice", "kundenbetreu", "kundensupport", "kundenkommunikation",
    // 🅱 BUILD LANE: no-code AI automation (build-fee + retainer) — co-equal primary
    "no-code", "no code", "nocode", "automation specialist", "workflow automation",
    "ai automation", "automation consultant", "integration specialist", "ai integration",
    "zapier", "make.com", "n8n", "airtable",
  ),
  // === NATIVE EDGE (w6): localization / translation — Bulgarian moat =========
  ...mk(6,
    "translation", "translator", "localization", "localisation", "mtpe",
    "post-editing", "post-editor", "linguist", "linguistic", "subtitle",
    "subtitling", "transcription", "transcriber", "proofread", "proofreading", "übersetz",
    "lqa", "localization qa", // localization-leaning QA stays with the edge
    "bulgarian",
  ),
  // === BRIDGE (w4): AI rating / training / annotation — gap-filler, NEVER the =
  // runway. Real but secondary, so it must not outrank a primary lane on a body hit.
  ...mk(4,
    "prompt engineer", "ai trainer", "ai evaluator", "ai tutor", "rlhf",
    "quality rater", "ads quality rater", "search quality rater",
    "data annotator", "data annotation", "annotation",
  ),
  // === DEMOTED (w1): generic manual QA / game testing — "ruled out as a =======
  // PRIMARY" in the plan. Kept as a faint nudge so it never surfaces on its own.
  ...mk(1,
    "game tester", "playtester", "play tester",
    "qa tester", "manual qa", "manual tester", "quality analyst", "quality assurance tester",
  ),
  // --- Tier B (w3): adjacent work + AI tooling + his niche -------------------
  ...mk(3,
    "data entry", "virtual assistant", "research assistant", "lead generation",
    "documentation", "knowledge base",
    "prompt", "llm", "generative ai", "gpt", "claude", "openai", "anthropic", " ai ", "artificial intelligence",
    "chatbot", "automation", "rpa", "integration",
    // his domain niche — trading / crypto / finance content
    "crypto", "cryptocurrency", "fintech", "finance", "trading", "web3", "blockchain",
    "english", "dateneingabe", "virtuelle assist", "schriftlich", "homeoffice", "mehrsprachig",
  ),
  // --- Anchor signals (contract part-time / remote / async) -----------------
  ...mk(2,
    "contract", "contractor", "freelance", "freelancer", "part-time", "part time",
    "retainer", "ongoing", "long-term", "remote", "work from home", "async",
    "asynchronous", "worldwide", "anywhere", "global",
    // open-to-all / junior signals
    "junior", "entry level", "entry-level", "graduate", "no experience", "trainee",
  ),
  // --- Languages / region (mild) --------------------------------------------
  ...mk(2, "german", "deutsch", "europe", "european", " eu ", "emea"),
];

// Phone/voice work — a HARD no for Boyan. Reused for both the score penalty and
// the anchor test (an otherwise-perfect anchor with calls is NOT an anchor).
const CALLS: string[] = [
  "phone support", "phone-based", "phone based", "over the phone", "on the phone",
  "by phone", "via phone", "answer calls", "answering calls", "make calls",
  "outbound call", "inbound call", "cold call", "cold-call", "call center",
  "call centre", "call-center", "callcenter", "contact center", "contact centre",
  "telephone", "video call", "zoom call", "phone & email",
  "phone and email", "voice support", "voice agent", "live calls", "hotline",
  // "inbound" customer roles are call-centre work in practice — text-only rule sinks them
  "inbound customer service", "inbound customer support", "inbound service",
  // German phone/on-site signals — so written DACH roles surface but call/field ones sink
  "telefon", "telefonisch", "telefonie", "anrufe", "mobilfunk", "außendienst", "vor ort",
];

const NEGATIVE: KW[] = [
  // seniority / over-level
  ...mk(-6, "senior", "sr.", "staff engineer", "principal", "team lead", "tech lead",
    "head of", "director", " vp ", "engineering manager", "architect"),
  // location / clearance gates
  ...mk(-6, "10+ years", "9+ years", "8+ years", "7+ years", "6+ years", "5+ years",
    "security clearance", "us citizen", "u.s. citizen", "usa only", "us only",
    "united states only", "must reside in the us", "must be based in the us"),
  // no-calls is a hard preference → sink phone/voice roles
  ...mk(-8, ...CALLS),
];

// Hybrid/on-site terms sink a role ONLY when it isn't domestic (Sofia is
// commutable; Berlin is not). Applied conditionally in scoreJob.
const ONSITE_HYBRID: KW[] = mk(-8,
  "on-site", "onsite", "on site", "in office", "in-office", "hybrid", "hybride", "teilremote", "partly remote",
);

// Off-target families + pure-dev roles (he doesn't code). A TITLE hit (-10)
// reliably drops the role below the floor; a description-only mention (-3) is mild
// (so "Technical Writer for developer docs" survives, but "Software Developer" sinks).
const EXTRA_NEGATIVE = [
  // dev roles he can't do (role-specific, not bare "developer")
  "software engineer", "software developer", "web developer", "back-end engineer",
  "backend engineer", "front-end developer", "frontend developer", "full stack developer",
  "full-stack developer", "devops", "data engineer", "data scientist",
  "machine learning engineer", "ml engineer", "android developer", "ios developer",
  "mobile developer", "site reliability", " sre ", "embedded engineer", "qa engineer",
  "test automation", "solutions architect", "platform engineer",
  // sales / marketing-ops / consulting / hr / finance-ops / medical / manual
  "sales representative", "inside sales", "outbound sales", "sales development",
  "account executive", "account manager", "account director", "business development",
  " sdr ", " bdr ", "sap ", "erp consultant",
  "performance marketing", "brand strategist", "shop strategist", "ugc creator",
  "creator relations", "public relation", "recruit", "human resources",
  "personalsachbearbeiter", "people & culture", "payroll", "accountant",
  "accounts payable", "bookkeep", "steuerberater", "finanzbuch", "casino", "hotel",
  "gardener", "paralegal", "medical scribe", "medical secretary", "nurse",
  "care specialist", "caregiver", "logistics", "warehouse", "driver",
  // generic writing / content roles — RULED OUT per his 2026-06-23 career thesis
  "copywriter", "copywriting", "content writer", "content writing", "ghostwriter",
  "blog writer", "article writer", "seo writer", "staff writer", "editorial assistant",
  "content creator", "content strategist", "content marketing", "social media manager",
];

// Anchor = Boyan's ideal stable base: a contract/part-time role that is
// remote/worldwide and has NO calls. Surfaced with a "⚓ anchor" chip + a bonus.
// A role only counts as an anchor if it's ALSO in one of Boyan's lanes — so a
// "Freelance Recruiter (remote)" doesn't qualify just for being contract+remote.
const LANE_SIGNALS = [
  "translat", "localis", "localiz", "linguist", "subtitl", "transcri", "proofread", "lqa",
  "customer support", "customer service", "support specialist", "support agent",
  "email support", "chat support", "help desk", "helpdesk", "moderat",
  "technical support", "application support", "service desk", "ticket", "zendesk", "freshdesk", "intercom",
  "prompt", "ai trainer", "ai evaluat", "ai tutor", "rlhf", "annotation", "quality rater",
  "no-code", "no code", "automation specialist", "workflow automation", "ai automation",
  "automation consultant", "integration specialist", "zapier", "make.com", "n8n", "airtable",
  "virtual assistant", "data entry", "research assistant",
];
const ANCHOR_CONTRACT = ["contract", "contractor", "freelance", "freelancer", "part-time", "part time", "retainer"];
const ANCHOR_REMOTE = ["remote", "worldwide", "anywhere", "async", "asynchronous", "work from home", "distributed", "global"];

export function scoreJob(j: ScoreInput): { score: number; matched: string[] } {
  const title = ` ${(j.title || "").toLowerCase()} `;
  const body = ` ${[j.company, j.location, (j.tags || []).join(" "), j.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()} `;
  const all = title + body;
  const domestic = classifyWorkMode(j.title, j.location || "", j.description || "") === "domestic";

  let score = 0;
  const matched = new Set<string>();

  for (const { kw, w } of POSITIVE) {
    if (title.includes(kw)) {
      score += w * 2;
      matched.add(kw.trim());
    } else if (body.includes(kw)) {
      score += w;
      matched.add(kw.trim());
    }
  }
  for (const { kw, w } of NEGATIVE) {
    if (title.includes(kw) || body.includes(kw)) score += w;
  }
  // Hybrid/on-site only sinks non-domestic roles; a BG-based hybrid is fine.
  if (!domestic) {
    for (const { kw, w } of ONSITE_HYBRID) {
      if (title.includes(kw) || body.includes(kw)) score += w;
    }
  } else {
    matched.add("🏠 domestic");
  }
  // Off-target / dev-role penalty — title hit is decisive (and disqualifies anchor).
  let offTargetTitle = false;
  for (const kw of EXTRA_NEGATIVE) {
    if (title.includes(kw)) {
      score -= 12;
      offTargetTitle = true;
    } else if (body.includes(kw)) score -= 3;
  }

  // Anchor bonus + visible chip (contract/part-time + remote/worldwide, no calls).
  const hasCalls = CALLS.some((k) => all.includes(k));
  const isAnchor =
    !offTargetTitle &&
    LANE_SIGNALS.some((k) => all.includes(k)) &&
    ANCHOR_CONTRACT.some((k) => all.includes(k)) &&
    ANCHOR_REMOTE.some((k) => all.includes(k)) &&
    !hasCalls;
  if (isAnchor) {
    score += 4;
    matched.add("⚓ anchor");
  }

  const out = [...matched];
  return {
    score: Math.round(score),
    matched: isAnchor ? ["⚓ anchor", ...out.filter((m) => m !== "⚓ anchor")] : out,
  };
}

// --------------------------------------------------------------------------
// Region eligibility + seniority — verified rules. The default feed shows only
// jobs that are eligible === true AND senior === false AND score >= FLOOR.
// --------------------------------------------------------------------------

export const RELEVANCE_FLOOR = 6;

// Substrings that, found in the LOCATION, force a job ELIGIBLE (they win over
// location blocks — so multi-region rows like "LATAM, Canada, Europe, USA" stay).
const REGION_ELIGIBLE_OVERRIDES = [
  "worldwide", "anywhere", "global", "europe", "emea",
  "germany", "berlin", "munich", "hamburg", "cologne", "frankfurt", "stuttgart", "bonn",
  "bremen", "dresden", "leipzig", "darmstadt", "mannheim", "heidelberg", "karlsruhe",
  "augsburg", "regensburg", "potsdam", "kiel", "magdeburg", "münster", "munster",
  "bulgaria", "poland", "polska", "warszawa", "warsaw", "netherlands", "spain", "barcelona",
  "italy", "rome", "france", "portugal", "czechia", "ukraine",
  "uk", "united kingdom", "england", "london", "cambridge", "birmingham", "ireland",
  "austria", "switzerland", "schweiz", "zürich", "zurich", "sweden", "denmark", "finland",
  "norway", "belgium", "luxembourg", "greece", "romania", "hungary", "croatia", "slovenia",
  "slovakia", "lithuania", "latvia", "estonia",
];

// Substrings in the LOCATION that mark a job ineligible for a BG/EU candidate
// (only checked if no eligible-override matched first).
const REGION_LOCATION_BLOCK = [
  "united states", "usa", "u.s.", "remote - us", "remote, usa", "us, remote", "us timezones",
  "brazil", "brasil", "são paulo", "sao paulo", "guarulhos", "fortaleza",
  "india", "bengaluru", "bhiwandi", "ludhiana", "latam", "latin america", "central america",
  "apac", "singapore", "south korea", "china", "japan", "australia", "brisbane", "alice springs",
  "new zealand", "canada", "toronto", "edmonton", "ontario", "labrador", "northwest territories",
  "red deer", "perú", "peru", "perã", "lima", "buenos aires", "santo domingo", "porlamar",
  "santa teresa", "pembroke parish", "east grand bahama", "saudi", "dubai", "emirates", "thailand",
  "florida", "illinois", "texas", "california", "arizona", "pennsylvania", "tennessee",
  "massachusetts", "maryland", "michigan", "ohio", "new york", "los angeles", "boston",
  "atlanta, georgia", "nashville", "austin", "dallas", "broward", "cuyahoga", "kings county",
  "worcester county", "columbia, maryland", "savannah", "orem", "chicago", "detroit", "portland",
  "atlanta,",
];

// Substrings in the TITLE signalling an explicit single-country residency gate
// even when the location looks open. Checked FIRST (before the location override).
const TITLE_REGION_BLOCK = [
  "us only", "usa only", "us-based", "u.s. only", "us-only", "north america only",
  "us residents", "must be based in the us", "united states", "- united states", "- usa",
];

// --------------------------------------------------------------------------
// Work mode: "domestic" = the job is based in Bulgaria (Sofia commutable →
// hybrid/on-site is acceptable); everything else is "remote" (must be fully
// remote to be workable). Bulgarian-language and BG-city signals both count.
// --------------------------------------------------------------------------

const DOMESTIC_SIGNALS = [
  "bulgaria", "българия", "sofia", "софия", "plovdiv", "пловдив", "varna", "варна",
  "burgas", "бургас", "ruse", "русе", "stara zagora", "стара загора",
  "veliko tarnovo", "велико търново", "pleven", "плевен",
];

export type WorkMode = "domestic" | "remote";

// Word-boundary test so "Bulgarian Linguist (remote)" ≠ based-in-Bulgaria:
// the language adjective ("bulgarian") must not trip the country signal.
const hasSignal = (text: string) =>
  DOMESTIC_SIGNALS.some((s) => new RegExp(`(^|[^a-zа-я])${s}($|[^a-zа-я])`, "i").test(text));

export function classifyWorkMode(title: string, location: string, description = ""): WorkMode {
  if (hasSignal(location || "") || hasSignal(title || "")) return "domestic";
  // Location fields are often empty (e.g. HN posts) — fall back to a body scan,
  // but only when the description ALSO talks about an office/hybrid setup, so
  // "open to candidates in Bulgaria, Romania…" (a remote job) doesn't trip it.
  const d = (description || "").toLowerCase();
  if (hasSignal(d) && /(office|hybrid|on-?site|офис|хибрид)/.test(d)) return "domestic";
  return "remote";
}

export function classifyEligible(title: string, location: string): boolean {
  const t = ` ${(title || "").toLowerCase()} `;
  const loc = ` ${(location || "").toLowerCase()} `;
  if (TITLE_REGION_BLOCK.some((s) => t.includes(s))) return false; // (1) explicit title gate
  if (REGION_ELIGIBLE_OVERRIDES.some((s) => loc.includes(s))) return true; // (2) override wins
  if (REGION_LOCATION_BLOCK.some((s) => loc.includes(s))) return false; // (3) location block
  return true; // (4) unknown -> show
}

// Title substrings marking a role too senior / over-capacity for a junior.
const SENIOR_BLOCK = [
  "senior", "sr.", " sr ", "snr", "lead ", " lead", "leiter", "principal",
  "staff engineer", "staff software", "staff ", "head of", " director", "vp ", " vp",
  "vice president", "chief", " cto", " cfo", " ceo", " coo", "architect", "manager", "management",
  "projektleiter", "filialleiter", "teamleiter", "gruppenleiter", "abteilungsleiter",
  "store manager", "shop manager", "geschäftsführer", "expert ", "10+ years",
  "semi-senior", "semi senior", "mid-senior", "mid/senior", "mid-/senior", "(m/w/d) senior",
];

// Title substrings that KEEP a job even if a senior term matched (override wins).
const JUNIOR_OVERRIDE = [
  "junior", "jr.", " jr ", "entry level", "entry-level", "graduate", "grad ", "internship",
  " intern ", "trainee", "apprentice", "praktikum", "praktikant", "werkstudent",
  "working student", "student", "no experience", "entry ",
];

// "Needs 4+ years" detection (title + description), case-insensitive. Avoids
// tail-matching company-age boilerplate like "over 25 years"/"celebrating 15 years".
const YEARS_RE =
  /(?<![0-9.,–-])(?:(?:at\s+least|minimum(?:\s+of)?|min\.?|mindestens|over|more\s+than|über|ueber)\s+(?:[4-9]|1[0-9])\s*\+?\s*(?:years?|jahre)|(?:[4-9]|1[0-9])\s*\+\s*years?|(?:[4-9]|1[0-9])\s*(?:-|–|to)\s*[0-9]+\s*\+?\s*years?|(?:[4-9]|1[0-9])\s*\+?\s*years?(?=[^.\n]{0,40}(?:experience|exp\.?|professional|industry|working|relevant|hands-?on))|(?:[4-9]|1[0-9])\s*\+?\s*(?:jahre|j\.)\s*(?:berufserfahrung|erfahrung))|\b(?:four|five|six|seven|eight|nine|ten)\+?\s+years?/i;

export function classifySenior(title: string, description: string): boolean {
  const t = ` ${(title || "").toLowerCase()} `;
  if (JUNIOR_OVERRIDE.some((s) => t.includes(s))) return false; // override wins
  if (SENIOR_BLOCK.some((s) => t.includes(s))) return true;
  return YEARS_RE.test(`${title || ""} ${description || ""}`.toLowerCase());
}
