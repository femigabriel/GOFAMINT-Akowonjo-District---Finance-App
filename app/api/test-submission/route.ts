import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import TestSubmission, { IEntry } from "@/models/TestSubmission";

export async function POST(req: NextRequest) {
  try {
    // Connect and use the new DB
    await dbConnect("Aakowonjo-submission");

    const { assembly, submissions } = await req.json();

    if (!assembly || !submissions || !Array.isArray(submissions)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const entries: IEntry[] = submissions.map((sub: any) => ({
      week: sub.week,
      date: new Date(sub.date),
      tithe: sub.tithe,
      offeringGeneral: sub.offeringGeneral,
      offeringSpecial: sub.offeringSpecial,
      welfare: sub.welfare,
      missionaryFund: sub.missionaryFund,
      total: sub.total,
      remarks: sub.remarks,
    }));

    const doc = await TestSubmission.create({ assembly, entries });

    return NextResponse.json({ success: true, doc });
  } catch (err: any) {
    console.error("Error saving submission:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect("Aakowonjo-submission");

    const docs = await TestSubmission.find().lean();
    return NextResponse.json(docs);
  } catch (err: any) {
    console.error("Error fetching submissions:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
