// lib/models/SpecialService.ts
import mongoose, { Schema } from 'mongoose';

const SpecialServiceSchema = new Schema({
  assembly: { type: String, required: true },
  submittedBy: { type: String, required: true },
  month: { type: String, required: true },
  records: [
    {
      serviceName: { type: String, required: true },
      date: { type: String, required: true },
      attendance: { type: Number, default: 0 },
      offering: { type: Number, default: 0 },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.SpecialService || mongoose.model('SpecialService', SpecialServiceSchema);