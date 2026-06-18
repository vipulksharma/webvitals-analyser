#!/usr/bin/env node
/**
 * Run Lighthouse for each route (mobile + desktop) and write reports.json
 * in the same format as scripts/reports.example.json.
 *
 * Usage:
 *   node scripts/collect-webvitals.mjs [routes-file]
 *   npm run collect-webvitals
 *
 * Requires: Google Chrome/Chromium installed locally.
 *
 * Runs each audit 3 times and keeps the best values (max scores, min vitals).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import lighthouse, { desktopConfig } from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLATFORMS = ["mobile", "desktop"];
const RUN_COUNT = 3;

function usage() {
  console.log(`Usage: node scripts/collect-webvitals.mjs [routes-file]

Environment:
  BASE_URL   Override baseUrl from the routes file

Example:
  cp scripts/routes.example.json scripts/routes.json
  npm run collect-webvitals
`);
}

function roundScore(score) {
  if (score == null || Number.isNaN(score)) return 0;
  return Math.round(score * 100);
}

function roundMetric(value, decimals) {
  if (value == null || Number.isNaN(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function getAuditNumeric(lhr, ids) {
  for (const id of ids) {
    const audit = lhr.audits[id];
    if (audit?.numericValue != null) return audit.numericValue;
  }
  return null;
}

function extractPlatformMetrics(lhr) {
  const performance = roundScore(lhr.categories.performance?.score);
  const accessibility = roundScore(lhr.categories.accessibility?.score);
  const bestPractices = roundScore(lhr.categories["best-practices"]?.score);
  const seo = roundScore(lhr.categories.seo?.score);

  const fcpMs = getAuditNumeric(lhr, ["first-contentful-paint"]);
  const lcpMs = getAuditNumeric(lhr, ["largest-contentful-paint"]);
  const inpMs = getAuditNumeric(lhr, [
    "interaction-to-next-paint",
    "experimental-interaction-to-next-paint",
    "max-potential-fid",
  ]);
  const cls = getAuditNumeric(lhr, ["cumulative-layout-shift"]);

  return {
    performance,
    fcp: roundMetric(fcpMs != null ? fcpMs / 1000 : 0, 2),
    lcp: roundMetric(lcpMs != null ? lcpMs / 1000 : 0, 2),
    inp: roundMetric(inpMs ?? 0, 0),
    cls: roundMetric(cls ?? 0, 3),
    accessibility,
    bestPractices,
    seo,
    lowScoreReasons: getLowScoreReasons(lhr),
  };
}

function getLowScoreReasons(lhr) {
  const categoryIds = ["performance", "accessibility", "best-practices", "seo"];
  const reasons = new Set();

  for (const categoryId of categoryIds) {
    const category = lhr.categories[categoryId];
    if (!category || category.score == null || category.score >= 0.9) continue;

    for (const ref of category.auditRefs) {
      if (ref.weight <= 0) continue;
      const audit = lhr.audits[ref.id];
      if (!audit || audit.score == null || audit.score >= 0.9) continue;
      if (audit.scoreDisplayMode === "informative") continue;
      reasons.add(audit.title);
    }
  }

  return [...reasons].join("\n");
}

function minAcross(runs, key) {
  return Math.min(...runs.map((run) => run[key]));
}

function maxAcross(runs, key) {
  return Math.max(...runs.map((run) => run[key]));
}

/** Best-case across multiple runs: highest scores, lowest vitals. */
function aggregateBestMetrics(runs) {
  const bestRun = runs.reduce((best, run) =>
    run.performance > best.performance ? run : best
  );

  return {
    performance: maxAcross(runs, "performance"),
    accessibility: maxAcross(runs, "accessibility"),
    bestPractices: maxAcross(runs, "bestPractices"),
    seo: maxAcross(runs, "seo"),
    fcp: roundMetric(minAcross(runs, "fcp"), 2),
    lcp: roundMetric(minAcross(runs, "lcp"), 2),
    inp: minAcross(runs, "inp"),
    cls: roundMetric(minAcross(runs, "cls"), 3),
    lowScoreReasons: bestRun.lowScoreReasons,
  };
}

async function collectPlatformMetrics(chrome, url, platform) {
  const runs = [];

  for (let attempt = 1; attempt <= RUN_COUNT; attempt += 1) {
    process.stdout.write(`run ${attempt}/${RUN_COUNT}... `);
    const lhr = await runAudit(chrome, url, platform);
    const metrics = extractPlatformMetrics(lhr);
    runs.push(metrics);
    console.log(
      `perf ${metrics.performance}, FCP ${metrics.fcp}s, LCP ${metrics.lcp}s, INP ${metrics.inp}ms, CLS ${metrics.cls}`
    );
  }

  return aggregateBestMetrics(runs);
}

function resolveUrl(baseUrl, route) {
  const base = baseUrl.replace(/\/$/, "");
  const pathPart = route.startsWith("/") ? route : `/${route}`;
  return `${base}${pathPart}`;
}

function loadRoutesConfig(configPath) {
  const raw = fs.readFileSync(configPath, "utf8");
  const config = JSON.parse(raw);

  if (!config.baseUrl && !process.env.BASE_URL) {
    throw new Error("routes file must include baseUrl (or set BASE_URL)");
  }
  if (!Array.isArray(config.routes) || config.routes.length === 0) {
    throw new Error("routes file must include a non-empty routes array");
  }

  for (const entry of config.routes) {
    if (!entry.route || !entry.team) {
      throw new Error("each route entry must include route and team");
    }
  }

  return {
    baseUrl: process.env.BASE_URL ?? config.baseUrl,
    output: config.output ?? "scripts/reports.json",
    routes: config.routes,
  };
}

async function runAudit(chrome, url, platform) {
  const config = platform === "desktop" ? desktopConfig : undefined;
  const result = await lighthouse(
    url,
    {
      logLevel: "error",
      port: chrome.port,
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    },
    config
  );

  if (!result?.lhr) {
    throw new Error(`Lighthouse returned no report for ${url} (${platform})`);
  }

  if (result.lhr.runtimeError) {
    throw new Error(
      `${url} (${platform}): ${result.lhr.runtimeError.message ?? "Lighthouse runtime error"}`
    );
  }

  return result.lhr;
}

async function main() {
  const configPath = process.argv[2] ?? path.join(__dirname, "routes.json");

  if (process.argv.includes("-h") || process.argv.includes("--help")) {
    usage();
    return;
  }

  if (!fs.existsSync(configPath)) {
    console.error(`error: routes file not found: ${configPath}`);
    console.error("Copy scripts/routes.example.json to scripts/routes.json and edit it.");
    usage();
    process.exit(1);
  }

  const { baseUrl, output, routes } = loadRoutesConfig(configPath);
  const outputPath = path.isAbsolute(output) ? output : path.join(process.cwd(), output);

  console.log(`Base URL: ${baseUrl}`);
  console.log(`Routes:   ${routes.length}`);
  console.log(`Output:   ${outputPath}`);
  console.log();

  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
  });

  const reports = [];

  try {
    for (const entry of routes) {
      const url = resolveUrl(baseUrl, entry.route);
      const report = {
        route: entry.route,
        team: entry.team,
      };

      console.log(`Auditing ${entry.route} (${entry.team})`);
      console.log(`  URL: ${url}`);

      for (const platform of PLATFORMS) {
        console.log(`  ${platform}:`);
        try {
          report[platform] = await collectPlatformMetrics(chrome, url, platform);
          console.log(
            `  ${platform} best-case → perf ${report[platform].performance}, FCP ${report[platform].fcp}s, LCP ${report[platform].lcp}s, INP ${report[platform].inp}ms, CLS ${report[platform].cls}`
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.log(`  ${platform} failed (${message})`);
          report[platform] = null;
        }
      }

      reports.push(report);
      const succeeded = PLATFORMS.filter((platform) => report[platform] != null);
      if (succeeded.length === 0) {
        console.warn(`  warning: no successful audits for ${entry.route}, skipping`);
        reports.pop();
      } else {
        for (const platform of PLATFORMS) {
          if (report[platform] == null) delete report[platform];
        }
      }
      console.log();
    }
  } finally {
    await chrome.kill();
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(reports, null, 2)}\n`, "utf8");

  console.log(`Saved ${reports.length} route(s) to ${outputPath}`);
  console.log("Submit with: npm run submit-reports");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
