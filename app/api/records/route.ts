import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assembly = searchParams.get("assembly");

    if (!assembly) {
      return NextResponse.json({ error: "Assembly is required" }, { status: 400 });
    }

    const mongoose = await dbConnect("gof-akowonjo");
    const db = mongoose.connection.db;

    // Fetch offering records
    const offeringRecords = await db
      .collection("offeringrecords")
      .find({ assembly })
      .toArray();

    // Fetch tithe records
    const titheRecords = await db
      .collection("titherecords")
      .find({ assembly })
      .toArray();

    return NextResponse.json({ offeringRecords, titheRecords }, { status: 200 });
  } catch (error) {
    console.error("Error fetching records:", error);
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 }
    );
  }
}