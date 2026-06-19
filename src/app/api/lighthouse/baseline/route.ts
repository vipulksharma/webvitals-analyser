import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { isReportPlatform } from "@/lib/platforms";
import {
  LighthouseReport,
  toReportResponse,
} from "@/models/LighthouseReport";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const route = request.nextUrl.searchParams.get("route");
    const platform = request.nextUrl.searchParams.get("platform");

    if (!route || !platform || !isReportPlatform(platform)) {
      return NextResponse.json(
        { error: "route and platform query params are required" },
        { status: 400 }
      );
    }

    const baseline = await LighthouseReport.findOne({ route, platform })
      .sort({ createdAt: 1 })
      .lean();

    if (!baseline) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: toReportResponse(baseline) });
  } catch (error) {
    console.error("GET /api/lighthouse/baseline error:", error);
    return NextResponse.json({ error: "Failed to fetch baseline" }, { status: 500 });
  }
}
