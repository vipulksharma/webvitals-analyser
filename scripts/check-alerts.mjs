#!/usr/bin/env node
/**
 * Collect fresh web vitals for alert routes, submit to API, and evaluate alerts.
 *
 * Usage:
 *   npm run check-alerts
 *   BASE_URL=http://localhost:3000 npm run check-alerts
 *
 * Requires: Chrome, MONGODB_URI on server, SMTP_* env vars for email.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ROUTES_SOURCE = path.join(ROOT, "scripts/routes.example.json");
const ALERT_ROUTES_FILE = path.join(ROOT, "scripts/alert-routes.tmp.json");
const REPORTS_FILE = path.join(ROOT, "scripts/reports.json");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? `Request failed: ${url}`);
  }
  return json;
}

async function main() {
  loadEnvFile(path.join(ROOT, ".env.local"));
  loadEnvFile(path.join(ROOT, ".env"));

  const baseUrl = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  console.log("Fetching enabled alerts…");
  const { data: alerts } = await fetchJson(`${baseUrl}/api/alerts?enabled=true`);

  if (!alerts.length) {
    console.log("No enabled alerts. Create alerts at /alert first.");
    return;
  }

  const alertRoutes = [...new Set(alerts.map((alert) => alert.route))];
  console.log(`Found ${alerts.length} alert(s) across ${alertRoutes.length} route(s)`);

  const routesConfig = JSON.parse(fs.readFileSync(ROUTES_SOURCE, "utf8"));
  const filteredRoutes = routesConfig.routes.filter((entry) =>
    alertRoutes.includes(entry.route)
  );

  if (filteredRoutes.length === 0) {
    throw new Error("No matching routes found in scripts/routes.example.json for configured alerts");
  }

  const alertRoutesConfig = {
    baseUrl: process.env.BASE_URL_OVERRIDE ?? routesConfig.baseUrl,
    output: "scripts/reports.json",
    routes: filteredRoutes,
  };

  fs.writeFileSync(ALERT_ROUTES_FILE, `${JSON.stringify(alertRoutesConfig, null, 2)}\n`);
  console.log(`Wrote ${filteredRoutes.length} route(s) to ${ALERT_ROUTES_FILE}`);

  console.log("\nCollecting web vitals…");
  execSync(`node scripts/collect-webvitals.mjs "${ALERT_ROUTES_FILE}"`, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });

  console.log("\nSubmitting reports…");
  execSync(`bash scripts/submit-reports.sh "${REPORTS_FILE}"`, {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, BASE_URL: baseUrl },
  });

  const reports = JSON.parse(fs.readFileSync(REPORTS_FILE, "utf8"));
  console.log("\nEvaluating alerts…");

  const headers = { "Content-Type": "application/json" };
  if (process.env.ALERT_CRON_SECRET) {
    headers["x-alert-secret"] = process.env.ALERT_CRON_SECRET;
  }

  const result = await fetchJson(`${baseUrl}/api/alerts/run-check`, {
    method: "POST",
    headers,
    body: JSON.stringify({ reports }),
  });

  console.log(`\nChecked ${result.checked} alert(s)`);
  console.log(`Triggered ${result.triggered} email(s)`);
  if (result.triggeredAlerts?.length) {
    for (const item of result.triggeredAlerts) {
      console.log(`  ✉ ${item}`);
    }
  }
  if (result.skipped?.length) {
    console.log("\nSkipped:");
    for (const item of result.skipped) {
      console.log(`  - ${item}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
