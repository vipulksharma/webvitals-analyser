export type CwvRating = "good" | "needs-improvement" | "poor";

export function scoreRating(score: number): CwvRating {
  if (score >= 90) return "good";
  if (score >= 50) return "needs-improvement";
  return "poor";
}

export function lcpRating(seconds: number): CwvRating {
  if (seconds <= 2.5) return "good";
  if (seconds <= 4) return "needs-improvement";
  return "poor";
}

export function fcpRating(seconds: number): CwvRating {
  if (seconds <= 1.8) return "good";
  if (seconds <= 3) return "needs-improvement";
  return "poor";
}

export function inpRating(ms: number): CwvRating {
  if (ms <= 200) return "good";
  if (ms <= 500) return "needs-improvement";
  return "poor";
}

export function clsRating(value: number): CwvRating {
  if (value <= 0.1) return "good";
  if (value <= 0.25) return "needs-improvement";
  return "poor";
}

export const RATING_LABELS: Record<CwvRating, string> = {
  good: "Good",
  "needs-improvement": "Needs improvement",
  poor: "Poor",
};

export const RATING_STYLES: Record<
  CwvRating,
  { text: string; bg: string; border: string; ring: string; chart: string }
> = {
  good: {
    text: "text-tiket-green",
    bg: "bg-tiket-green/10",
    border: "border-tiket-green/35",
    ring: "ring-tiket-green/20",
    chart: "#00C48C",
  },
  "needs-improvement": {
    text: "text-tiket-yellow",
    bg: "bg-tiket-yellow/10",
    border: "border-tiket-yellow/35",
    ring: "ring-tiket-yellow/20",
    chart: "#FFB020",
  },
  poor: {
    text: "text-tiket-red",
    bg: "bg-tiket-red/10",
    border: "border-tiket-red/35",
    ring: "ring-tiket-red/20",
    chart: "#FF5252",
  },
};

export function ratingClass(rating: CwvRating) {
  return RATING_STYLES[rating];
}
