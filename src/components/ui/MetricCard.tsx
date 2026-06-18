import type { CwvRating } from "@/lib/cwv-thresholds";
import { RATING_LABELS, RATING_STYLES } from "@/lib/cwv-thresholds";
import { TrendIndicator } from "./RatingBadge";

export function MetricCard({
  label,
  value,
  unit,
  rating,
  trend,
  invertTrend = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  rating: CwvRating;
  trend?: { direction: "up" | "down" | "flat"; delta: number } | null;
  invertTrend?: boolean;
}) {
  const styles = RATING_STYLES[rating];

  return (
    <article
      className={`panel p-4 ring-1 ring-inset ${styles.ring}`}
      aria-label={`${label}: ${value}${unit ?? ""}, ${RATING_LABELS[rating]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-tiket-muted">
          {label}
        </p>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles.bg} ${styles.border} ${styles.text}`}
        >
          {RATING_LABELS[rating]}
        </span>
      </div>
      <p className={`mt-3 text-2xl font-bold tabular-nums ${styles.text}`}>
        {value}
        {unit && (
          <span className="ml-1 text-sm font-normal text-tiket-muted">
            {unit}
          </span>
        )}
      </p>
      {trend && (
        <div className="mt-2">
          <TrendIndicator
            {...trend}
            unit={unit}
            invert={invertTrend}
          />
        </div>
      )}
    </article>
  );
}
