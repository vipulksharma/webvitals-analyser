export function Sparkline({
  values,
  width = 80,
  height = 24,
  ariaLabel,
}: {
  values: number[];
  width?: number;
  height?: number;
  ariaLabel: string;
}) {
  if (values.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        className="text-tiket-border"
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const latest = values[values.length - 1];
  const color =
    latest >= 90 ? "#00C48C" : latest >= 50 ? "#FFB020" : "#FF5252";

  return (
    <svg width={width} height={height} role="img" aria-label={ariaLabel}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

export function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading performance reports</span>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel p-6">
            <div className="skeleton mx-auto h-28 w-28 rounded-full" />
            <div className="skeleton mx-auto mt-4 h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="panel p-6">
        <div className="skeleton mb-4 h-6 w-48" />
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
      <div className="panel p-6">
        <div className="skeleton mb-4 h-6 w-56" />
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function DashboardEmpty({ usingSample }: { usingSample?: boolean }) {
  return (
    <div
      className="panel flex flex-col items-center px-6 py-16 text-center"
      role="status"
    >
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-tiket-blue/25 to-tiket-orange/15 ring-1 ring-tiket-blue/30"
        aria-hidden="true"
      >
        <svg
          className="h-10 w-10 text-tiket-blue"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-tiket-text">
        {usingSample ? "Previewing sample data" : "No reports yet"}
      </h2>
      <p className="mt-2 max-w-md text-sm text-tiket-muted">
        {usingSample
          ? "Sample Lighthouse data is loaded in development. Run collect-webvitals to gather real metrics."
          : "Run the Lighthouse collection script to populate Core Web Vitals and performance scores."}
      </p>
    </div>
  );
}

export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-tiket-border py-16">
      <p className="text-sm text-tiket-muted">{message}</p>
    </div>
  );
}
