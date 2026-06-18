import { DashboardCharts } from "@/components/DashboardCharts";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Lighthouse Dashboard
        </h1>
        <p className="mt-2 text-slate-600">
          Visualize performance trends, Core Web Vitals, and team averages from stored reports.
        </p>
      </div>
      <DashboardCharts />
    </div>
  );
}
