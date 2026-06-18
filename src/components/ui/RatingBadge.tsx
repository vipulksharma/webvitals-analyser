import type { CwvRating } from "@/lib/cwv-thresholds";
import { RATING_LABELS, RATING_STYLES } from "@/lib/cwv-thresholds";

export function RatingBadge({
  rating,
  label,
}: {
  rating: CwvRating;
  label?: string;
}) {
  const styles = RATING_STYLES[rating];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles.bg} ${styles.border} ${styles.text}`}
    >
      {label ?? RATING_LABELS[rating]}
    </span>
  );
}

export function TrendIndicator({
  direction,
  delta,
  unit = "",
  invert = false,
}: {
  direction: "up" | "down" | "flat";
  delta: number;
  unit?: string;
  invert?: boolean;
}) {
  if (direction === "flat") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-tiket-muted">
        <span aria-hidden="true">→</span>
        <span>No change</span>
      </span>
    );
  }

  const isPositive = direction === "up";
  const isGood = invert ? !isPositive : isPositive;
  const color = isGood ? "text-tiket-green" : "text-tiket-red";
  const arrow = isPositive ? "↑" : "↓";

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <span aria-hidden="true">{arrow}</span>
      <span>
        {delta}
        {unit}
      </span>
    </span>
  );
}
