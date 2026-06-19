export const ALERT_METRICS = [
  { key: "fcp", label: "FCP", unit: "s", lowerIsBetter: true },
  { key: "lcp", label: "LCP", unit: "s", lowerIsBetter: true },
  { key: "inp", label: "INP", unit: "ms", lowerIsBetter: true },
  { key: "cls", label: "CLS", unit: "", lowerIsBetter: true },
  { key: "bestPractices", label: "Best Practices", unit: "pts", lowerIsBetter: false },
  { key: "accessibility", label: "Accessibility", unit: "pts", lowerIsBetter: false },
] as const;

export type AlertMetricKey = (typeof ALERT_METRICS)[number]["key"];

export function isAlertMetric(value: string): value is AlertMetricKey {
  return ALERT_METRICS.some((metric) => metric.key === value);
}

export function getAlertMetric(key: AlertMetricKey) {
  return ALERT_METRICS.find((metric) => metric.key === key)!;
}

/** Positive value means the metric got worse since baseline. */
export function metricRegression(
  metric: AlertMetricKey,
  baseline: number,
  latest: number
): number {
  const config = getAlertMetric(metric);
  if (config.lowerIsBetter) {
    return latest - baseline;
  }
  return baseline - latest;
}

export function formatMetricValue(metric: AlertMetricKey, value: number): string {
  const config = getAlertMetric(metric);
  if (config.unit === "s") return `${value}s`;
  if (config.unit === "ms") return `${value}ms`;
  if (config.unit === "pts") return `${value}`;
  return `${value}`;
}
