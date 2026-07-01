"use client";

import { useEffect, useMemo, useState } from "react";

type Platform = {
  id: number;
  name: string;
  category: string;
  tier: string;
  url: string;
  pay: string;
  payout: string;
  eligibility: string;
  entry: string;
  mode: string;
  fit: string;
  recommended: boolean;
  status: string;
  notes: string;
};

const STATUSES = [
  { key: "todo", label: "To do" },
  { key: "applied", label: "Applied" },
  { key: "in_progress", label: "In progress" },
  { key: "accepted", label: "Accepted" },
  { key: "earning", label: "💰 Earning" },
  { key: "rejected", label: "Rejected" },
];

const TIERS = [
  { key: "", label: "All tiers" },
  { key: "start_now", label: "⚡ Start now" },
  { key: "apply_now", label: "Apply now" },
  { key: "build", label: "Build over time" },
];

const TIER_BADGE: Record<string, string> = {
  start_now: "bg-emerald-100 text-emerald-800",
  apply_now: "bg-sky-100 text-sky-800",
  build: "bg-slate-100 text-slate-600",
};

const MODE_BADGE: Record<string, string> = {
  async: "bg-violet-50 text-violet-700",
  voice: "bg-rose-50 text-rose-700",
  mixed: "bg-amber-50 text-amber-700",
};

const statusColor = (s: string) =>
  s === "earning"
    ? "border-emerald-400 bg-emerald-50 text-emerald-800"
    : s === "accepted"
      ? "border-sky-400 bg-sky-50 text-sky-800"
      : s === "applied" || s === "in_progress"
        ? "border-amber-400 bg-amber-50 text-amber-800"
        : s === "rejected"
          ? "border-slate-300 bg-slate-50 text-slate-400"
          : "border-slate-300 bg-white text-slate-700";

export default function Tracker() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState("");
  const [q, setQ] = useState("");
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({});

  async function load() {
    setLoading(true);
    const res = await fetch("/api/platforms");
    const data = await res.json();
    setPlatforms(data.platforms || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function patch(id: number, body: Record<string, string>) {
    setPlatforms((prev) => prev.map((p) => (p.id === id ? { ...p, ...body } : p)));
    await fetch(`/api/platforms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return platforms.filter(
      (p) =>
        (!tier || p.tier === tier) &&
        (!needle ||
          p.name.toLowerCase().includes(needle) ||
          p.category.toLowerCase().includes(needle) ||
          p.fit.toLowerCase().includes(needle)),
    );
  }, [platforms, tier, q]);

  const byCategory = useMemo(() => {
    const map = new Map<string, Platform[]>();
    for (const p of filtered) {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    }
    return [...map.entries()];
  }, [filtered]);

  const summary = useMemo(() => {
    const s: Record<string, number> = {};
    for (const p of platforms) s[p.status] = (s[p.status] || 0) + 1;
    return s;
  }, [platforms]);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Platform Tracker</h1>
        <p className="text-sm text-slate-500">
          The {platforms.length} researched platforms you can sign up for — track each application’s status and notes.
        </p>
      </div>

      {/* Summary */}
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {STATUSES.map((s) =>
          summary[s.key] ? (
            <span key={s.key} className={`rounded-full border px-3 py-1 ${statusColor(s.key)}`}>
              {s.label}: {summary[s.key]}
            </span>
          ) : null,
        )}
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {TIERS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTier(t.key)}
            className={`rounded-full px-3 py-1 text-sm ${
              tier === t.key ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search platforms…"
          className="ml-auto w-56 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-slate-500"
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        byCategory.map(([category, items]) => (
          <section key={category} className="mb-7">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">{category}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start gap-2">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      {p.name}
                    </a>
                    {p.recommended && <span title="Top pick">⭐</span>}
                    <span className={`ml-auto rounded px-1.5 py-0.5 text-[11px] font-medium ${TIER_BADGE[p.tier] || ""}`}>
                      {p.tier.replace("_", " ")}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">💵 {p.pay}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{p.payout}</span>
                    <span className={`rounded px-1.5 py-0.5 ${MODE_BADGE[p.mode] || "bg-slate-100 text-slate-600"}`}>{p.mode}</span>
                    {p.eligibility === "verify" && (
                      <span className="rounded bg-orange-100 px-1.5 py-0.5 text-orange-700">⚠ verify eligibility</span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-slate-600">{p.fit}</p>
                  <p className="mt-1 text-xs text-slate-400">Entry: {p.entry}</p>

                  <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <select
                      value={p.status}
                      onChange={(e) => patch(p.id, { status: e.target.value })}
                      className={`rounded-md border px-2 py-1 text-xs font-medium ${statusColor(p.status)}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={notesDraft[p.id] ?? p.notes}
                      onChange={(e) => setNotesDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                      onBlur={(e) => patch(p.id, { notes: e.target.value })}
                      placeholder="Notes (login, contact, next step)…"
                      className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-slate-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
