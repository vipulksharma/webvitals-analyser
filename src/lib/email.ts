import nodemailer from "nodemailer";
import {
  formatMetricValue,
  getAlertMetric,
  type AlertMetricKey,
} from "@/lib/alert-metrics";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;

  if (!host || !user || !pass || !from) {
    throw new Error(
      "SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM must be set to send alert emails"
    );
  }

  return { host, port, user, pass, from };
}

export async function sendAlertEmail({
  to,
  route,
  platform,
  metric,
  threshold,
  baseline,
  latest,
  regression,
  baselineDate,
  latestDate,
}: {
  to: string;
  route: string;
  platform: string;
  metric: AlertMetricKey;
  threshold: number;
  baseline: number;
  latest: number;
  regression: number;
  baselineDate: string;
  latestDate: string;
}) {
  const { host, port, user, pass, from } = getSmtpConfig();
  const metricConfig = getAlertMetric(metric);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const subject = `[EagleEye] ${metricConfig.label} regression on ${route} (${platform})`;

  const text = [
    `Web Vitals alert triggered for ${route} (${platform})`,
    "",
    `Metric: ${metricConfig.label}`,
    `Baseline (${baselineDate}): ${formatMetricValue(metric, baseline)}`,
    `Latest (${latestDate}): ${formatMetricValue(metric, latest)}`,
    `Regression: ${formatMetricValue(metric, regression)}`,
    `Threshold: ${formatMetricValue(metric, threshold)}`,
    "",
    "Review the dashboard for full details.",
  ].join("\n");

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html: `
      <div style="font-family:sans-serif;max-width:560px;color:#F0F4FA;background:#1A2332;padding:24px;border-radius:12px;">
        <h2 style="color:#FF6819;margin:0 0 16px;">EagleEye Alert</h2>
        <p style="color:#8B95AD;margin:0 0 8px;">Route: <strong style="color:#F0F4FA;">${route}</strong> · ${platform}</p>
        <p style="color:#8B95AD;margin:0 0 16px;">Metric: <strong style="color:#007BFF;">${metricConfig.label}</strong></p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#8B95AD;">Baseline (${baselineDate})</td><td style="text-align:right;">${formatMetricValue(metric, baseline)}</td></tr>
          <tr><td style="padding:8px 0;color:#8B95AD;">Latest (${latestDate})</td><td style="text-align:right;">${formatMetricValue(metric, latest)}</td></tr>
          <tr><td style="padding:8px 0;color:#8B95AD;">Regression</td><td style="text-align:right;color:#FF5252;">${formatMetricValue(metric, regression)}</td></tr>
          <tr><td style="padding:8px 0;color:#8B95AD;">Threshold</td><td style="text-align:right;">${formatMetricValue(metric, threshold)}</td></tr>
        </table>
      </div>
    `,
  });
}
