"use client";

import type { LighthouseReportResponse } from "@/models/LighthouseReport";
import { scoreRating, RATING_STYLES } from "@/lib/cwv-thresholds";
import { getLatestReport, teamAverages } from "@/lib/dashboard-utils";
import { formatPlatform } from "@/lib/platforms";

function ComparisonBar({
  label,
  reportValue,
  teamValue,
  higherIsBetter = true,
}: {
  label: string;
  reportValue: number;
  teamValue: number;
  higherIsBetter?: boolean;
}) {
  const max = Math.max(reportValue, teamValue, 1);
  const reportPct = (reportValue / max) * 100;
  const teamPct = (teamValue / max) * 100;
  const diff = reportValue - teamValue;
  const isBetter = higherIsBetter ? diff >= 0 : diff <= 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-tiket-text">{label}</span>
        <span
          className={`text-xs font-medium ${isBetter ? "text-tiket-green" : "text-tiket-red"}`}
        >
          {diff >= 0 ? "+" : ""}
          {Number.isInteger(diff) ? diff : diff.toFixed(2)}
          {label === "LCP" || label === "CLS" ? "" : ""}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-[10px] uppercase text-tiket-muted">
            Report
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-tiket-surface">
            <div
              className="h-full rounded-full bg-tiket-blue transition-all"
              style={{ width: `${reportPct}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs tabular-nums">{reportValue}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-[10px] uppercase text-tiket-muted">
            Team
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-tiket-surface">
            <div
              className="h-full rounded-full bg-tiket-muted/50 transition-all"
              style={{ width: `${teamPct}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs tabular-nums">{teamValue}</span>
        </div>
      </div>
    </div>
  );
}

export function ComparisonPanel({
  reports,
  route,
  platform,
}: {
  reports: LighthouseReportResponse[];
  route: string;
  platform: string;
}) {
  const latest = getLatestReport(reports, route, platform);
  const teamStats = teamAverages(reports).find((t) => t.team === latest?.team);

  if (!latest || !teamStats) return null;

  const rating = scoreRating(latest.performance);
  const styles = RATING_STYLES[rating];

  return (
    <section className="panel p-6" aria-label="Team comparison">
      <h2 className="text-lg font-semibold text-tiket-text">
        vs team average
      </h2>
      <p className="mt-1 text-sm text-tiket-muted">
        {latest.team} — {route} · {formatPlatform(platform)}
      </p>

      <div className={`mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${styles.bg} ${styles.border}`}>
        <span className={`text-2xl font-bold tabular-nums ${styles.text}`}>
          {latest.performance}
        </span>
        <span className="text-sm text-tiket-muted">
          vs team avg {teamStats.performance}
        </span>
      </div>

      <div className="mt-6 space-y-5">
        <ComparisonBar label="Performance" reportValue={latest.performance} teamValue={teamStats.performance} />
        <ComparisonBar label="Accessibility" reportValue={latest.accessibility} teamValue={teamStats.accessibility} />
        <ComparisonBar label="SEO" reportValue={latest.seo} teamValue={teamStats.seo} />
        <ComparisonBar
          label="LCP"
          reportValue={Math.round(latest.lcp * 1000)}
          teamValue={Math.round(teamStats.lcp * 1000)}
          higherIsBetter={false}
        />
        <ComparisonBar
          label="INP"
          reportValue={latest.inp}
          teamValue={teamStats.inp}
          higherIsBetter={false}
        />
      </div>
    </section>
  );
}
