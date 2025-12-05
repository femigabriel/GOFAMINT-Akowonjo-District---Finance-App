// lib/models/SundayService.ts
import mongoose, { Schema } from 'mongoose';

const SundayServiceSchema = new Schema({
  assembly: { type: String, required: true },
  submittedBy: { type: String, required: true },
  month: { type: String, required: true },
  records: [
    {
      week: { type: String, required: true }, // 'Week 1', 'Week 2', etc.
      attendance: { type: Number, default: 0 },
      sbsAttendance: { type: Number, default: 0 }, // Sunday Bible Study
      visitors: { type: Number, default: 0 },
      tithes: { type: Number, default: 0 },
      offerings: { type: Number, default: 0 },
      specialOfferings: { type: Number, default: 0 },
      etf: { type: Number, default: 0 }, // Education Trust Fund
      pastorsWarfare: { type: Number, default: 0 },
      vigil: { type: Number, default: 0 },
      thanksgiving: { type: Number, default: 0 },
      retirees: { type: Number, default: 0 },
      missionaries: { type: Number, default: 0 },
      youthOfferings: { type: Number, default: 0 },
      districtSupport: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.SundayService || mongoose.model('SundayService', SundayServiceSchema);