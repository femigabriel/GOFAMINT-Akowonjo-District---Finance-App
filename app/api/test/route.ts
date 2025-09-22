import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import HelloWorld from "@/models/HelloWorld";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const doc = await HelloWorld.create({ message: "Hello World" });

    return NextResponse.json({ success: true, doc });
  } catch (err: any) {
    console.error("Error saving Hello World:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const docs = await HelloWorld.find().lean();

    return NextResponse.json(docs);
  } catch (err: any) {
    console.error("Error fetching Hello World:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
