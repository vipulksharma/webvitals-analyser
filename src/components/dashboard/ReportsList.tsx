"use client";

import { useState } from "react";
import type { LighthouseReportResponse } from "@/models/LighthouseReport";
import { scoreRating, RATING_STYLES } from "@/lib/cwv-thresholds";
import { formatPlatform } from "@/lib/platforms";
import { RatingBadge } from "@/components/ui/RatingBadge";

function scoreClass(score: number) {
  return RATING_STYLES[scoreRating(score)].text;
}

export function ReportsList({ reports }: { reports: LighthouseReportResponse[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (reports.length === 0) {
    return (
      <section className="panel p-8 text-center text-sm text-tiket-muted">
        No reports match the current filters.
      </section>
    );
  }

  return (
    <section className="panel" aria-label="All reports">
      <div className="panel-header flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-tiket-text">
            All reports
          </h2>
          <p className="mt-1 text-sm text-tiket-muted">
            {reports.length} report{reports.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Desktop table with sr-only accessible data */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Lighthouse reports with Core Web Vitals and scores
          </caption>
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs uppercase tracking-wide text-tiket-muted dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <th scope="col" className="px-5 py-3 font-medium">Route</th>
              <th scope="col" className="px-5 py-3 font-medium">Team</th>
              <th scope="col" className="px-5 py-3 font-medium">Platform</th>
              <th scope="col" className="px-5 py-3 font-medium">Perf</th>
              <th scope="col" className="px-5 py-3 font-medium">FCP</th>
              <th scope="col" className="px-5 py-3 font-medium">LCP</th>
              <th scope="col" className="px-5 py-3 font-medium">INP</th>
              <th scope="col" className="px-5 py-3 font-medium">CLS</th>
              <th scope="col" className="px-5 py-3 font-medium">A11y</th>
              <th scope="col" className="px-5 py-3 font-medium">BP</th>
              <th scope="col" className="px-5 py-3 font-medium">SEO</th>
              <th scope="col" className="px-5 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tiket-border">
            {reports.map((report) => (
              <tr
                key={report._id}
                className="transition hover:bg-tiket-card-hover"
              >
                <td className="max-w-[200px] truncate px-5 py-3 font-mono text-xs font-medium">
                  {report.route}
                </td>
                <td className="px-5 py-3">{report.team}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                    {formatPlatform(report.platform)}
                  </span>
                </td>
                <td className={`px-5 py-3 font-bold tabular-nums ${scoreClass(report.performance)}`}>
                  {report.performance}
                </td>
                <td className="px-5 py-3 tabular-nums">{Math.round((report.fcp || 0) * 1000)}ms</td>
                <td className="px-5 py-3 tabular-nums">{Math.round(report.lcp * 1000)}ms</td>
                <td className="px-5 py-3 tabular-nums">{report.inp}ms</td>
                <td className="px-5 py-3 tabular-nums">{report.cls}</td>
                <td className={`px-5 py-3 tabular-nums ${scoreClass(report.accessibility)}`}>
                  {report.accessibility}
                </td>
                <td className={`px-5 py-3 tabular-nums ${scoreClass(report.bestPractices)}`}>
                  {report.bestPractices}
                </td>
                <td className={`px-5 py-3 tabular-nums ${scoreClass(report.seo)}`}>
                  {report.seo}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-xs text-tiket-muted">
                  <time dateTime={report.createdAt}>
                    {new Date(report.createdAt).toLocaleString()}
                  </time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="space-y-3 p-4 lg:hidden">
        {reports.map((report) => {
          const expanded = expandedId === report._id;
          return (
            <article
              key={report._id}
              className="panel overflow-hidden"
            >
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 p-4 text-left"
                onClick={() => setExpandedId(expanded ? null : report._id)}
                aria-expanded={expanded}
                aria-controls={`report-details-${report._id}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs text-tiket-muted">
                    {report.route}
                  </p>
                  <p className="mt-1 text-xs text-tiket-muted">
                    {report.team} · {formatPlatform(report.platform)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`text-2xl font-bold tabular-nums ${scoreClass(report.performance)}`}>
                    {report.performance}
                  </span>
                  <RatingBadge rating={scoreRating(report.performance)} />
                </div>
              </button>

              {expanded && (
                <div
                  id={`report-details-${report._id}`}
                  className="border-t border-zinc-200 px-4 pb-4 pt-3 dark:border-zinc-800"
                >
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-tiket-muted">LCP</dt>
                      <dd className="font-medium tabular-nums">{Math.round(report.lcp * 1000)}ms</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-tiket-muted">INP</dt>
                      <dd className="font-medium tabular-nums">{report.inp}ms</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-tiket-muted">CLS</dt>
                      <dd className="font-medium tabular-nums">{report.cls}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-tiket-muted">FCP</dt>
                      <dd className="font-medium tabular-nums">{Math.round((report.fcp || 0) * 1000)}ms</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-tiket-muted">Accessibility</dt>
                      <dd className={`font-medium tabular-nums ${scoreClass(report.accessibility)}`}>
                        {report.accessibility}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-tiket-muted">SEO</dt>
                      <dd className={`font-medium tabular-nums ${scoreClass(report.seo)}`}>
                        {report.seo}
                      </dd>
                    </div>
                  </dl>
                  {report.lowScoreReasons.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-tiket-muted">
                      {report.lowScoreReasons.slice(0, 5).map((reason) => (
                        <li key={reason} className="flex gap-2">
                          <span aria-hidden="true">•</span>
                          {reason}
                        </li>
                      ))}
                      {report.lowScoreReasons.length > 5 && (
                        <li className="text-tiket-muted">
                          +{report.lowScoreReasons.length - 5} more
                        </li>
                      )}
                    </ul>
                  )}
                  <time
                    className="mt-3 block text-xs text-tiket-muted"
                    dateTime={report.createdAt}
                  >
                    {new Date(report.createdAt).toLocaleString()}
                  </time>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
