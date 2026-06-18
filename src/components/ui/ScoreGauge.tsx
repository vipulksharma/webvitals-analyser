import { scoreRating, ratingClass } from "@/lib/cwv-thresholds";
import { TrendIndicator } from "./RatingBadge";

export function ScoreGauge({
  score,
  label,
  trend,
  size = "lg",
}: {
  score: number;
  label: string;
  trend?: { direction: "up" | "down" | "flat"; delta: number } | null;
  size?: "sm" | "lg";
}) {
  const rating = scoreRating(score);
  const styles = ratingClass(rating);
  const radius = size === "lg" ? 52 : 36;
  const stroke = size === "lg" ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const dimension = size === "lg" ? 128 : 88;

  return (
    <div
      className="flex flex-col items-center gap-2"
      role="img"
      aria-label={`${label}: ${score} out of 100`}
    >
      <div className="relative" style={{ width: dimension, height: dimension }}>
        <svg
          width={dimension}
          height={dimension}
          viewBox={`0 0 ${dimension} ${dimension}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-tiket-border"
          />
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke={styles.chart}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold tabular-nums ${size === "lg" ? "text-3xl" : "text-xl"} ${styles.text}`}>
            {score}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-tiket-text">{label}</p>
        {trend && (
          <div className="mt-1">
            <TrendIndicator {...trend} />
          </div>
        )}
      </div>
    </div>
  );
}
