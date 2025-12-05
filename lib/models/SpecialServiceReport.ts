import { Schema, model, models } from "mongoose";

const SpecialRecordSchema = new Schema(
  {
    title: String, // e.g. "Anointing Service"
    date: String,
    attendance: Number,
    offering: Number,
    total: Number,
  },
  { _id: false }
);

const SpecialServiceReportSchema = new Schema(
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
      type: [SpecialRecordSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const SpecialServiceReport =
  models.SpecialServiceReport ||
  model("SpecialServiceReport", SpecialServiceReportSchema);

export default SpecialServiceReport;
