import { AlertForm } from "@/components/AlertForm";

export default function AlertPage() {
  return (
    <div>
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-tiket-orange">
          Regression Monitoring
        </p>
        <h1 className="mt-2 text-2xl font-bold text-tiket-text sm:text-3xl">
          Web Vitals Alerts
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-tiket-muted">
          Get emailed when FCP, LCP, INP, CLS, Accessibility, or Best Practices regress beyond your threshold compared to the earliest baseline report.
        </p>
      </header>
      <AlertForm />
    </div>
  );
}
