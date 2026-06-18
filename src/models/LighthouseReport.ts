import mongoose, { Schema, Document, Model } from "mongoose";
import { REPORT_PLATFORMS, type ReportPlatform } from "@/lib/platforms";

export type { ReportPlatform };

export interface ILighthouseReport {
  route: string;
  team: string;
  platform: ReportPlatform;
  performance: number;
  lcp: number;
  inp: number;
  cls: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  screenshot?: string;
  screenshotMimeType?: string;
  lowScoreReasons: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type LighthouseReportDocument = ILighthouseReport & Document;

const LighthouseReportSchema = new Schema<ILighthouseReport>(
  {
    route: { type: String, required: true, trim: true },
    team: { type: String, required: true, trim: true },
    platform: {
      type: String,
      required: true,
      enum: REPORT_PLATFORMS,
    },
    performance: { type: Number, required: true, min: 0, max: 100 },
    lcp: { type: Number, required: true, min: 0 },
    inp: { type: Number, required: true, min: 0 },
    cls: { type: Number, required: true, min: 0 },
    accessibility: { type: Number, required: true, min: 0, max: 100 },
    bestPractices: { type: Number, required: true, min: 0, max: 100 },
    seo: { type: Number, required: true, min: 0, max: 100 },
    screenshot: { type: String },
    screenshotMimeType: { type: String },
    lowScoreReasons: { type: [String], default: [] },
  },
  { timestamps: true }
);

LighthouseReportSchema.index({ route: 1, team: 1, platform: 1, createdAt: -1 });

export const LighthouseReport: Model<ILighthouseReport> =
  mongoose.models.LighthouseReport ??
  mongoose.model<ILighthouseReport>("LighthouseReport", LighthouseReportSchema);

export interface LighthouseReportResponse {
  _id: string;
  route: string;
  team: string;
  platform: ReportPlatform;
  performance: number;
  lcp: number;
  inp: number;
  cls: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  screenshot?: string;
  screenshotMimeType?: string;
  lowScoreReasons: string[];
  createdAt: string;
  updatedAt: string;
}

type ReportSource = ILighthouseReport & { _id: { toString(): string } };

export function toReportResponse(doc: ReportSource): LighthouseReportResponse {
  return {
    _id: doc._id.toString(),
    route: doc.route,
    team: doc.team,
    platform: doc.platform ?? "desktop",
    performance: doc.performance,
    lcp: doc.lcp,
    inp: doc.inp,
    cls: doc.cls,
    accessibility: doc.accessibility,
    bestPractices: doc.bestPractices,
    seo: doc.seo,
    screenshot: doc.screenshot,
    screenshotMimeType: doc.screenshotMimeType,
    lowScoreReasons: doc.lowScoreReasons,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
