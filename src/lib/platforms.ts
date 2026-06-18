export const REPORT_PLATFORMS = [
  "mobile",
  "desktop",
  "webview-android",
  "webview-ios",
] as const;

export type ReportPlatform = (typeof REPORT_PLATFORMS)[number];

export const REPORT_PLATFORM_LABELS: Record<ReportPlatform, string> = {
  mobile: "Mobile",
  desktop: "Desktop",
  "webview-android": "WebView Android",
  "webview-ios": "WebView iOS",
};

export function isReportPlatform(value: string): value is ReportPlatform {
  return (REPORT_PLATFORMS as readonly string[]).includes(value);
}

export function formatPlatform(platform: ReportPlatform | string): string {
  if (isReportPlatform(platform)) {
    return REPORT_PLATFORM_LABELS[platform];
  }
  return platform;
}
