"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import {
  REPORT_PLATFORMS,
  REPORT_PLATFORM_LABELS,
  type ReportPlatform,
} from "@/lib/platforms";

const initialForm = {
  route: "",
  team: "",
  platform: "desktop" as ReportPlatform,
  performance: "",
  fcp: "",
  lcp: "",
  inp: "",
  cls: "",
  accessibility: "",
  bestPractices: "",
  seo: "",
  lowScoreReasons: "",
};

export function LighthouseForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/lighthouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to save report");
      }

      setStatus("success");
      setMessage("Report saved successfully.");
      setForm(initialForm);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="panel p-6">
        <h2 className="mb-4 text-lg font-semibold text-tiket-text">
          Route & Team
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Route" name="route" value={form.route} onChange={handleChange} placeholder="/home" required />
          <Field label="Team" name="team" value={form.team} onChange={handleChange} placeholder="Platform" required />
          <div>
            <label htmlFor="platform" className="mb-1 block text-sm font-medium text-tiket-text">
              Report For
            </label>
            <select
              id="platform"
              name="platform"
              value={form.platform}
              onChange={handleChange}
              required
              className="input-field"
            >
              {REPORT_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {REPORT_PLATFORM_LABELS[platform]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="panel p-6">
        <h2 className="mb-4 text-lg font-semibold text-tiket-text">
          Lighthouse Scores
        </h2>
        <p className="mb-4 text-sm text-tiket-muted">
          Score fields accept 0–100. Vitals use raw units (FCP/LCP in seconds, INP in ms, CLS as decimal).
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Performance" name="performance" type="number" min={0} max={100} value={form.performance} onChange={handleChange} required />
          <Field label="Accessibility" name="accessibility" type="number" min={0} max={100} value={form.accessibility} onChange={handleChange} required />
          <Field label="Best Practices" name="bestPractices" type="number" min={0} max={100} value={form.bestPractices} onChange={handleChange} required />
          <Field label="SEO" name="seo" type="number" min={0} max={100} value={form.seo} onChange={handleChange} required />
        </div>
      </section>

      <section className="panel p-6">
        <h2 className="mb-4 text-lg font-semibold text-tiket-text">
          Core Web Vitals
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="First Contentful Paint (s)" name="fcp" type="number" step="0.01" min={0} value={form.fcp} onChange={handleChange} required />
          <Field label="Largest Contentful Paint (s)" name="lcp" type="number" step="0.01" min={0} value={form.lcp} onChange={handleChange} required />
          <Field label="Interaction to Next Paint (ms)" name="inp" type="number" step="1" min={0} value={form.inp} onChange={handleChange} required />
          <Field label="Cumulative Layout Shift" name="cls" type="number" step="0.001" min={0} value={form.cls} onChange={handleChange} required />
        </div>
      </section>

      <section className="panel p-6">
        <h2 className="mb-4 text-lg font-semibold text-tiket-text">
          Notes
        </h2>
        <div>
          <label htmlFor="lowScoreReasons" className="mb-1 block text-sm font-medium text-tiket-text">
            Reason for Low Score (one point per line)
          </label>
          <textarea
            id="lowScoreReasons"
            name="lowScoreReasons"
            rows={4}
            value={form.lowScoreReasons}
            onChange={handleChange}
            placeholder={"Large images not optimized\nRender-blocking scripts\nMissing alt text on images"}
            className="input-field"
          />
        </div>
      </section>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            status === "success"
              ? "bg-tiket-green/10 text-tiket-green"
              : "bg-tiket-red/10 text-tiket-red"
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-tiket w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Saving…" : "Save Report"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  min,
  max,
  step,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number | string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-tiket-text">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        className="input-field"
      />
    </div>
  );
}
