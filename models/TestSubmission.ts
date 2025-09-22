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
  entries: IEntry[];
  createdAt: Date;
}

const EntrySchema = new Schema<IEntry>({
  week: { type: String, required: true },
  date: { type: Date },
  tithe: { type: Number, default: 0 },
  offeringGeneral: { type: Number, default: 0 },
  offeringSpecial: { type: Number, default: 0 },
  welfare: { type: Number, default: 0 },
  missionaryFund: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  remarks: { type: String },
}, { _id: false });

const SubmissionSchema = new Schema<ISubmission>({
  assembly: { type: String, required: true },
  entries: [EntrySchema],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.TestSubmission ||
  mongoose.model<ISubmission>("TestSubmission", SubmissionSchema, "submission");
