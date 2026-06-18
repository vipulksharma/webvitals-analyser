"use client";

import type { LighthouseReportResponse } from "@/models/LighthouseReport";
import {
  clsRating,
  fcpRating,
  inpRating,
  lcpRating,
  scoreRating,
} from "@/lib/cwv-thresholds";
import {
  computeTrend,
  getLatestReport,
  getPreviousReport,
} from "@/lib/dashboard-utils";
import { formatPlatform } from "@/lib/platforms";
import { MetricCard } from "@/components/ui/MetricCard";
import { ScoreGauge } from "@/components/ui/ScoreGauge";

export function ScoreOverview({
  reports,
  route,
  platform,
}: {
  reports: LighthouseReportResponse[];
  route: string;
  platform: string;
}) {
  const latest = getLatestReport(reports, route, platform);
  const previous = getPreviousReport(reports, route, platform);

  if (!latest) {
    return (
      <section className="panel p-6" aria-label="Score overview">
        <p className="text-sm text-tiket-muted">
          Select a route with reports to view score overview.
        </p>
      </section>
    );
  }

  const perfTrend = computeTrend(latest.performance, previous?.performance);

  return (
    <section className="panel p-6" aria-label="Score overview">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-tiket-text">
            Performance snapshot
          </h2>
          <p className="mt-1 font-mono text-xs text-tiket-muted">
            {route} · {formatPlatform(platform)}
          </p>
        </div>
        <time
          className="text-xs text-tiket-muted"
          dateTime={latest.createdAt}
        >
          Latest: {new Date(latest.createdAt).toLocaleString()}
        </time>
      </div>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="flex justify-center lg:justify-start">
          <ScoreGauge
            score={latest.performance}
            label="Performance"
            trend={perfTrend}
            size="lg"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="LCP"
            value={Math.round(latest.lcp * 1000)}
            unit="ms"
            rating={lcpRating(latest.lcp)}
            trend={computeTrend(latest.lcp, previous?.lcp)}
            invertTrend
          />
          <MetricCard
            label="INP"
            value={latest.inp}
            unit="ms"
            rating={inpRating(latest.inp)}
            trend={computeTrend(latest.inp, previous?.inp)}
            invertTrend
          />
          <MetricCard
            label="CLS"
            value={latest.cls}
            rating={clsRating(latest.cls)}
            trend={computeTrend(latest.cls, previous?.cls)}
            invertTrend
          />
          <MetricCard
            label="FCP"
            value={Math.round((latest.fcp || 0) * 1000)}
            unit="ms"
            rating={fcpRating(latest.fcp || 0)}
            trend={computeTrend(latest.fcp || 0, previous?.fcp)}
            invertTrend
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Accessibility", value: latest.accessibility },
          { label: "Best Practices", value: latest.bestPractices },
          { label: "SEO", value: latest.seo },
        ].map(({ label, value }) => (
          <MetricCard
            key={label}
            label={label}
            value={value}
            rating={scoreRating(value)}
            trend={computeTrend(
              value,
              previous
                ? label === "Accessibility"
                  ? previous.accessibility
                  : label === "Best Practices"
                    ? previous.bestPractices
                    : previous.seo
                : undefined
            )}
          />
        ))}
      </div>
    </section>
  );
}
