"use client";

import { scoreRating, RATING_STYLES } from "@/lib/cwv-thresholds";
import { routeOverview } from "@/lib/dashboard-utils";
import type { LighthouseReportResponse } from "@/models/LighthouseReport";
import { formatPlatform } from "@/lib/platforms";
import { Sparkline } from "@/components/ui/DashboardStates";

function heatCellClass(score: number) {
  const rating = scoreRating(score);
  return RATING_STYLES[rating].bg;
}

export function RouteHeatmap({
  reports,
  onSelectRoute,
}: {
  reports: LighthouseReportResponse[];
  onSelectRoute?: (route: string, platform: string) => void;
}) {
  const rows = routeOverview(reports).sort(
    (a, b) => a.latest.performance - b.latest.performance
  );

  if (rows.length === 0) return null;

  return (
    <section className="panel" aria-label="Route performance overview">
      <div className="panel-header">
        <h2 className="text-lg font-semibold text-tiket-text">
          Route overview
        </h2>
        <p className="mt-1 text-sm text-tiket-muted">
          Performance heatmap with sparklines — click a row to focus charts
        </p>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Route performance heatmap with trend sparklines
          </caption>
          <thead>
            <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-tiket-muted dark:border-zinc-800 dark:text-zinc-400">
              <th scope="col" className="px-5 py-3 font-medium">
                Route
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                Platform
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                Perf
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                Trend
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                LCP
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                INP
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tiket-border">
            {rows.map(({ route, platform, latest, perfHistory }) => (
              <tr
                key={`${route}-${platform}`}
                className="cursor-pointer transition hover:bg-tiket-card-hover"
                onClick={() => onSelectRoute?.(route, platform)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectRoute?.(route, platform);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View ${route} on ${formatPlatform(platform)}, performance ${latest.performance}`}
              >
                <td className="max-w-xs truncate px-5 py-3 font-mono text-xs font-medium">
                  {route}
                </td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                    {formatPlatform(platform)}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex min-w-[2.5rem] justify-center rounded-md px-2 py-1 text-sm font-bold tabular-nums ${heatCellClass(latest.performance)}`}
                  >
                    {latest.performance}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <Sparkline
                    values={perfHistory}
                    ariaLabel={`Performance trend for ${route}`}
                  />
                </td>
                <td className="px-5 py-3 tabular-nums text-tiket-muted">
                  {Math.round(latest.lcp * 1000)}ms
                </td>
                <td className="px-5 py-3 tabular-nums text-tiket-muted">
                  {latest.inp}ms
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {rows.map(({ route, platform, latest, perfHistory }) => (
          <button
            key={`${route}-${platform}-mobile`}
            type="button"
            onClick={() => onSelectRoute?.(route, platform)}
            className="panel w-full p-4 text-left transition active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-tiket-muted">
                  {route}
                </p>
                <p className="mt-1 text-xs text-tiket-muted">{formatPlatform(platform)}</p>
              </div>
              <span
                className={`rounded-lg px-3 py-1 text-lg font-bold tabular-nums ${heatCellClass(latest.performance)}`}
              >
                {latest.performance}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Sparkline
                values={perfHistory}
                width={120}
                ariaLabel={`Performance trend for ${route}`}
              />
              <span className="text-xs tabular-nums text-tiket-muted">
                LCP {Math.round(latest.lcp * 1000)}ms · INP {latest.inp}ms
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
