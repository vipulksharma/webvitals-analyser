import { LighthouseForm } from "@/components/LighthouseForm";

export default function FormPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Submit Lighthouse Report
        </h1>
        <p className="mt-2 text-slate-600">
          Record performance metrics and Core Web Vitals for any route.
        </p>
      </div>
      <LighthouseForm />
    </div>
  );
}
