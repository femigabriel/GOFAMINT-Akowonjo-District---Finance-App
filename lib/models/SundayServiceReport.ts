import { Schema, model, models } from "mongoose";

const SundayRecordSchema = new Schema(
  {
    serviceName: String,
    date: String,
    attendance: Number,
    offerings: Number,
    tithes: Number,
    total: Number,
  },
  { _id: false }
);

const SundayServiceReportSchema = new Schema(
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
      type: [SundayRecordSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const SundayServiceReport =
  models.SundayServiceReport ||
  model("SundayServiceReport", SundayServiceReportSchema);

export default SundayServiceReport;
