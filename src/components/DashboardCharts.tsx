"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LighthouseReportResponse } from "@/models/LighthouseReport";
import { formatPlatform } from "@/lib/platforms";
import {
  MOCK_LIGHTHOUSE_RESPONSE,
  useMockDashboardData,
  type LighthouseApiResponse,
} from "@/lib/mock-lighthouse-data";
import {
  buildRouteSeries,
  teamAverages as computeTeamAverages,
} from "@/lib/dashboard-utils";
import { ComparisonPanel } from "@/components/dashboard/ComparisonPanel";
import {
  ChartPanel,
  FilterSelect,
  ScoresLineChart,
  TeamBarChart,
  VitalsLineChart,
} from "@/components/dashboard/ChartPanels";
import { ReportsList } from "@/components/dashboard/ReportsList";
import { RouteHeatmap } from "@/components/dashboard/RouteHeatmap";
import { ScoreOverview } from "@/components/dashboard/ScoreOverview";
import {
  ChartEmpty,
  DashboardEmpty,
  DashboardLoading,
} from "@/components/ui/DashboardStates";

type ApiResponse = LighthouseApiResponse;

export function DashboardCharts() {
  const [allReports, setAllReports] = useState<LighthouseReportResponse[]>([]);
  const [routes, setRoutes] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [scoresChartRoute, setScoresChartRoute] = useState("");
  const [scoresChartPlatform, setScoresChartPlatform] = useState("mobile");
  const [vitalsChartRoute, setVitalsChartRoute] = useState("");
  const [vitalsChartPlatform, setVitalsChartPlatform] = useState("mobile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const usingMock = useMockDashboardData();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (usingMock) {
        const json = MOCK_LIGHTHOUSE_RESPONSE;
        setAllReports(json.data);
        setRoutes(json.routes);
        setPlatforms(json.platforms);
        return;
      }

      const res = await fetch("/api/lighthouse");
      const json: ApiResponse = await res.json();
      if (!res.ok) throw new Error("Failed to load reports");

      setAllReports(json.data);
      setRoutes(json.routes);
      setPlatforms(json.platforms);
    } catch {
      setError("Could not load lighthouse reports. Check your MongoDB connection.");
    } finally {
      setLoading(false);
    }
  }, [usingMock]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (routes.length === 0) return;
    setScoresChartRoute((current) => current || routes[0]);
    setVitalsChartRoute((current) => current || routes[0]);
  }, [routes]);

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

  const teamBarData = useMemo(
    () =>
      computeTeamAverages(allReports).map((team) => ({
        team: team.team,
        Performance: team.performance,
        Accessibility: team.accessibility,
        SEO: team.seo,
      })),
    [allReports]
  );

  const focusRoute = (route: string, platform: string) => {
    setScoresChartRoute(route);
    setScoresChartPlatform(platform);
    setVitalsChartRoute(route);
    setVitalsChartPlatform(platform);
  };

  if (loading) return <DashboardLoading />;

  if (error) {
    return (
      <div
        className="panel border-tiket-red/30 bg-tiket-red/5 px-5 py-4 text-sm text-tiket-red"
        role="alert"
      >
        {error}
      </div>
    );
  }

  if (allReports.length === 0) {
    return <DashboardEmpty usingSample={false} />;
  }

  const overviewRoute = scoresChartRoute || routes[0];
  const overviewPlatform = scoresChartPlatform;

  return (
    <div className="space-y-6">
      {usingMock && (
        <div
          className="panel flex items-center gap-3 border-tiket-blue/30 bg-tiket-blue/5 px-4 py-3 text-sm text-tiket-blue"
          role="status"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-tiket-blue" aria-hidden="true" />
          Development mode — showing sample Lighthouse data
        </div>
      )}

      <ScoreOverview
        reports={allReports}
        route={overviewRoute}
        platform={overviewPlatform}
      />

      <RouteHeatmap reports={allReports} onSelectRoute={focusRoute} />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <ChartPanel
            title="Lighthouse scores over time"
            description="Select a route to track category scores day over day"
            controls={
              <div className="mb-4 flex flex-wrap gap-4">
                <FilterSelect
                  label="Route"
                  id="scores-route"
                  value={scoresChartRoute}
                  options={routes}
                  onChange={setScoresChartRoute}
                  includeAll={false}
                />
                <FilterSelect
                  label="Platform"
                  id="scores-platform"
                  value={scoresChartPlatform}
                  options={platforms.map((p) => ({
                    value: p,
                    label: formatPlatform(p),
                  }))}
                  onChange={setScoresChartPlatform}
                  includeAll={false}
                />
              </div>
            }
          >
            {scoresChartRoute && scoreChartData.length > 0 ? (
              <>
                <ScoresLineChart data={scoreChartData} showPercentiles />
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-tiket-muted hover:text-tiket-text">
                    View chart data as table (screen reader accessible)
                  </summary>
                  <table className="mt-2 w-full text-left text-xs">
                    <caption className="sr-only">
                      Lighthouse scores over time for {scoresChartRoute}
                    </caption>
                    <thead>
                      <tr className="border-b border-tiket-border">
                        <th scope="col" className="py-2 pr-4">Date</th>
                        <th scope="col" className="py-2 pr-4">Performance</th>
                        <th scope="col" className="py-2 pr-4">Accessibility</th>
                        <th scope="col" className="py-2 pr-4">Best Practices</th>
                        <th scope="col" className="py-2">SEO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreChartData.map((row) => (
                        <tr key={String(row.dateKey)} className="border-b border-tiket-border/50">
                          <td className="py-2 pr-4">{String(row.date)}</td>
                          <td className="py-2 pr-4 tabular-nums">{String(row.Performance)}</td>
                          <td className="py-2 pr-4 tabular-nums">{String(row.Accessibility)}</td>
                          <td className="py-2 pr-4 tabular-nums">{String(row["Best Practices"])}</td>
                          <td className="py-2 tabular-nums">{String(row.SEO)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </>
            ) : (
              <ChartEmpty message="No score history for this route and platform." />
            )}
          </ChartPanel>

          <ChartPanel
            title="Core Web Vitals over time"
            description="FCP, LCP, and INP in milliseconds; CLS as decimal"
            controls={
              <div className="mb-4 flex flex-wrap gap-4">
                <FilterSelect
                  label="Route"
                  id="vitals-route"
                  value={vitalsChartRoute}
                  options={routes}
                  onChange={setVitalsChartRoute}
                  includeAll={false}
                />
                <FilterSelect
                  label="Platform"
                  id="vitals-platform"
                  value={vitalsChartPlatform}
                  options={platforms.map((p) => ({
                    value: p,
                    label: formatPlatform(p),
                  }))}
                  onChange={setVitalsChartPlatform}
                  includeAll={false}
                />
              </div>
            }
          >
            {vitalsChartRoute && vitalsChartData.length > 0 ? (
              <>
                <VitalsLineChart data={vitalsChartData} />
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-tiket-muted hover:text-tiket-text">
                    View chart data as table (screen reader accessible)
                  </summary>
                  <table className="mt-2 w-full text-left text-xs">
                    <caption className="sr-only">
                      Core Web Vitals over time for {vitalsChartRoute}
                    </caption>
                    <thead>
                      <tr className="border-b border-tiket-border">
                        <th scope="col" className="py-2 pr-4">Date</th>
                        <th scope="col" className="py-2 pr-4">FCP (ms)</th>
                        <th scope="col" className="py-2 pr-4">LCP (ms)</th>
                        <th scope="col" className="py-2 pr-4">INP (ms)</th>
                        <th scope="col" className="py-2">CLS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vitalsChartData.map((row) => (
                        <tr key={String(row.dateKey)} className="border-b border-tiket-border/50">
                          <td className="py-2 pr-4">{String(row.date)}</td>
                          <td className="py-2 pr-4 tabular-nums">{String(row.FCP)}</td>
                          <td className="py-2 pr-4 tabular-nums">{String(row.LCP)}</td>
                          <td className="py-2 pr-4 tabular-nums">{String(row.INP)}</td>
                          <td className="py-2 tabular-nums">{String(row.CLS)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </>
            ) : (
              <ChartEmpty message="No vitals history for this route and platform." />
            )}
          </ChartPanel>
        </div>

        <ComparisonPanel
          reports={allReports}
          route={overviewRoute}
          platform={overviewPlatform}
        />
      </div>

      {teamBarData.length > 1 && (
        <ChartPanel title="Average scores by team">
          <TeamBarChart data={teamBarData} />
        </ChartPanel>
      )}

      <ReportsList reports={allReports} />
    </div>
  );
}
