// models/FinancialRecord.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IFinancialRecord extends Document {
  assembly: string;
  submittedBy: string;
  month: string; // Format: "November-2025"
  records: {
    date: string;
    description: string;
    category: string;
    type: 'income' | 'expense';
    amount: number;
    paymentMethod?: string;
    reference?: string;
  }[];
  totals: {
    income: number;
    expense: number;
    net: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FinancialRecordSchema: Schema = new Schema(
  {
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
    records: [
      {
        date: {
          type: String,
          required: true
        },
        description: {
          type: String,
          required: true,
          trim: true
        },
        category: {
          type: String,
          required: true,
          trim: true
        },
        type: {
          type: String,
          enum: ['income', 'expense'],
          required: true
        },
        amount: {
          type: Number,
          required: true,
          min: 0
        },
        paymentMethod: {
          type: String,
          trim: true
        },
        reference: {
          type: String,
          trim: true
        }
      }
    ],
    totals: {
      income: { type: Number, default: 0 },
      expense: { type: Number, default: 0 },
      net: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

FinancialRecordSchema.index({ assembly: 1, month: 1 }, { unique: true });

export default mongoose.models.FinancialRecord || 
  mongoose.model<IFinancialRecord>('FinancialRecord', FinancialRecordSchema);