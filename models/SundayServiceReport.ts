// models/SundayServiceReport.ts
import mongoose, { Schema, Document } from "mongoose";

interface ISundayServiceRecord {
  week: string;
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
}

interface ISundayServiceReport extends Document {
  assembly: string;
  submittedBy: string;
  month: string;
  records: ISundayServiceRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const SundayServiceRecordSchema = new Schema<ISundayServiceRecord>({
  week: { type: String, required: true },
  attendance: { type: Number, required: true, default: 0 },
  sbsAttendance: { type: Number, required: true, default: 0 },
  visitors: { type: Number, required: true, default: 0 },
  tithes: { type: Number, required: true, default: 0 },
  offerings: { type: Number, required: true, default: 0 },
  specialOfferings: { type: Number, required: true, default: 0 },
  etf: { type: Number, required: true, default: 0 },
  pastorsWarfare: { type: Number, required: true, default: 0 },
  vigil: { type: Number, required: true, default: 0 },
  thanksgiving: { type: Number, required: true, default: 0 },
  retirees: { type: Number, required: true, default: 0 },
  missionaries: { type: Number, required: true, default: 0 },
  youthOfferings: { type: Number, required: true, default: 0 },
  districtSupport: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true, default: 0 },
});

const SundayServiceReportSchema = new Schema<ISundayServiceReport>(
  {
    assembly: { type: String, required: true },
    submittedBy: { type: String, required: true },
    month: { type: String, required: true },
    records: [SundayServiceRecordSchema],
  },
  { timestamps: true }
);

export default mongoose.models.SundayServiceReport ||
  mongoose.model<ISundayServiceReport>("SundayServiceReport", SundayServiceReportSchema);