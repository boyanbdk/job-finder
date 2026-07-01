"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Job = {
  id: number;
  source: string;
  title: string;
  company: string;
  url: string;
  location: string;
  tags: string;
  salary: string;
  score: number;
  matched: string;
  status: string;
  isNew: boolean;
  eligible: boolean;
  senior: boolean;
  postedAt: string | null;
};

const SOURCES = ["RemoteOK", "Remotive", "Arbeitnow", "Jobicy", "WeWorkRemotely", "HN Who's Hiring", "Himalayas", "WorkingNomads", "Adzuna"];
const REFRESH_MS = 30 * 60 * 1000; // 30 minutes

function scoreColor(s: number) {
  if (s >= 14) return "bg-emerald-100 text-emerald-800";
  if (s >= 7) return "bg-amber-100 text-amber-800";
  if (s > 0) return "bg-slate-100 text-slate-600";
  return "bg-slate-100 text-slate-400";
}

function ago(d: string | null) {
  if (!d) return "";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

function since(iso: string | null) {
  if (!iso) return "never";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function LiveJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [counts, setCounts] = useState({ all: 0, saved: 0, applied: 0, fresh: 0, filtered: 0, totalActive: 0 });
  const [floor, setFloor] = useState(6);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [min, setMin] = useState(0);
  const [sort, setSort] = useState("score");
  const [tab, setTab] = useState("active");
  const [autoOn, setAutoOn] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    // A "silent" reload refreshes data/counts without flipping `loading` — which
    // would swap the list for "Loading…", unmount it, and reset scroll to the top.
    if (!opts?.silent) setLoading(true);
    const params = new URLSearchParams({ sort, min: String(min) });
    if (tab === "justnew") params.set("new", "1");
    else params.set("status", tab);
    if (showAll) params.set("all", "1");
    if (q.trim()) params.set("q", q.trim());
    if (source) params.set("source", source);
    const res = await fetch(`/api/jobs?${params.toString()}`);
    const data = await res.json();
    setJobs(data.jobs || []);
    setCounts(data.counts || { all: 0, saved: 0, applied: 0, fresh: 0, filtered: 0, totalActive: 0 });
    setFloor(data.floor ?? 6);
    setLastRefreshAt(data.lastRefreshAt ?? null);
    setLoading(false);
  }, [tab, sort, min, q, source, showAll]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setMsg("Searching all sources for new listings…");
    try {
      const res = await fetch("/api/jobs/refresh", { method: "POST" });
      const data = await res.json();
      const parts = Object.entries(data.bySource || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ");
      setMsg(`Pulled ${data.fetched} listings (${parts}). 🆕 ${data.newCount ?? 0} new since last check.`);
      await loadRef.current();
    } catch {
      setMsg("Refresh failed — check your internet connection and try again.");
    }
    setRefreshing(false);
  }, []);

  const autoChecked = useRef(false);
  useEffect(() => {
    if (autoChecked.current) return;
    autoChecked.current = true;
    (async () => {
      try {
        const res = await fetch("/api/jobs?status=active");
        const data = await res.json();
        const last = data.lastRefreshAt ? new Date(data.lastRefreshAt).getTime() : 0;
        if (!last || Date.now() - last > REFRESH_MS) await refresh();
      } catch {
        /* offline — keep existing data */
      }
    })();
  }, [refresh]);

  useEffect(() => {
    if (!autoOn) return;
    const id = setInterval(() => refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [autoOn, refresh]);

  async function setJobStatus(id: number, s: string) {
    // Optimistic, in-place update so your scroll position never moves. If the new
    // status means the row no longer belongs in the current tab (e.g. Hide in the
    // All view, or Unsave in Saved), drop just that row; otherwise re-mark it in
    // place. The silent reload below then reconciles counts without a scroll jump.
    const stillBelongs =
      tab === "saved" ? s === "saved"
      : tab === "applied" ? s === "applied"
      : tab === "hidden" ? s === "hidden"
      : /* active | justnew */ s !== "hidden";
    setJobs((prev) =>
      stillBelongs
        ? prev.map((j) => (j.id === id ? { ...j, status: s } : j))
        : prev.filter((j) => j.id !== id),
    );
    await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    load({ silent: true });
  }

  function flagsFor(j: Job) {
    const f: { t: string; c: string }[] = [];
    if (!j.eligible) f.push({ t: "region-locked", c: "bg-rose-100 text-rose-700" });
    if (j.senior) f.push({ t: "senior / over-level", c: "bg-orange-100 text-orange-700" });
    if (j.score < floor) f.push({ t: "low match", c: "bg-slate-200 text-slate-500" });
    return f;
  }

  const TABS = [
    { key: "active", label: `All${counts.all ? ` (${counts.all})` : ""}` },
    { key: "justnew", label: `🆕 New${counts.fresh ? ` (${counts.fresh})` : ""}` },
    { key: "saved", label: `★ Saved${counts.saved ? ` (${counts.saved})` : ""}` },
    { key: "applied", label: `✓ Applied${counts.applied ? ` (${counts.applied})` : ""}` },
    { key: "hidden", label: "Hidden" },
  ];

  const gatedView = tab === "active" || tab === "justnew";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Live Jobs</h1>
          <p className="text-sm text-slate-500">
            Roles you can actually apply to — <span className="font-medium text-slate-700">EU/worldwide</span>,{" "}
            <span className="font-medium text-slate-700">no-calls</span>, matched to your lanes (writing · translation · support · AI).{" "}
            <span className="font-medium text-slate-700">⚓ = anchor</span> (contract + remote). Updated{" "}
            <span className="font-medium text-slate-700">{since(lastRefreshAt)}</span>.
          </p>
        </div>
        <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
          <input type="checkbox" checked={autoOn} onChange={(e) => setAutoOn(e.target.checked)} />
          Auto-refresh (30 min)
        </label>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {refreshing ? "Searching…" : "↻ Search for new jobs"}
        </button>
      </div>

      {msg && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">{msg}</div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1 text-sm ${
              tab === t.key ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        {gatedView && (
          <label
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
              showAll ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-600"
            }`}
          >
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="accent-slate-900" />
            Show all{!showAll && counts.filtered ? ` (+${counts.filtered} filtered)` : ""}
          </label>
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Search title / tags / company…"
          className="w-52 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-slate-500"
        />
        <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm">
          <option value="">All sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm">
          <option value="score">Sort: best match</option>
          <option value="date">Sort: newest</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">No jobs to show.</p>
          <p className="mt-1 text-sm text-slate-400">
            {counts.filtered ? `${counts.filtered} were filtered out — tick “Show all” to see them, or ` : ""}
            hit <span className="font-medium">↻ Search for new jobs</span> to pull fresh listings.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs text-slate-400">
            {jobs.length} shown{gatedView && !showAll && counts.filtered ? ` · ${counts.filtered} hidden as not-applicable` : ""}
          </p>
          <ul className="space-y-3">
            {jobs.map((j) => {
              const flags = flagsFor(j);
              return (
                <li
                  key={j.id}
                  className={`rounded-xl border bg-white p-4 ${j.isNew ? "border-indigo-300 ring-1 ring-indigo-100" : "border-slate-200"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`rounded-md px-2 py-1 text-xs font-bold ${scoreColor(j.score)}`}>{j.score}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {j.isNew && (
                          <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            🆕 New
                          </span>
                        )}
                        <a href={j.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-900 hover:underline">
                          {j.title}
                        </a>
                        {flags.map((fl) => (
                          <span key={fl.t} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${fl.c}`}>
                            {fl.t}
                          </span>
                        ))}
                      </div>
                      <div className="mt-0.5 text-sm text-slate-500">
                        {[j.company, j.location].filter(Boolean).join(" · ")}
                        {j.salary ? ` · 💰 ${j.salary}` : ""}
                      </div>
                      {j.matched && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {j.matched
                            .split(", ")
                            .filter(Boolean)
                            .slice(0, 10)
                            .map((m) => (
                              <span key={m} className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">
                                {m}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{j.source}</span>
                      <span className="text-xs text-slate-400">{ago(j.postedAt)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => setJobStatus(j.id, j.status === "saved" ? "new" : "saved")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                        j.status === "saved" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      ★ Save
                    </button>
                    <button
                      onClick={() => setJobStatus(j.id, j.status === "applied" ? "new" : "applied")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                        j.status === "applied" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      ✓ Applied
                    </button>
                    <button
                      onClick={() => setJobStatus(j.id, j.status === "hidden" ? "new" : "hidden")}
                      className="ml-auto rounded-md px-2.5 py-1 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      {j.status === "hidden" ? "Unhide" : "Hide"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
