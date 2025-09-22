// app/api/submissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose, { Document, Schema } from "mongoose";

// Define the Submission interface to match the frontend
interface Submission {
  week: string;
  date: string;
  tithe: number;
  offeringGeneral: number;
  offeringSpecial: number;
  welfare: number;
  missionaryFund: number;
  total: number;
  remarks: string;
}

// Define the database schema (for reference)
interface IEntry {
  week: string;
  date: Date;
  tithe: number;
  offeringGeneral: number;
  offeringSpecial: number;
  welfare: number;
  missionaryFund: number;
  total: number;
  remarks: string;
}

interface ISubmission extends Document {
  assembly: string;
  month?: number;
  year?: number;
  entries: IEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const entrySchema = new Schema<IEntry>({
  week: { type: String, required: true },
  date: { type: Date, required: true },
  tithe: { type: Number, default: 0 },
  offeringGeneral: { type: Number, default: 0 },
  offeringSpecial: { type: Number, default: 0 },
  welfare: { type: Number, default: 0 },
  missionaryFund: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  remarks: { type: String, default: "" },
});

const submissionSchema = new Schema<ISubmission>(
  {
    assembly: { type: String, required: true },
    month: { type: Number },
    year: { type: Number },
    entries: [entrySchema],
  },
  { timestamps: true }
);

const SubmissionModel =
  mongoose.models.Submission || mongoose.model<ISubmission>("Submission", submissionSchema);

export async function GET(req: NextRequest) {
  try {
    // Connect to the gof-akowonjo database
    await dbConnect("gof-akowonjo");

    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const assembly = searchParams.get("assembly");

    // Validate assembly
    if (!assembly) {
      return NextResponse.json({ error: "Assembly is required" }, { status: 400 });
    }

    // Build query
    const query: any = { assembly };
    if (start && end) {
      query["entries.date"] = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    // Fetch documents from submissions-data collection
    const docs = await SubmissionModel.find(query).lean();

    // Transform documents into a flat array of Submission objects
    const submissions: Submission[] = docs
      .flatMap((doc: any) => doc.entries || [])
      .filter((entry: IEntry) => {
        // Additional date filtering to ensure only entries within the range are included
        if (start && end) {
          const entryDate = new Date(entry.date);
          return entryDate >= new Date(start) && entryDate <= new Date(end);
        }
        return true;
      })
      .map((entry: IEntry) => ({
        week: entry.week || "",
        date: new Date(entry.date).toISOString().split("T")[0],
        tithe: Number(entry.tithe) || 0,
        offeringGeneral: Number(entry.offeringGeneral) || 0,
        offeringSpecial: Number(entry.offeringSpecial) || 0,
        welfare: Number(entry.welfare) || 0,
        missionaryFund: Number(entry.missionaryFund) || 0,
        total: Number(entry.total) || 0,
        remarks: entry.remarks || "",
      }));

    return NextResponse.json(submissions);
  } catch (err: any) {
    console.error("Error fetching submissions:", err);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}