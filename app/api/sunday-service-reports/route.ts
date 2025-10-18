// app/api/sunday-service-reports/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SundayServiceReport from "@/models/SundayServiceReport";

export async function POST(request: Request) {
  try {
    await dbConnect();
    console.log("Connected to MongoDB for POST /api/sunday-service-reports");
    const { assembly, submittedBy, month, records } = await request.json();
    console.log("Received data:", { assembly, submittedBy, month, recordsCount: records.length });

    if (!assembly || !submittedBy || !month || !records) {
      return NextResponse.json(
        { error: "Missing required fields: assembly, submittedBy, month, and records are required" },
        { status: 400 }
      );
    }

    // Validate records
    const validRecords = records.filter(
      (r: any) =>
        r.attendance > 0 ||
        r.sbsAttendance > 0 ||
        r.visitors > 0 ||
        r.tithes > 0 ||
        r.offerings > 0 ||
        r.specialOfferings > 0 ||
        r.etf > 0 ||
        r.pastorsWarfare > 0 ||
        r.vigil > 0 ||
        r.thanksgiving > 0 ||
        r.retirees > 0 ||
        r.missionaries > 0 ||
        r.youthOfferings > 0 ||
        r.districtSupport > 0
    );
    console.log("Valid records to save:", validRecords.length);

    if (validRecords.length === 0) {
      return NextResponse.json(
        { error: "No valid records to save" },
        { status: 400 }
      );
    }

    const sundayServiceReport = new SundayServiceReport({
      assembly,
      submittedBy,
      month,
      records: validRecords,
    });

    await sundayServiceReport.save();
    console.log("Sunday Service Report saved successfully");

    return NextResponse.json({
      success: true,
      message: `${validRecords.length} record(s) saved successfully`,
    });
  } catch (error) {
    console.error("Error saving Sunday Service Report:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    console.log("Connected to MongoDB for GET /api/sunday-service-reports");
    const { searchParams } = new URL(request.url);
    const assembly = searchParams.get("assembly");
    const month = searchParams.get("month");

    if (!assembly || !month) {
      return NextResponse.json(
        { error: "Assembly and month are required" },
        { status: 400 }
      );
    }

    // Get the most recent record for the assembly and month
    const latestRecord = await SundayServiceReport.findOne({ assembly, month })
      .sort({ createdAt: -1 })
      .select("records");

    const records = latestRecord
      ? latestRecord.records
      : Array.from({ length: 5 }, () => ({
          attendance: 0,
          sbsAttendance: 0,
          visitors: 0,
          tithes: 0,
          offerings: 0,
          specialOfferings: 0,
          etf: 0,
          pastorsWarfare: 0,
          vigil: 0,
          thanksgiving: 0,
          retirees: 0,
          missionaries: 0,
          youthOfferings: 0,
          districtSupport: 0,
          total: 0,
        }));

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Error fetching Sunday Service Reports:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}