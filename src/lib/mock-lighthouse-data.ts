import type { LighthouseReportResponse } from "@/models/LighthouseReport";
import type { ReportPlatform } from "@/lib/platforms";
import raw from "./mock-lighthouse-response.json";

export type LighthouseApiResponse = {
  data: LighthouseReportResponse[];
  teams: string[];
  routes: string[];
  platforms: string[];
};

type RawReport = Omit<LighthouseReportResponse, "fcp" | "platform"> & {
  fcp?: number;
  platform: string;
};

function normalizeReport(report: RawReport): LighthouseReportResponse {
  return {
    ...report,
    fcp: report.fcp ?? 0,
    platform: report.platform as ReportPlatform,
  };
}

export const MOCK_LIGHTHOUSE_RESPONSE: LighthouseApiResponse = {
  teams: raw.teams,
  routes: raw.routes,
  platforms: raw.platforms,
  data: (raw.data as RawReport[]).map(normalizeReport),
};

export function filterLighthouseReports(
  reports: LighthouseReportResponse[],
  filters: { team?: string; route?: string; platform?: string }
): LighthouseReportResponse[] {
  return reports.filter((report) => {
    if (filters.team && report.team !== filters.team) return false;
    if (filters.route && report.route !== filters.route) return false;
    if (filters.platform && report.platform !== filters.platform) return false;
    return true;
  });
}

export function useMockDashboardData(): boolean {
  return process.env.NODE_ENV === "development";
}
