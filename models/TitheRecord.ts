// lib/models/TitheRecord.ts
import mongoose, { Schema } from 'mongoose';

const TitheRecordSchema = new Schema({
  assembly: { type: String, required: true },
  submittedBy: { type: String, required: true },
  month: { type: String, required: true },
  records: [
    {
      name: { type: String, required: true },
      titheNumber: { type: String, required: true },
      week1: { type: Number, default: 0 },
      week2: { type: Number, default: 0 },
      week3: { type: Number, default: 0 },
      week4: { type: Number, default: 0 },
      week5: { type: Number, default: 0 }, 
      total: { type: Number, default: 0 },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.TitheRecord || mongoose.model('TitheRecord', TitheRecordSchema);