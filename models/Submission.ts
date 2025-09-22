// models/Submission.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IEntry {
  week: string;
  date?: Date | string;
  tithe: number;
  offeringGeneral: number;
  offeringSpecial: number;
  welfare: number;
  missionaryFund: number;
  total: number;
  remarks?: string;
}

export interface ISubmission extends Document {
  assembly: string;
  month: number;
  year: number;
  entries: IEntry[];
  createdAt: Date;
}

const EntrySchema = new Schema<IEntry>(
  {
    week: { type: String, required: true },
    date: { type: Date, required: false },
    tithe: { type: Number, required: true, default: 0 },
    offeringGeneral: { type: Number, required: true, default: 0 },
    offeringSpecial: { type: Number, required: true, default: 0 },
    welfare: { type: Number, required: true, default: 0 },
    missionaryFund: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    remarks: { type: String, required: false },
  },
  { _id: false }
);

const SubmissionSchema = new Schema<ISubmission>(
  {
    assembly: { type: String, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    entries: [EntrySchema],
  },
  { timestamps: true }
);

// Add index for faster queries
SubmissionSchema.index({ assembly: 1, month: 1, year: 1 });

export default mongoose.models.Submission ||
  mongoose.model<ISubmission>("Submission", SubmissionSchema, "submissions-data");
