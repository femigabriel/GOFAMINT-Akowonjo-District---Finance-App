// lib/models/MidweekService.ts
import mongoose, { Schema } from 'mongoose';

const MidweekServiceSchema = new Schema({
  assembly: { type: String, required: true },
  submittedBy: { type: String, required: true },
  month: { type: String, required: true },
  records: [
    {
      date: { type: String, required: true },
      day: { type: String, required: true }, 
      attendance: { type: Number, default: 0 },
      offering: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.MidweekService || mongoose.model('MidweekService', MidweekServiceSchema);