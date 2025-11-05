// models/SundayServiceReport.ts
import mongoose, { Schema, Document } from "mongoose";

interface ISundayServiceRecord {
  week: string;               // "Week 1"
  date: string;               // "2025-11-02"
  attendance: number;
  sbsAttendance: number;
  visitors: number;
  tithes: number;
  offerings: number;
  specialOfferings: number;
  etf: number;
  pastorsWarfare: number;
  vigil: number;
  thanksgiving: number;
  retirees: number;
  missionaries: number;
  youthOfferings: number;
  districtSupport: number;
  total: number;
  totalAttendance: number;    // calculated on the server
}

interface ISundayServiceReport extends Document {
  assembly: string;
  submittedBy: string;
  month: string;              // "November-2025"
  records: ISundayServiceRecord[];
  createdAt: Date;
  updatedAt: Date;
}

/* ---------- Record sub-schema ---------- */
const SundayServiceRecordSchema = new Schema<ISundayServiceRecord>({
  week: { type: String, required: true },
  date: { type: String, required: true },               // <-- NEW
  attendance: { type: Number, default: 0 },
  sbsAttendance: { type: Number, default: 0 },
  visitors: { type: Number, default: 0 },
  tithes: { type: Number, default: 0 },
  offerings: { type: Number, default: 0 },
  specialOfferings: { type: Number, default: 0 },
  etf: { type: Number, default: 0 },
  pastorsWarfare: { type: Number, default: 0 },
  vigil: { type: Number, default: 0 },
  thanksgiving: { type: Number, default: 0 },
  retirees: { type: Number, default: 0 },
  missionaries: { type: Number, default: 0 },
  youthOfferings: { type: Number, default: 0 },
  districtSupport: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  totalAttendance: { type: Number, default: 0 },
});

/* ---------- Main schema ---------- */
const SundayServiceReportSchema = new Schema<ISundayServiceReport>(
  {
    assembly: { type: String, required: true },
    submittedBy: { type: String, required: true },
    month: { type: String, required: true },
    records: [SundayServiceRecordSchema],
  },
  { timestamps: true }
);

/* optional index for fast lookup */
SundayServiceReportSchema.index({ assembly: 1, month: 1 });

export default mongoose.models.SundayServiceReport ||
  mongoose.model<ISundayServiceReport>("SundayServiceReport", SundayServiceReportSchema);