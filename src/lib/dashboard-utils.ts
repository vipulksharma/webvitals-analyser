import type { LighthouseReportResponse } from "@/models/LighthouseReport";

export function toDateKey(iso: string) {
  return iso.slice(0, 10);
}

export function formatDateLabel(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function averageDecimal(values: number[], decimals: number) {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const factor = 10 ** decimals;
  return Math.round(mean * factor) / factor;
}

export function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

export function buildDailySeries(reports: LighthouseReportResponse[]) {
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
      LCP: averageDecimal(dayReports.map((report) => report.lcp), 2),
      FCP: averageDecimal(dayReports.map((report) => report.fcp), 2),
      INP: average(dayReports.map((report) => report.inp)),
      CLS: averageDecimal(dayReports.map((report) => report.cls), 3),
      "Performance P75": percentile(dayReports.map((report) => report.performance), 75),
      "Performance P90": percentile(dayReports.map((report) => report.performance), 90),
    }));
}

export function buildRouteSeries(
  reports: LighthouseReportResponse[],
  route: string,
  platform: string
) {
  return buildDailySeries(
    reports.filter((report) => report.route === route && report.platform === platform)
  );
}

export function getLatestReport(
  reports: LighthouseReportResponse[],
  route: string,
  platform: string
) {
  return reports
    .filter((report) => report.route === route && report.platform === platform)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export function getPreviousReport(
  reports: LighthouseReportResponse[],
  route: string,
  platform: string
) {
  return reports
    .filter((report) => report.route === route && report.platform === platform)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[1];
}

export function computeTrend(current: number, previous: number | undefined) {
  if (previous == null) return null;
  const delta = current - previous;
  if (delta === 0) return { direction: "flat" as const, delta: 0 };
  return {
    direction: delta > 0 ? ("up" as const) : ("down" as const),
    delta: Math.abs(delta),
  };
}

export function teamAverages(reports: LighthouseReportResponse[]) {
  const map = new Map<
    string,
    {
      count: number;
      performance: number;
      accessibility: number;
      bestPractices: number;
      seo: number;
      lcp: number;
      inp: number;
      cls: number;
    }
  >();

  for (const report of reports) {
    const existing = map.get(report.team) ?? {
      count: 0,
      performance: 0,
      accessibility: 0,
      bestPractices: 0,
      seo: 0,
      lcp: 0,
      inp: 0,
      cls: 0,
    };
    existing.count += 1;
    existing.performance += report.performance;
    existing.accessibility += report.accessibility;
    existing.bestPractices += report.bestPractices;
    existing.seo += report.seo;
    existing.lcp += report.lcp;
    existing.inp += report.inp;
    existing.cls += report.cls;
    map.set(report.team, existing);
  }

  return Array.from(map.entries()).map(([team, stats]) => ({
    team,
    performance: Math.round(stats.performance / stats.count),
    accessibility: Math.round(stats.accessibility / stats.count),
    bestPractices: Math.round(stats.bestPractices / stats.count),
    seo: Math.round(stats.seo / stats.count),
    lcp: averageDecimal([stats.lcp / stats.count], 2),
    inp: Math.round(stats.inp / stats.count),
    cls: averageDecimal([stats.cls / stats.count], 3),
  }));
}

export function routeOverview(reports: LighthouseReportResponse[]) {
  const map = new Map<string, LighthouseReportResponse[]>();
  for (const report of reports) {
    const key = `${report.route}::${report.platform}`;
    const existing = map.get(key) ?? [];
    existing.push(report);
    map.set(key, existing);
  }

  return [...map.entries()].map(([key, routeReports]) => {
    const [route, platform] = key.split("::");
    const sorted = [...routeReports].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    const latest = sorted[0];
    const perfHistory = sorted
      .slice()
      .reverse()
      .map((report) => report.performance);
    return { route, platform, latest, perfHistory };
  });
}
