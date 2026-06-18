"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = {
  grid: "rgba(42, 53, 72, 0.6)",
  axis: "#8B95AD",
  performance: "#007BFF",
  accessibility: "#00C48C",
  bestPractices: "#7C6CF0",
  seo: "#FF6819",
  fcp: "#00B8D9",
  lcp: "#007BFF",
  inp: "#00C48C",
  cls: "#FF6819",
};

const TOOLTIP_STYLE = {
  backgroundColor: "#1A2332",
  border: "1px solid #2A3548",
  borderRadius: "12px",
  fontSize: "12px",
  color: "#F0F4FA",
};

export function ChartPanel({
  title,
  description,
  children,
  controls,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  controls?: React.ReactNode;
}) {
  return (
    <section className="panel p-6" aria-label={title}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-tiket-text">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-tiket-muted">
              {description}
            </p>
          )}
        </div>
      </div>
      {controls}
      {children}
    </section>
  );
}

export function ScoresLineChart({
  data,
  showPercentiles = false,
}: {
  data: Record<string, unknown>[];
  showPercentiles?: boolean;
}) {
  return (
    <div
      className="h-[320px] w-full touch-pan-x"
      role="img"
      aria-label="Lighthouse scores over time line chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: "#F0F4FA" }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#8B95AD" }} />
          <Line
            type="monotone"
            dataKey="Performance"
            stroke={CHART_COLORS.performance}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="Accessibility"
            stroke={CHART_COLORS.accessibility}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="Best Practices"
            stroke={CHART_COLORS.bestPractices}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="SEO"
            stroke={CHART_COLORS.seo}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          {showPercentiles && (
            <>
              <Line
                type="monotone"
                dataKey="Performance P75"
                stroke={CHART_COLORS.performance}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Performance P90"
                stroke={CHART_COLORS.performance}
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VitalsLineChart({
  data,
}: {
  data: Record<string, unknown>[];
}) {
  return (
    <div
      className="h-[320px] w-full touch-pan-x"
      role="img"
      aria-label="Core Web Vitals over time line chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === "CLS") return [value, name];
              return [`${value}ms`, name];
            }}
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#8B95AD" }} />
          <Line type="monotone" dataKey="FCP" stroke={CHART_COLORS.fcp} strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="LCP" stroke={CHART_COLORS.lcp} strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="INP" stroke={CHART_COLORS.inp} strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="CLS" stroke={CHART_COLORS.cls} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TeamBarChart({
  data,
}: {
  data: { team: string; Performance: number; Accessibility: number; SEO: number }[];
}) {
  return (
    <div className="h-[300px] w-full" role="img" aria-label="Average scores by team">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="team" tick={{ fontSize: 11, fill: CHART_COLORS.axis }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: CHART_COLORS.axis }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#8B95AD" }} />
          <Bar dataKey="Performance" fill={CHART_COLORS.performance} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Accessibility" fill={CHART_COLORS.accessibility} radius={[4, 4, 0, 0]} />
          <Bar dataKey="SEO" fill={CHART_COLORS.seo} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FilterSelect({
  label,
  id,
  value,
  options,
  onChange,
  includeAll = true,
}: {
  label: string;
  id?: string;
  value: string;
  options: string[] | { value: string; label: string }[];
  onChange: (v: string) => void;
  includeAll?: boolean;
}) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const normalized = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  return (
    <div className="min-w-[160px] flex-1">
      <label
        htmlFor={selectId}
        className="mb-1 block text-xs font-bold uppercase tracking-wide text-tiket-orange"
      >
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      >
        {includeAll && <option value="">All</option>}
        {normalized.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
