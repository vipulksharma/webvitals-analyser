import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { isReportPlatform } from "@/lib/platforms";
import {
  LighthouseReport,
  toReportResponse,
} from "@/models/LighthouseReport";

export const runtime = "nodejs";

function parseNumber(value: unknown, field: string): number {
  const num = Number(value);
  if (value === null || value === undefined || value === "" || Number.isNaN(num)) {
    throw new Error(`${field} must be a valid number`);
  }
  return num;
}

function parseScore(value: unknown, field: string): number {
  const num = parseNumber(value, field);
  if (num < 0 || num > 100) {
    throw new Error(`${field} must be between 0 and 100`);
  }
  return num;
}

function parseReasons(value: unknown): string[] {
  if (!value || typeof value !== "string") return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const team = searchParams.get("team");
    const route = searchParams.get("route");
    const platform = searchParams.get("platform");

    const filter: Record<string, string> = {};
    if (team) filter.team = team;
    if (route) filter.route = route;
    if (platform) filter.platform = platform;

    const reports = await LighthouseReport.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const data = reports.map((doc) => toReportResponse(doc));

    const teams = await LighthouseReport.distinct("team");
    const routes = await LighthouseReport.distinct("route");
    const platforms = await LighthouseReport.distinct("platform");

    return NextResponse.json({ data, teams, routes, platforms });
  } catch (error) {
    console.error("GET /api/lighthouse error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lighthouse reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const route = body.route;
    const team = body.team;
    const platform = body.platform;

    if (!route || typeof route !== "string" || !route.trim()) {
      return NextResponse.json({ error: "Route is required" }, { status: 400 });
    }
    if (!team || typeof team !== "string" || !team.trim()) {
      return NextResponse.json({ error: "Team is required" }, { status: 400 });
    }
    if (!platform || typeof platform !== "string" || !isReportPlatform(platform)) {
      return NextResponse.json(
        { error: "Platform is required (mobile, desktop, webview-android, webview-ios)" },
        { status: 400 }
      );
    }

    const performance = parseScore(body.performance, "Performance");
    const lcp = parseNumber(body.lcp, "Largest Contentful Paint");
    const inp = parseNumber(body.inp, "Interaction to Next Paint");
    const cls = parseNumber(body.cls, "Cumulative Layout Shift");
    const accessibility = parseScore(body.accessibility, "Accessibility");
    const bestPractices = parseScore(body.bestPractices, "Best Practices");
    const seo = parseScore(body.seo, "SEO");
    const lowScoreReasons = parseReasons(body.lowScoreReasons);

    const report = await LighthouseReport.create({
      route: route.trim(),
      team: team.trim(),
      platform,
      performance,
      lcp,
      inp,
      cls,
      accessibility,
      bestPractices,
      seo,
      lowScoreReasons,
    });

    return NextResponse.json(
      { data: toReportResponse(report) },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save lighthouse report";
    console.error("POST /api/lighthouse error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
