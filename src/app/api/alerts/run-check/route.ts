import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { type ReportPlatform } from "@/lib/platforms";
import {
  metricRegression,
  type AlertMetricKey,
  isAlertMetric,
} from "@/lib/alert-metrics";
import { sendAlertEmail } from "@/lib/email";
import { WebVitalsAlert } from "@/models/WebVitalsAlert";
import { LighthouseReport } from "@/models/LighthouseReport";

export const runtime = "nodejs";

type CollectedPlatformMetrics = {
  fcp: number;
  lcp: number;
  inp: number;
  cls: number;
  accessibility: number;
  bestPractices: number;
};

type CollectedReport = {
  route: string;
  team: string;
  mobile?: CollectedPlatformMetrics;
  desktop?: CollectedPlatformMetrics;
};

function getMetricValue(report: CollectedPlatformMetrics, metric: AlertMetricKey): number {
  return report[metric];
}

function getCollectedPlatformMetrics(
  report: CollectedReport,
  platform: ReportPlatform
): CollectedPlatformMetrics | undefined {
  if (platform === "mobile") return report.mobile;
  if (platform === "desktop") return report.desktop;
  return undefined;
}

function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.ALERT_CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  return request.headers.get("x-alert-secret") === secret;
}

export async function POST(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const body = await request.json();
    const reports = body.reports as CollectedReport[] | undefined;

    if (!Array.isArray(reports) || reports.length === 0) {
      return NextResponse.json({ error: "reports array is required" }, { status: 400 });
    }

    const alerts = await WebVitalsAlert.find({ enabled: true }).lean();
    const triggered: string[] = [];
    const skipped: string[] = [];

    for (const alert of alerts) {
      const collected = reports.find((report) => report.route === alert.route);
      const platformMetrics = collected
        ? getCollectedPlatformMetrics(collected, alert.platform)
        : undefined;

      if (!platformMetrics) {
        skipped.push(`${alert._id}: no collected data for ${alert.route} (${alert.platform})`);
        continue;
      }

      const baseline = await LighthouseReport.findOne({
        route: alert.route,
        platform: alert.platform,
      })
        .sort({ createdAt: 1 })
        .lean();

      if (!baseline) {
        skipped.push(`${alert._id}: no baseline in database yet`);
        continue;
      }

      const metric = alert.metric as AlertMetricKey;
      if (!isAlertMetric(metric)) continue;

      const baselineValue = baseline[metric] ?? 0;
      const latestValue = getMetricValue(platformMetrics, metric);
      const regression = metricRegression(metric, baselineValue, latestValue);

      if (regression <= alert.threshold) {
        skipped.push(`${alert._id}: regression ${regression} within threshold ${alert.threshold}`);
        continue;
      }

      await sendAlertEmail({
        to: alert.email,
        route: alert.route,
        platform: alert.platform,
        metric,
        threshold: alert.threshold,
        baseline: baselineValue,
        latest: latestValue,
        regression,
        baselineDate: new Date(baseline.createdAt).toLocaleDateString(),
        latestDate: new Date().toLocaleDateString(),
      });

      triggered.push(`${alert.email}: ${alert.route} ${alert.platform} ${metric}`);
    }

    return NextResponse.json({
      checked: alerts.length,
      triggered: triggered.length,
      triggeredAlerts: triggered,
      skipped,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Alert check failed";
    console.error("POST /api/alerts/run-check error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
