// app/api/titherecords/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import TitheRecord from "@/models/TitheRecord";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const assembly = searchParams.get("assembly");
    const month = searchParams.get("month");

    if (!assembly || !month) {
      return NextResponse.json(
        { error: "assembly and month are required" },
        { status: 400 }
      );
    }

    const record = await TitheRecord.findOne({ assembly, month });

    return NextResponse.json({ record });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch tithe records", details: err },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();

    const { assembly, submittedBy, month, records } = body;

    if (!assembly || !submittedBy || !month || !records) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if record exists → then update
    const existing = await TitheRecord.findOne({ assembly, month });

    if (existing) {
      existing.records = records;
      existing.submittedBy = submittedBy;
      await existing.save();

      return NextResponse.json({ message: "Updated successfully" });
    }

    // Create new record
    await TitheRecord.create(body);

    return NextResponse.json({ message: "Created successfully" });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to save tithe record", details: err },
      { status: 500 }
    );
  }
}
