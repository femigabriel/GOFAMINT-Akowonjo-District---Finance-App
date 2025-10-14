// lib/models/OfferingRecord.ts
import mongoose, { Schema } from 'mongoose';

const OfferingRecordSchema = new Schema({
  assembly: { type: String, required: true },
  submittedBy: { type: String, required: true },
  month: { type: String, required: true }, // e.g., "October-2025"
  type: { type: String, required: true }, // e.g., "Sunday Service", "Tuesday Bible Study and Thursday Prayer Meeting", "Pastor's Welfare"
  records: [
    {
      week1: { type: Number, default: 0 }, // For Sunday Service
      week2: { type: Number, default: 0 },
      week3: { type: Number, default: 0 },
      week4: { type: Number, default: 0 },
      week5: { type: Number, default: 0, required: false },
      tuesdayWeek1: { type: Number, default: 0 }, // For Tuesday Bible Study
      tuesdayWeek2: { type: Number, default: 0 },
      tuesdayWeek3: { type: Number, default: 0 },
      tuesdayWeek4: { type: Number, default: 0 },
      tuesdayWeek5: { type: Number, default: 0, required: false },
      thursdayWeek1: { type: Number, default: 0 }, // For Thursday Prayer Meeting
      thursdayWeek2: { type: Number, default: 0 },
      thursdayWeek3: { type: Number, default: 0 },
      thursdayWeek4: { type: Number, default: 0 },
      thursdayWeek5: { type: Number, default: 0, required: false },
      amount: { type: Number, default: 0 }, // Sum for weekly, single amount for special
      total: { type: Number, default: 0 }, // Mirrors amount
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.OfferingRecord || mongoose.model('OfferingRecord', OfferingRecordSchema);