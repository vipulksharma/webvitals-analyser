"use client";

import { useState, FormEvent, ChangeEvent } from "react";

const initialForm = {
  route: "",
  team: "",
  performance: "",
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
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setScreenshot(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    if (screenshot) body.append("screenshot", screenshot);

    try {
      const res = await fetch("/api/lighthouse", {
        method: "POST",
        body,
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to save report");
      }

      setStatus("success");
      setMessage("Report saved successfully.");
      setForm(initialForm);
      setScreenshot(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Route & Team
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Route" name="route" value={form.route} onChange={handleChange} placeholder="/home" required />
          <Field label="Team" name="team" value={form.team} onChange={handleChange} placeholder="Platform" required />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Lighthouse Scores
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Score fields accept 0–100. Core Web Vitals use their raw units (LCP in seconds, INP in ms, CLS as decimal).
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Performance" name="performance" type="number" min={0} max={100} value={form.performance} onChange={handleChange} required />
          <Field label="Accessibility" name="accessibility" type="number" min={0} max={100} value={form.accessibility} onChange={handleChange} required />
          <Field label="Best Practices" name="bestPractices" type="number" min={0} max={100} value={form.bestPractices} onChange={handleChange} required />
          <Field label="SEO" name="seo" type="number" min={0} max={100} value={form.seo} onChange={handleChange} required />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Core Web Vitals
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Largest Contentful Paint (s)" name="lcp" type="number" step="0.01" min={0} value={form.lcp} onChange={handleChange} required />
          <Field label="Interaction to Next Paint (ms)" name="inp" type="number" step="1" min={0} value={form.inp} onChange={handleChange} required />
          <Field label="Cumulative Layout Shift" name="cls" type="number" step="0.001" min={0} value={form.cls} onChange={handleChange} required />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Screenshot & Notes
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Lighthouse Screenshot
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
            />
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Screenshot preview"
                className="mt-3 max-h-48 rounded-lg border border-slate-200 object-contain"
              />
            )}
          </div>
          <div>
            <label htmlFor="lowScoreReasons" className="mb-1 block text-sm font-medium text-slate-700">
              Reason for Low Score (one point per line)
            </label>
            <textarea
              id="lowScoreReasons"
              name="lowScoreReasons"
              rows={4}
              value={form.lowScoreReasons}
              onChange={handleChange}
              placeholder={"Large images not optimized\nRender-blocking scripts\nMissing alt text on images"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
      </section>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            status === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
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
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  );
}
