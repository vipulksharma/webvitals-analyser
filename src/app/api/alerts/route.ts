import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { isReportPlatform } from "@/lib/platforms";
import { isAlertMetric } from "@/lib/alert-metrics";
import {
  WebVitalsAlert,
  toAlertResponse,
} from "@/models/WebVitalsAlert";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const enabledOnly = request.nextUrl.searchParams.get("enabled") === "true";
    const filter = enabledOnly ? { enabled: true } : {};
    const alerts = await WebVitalsAlert.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ data: alerts.map((doc) => toAlertResponse(doc)) });
  } catch (error) {
    console.error("GET /api/alerts error:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const email = body.email?.trim()?.toLowerCase();
    const route = body.route?.trim();
    const platform = body.platform;
    const metric = body.metric;
    const threshold = Number(body.threshold);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!route) {
      return NextResponse.json({ error: "Route is required" }, { status: 400 });
    }
    if (!platform || !isReportPlatform(platform)) {
      return NextResponse.json({ error: "Valid platform is required" }, { status: 400 });
    }
    if (!metric || !isAlertMetric(metric)) {
      return NextResponse.json({ error: "Valid metric is required" }, { status: 400 });
    }
    if (Number.isNaN(threshold) || threshold < 0) {
      return NextResponse.json({ error: "Threshold must be a non-negative number" }, { status: 400 });
    }

    const alert = await WebVitalsAlert.create({
      email,
      route,
      platform,
      metric,
      threshold,
      enabled: body.enabled !== false,
    });

    return NextResponse.json({ data: toAlertResponse(alert) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create alert";
    console.error("POST /api/alerts error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Alert id is required" }, { status: 400 });
    }

    const deleted = await WebVitalsAlert.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/alerts error:", error);
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}
