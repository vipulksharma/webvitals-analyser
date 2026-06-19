import { NextRequest, NextResponse } from "next/server";
import { loadRoutesConfig } from "@/lib/routes-config";

export const runtime = "nodejs";

export async function GET() {
  try {
    const config = loadRoutesConfig();
    return NextResponse.json({
      baseUrl: config.baseUrl,
      routes: config.routes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load routes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
