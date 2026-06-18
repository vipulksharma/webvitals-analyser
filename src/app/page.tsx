import { DashboardCharts } from "@/components/DashboardCharts";

export default function HomePage() {
  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-tiket-orange">
          Performance Analytics
        </p>
        <h1 className="mt-2 bg-gradient-to-r from-tiket-text to-tiket-muted bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
          Lighthouse Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-tiket-muted">
          Monitor Core Web Vitals, track regressions over time, and compare routes against team benchmarks.
        </p>
      </header>
      <DashboardCharts />
    </div>
  );
}
