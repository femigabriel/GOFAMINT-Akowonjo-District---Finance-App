import { Schema, model, models } from "mongoose";

const MidweekRecordSchema = new Schema(
  {
    serviceName: String,
    date: String,
    attendance: Number,
    offering: Number,
    total: Number,
  },
  { _id: false }
);

const MidweekReportSchema = new Schema(
  {
    assembly: {
      type: String,
      uppercase: true,
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    records: {
      type: [MidweekRecordSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const MidweekReport =
  models.MidweekReport || model("MidweekReport", MidweekReportSchema);

export default MidweekReport;
