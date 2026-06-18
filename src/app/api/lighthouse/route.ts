import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
  LighthouseReport,
  toReportResponse,
} from "@/models/LighthouseReport";

export const runtime = "nodejs";

const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024; // 4 MB

function parseNumber(value: FormDataEntryValue | null, field: string): number {
  const num = Number(value);
  if (value === null || value === "" || Number.isNaN(num)) {
    throw new Error(`${field} must be a valid number`);
  }
  return num;
}

function parseScore(value: FormDataEntryValue | null, field: string): number {
  const num = parseNumber(value, field);
  if (num < 0 || num > 100) {
    throw new Error(`${field} must be between 0 and 100`);
  }
  return num;
}

function parseReasons(value: FormDataEntryValue | null): string[] {
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

    const filter: Record<string, string> = {};
    if (team) filter.team = team;
    if (route) filter.route = route;

    const reports = await LighthouseReport.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const data = reports.map((doc) => toReportResponse(doc));

    const teams = await LighthouseReport.distinct("team");
    const routes = await LighthouseReport.distinct("route");

    return NextResponse.json({ data, teams, routes });
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

    const formData = await request.formData();

    const route = formData.get("route");
    const team = formData.get("team");

    if (!route || typeof route !== "string" || !route.trim()) {
      return NextResponse.json({ error: "Route is required" }, { status: 400 });
    }
    if (!team || typeof team !== "string" || !team.trim()) {
      return NextResponse.json({ error: "Team is required" }, { status: 400 });
    }

    const performance = parseScore(formData.get("performance"), "Performance");
    const lcp = parseNumber(formData.get("lcp"), "Largest Contentful Paint");
    const inp = parseNumber(formData.get("inp"), "Interaction to Next Paint");
    const cls = parseNumber(formData.get("cls"), "Cumulative Layout Shift");
    const accessibility = parseScore(formData.get("accessibility"), "Accessibility");
    const bestPractices = parseScore(formData.get("bestPractices"), "Best Practices");
    const seo = parseScore(formData.get("seo"), "SEO");
    const lowScoreReasons = parseReasons(formData.get("lowScoreReasons"));

    let screenshot: string | undefined;
    let screenshotMimeType: string | undefined;

    const screenshotFile = formData.get("screenshot");
    if (screenshotFile instanceof File && screenshotFile.size > 0) {
      if (!screenshotFile.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Screenshot must be an image file" },
          { status: 400 }
        );
      }
      if (screenshotFile.size > MAX_SCREENSHOT_BYTES) {
        return NextResponse.json(
          { error: "Screenshot must be smaller than 4 MB" },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await screenshotFile.arrayBuffer());
      screenshot = buffer.toString("base64");
      screenshotMimeType = screenshotFile.type;
    }

    const report = await LighthouseReport.create({
      route: route.trim(),
      team: team.trim(),
      performance,
      lcp,
      inp,
      cls,
      accessibility,
      bestPractices,
      seo,
      screenshot,
      screenshotMimeType,
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
