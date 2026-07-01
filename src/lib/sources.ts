// Live job aggregation from free, public job-board APIs.
// Every fetcher is wrapped so one failing source never breaks a refresh.
import { XMLParser } from "fast-xml-parser";

export type RawJob = {
  source: string;
  externalId: string;
  title: string;
  company: string;
  url: string;
  location: string;
  tags: string[];
  salary: string;
  description: string;
  postedAt: Date | null;
};

const UA = "Mozilla/5.0 (compatible; job-finder/1.0; +personal)";

function stripHtml(s: unknown, max = 600): string {
  if (!s) return "";
  const text = String(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max) + "…" : text;
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function getText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.text();
}

const arr = (x: unknown): any[] => (Array.isArray(x) ? x : []);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function remoteok(): Promise<RawJob[]> {
  const data = await getJson("https://remoteok.com/api");
  return arr(data)
    .filter((x) => x && x.id && x.position)
    .map((x) => ({
      source: "RemoteOK",
      externalId: String(x.id),
      title: String(x.position),
      company: String(x.company || ""),
      url: String(x.url || `https://remoteok.com/l/${x.id}`),
      location: String(x.location || "Remote"),
      tags: arr(x.tags).map(String),
      salary: x.salary_min ? `$${x.salary_min}–${x.salary_max || ""}` : "",
      description: stripHtml(x.description),
      postedAt: x.date ? new Date(x.date) : x.epoch ? new Date(x.epoch * 1000) : null,
    }));
}

async function remotive(): Promise<RawJob[]> {
  // Lane categories + anchor-targeted searches (contract/worldwide support & automation).
  const cats = ["customer-support", "writing", "qa", "data", "all-others", "design"];
  const searches = ["technical support", "customer success", "automation", "no-code", "localization"];
  const out: RawJob[] = [];
  const seen = new Set<string>();
  const add = (x: any) => {
    const id = String(x.id);
    if (!id || seen.has(id)) return;
    seen.add(id);
    out.push({
      source: "Remotive",
      externalId: id,
      title: String(x.title),
      company: String(x.company_name || ""),
      url: String(x.url),
      location: String(x.candidate_required_location || "Remote"),
      tags: arr(x.tags).map(String),
      salary: String(x.salary || ""),
      description: stripHtml(x.description),
      postedAt: x.publication_date ? new Date(x.publication_date) : null,
    });
  };
  for (const cat of cats) {
    try {
      const data = await getJson(`https://remotive.com/api/remote-jobs?category=${cat}&limit=100`);
      for (const x of arr(data?.jobs)) add(x);
    } catch {
      /* skip this category */
    }
    await sleep(300); // Remotive rate-limits bursts — space the calls out
  }
  for (const q of searches) {
    try {
      const data = await getJson(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}&limit=50`);
      for (const x of arr(data?.jobs)) add(x);
    } catch {
      /* skip this search */
    }
    await sleep(300);
  }
  return out;
}

async function arbeitnow(): Promise<RawJob[]> {
  // Paginate a few pages deep to widen the (mostly German/EU) window.
  const out: RawJob[] = [];
  for (let page = 1; page <= 3; page++) {
    try {
      const data = await getJson(`https://www.arbeitnow.com/api/job-board-api?page=${page}`);
      const rows = arr(data?.data);
      if (!rows.length) break;
      for (const x of rows) {
        out.push({
          source: "Arbeitnow",
          externalId: String(x.slug),
          title: String(x.title),
          company: String(x.company_name || ""),
          url: String(x.url),
          location: [x.location, x.remote ? "Remote" : ""].filter(Boolean).join(" · ") || "Europe",
          tags: arr(x.tags).map(String),
          salary: "",
          description: stripHtml(x.description),
          postedAt: x.created_at ? new Date(x.created_at * 1000) : null,
        });
      }
    } catch {
      break;
    }
  }
  return out;
}

async function jobicy(): Promise<RawJob[]> {
  // Generic remote feed + anchor-targeted tag searches (contract/worldwide support & automation).
  const urls = [
    "https://jobicy.com/api/v2/remote-jobs?count=50",
    "https://jobicy.com/api/v2/remote-jobs?count=50&tag=customer%20support",
    "https://jobicy.com/api/v2/remote-jobs?count=50&tag=technical%20support",
    "https://jobicy.com/api/v2/remote-jobs?count=50&tag=customer%20success",
    "https://jobicy.com/api/v2/remote-jobs?count=50&tag=automation",
  ];
  const out: RawJob[] = [];
  const seen = new Set<string>();
  for (const url of urls) {
    try {
      const data = await getJson(url);
      for (const x of arr(data?.jobs)) {
        const id = String(x.id);
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({
          source: "Jobicy",
          externalId: id,
          title: String(x.jobTitle),
          company: String(x.companyName || ""),
          url: String(x.url),
          location: String(x.jobGeo || "Anywhere"),
          tags: [...arr(x.jobIndustry), ...arr(x.jobType)].map(String),
          salary: x.annualSalaryMin ? `$${x.annualSalaryMin}–${x.annualSalaryMax || ""}` : "",
          description: stripHtml(x.jobExcerpt),
          postedAt: x.pubDate ? new Date(x.pubDate) : null,
        });
      }
    } catch {
      /* skip this query */
    }
  }
  return out;
}

async function weworkremotely(): Promise<RawJob[]> {
  const feeds = [
    "https://weworkremotely.com/remote-jobs.rss",
    "https://weworkremotely.com/categories/remote-customer-support-jobs.rss",
    "https://weworkremotely.com/categories/all-other-remote-jobs.rss",
    "https://weworkremotely.com/categories/remote-sales-and-marketing-jobs.rss",
  ];
  const parser = new XMLParser();
  const out: RawJob[] = [];
  for (const feed of feeds) {
    try {
      const doc = parser.parse(await getText(feed));
      for (const it of arr(doc?.rss?.channel?.item)) {
        const rawTitle = String(it.title || "");
        const idx = rawTitle.indexOf(":");
        const company = idx > -1 ? rawTitle.slice(0, idx).trim() : "";
        const role = idx > -1 ? rawTitle.slice(idx + 1).trim() : rawTitle;
        out.push({
          source: "WeWorkRemotely",
          externalId: String(it.guid?.["#text"] || it.guid || it.link || rawTitle),
          title: role || rawTitle,
          company,
          url: String(it.link || ""),
          location: String(it.region || "Remote"),
          tags: it.category ? arr(it.category).concat(typeof it.category === "string" ? [it.category] : []).map(String) : [],
          salary: "",
          description: stripHtml(it.description),
          postedAt: it.pubDate ? new Date(it.pubDate) : null,
        });
      }
    } catch {
      /* skip this feed */
    }
  }
  return out;
}

async function hackernews(): Promise<RawJob[]> {
  // Pull the latest few "Who is hiring" threads (≈ last 3 months) to widen the window.
  const search = await getJson(
    "https://hn.algolia.com/api/v1/search_by_date?query=Ask%20HN%3A%20Who%20is%20hiring&tags=story&hitsPerPage=12",
  );
  const stories = arr(search?.hits)
    .filter((h) => /who is hiring/i.test(h.title || ""))
    .slice(0, 3);
  const out: RawJob[] = [];
  for (const story of stories) {
    try {
      const item = await getJson(`https://hn.algolia.com/api/v1/items/${story.objectID}`);
      for (const c of arr(item?.children)
        .filter((c) => c && c.text && !c.dead && !c.deleted)
        .slice(0, 80)) {
        const text = stripHtml(c.text, 800);
        const title = (text.split("|")[0].split(/[.!?]/)[0] || "HN hiring post").slice(0, 90);
        out.push({
          source: "HN Who's Hiring",
          externalId: String(c.id),
          title,
          company: String(c.author || ""),
          url: `https://news.ycombinator.com/item?id=${c.id}`,
          location: "",
          tags: [],
          salary: "",
          description: text,
          postedAt: c.created_at ? new Date(c.created_at) : null,
        });
      }
    } catch {
      /* skip this thread */
    }
  }
  return out;
}

async function himalayas(): Promise<RawJob[]> {
  // Himalayas remote-jobs API — defensive field mapping (shape varies).
  const data = await getJson("https://himalayas.app/jobs/api?limit=100");
  return arr(data?.jobs)
    .map((x) => {
      const loc = Array.isArray(x.locationRestrictions) && x.locationRestrictions.length
        ? x.locationRestrictions.join(", ")
        : String(x.location || "Remote");
      const url = String(x.applicationLink || x.guid || x.url || "");
      return {
        source: "Himalayas",
        externalId: String(x.guid || x.id || url || x.title || ""),
        title: String(x.title || ""),
        company: String(x.companyName || x.company || ""),
        url,
        location: loc,
        tags: [...arr(x.categories), ...arr(x.seniority)].map(String),
        salary: x.minSalary ? `$${x.minSalary}–${x.maxSalary || ""}` : "",
        description: stripHtml(x.description || x.excerpt),
        postedAt: x.pubDate
          ? new Date(typeof x.pubDate === "number" ? x.pubDate * 1000 : x.pubDate)
          : null,
      } as RawJob;
    })
    .filter((j) => j.title && j.url);
}

async function workingnomads(): Promise<RawJob[]> {
  // Clean remote-only feed across all categories (JSON array, no key).
  const data = await getJson("https://www.workingnomads.com/api/exposed_jobs/");
  return arr(data)
    .map((x) => {
      const m = String(x.url || "").match(/\/job\/go\/(\d+)/);
      return {
        source: "WorkingNomads",
        externalId: m ? m[1] : String(x.url || x.title || ""),
        title: String(x.title || ""),
        company: String(x.company_name || ""),
        url: String(x.url || ""),
        location: String(x.location || "Remote"),
        tags: String(x.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
        salary: "",
        description: stripHtml(x.description),
        postedAt: x.pub_date ? new Date(x.pub_date) : null,
      } as RawJob;
    })
    .filter((j) => j.title && j.url);
}

async function jobspresso(): Promise<RawJob[]> {
  // Curated remote board (WP Job Manager RSS). Strong on part-time/contract + support roles;
  // job_category carries the employment type (Part Time / Contract / Full Time) — useful anchor signal.
  const parser = new XMLParser();
  const out: RawJob[] = [];
  try {
    const doc = parser.parse(await getText("https://jobspresso.co/?feed=job_feed"));
    for (const it of arr(doc?.rss?.channel?.item)) {
      const empType = String(it["job_listing:job_category"] || "").trim();
      const roleTags = String(it["job_listing:job_type"] || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      out.push({
        source: "Jobspresso",
        externalId: String(it.link || it.title || ""),
        title: String(it.title || ""),
        company: String(it["job_listing:company"] || "").trim(),
        url: String(it.link || ""),
        location: String(it["job_listing:location"] || "Remote").trim(),
        tags: [...roleTags, empType].filter(Boolean),
        salary: "",
        description: stripHtml(it["content:encoded"] || it.description),
        postedAt: it.pubDate ? new Date(it.pubDate) : null,
      });
    }
  } catch {
    /* skip source */
  }
  return out.filter((j) => j.title && j.url);
}

async function adzuna(): Promise<RawJob[]> {
  const id = process.env.ADZUNA_APP_ID;
  const key = process.env.ADZUNA_APP_KEY;
  if (!id || !key) return []; // no key configured -> skip silently
  // Targeted REMOTE queries in Boyan's income-plan lanes — English (gb) + German (de).
  // Primary lanes first (support + no-code automation), then gap-fillers + the DE edge.
  const queries: Array<[string, string]> = [
    ["gb", "remote customer support"],
    ["gb", "remote technical support"],
    ["gb", "remote no-code automation"],
    ["gb", "remote virtual assistant"],
    ["de", "homeoffice kundenservice"],
    ["de", "remote übersetzer"],
  ];
  const out: RawJob[] = [];
  for (const [country, what] of queries) {
    try {
      const url =
        `https://api.adzuna.com/v1/api/jobs/${country}/search/1` +
        `?app_id=${id}&app_key=${key}&results_per_page=25&content-type=application/json` +
        `&what=${encodeURIComponent(what)}`;
      const data = await getJson(url);
      const sym = country === "de" ? "€" : "£";
      for (const r of arr(data?.results)) {
        out.push({
          source: "Adzuna",
          externalId: String(r.id),
          title: stripHtml(r.title, 200),
          company: String((r.company && r.company.display_name) || ""),
          url: String(r.redirect_url || ""),
          location: String((r.location && r.location.display_name) || "Remote"),
          tags: [String((r.category && r.category.label) || "")].filter(Boolean),
          salary: r.salary_min ? `${sym}${Math.round(r.salary_min)}–${Math.round(r.salary_max || 0)}/yr` : "",
          description: stripHtml(r.description),
          postedAt: r.created ? new Date(r.created) : null,
        });
      }
    } catch {
      /* skip this query */
    }
  }
  // Collapse multi-location duplicates (Adzuna repeats a job across many towns).
  const seen = new Set<string>();
  return out.filter((j) => {
    const k = `${j.title}|${j.company}`.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export type FetchResult = {
  jobs: RawJob[];
  bySource: Record<string, number>;
  errors: string[];
};

export async function fetchAllJobs(): Promise<FetchResult> {
  const sources: Array<[string, () => Promise<RawJob[]>]> = [
    ["RemoteOK", remoteok],
    ["Remotive", remotive],
    ["Arbeitnow", arbeitnow],
    ["Jobicy", jobicy],
    ["WeWorkRemotely", weworkremotely],
    ["HN Who's Hiring", hackernews],
    ["Himalayas", himalayas],
    ["WorkingNomads", workingnomads],
    ["Jobspresso", jobspresso],
    ["Adzuna", adzuna],
  ];
  const results = await Promise.allSettled(sources.map(([, fn]) => fn()));

  const jobs: RawJob[] = [];
  const bySource: Record<string, number> = {};
  const errors: string[] = [];

  results.forEach((r, i) => {
    const name = sources[i][0];
    if (r.status === "fulfilled") {
      jobs.push(...r.value);
      bySource[name] = r.value.length;
    } else {
      bySource[name] = 0;
      errors.push(`${name}: ${r.reason}`);
    }
  });

  const seen = new Set<string>();
  const deduped = jobs.filter((j) => {
    const key = (j.url || `${j.source}:${j.externalId}`).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { jobs: deduped, bySource, errors };
}
