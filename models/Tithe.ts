// models/Tithe.ts
import mongoose, { Schema, Document } from "mongoose";

interface ITitheRow {
  name: string;
  titheNumber: string;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
  week5?: number;
  total: number;
}

interface ITithe extends Document {
  churchName: string;
  month: string;
  year: number;
  preparerName: string;
  data: ITitheRow[];
  createdAt: Date;
}

interface ITither extends Document {
  churchName: string;
  name: string;
  titheNumber: string;
}

const TitheSchema = new Schema<ITithe>({
  churchName: { type: String, required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  preparerName: { type: String, required: true },
  data: [
    {
      name: String,
      titheNumber: String,
      week1: Number,
      week2: Number,
      week3: Number,
      week4: Number,
      week5: Number,
      total: Number,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const TitherSchema = new Schema<ITither>({
  churchName: { type: String, required: true },
  name: { type: String, required: true },
  titheNumber: { type: String, required: true, unique: true },
});

export const Tithe = mongoose.models.Tithe || mongoose.model<ITithe>("Tithe", TitheSchema);
export const Tither = mongoose.models.Tither || mongoose.model<ITither>("Tither", TitherSchema);