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
import {
  filterLighthouseReports,
  MOCK_LIGHTHOUSE_RESPONSE,
  useMockDashboardData,
  type LighthouseApiResponse,
} from "@/lib/mock-lighthouse-data";

type ApiResponse = LighthouseApiResponse;

function scoreColor(score: number) {
  if (score >= 90) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function toDateKey(iso: string) {
  return iso.slice(0, 10);
}

function formatDateLabel(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function averageDecimal(values: number[], decimals: number) {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const factor = 10 ** decimals;
  return Math.round(mean * factor) / factor;
}

function buildDailySeries(reports: LighthouseReportResponse[]) {
  const byDate = new Map<string, LighthouseReportResponse[]>();

  for (const report of reports) {
    const dateKey = toDateKey(report.createdAt);
    const existing = byDate.get(dateKey) ?? [];
    existing.push(report);
    byDate.set(dateKey, existing);
  }

  return [...byDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dateKey, dayReports]) => ({
      date: formatDateLabel(dateKey),
      dateKey,
      reportCount: dayReports.length,
      Performance: average(dayReports.map((report) => report.performance)),
      Accessibility: average(dayReports.map((report) => report.accessibility)),
      "Best Practices": average(dayReports.map((report) => report.bestPractices)),
      SEO: average(dayReports.map((report) => report.seo)),
      LCP: averageDecimal(
        dayReports.map((report) => report.lcp),
        2
      ),
      FCP: averageDecimal(
        dayReports.map((report) => report.fcp),
        2
      ),
      INP: average(dayReports.map((report) => report.inp)),
      CLS: averageDecimal(
        dayReports.map((report) => report.cls),
        3
      ),
    }));
}

function buildRouteSeries(
  reports: LighthouseReportResponse[],
  route: string,
  platform: string
) {
  const filtered = reports.filter(
    (report) => report.route === route && report.platform === platform
  );
  return buildDailySeries(filtered);
}

function RouteChartSelect({
  label,
  value,
  routes,
  onChange,
}: {
  label: string;
  value: string;
  routes: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-4 max-w-xl">
      <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        <option value="">Select a route</option>
        {routes.map((route) => (
          <option key={route} value={route}>
            {route}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DashboardCharts() {
  const [allReports, setAllReports] = useState<LighthouseReportResponse[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [routes, setRoutes] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [teamFilter, setTeamFilter] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [scoresChartRoute, setScoresChartRoute] = useState("");
  const [scoresChartPlatform, setScoresChartPlatform] = useState("mobile");
  const [vitalsChartRoute, setVitalsChartRoute] = useState("");
  const [vitalsChartPlatform, setVitalsChartPlatform] = useState("mobile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (useMockDashboardData()) {
        const json = MOCK_LIGHTHOUSE_RESPONSE;
        setAllReports(json.data);
        setTeams(json.teams);
        setRoutes(json.routes);
        setPlatforms(json.platforms);
        return;
      }

      const res = await fetch("/api/lighthouse");
      const json: ApiResponse = await res.json();
      if (!res.ok) throw new Error("Failed to load reports");

      setAllReports(json.data);
      setTeams(json.teams);
      setRoutes(json.routes);
      setPlatforms(json.platforms);
    } catch {
      setError("Could not load lighthouse reports. Check your MongoDB connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (routes.length === 0) return;
    setScoresChartRoute((current) => current || routes[0]);
    setVitalsChartRoute((current) => current || routes[0]);
  }, [routes]);

  const filteredReports = useMemo(
    () =>
      filterLighthouseReports(allReports, {
        team: teamFilter || undefined,
        route: routeFilter || undefined,
        platform: platformFilter || undefined,
      }),
    [allReports, teamFilter, routeFilter, platformFilter]
  );

  const scoreChartData = useMemo(() => {
    if (!scoresChartRoute || !scoresChartPlatform) return [];
    return buildRouteSeries(allReports, scoresChartRoute, scoresChartPlatform);
  }, [allReports, scoresChartRoute, scoresChartPlatform]);

  const vitalsChartData = useMemo(() => {
    if (!vitalsChartRoute || !vitalsChartPlatform) return [];
    return buildRouteSeries(allReports, vitalsChartRoute, vitalsChartPlatform).map(
      (point) => ({
        ...point,
        FCP: Math.round(point.FCP * 1000),
        LCP: Math.round(point.LCP * 1000),
      })
    );
  }, [allReports, vitalsChartRoute, vitalsChartPlatform]);

  const teamAverages = useMemo(() => {
    const map = new Map<string, { count: number; performance: number; accessibility: number; seo: number }>();
    for (const r of filteredReports) {
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
  }, [filteredReports]);

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

      {allReports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          No reports yet. Data will appear here once reports are collected.
        </div>
      ) : (
        <>
          <ChartCard title="Lighthouse Scores Over Time">
            <div className="mb-4 flex flex-wrap gap-4">
              <RouteChartSelect
                label="Route"
                value={scoresChartRoute}
                routes={routes}
                onChange={setScoresChartRoute}
              />
              <FilterSelect
                label="Platform"
                value={scoresChartPlatform}
                options={platforms.map((p) => ({ value: p, label: formatPlatform(p) }))}
                onChange={setScoresChartPlatform}
                includeAll={false}
              />
            </div>
            {scoresChartRoute ? (
              <>
                <p className="mb-4 text-xs text-slate-500">
                  {scoresChartRoute} · {formatPlatform(scoresChartPlatform)} — one point per day
                </p>
                {scoreChartData.length === 0 ? (
                  <p className="py-12 text-center text-sm text-slate-500">
                    No reports for this route and platform yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={scoreChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value, name) => [value, name]}
                        labelFormatter={(label, payload) => {
                          const count = payload?.[0]?.payload?.reportCount;
                          return count ? `${label} (${count} report${count === 1 ? "" : "s"})` : label;
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="Performance" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Accessibility" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Best Practices" stroke="#9333ea" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="SEO" stroke="#ea580c" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </>
            ) : (
              <p className="py-12 text-center text-sm text-slate-500">
                Select a route to view score trends over time.
              </p>
            )}
          </ChartCard>

          <ChartCard title="Core Web Vitals Over Time">
            <div className="mb-4 flex flex-wrap gap-4">
              <RouteChartSelect
                label="Route"
                value={vitalsChartRoute}
                routes={routes}
                onChange={setVitalsChartRoute}
              />
              <FilterSelect
                label="Platform"
                value={vitalsChartPlatform}
                options={platforms.map((p) => ({ value: p, label: formatPlatform(p) }))}
                onChange={setVitalsChartPlatform}
                includeAll={false}
              />
            </div>
            {vitalsChartRoute ? (
              <>
                <p className="mb-4 text-xs text-slate-500">
                  {vitalsChartRoute} · {formatPlatform(vitalsChartPlatform)} — FCP, LCP, and INP in ms; CLS as decimal
                </p>
                {vitalsChartData.length === 0 ? (
                  <p className="py-12 text-center text-sm text-slate-500">
                    No reports for this route and platform yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={vitalsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "FCP" || name === "LCP" || name === "INP") {
                            return [`${value}ms`, name];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(label, payload) => {
                          const count = payload?.[0]?.payload?.reportCount;
                          return count ? `${label} (${count} report${count === 1 ? "" : "s"})` : label;
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="FCP" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="LCP" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="INP" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="CLS" stroke="#ea580c" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </>
            ) : (
              <p className="py-12 text-center text-sm text-slate-500">
                Select a route to view Core Web Vitals over time.
              </p>
            )}
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
                    <th className="px-4 py-3">FCP</th>
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
                  {filteredReports.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{r.route}</td>
                      <td className="px-4 py-3">{r.team}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {formatPlatform(r.platform)}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-semibold ${scoreColor(r.performance)}`}>{r.performance}</td>
                      <td className="px-4 py-3">{r.fcp}s</td>
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
  includeAll = true,
}: {
  label: string;
  value: string;
  options: string[] | { value: string; label: string }[];
  onChange: (v: string) => void;
  includeAll?: boolean;
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
        {includeAll && <option value="">All</option>}
        {normalized.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
