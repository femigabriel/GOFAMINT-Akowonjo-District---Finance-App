// app/api/sunday-service-reports/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SundayServiceReport from "@/models/SundayServiceReport";
import { format } from "date-fns";

/* ---------- Helper to calculate totals ---------- */
function calcTotals(r: any) {
  const attendance = Number(r.attendance) || 0;
  const sbs = Number(r.sbsAttendance) || 0;
  const visitors = Number(r.visitors) || 0;

  const monetary =
    Number(r.tithes) +
    Number(r.offerings) +
    Number(r.specialOfferings) +
    Number(r.etf) +
    Number(r.pastorsWarfare) +
    Number(r.vigil) +
    Number(r.thanksgiving) +
    Number(r.retirees) +
    Number(r.missionaries) +
    Number(r.youthOfferings) +
    Number(r.districtSupport);

  return {
    totalAttendance: attendance + sbs + visitors,
    total: monetary,
  };
}

/* ---------- Helper to generate date based on week and month ---------- */
function generateDateForWeek(week: string, month: string): string {
  try {
    // Parse month like "November-2025"
    const [monthName, year] = month.split('-');
    const monthIndex = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ].indexOf(monthName);
    
    if (monthIndex === -1) return '';
    
    // Get week number (e.g., "Week 1" -> 1)
    const weekNumber = parseInt(week.replace('Week ', '')) || 1;
    
    // Calculate date: first Sunday of the month + (week-1) * 7 days
    const firstOfMonth = new Date(parseInt(year), monthIndex, 1);
    
    // Find first Sunday of the month
    let firstSunday = new Date(firstOfMonth);
    while (firstSunday.getDay() !== 0) { // 0 is Sunday
      firstSunday.setDate(firstSunday.getDate() + 1);
    }
    
    // Add weeks
    const recordDate = new Date(firstSunday);
    recordDate.setDate(firstSunday.getDate() + (weekNumber - 1) * 7);
    
    return recordDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
  } catch (error) {
    console.error('Error generating date:', error);
    return '';
  }
}

/* ---------- POST – save report ---------- */
export async function POST(request: Request) {
  try {
    await dbConnect();
    console.log("Connected to MongoDB (POST)");

    const { assembly, submittedBy, month, records } = await request.json();

    if (!assembly || !submittedBy || !month || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* Filter out completely empty rows & calculate totals */
    const validRecords = records
      .filter((r: any) => {
        const hasValue =
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
          r.districtSupport > 0;
        return hasValue;
      })
      .map((r: any) => {
        const { totalAttendance, total } = calcTotals(r);
        
        // AUTO-GENERATE DATE IF MISSING
        let recordDate = r.date;
        if (!recordDate && r.week && month) {
          recordDate = generateDateForWeek(r.week, month);
          console.log(`📅 Generated date for ${r.week}: ${recordDate}`);
        }

        return {
          week: r.week,
          date: recordDate, // Now this will always have a value
          attendance: Number(r.attendance) || 0,
          sbsAttendance: Number(r.sbsAttendance) || 0,
          visitors: Number(r.visitors) || 0,
          tithes: Number(r.tithes) || 0,
          offerings: Number(r.offerings) || 0,
          specialOfferings: Number(r.specialOfferings) || 0,
          etf: Number(r.etf) || 0,
          pastorsWarfare: Number(r.pastorsWarfare) || 0,
          vigil: Number(r.vigil) || 0,
          thanksgiving: Number(r.thanksgiving) || 0,
          retirees: Number(r.retirees) || 0,
          missionaries: Number(r.missionaries) || 0,
          youthOfferings: Number(r.youthOfferings) || 0,
          districtSupport: Number(r.districtSupport) || 0,
          total,
          totalAttendance,
        };
      });

    if (validRecords.length === 0) {
      return NextResponse.json(
        { error: "No valid records to save" },
        { status: 400 }
      );
    }

    const report = new SundayServiceReport({
      assembly,
      submittedBy,
      month,
      records: validRecords,
    });

    await report.save();
    console.log("Saved report – records:", validRecords.length);
    console.log("Saved records with dates:", validRecords.map(r => ({ week: r.week, date: r.date })));

    return NextResponse.json({
      success: true,
      message: `${validRecords.length} record(s) saved`,
    });
  } catch (err: any) {
    console.error("POST error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

/* ---------- GET – fetch latest report for assembly+month ---------- */
export async function GET(request: Request) {
  try {
    await dbConnect();
    console.log("Connected to MongoDB (GET)");

    const { searchParams } = new URL(request.url);
    const assembly = searchParams.get("assembly");
    const month = searchParams.get("month");

    if (!assembly || !month) {
      return NextResponse.json(
        { error: "assembly and month required" },
        { status: 400 }
      );
    }

    const doc = await SundayServiceReport.findOne({ assembly, month })
      .sort({ createdAt: -1 })
      .lean();


    if (!doc) {
      // Return empty structure with the requested month
      return NextResponse.json({
        _id: null,
        assembly,
        submittedBy: "",
        month,
        records: [],
        createdAt: null,
        updatedAt: null,
        __v: 0
      });
    }

    // Return the ENTIRE document, not just records
    return NextResponse.json(doc);
    
  } catch (err: any) {
    console.error("GET error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}