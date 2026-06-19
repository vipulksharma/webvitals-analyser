"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import {
  ALERT_METRICS,
  type AlertMetricKey,
} from "@/lib/alert-metrics";
import { REPORT_PLATFORMS, REPORT_PLATFORM_LABELS } from "@/lib/platforms";
import type { WebVitalsAlertResponse } from "@/models/WebVitalsAlert";

type RouteEntry = { route: string; team: string };

export function AlertForm() {
  const [routes, setRoutes] = useState<RouteEntry[]>([]);
  const [alerts, setAlerts] = useState<WebVitalsAlertResponse[]>([]);
  const [email, setEmail] = useState("");
  const [route, setRoute] = useState("");
  const [platform, setPlatform] = useState("mobile");
  const [metric, setMetric] = useState<AlertMetricKey>("lcp");
  const [threshold, setThreshold] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [routesRes, alertsRes] = await Promise.all([
        fetch("/api/alerts/routes"),
        fetch("/api/alerts"),
      ]);
      const routesJson = await routesRes.json();
      const alertsJson = await alertsRes.json();
      if (!routesRes.ok) throw new Error(routesJson.error ?? "Failed to load routes");
      if (!alertsRes.ok) throw new Error(alertsJson.error ?? "Failed to load alerts");

      setRoutes(routesJson.routes);
      setAlerts(alertsJson.data);
      if (routesJson.routes.length > 0) {
        setRoute((current) => current || routesJson.routes[0].route);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load data");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          route,
          platform,
          metric,
          threshold: Number(threshold),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create alert");

      setStatus("success");
      setMessage("Alert created successfully.");
      setThreshold("");
      await fetchData();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to delete alert");
      await fetchData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to delete alert");
      setStatus("error");
    }
  }

  const selectedMetric = ALERT_METRICS.find((m) => m.key === metric);

  if (loading) {
    return (
      <div className="panel p-8 text-center text-tiket-muted" role="status">
        Loading routes and alerts…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="panel space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold text-tiket-text">Create alert</h2>
          <p className="mt-1 text-sm text-tiket-muted">
            Triggers when the latest Lighthouse run regresses beyond your threshold compared to the earliest stored report for that route.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="alert-email" className="mb-1 block text-sm font-medium text-tiket-text">
              Email
            </label>
            <input
              id="alert-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="alert-route" className="mb-1 block text-sm font-medium text-tiket-text">
              Route
            </label>
            <select
              id="alert-route"
              required
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="input-field"
            >
              {routes.map((entry) => (
                <option key={entry.route} value={entry.route}>
                  {entry.route} ({entry.team})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="alert-platform" className="mb-1 block text-sm font-medium text-tiket-text">
              Platform
            </label>
            <select
              id="alert-platform"
              required
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="input-field"
            >
              {REPORT_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {REPORT_PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="alert-metric" className="mb-1 block text-sm font-medium text-tiket-text">
              Metric
            </label>
            <select
              id="alert-metric"
              required
              value={metric}
              onChange={(e) => setMetric(e.target.value as AlertMetricKey)}
              className="input-field"
            >
              {ALERT_METRICS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="alert-threshold" className="mb-1 block text-sm font-medium text-tiket-text">
              Threshold ({selectedMetric?.unit || "value"})
            </label>
            <input
              id="alert-threshold"
              type="number"
              required
              min={0}
              step={metric === "cls" ? "0.001" : metric === "inp" ? "1" : "0.01"}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder={
                metric === "inp" ? "50" : metric === "cls" ? "0.05" : "0.5"
              }
              className="input-field"
            />
            <p className="mt-1 text-xs text-tiket-muted">
              {selectedMetric?.lowerIsBetter
                ? "Alert when the metric increases by more than this amount vs baseline."
                : "Alert when the score drops by more than this amount vs baseline."}
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              status === "success"
                ? "bg-tiket-green/10 text-tiket-green"
                : "bg-tiket-red/10 text-tiket-red"
            }`}
            role="status"
          >
            {message}
          </div>
        )}

        <button type="submit" disabled={status === "loading"} className="btn-tiket">
          {status === "loading" ? "Saving…" : "Create alert"}
        </button>
      </form>

      <section className="panel" aria-label="Configured alerts">
        <div className="panel-header">
          <h2 className="text-lg font-semibold text-tiket-text">Active alerts</h2>
          <p className="mt-1 text-sm text-tiket-muted">
            {alerts.length} alert{alerts.length === 1 ? "" : "s"} configured
          </p>
        </div>

        {alerts.length === 0 ? (
          <p className="p-6 text-sm text-tiket-muted">No alerts configured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-tiket-border text-xs uppercase tracking-wide text-tiket-muted">
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Route</th>
                  <th className="px-5 py-3">Platform</th>
                  <th className="px-5 py-3">Metric</th>
                  <th className="px-5 py-3">Threshold</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tiket-border">
                {alerts.map((alert) => {
                  const metricInfo = ALERT_METRICS.find((m) => m.key === alert.metric);
                  return (
                    <tr key={alert._id} className="hover:bg-tiket-card-hover">
                      <td className="px-5 py-3">{alert.email}</td>
                      <td className="max-w-xs truncate px-5 py-3 font-mono text-xs">{alert.route}</td>
                      <td className="px-5 py-3">{REPORT_PLATFORM_LABELS[alert.platform]}</td>
                      <td className="px-5 py-3">{metricInfo?.label}</td>
                      <td className="px-5 py-3 tabular-nums">
                        {alert.threshold}
                        {metricInfo?.unit ? ` ${metricInfo.unit}` : ""}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => handleDelete(alert._id)}
                          className="text-xs font-medium text-tiket-red hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel p-6">
        <h2 className="text-lg font-semibold text-tiket-text">Run alert check</h2>
        <p className="mt-2 text-sm text-tiket-muted">
          From your terminal, run{" "}
          <code className="rounded bg-tiket-surface px-1.5 py-0.5 font-mono text-xs text-tiket-orange">
            npm run check-alerts
          </code>{" "}
          to collect fresh vitals, submit them, and evaluate all enabled alerts.
        </p>
      </section>
    </div>
  );
}
