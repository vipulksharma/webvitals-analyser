"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LighthouseReportResponse } from "@/models/LighthouseReport";
import { formatPlatform } from "@/lib/platforms";

type ApiResponse = {
  data: LighthouseReportResponse[];
  teams: string[];
  routes: string[];
  platforms: string[];
};

function scoreColor(score: number) {
  if (score >= 90) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

export function DashboardCharts() {
  const [reports, setReports] = useState<LighthouseReportResponse[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [routes, setRoutes] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [teamFilter, setTeamFilter] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (teamFilter) params.set("team", teamFilter);
      if (routeFilter) params.set("route", routeFilter);
      if (platformFilter) params.set("platform", platformFilter);

      const res = await fetch(`/api/lighthouse?${params.toString()}`);
      const json: ApiResponse = await res.json();
      if (!res.ok) throw new Error("Failed to load reports");

      setReports(json.data);
      setTeams(json.teams);
      setRoutes(json.routes);
      setPlatforms(json.platforms);
    } catch {
      setError("Could not load lighthouse reports. Check your MongoDB connection.");
    } finally {
      setLoading(false);
    }
  }, [teamFilter, routeFilter, platformFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const scoreChartData = useMemo(() => {
    return [...reports]
      .reverse()
      .map((r) => ({
        label: `${r.route} · ${formatPlatform(r.platform)} (${new Date(r.createdAt).toLocaleDateString()})`,
        route: r.route,
        platform: formatPlatform(r.platform),
        Performance: r.performance,
        Accessibility: r.accessibility,
        "Best Practices": r.bestPractices,
        SEO: r.seo,
      }));
  }, [reports]);

  const vitalsChartData = useMemo(() => {
    return [...reports]
      .reverse()
      .map((r) => ({
        label: `${r.route} · ${formatPlatform(r.platform)}`,
        LCP: r.lcp,
        INP: r.inp,
        CLS: r.cls * 100,
      }));
  }, [reports]);

  const teamAverages = useMemo(() => {
    const map = new Map<string, { count: number; performance: number; accessibility: number; seo: number }>();
    for (const r of reports) {
      const existing = map.get(r.team) ?? { count: 0, performance: 0, accessibility: 0, seo: 0 };
      existing.count += 1;
      existing.performance += r.performance;
      existing.accessibility += r.accessibility;
      existing.seo += r.seo;
      map.set(r.team, existing);
    }
    return Array.from(map.entries()).map(([team, stats]) => ({
      team,
      Performance: Math.round(stats.performance / stats.count),
      Accessibility: Math.round(stats.accessibility / stats.count),
      SEO: Math.round(stats.seo / stats.count),
    }));
  }, [reports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        Loading reports…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <FilterSelect
          label="Team"
          value={teamFilter}
          options={teams}
          onChange={setTeamFilter}
        />
        <FilterSelect
          label="Route"
          value={routeFilter}
          options={routes}
          onChange={setRouteFilter}
        />
        <FilterSelect
          label="Platform"
          value={platformFilter}
          options={platforms.map((p) => ({ value: p, label: formatPlatform(p) }))}
          onChange={setPlatformFilter}
        />
        <button
          type="button"
          onClick={() => {
            setTeamFilter("");
            setRouteFilter("");
            setPlatformFilter("");
          }}
          className="self-end rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Clear filters
        </button>
      </section>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          No reports yet. Submit your first Lighthouse report to see charts here.
        </div>
      ) : (
        <>
          <ChartCard title="Lighthouse Scores Over Time">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={scoreChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Performance" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Accessibility" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Best Practices" stroke="#9333ea" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="SEO" stroke="#ea580c" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Core Web Vitals">
            <p className="mb-4 text-xs text-slate-500">
              LCP in seconds, INP in milliseconds, CLS scaled ×100 for visibility.
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={vitalsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="LCP" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="INP" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="CLS" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {teamAverages.length > 1 && (
            <ChartCard title="Average Scores by Team">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teamAverages}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="team" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Performance" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Accessibility" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="SEO" fill="#ea580c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <h2 className="border-b border-slate-200 px-6 py-4 text-lg font-semibold">
              All Reports
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Perf</th>
                    <th className="px-4 py-3">LCP</th>
                    <th className="px-4 py-3">INP</th>
                    <th className="px-4 py-3">CLS</th>
                    <th className="px-4 py-3">A11y</th>
                    <th className="px-4 py-3">BP</th>
                    <th className="px-4 py-3">SEO</th>
                    <th className="px-4 py-3">Reasons</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{r.route}</td>
                      <td className="px-4 py-3">{r.team}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {formatPlatform(r.platform)}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-semibold ${scoreColor(r.performance)}`}>{r.performance}</td>
                      <td className="px-4 py-3">{r.lcp}s</td>
                      <td className="px-4 py-3">{r.inp}ms</td>
                      <td className="px-4 py-3">{r.cls}</td>
                      <td className={`px-4 py-3 ${scoreColor(r.accessibility)}`}>{r.accessibility}</td>
                      <td className={`px-4 py-3 ${scoreColor(r.bestPractices)}`}>{r.bestPractices}</td>
                      <td className={`px-4 py-3 ${scoreColor(r.seo)}`}>{r.seo}</td>
                      <td className="max-w-xs px-4 py-3">
                        {r.lowScoreReasons.length > 0 ? (
                          <ul className="list-inside list-disc text-xs text-slate-600">
                            {r.lowScoreReasons.map((reason) => (
                              <li key={reason}>{reason}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[] | { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const normalized = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        <option value="">All</option>
        {normalized.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
