// models/SpecialServiceReport.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ISpecialServiceRecord {
  serviceName: string;
  date: string;
  attendance: number;
  offering: number;
}

export interface ISpecialServiceReport extends Document {
  assembly: string;
  submittedBy: string;
  month: string;
  records: ISpecialServiceRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const SpecialServiceRecordSchema = new Schema({
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true
  },
  attendance: {
    type: Number,
    default: 0,
    min: 0
  },
  offering: {
    type: Number,
    default: 0,
    min: 0
  }
});

const SpecialServiceReportSchema = new Schema({
  assembly: {
    type: String,
    required: true,
    trim: true
  },
  submittedBy: {
    type: String,
    required: true,
    trim: true
  },
  month: {
    type: String,
    required: true
  },
  records: [SpecialServiceRecordSchema]
}, {
  timestamps: true
});

// Compound index to ensure one report per assembly per month
SpecialServiceReportSchema.index({ assembly: 1, month: 1 }, { unique: true });

export default mongoose.models.SpecialServiceReport || 
  mongoose.model<ISpecialServiceReport>('SpecialServiceReport', SpecialServiceReportSchema);