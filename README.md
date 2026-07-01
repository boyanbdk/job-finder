# 🎯 Job Finder

A personal job-hunting app for **Boyan Budakov** (Sofia, BG · BG/EN/DE · Next.js/Supabase/Python + AI tooling).

Two parts:

1. **Platform Tracker** — the ~48 researched remote/freelance platforms you can sign up for (AI data-training, crowdtesting/QA, localization, freelance dev, paid research/UX, tutoring/writing). Each shows pay, payout method, Bulgaria eligibility, entry difficulty and a fit note — and you can track each application's **status + notes**.
2. **Live Jobs** — actively pulls fresh listings from public job boards and **scores them against your profile** (Next.js, React, TypeScript, Python, QA, localization, **German/EU**, junior/freelance/contract). Save / mark applied / hide.

Built with **Next.js 16 (App Router) + TypeScript + Tailwind v4 + Prisma + SQLite**. Runs fully local — all data lives in a SQLite file. One **optional** API key (Adzuna) unlocks an extra job source; everything else works with zero config.

---

## Setup (once)

```bash
npm install      # also runs `prisma generate`
npm run setup    # creates the SQLite DB + seeds the platform list
```

Optional: `cp .env.example .env` and add free [Adzuna](https://developer.adzuna.com/) credentials to enable the Adzuna job source. The app runs fine without it.

## Run

```bash
npm run dev
```

Open **http://localhost:3000**. Click **“↻ Search for new jobs”** on the Live Jobs page to pull listings.

---

## Live job sources

| Source | Good for |
|--------|----------|
| RemoteOK, Remotive, Jobicy, WeWorkRemotely | remote dev / tech / QA / support |
| **Arbeitnow** | German & EU roles (your edge) |
| HN “Who's Hiring” | contract / startup gigs |

Each source is fetched server-side (no CORS issues) and failures are isolated — one dead source won't break a refresh.

> **Note:** Upwork / Fiverr / Contra gig feeds have no open API, so those stay in the **Platform Tracker** as places to check manually rather than auto-pulled here.

## Tuning your match score

Edit the weighted keyword lists in [`src/lib/profile.ts`](src/lib/profile.ts) — add skills you want boosted or terms you want penalised (e.g. "senior", "US only" are already negative).

## Project layout

```
prisma/schema.prisma   # Platform + Job models
prisma/seed.ts         # the researched platform list
src/lib/profile.ts     # profile keywords + scoring
src/lib/sources.ts     # job-board fetchers + aggregator
src/app/page.tsx       # Live Jobs
src/app/platforms/page.tsx  # Platform Tracker
src/app/api/...        # jobs (list/refresh/status) + platforms (list/update)
```

## Reset the data

```bash
rm prisma/dev.db && npm run setup
```
