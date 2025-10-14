// app/api/tithes/[churchName]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Tithe, Tither } from "@/models/Tithe";

export async function GET(req: NextRequest, { params }: { params: { churchName: string } }) {
  const { churchName } = params;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  try {
    await dbConnect();
    const tithe = await Tithe.findOne({ churchName, month, year });
    const tithers = await Tither.find({ churchName });
    return NextResponse.json({ tithe, tithers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { churchName: string } }) {
  const { churchName } = params;
  const { month, year, preparerName, data } = await req.json();

  if (!preparerName || !data) {
    return NextResponse.json({ error: "Preparer name and data are required" }, { status: 400 });
  }

  try {
    await dbConnect();

    // Validate and update tither master list
    for (const row of data) {
      if (row.name && row.titheNumber) {
        await Tither.findOneAndUpdate(
          { churchName, titheNumber: row.titheNumber },
          { name: row.name, churchName },
          { upsert: true }
        );
      }
    }

    // Save tithe data
    const newTithe = new Tithe({ churchName, month, year, preparerName, data });
    await newTithe.save();
    return NextResponse.json({ message: "Data saved successfully" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}