import mongoose, { Schema, Document, Model } from "mongoose";
import { REPORT_PLATFORMS, type ReportPlatform } from "@/lib/platforms";
import { ALERT_METRICS, type AlertMetricKey } from "@/lib/alert-metrics";

export interface IWebVitalsAlert {
  email: string;
  route: string;
  platform: ReportPlatform;
  metric: AlertMetricKey;
  threshold: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type WebVitalsAlertDocument = IWebVitalsAlert & Document;

const metricKeys = ALERT_METRICS.map((metric) => metric.key);

const WebVitalsAlertSchema = new Schema<IWebVitalsAlert>(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    route: { type: String, required: true, trim: true },
    platform: { type: String, required: true, enum: REPORT_PLATFORMS },
    metric: { type: String, required: true, enum: metricKeys },
    threshold: { type: Number, required: true, min: 0 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

WebVitalsAlertSchema.index({ email: 1, route: 1, platform: 1, metric: 1 }, { unique: true });

export const WebVitalsAlert: Model<IWebVitalsAlert> =
  mongoose.models.WebVitalsAlert ??
  mongoose.model<IWebVitalsAlert>("WebVitalsAlert", WebVitalsAlertSchema);

export interface WebVitalsAlertResponse {
  _id: string;
  email: string;
  route: string;
  platform: ReportPlatform;
  metric: AlertMetricKey;
  threshold: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

type AlertSource = IWebVitalsAlert & { _id: { toString(): string } };

export function toAlertResponse(doc: AlertSource): WebVitalsAlertResponse {
  return {
    _id: doc._id.toString(),
    email: doc.email,
    route: doc.route,
    platform: doc.platform,
    metric: doc.metric,
    threshold: doc.threshold,
    enabled: doc.enabled,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
