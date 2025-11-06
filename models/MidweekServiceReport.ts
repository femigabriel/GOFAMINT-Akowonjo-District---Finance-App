// models/MidweekServiceReport.ts
import mongoose, { Schema, Document } from "mongoose";

interface IMidweekServiceRecord {
  date: string;              
  day: "tuesday" | "thursday"; 
  attendance: number;
  offering: number;
  total: number;             
}

interface IMidweekServiceReport extends Document {
  assembly: string;
  submittedBy: string;
  month: string;           
  records: IMidweekServiceRecord[];
  createdAt: Date;
  updatedAt: Date;
}

/* ---------- Record sub-schema ---------- */
const MidweekServiceRecordSchema = new Schema<IMidweekServiceRecord>({
  date: { type: String, required: true },
  day: { 
    type: String, 
    required: true, 
    enum: ["tuesday", "thursday"] 
  },
  attendance: { type: Number, default: 0 },
  offering: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
});

/* ---------- Main schema ---------- */
const MidweekServiceReportSchema = new Schema<IMidweekServiceReport>(
  {
    assembly: { type: String, required: true },
    submittedBy: { type: String, required: true },
    month: { type: String, required: true },
    records: [MidweekServiceRecordSchema],
  },
  { timestamps: true }
);

/* Index for fast lookup by assembly + month */
MidweekServiceReportSchema.index({ assembly: 1, month: 1 });

export default mongoose.models.MidweekServiceReport ||
  mongoose.model<IMidweekServiceReport>("MidweekServiceReport", MidweekServiceReportSchema);