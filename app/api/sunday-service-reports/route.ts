// app/api/sunday-service-reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SundayServiceReport from "@/models/SundayServiceReport";
import MidweekServiceReport from "@/models/MidweekServiceReport";
import SpecialServiceReport from "@/models/SpecialServiceReport";
import { format } from "date-fns";

// Define TypeScript interfaces
interface SundayRecord {
  week: string;
  date?: string;
  attendance: number;
  sbsAttendance: number;
  visitors: number;
  tithes: number;
  offerings: number;
  specialOfferings: number;
  etf: number;
  pastorsWarfare: number;
  vigil: number;
  thanksgiving: number;
  retirees: number;
  missionaries: number;
  youthOfferings: number;
  districtSupport: number;
  total?: number;
  totalAttendance?: number;
}

interface MidweekRecord {
  date: string;
  day: string;
  attendance: number;
  offering: number;
  total?: number;
}

interface SpecialRecord {
  serviceName: string;
  date: string;
  attendance: number;
  offering: number;
}

interface ReportRequest {
  assembly: string;
  submittedBy: string;
  month: string;
  records: any[];
  serviceType?: "sunday" | "midweek" | "special";
}

interface SundayReportDocument {
  _id: string;
  assembly: string;
  submittedBy: string;
  month: string;
  records: SundayRecord[];
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

interface MidweekReportDocument {
  _id: string;
  assembly: string;
  submittedBy: string;
  month: string;
  records: MidweekRecord[];
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

interface SpecialReportDocument {
  _id: string;
  assembly: string;
  submittedBy: string;
  month: string;
  records: SpecialRecord[];
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

/* ---------- Helper to calculate totals for Sunday ---------- */
function calcSundayTotals(r: any) {
  const attendance = Number(r.attendance) || 0;
  const sbs = Number(r.sbsAttendance) || 0;
  const visitors = Number(r.visitors) || 0;

  // Total attendance is just the main service attendance
  const totalAttendance = attendance;

  // Total offerings EXCLUDES tithes
  const totalOfferings =
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
    totalAttendance,
    totalOfferings,
  };
}

/* ---------- Helper to generate date based on week and month for Sunday ---------- */
function generateDateForWeek(week: string, month: string): string {
  try {
    // Parse month like "November-2025"
    const [monthName, year] = month.split("-");
    const monthIndex = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ].indexOf(monthName);

    if (monthIndex === -1) return "";

    // Get week number (e.g., "Week 1" -> 1)
    const weekNumber = parseInt(week.replace("Week ", "")) || 1;

    // Calculate date: first Sunday of the month + (week-1) * 7 days
    const firstOfMonth = new Date(parseInt(year), monthIndex, 1);

    // Find first Sunday of the month
    let firstSunday = new Date(firstOfMonth);
    while (firstSunday.getDay() !== 0) {
      firstSunday.setDate(firstSunday.getDate() + 1);
    }

    // Add weeks
    const recordDate = new Date(firstSunday);
    recordDate.setDate(firstSunday.getDate() + (weekNumber - 1) * 7);

    return recordDate.toISOString().split("T")[0]; // YYYY-MM-DD format
  } catch (error) {
    console.error("Error generating date:", error);
    return "";
  }
}

/* ---------- POST – save report ---------- */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await dbConnect();
    console.log("Connected to MongoDB (POST)");

    const body: ReportRequest = await request.json();
    const {
      assembly,
      submittedBy,
      month,
      records,
      serviceType = "sunday",
    } = body;

    if (!assembly || !submittedBy || !month || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Handle Special Service Reports
    if (serviceType === "special") {
      /* Filter out completely empty rows for special services */
      const validRecords = records
        .filter((r: any) => {
          const hasValue =
            r.attendance > 0 ||
            r.offering > 0 ||
            (r.serviceName && r.serviceName.trim() !== "");
          return hasValue;
        })
        .map((r: any) => ({
          serviceName: r.serviceName?.trim() || "Unnamed Service",
          date: r.date,
          attendance: Number(r.attendance) || 0,
          offering: Number(r.offering) || 0,
        }));

      if (validRecords.length === 0) {
        return NextResponse.json(
          { error: "No valid records to save" },
          { status: 400 }
        );
      }

      // Use findOneAndUpdate with upsert to create or update the report
      const report = await SpecialServiceReport.findOneAndUpdate(
        { assembly, month },
        {
          assembly,
          submittedBy,
          month,
          records: validRecords,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

      console.log(
        "Saved special service report – records:",
        validRecords.length
      );

      return NextResponse.json({
        success: true,
        message: `${validRecords.length} special service record(s) saved`,
        data: report,
      });
    }
    // Handle Midweek Service Reports
    else if (serviceType === "midweek") {
      /* Filter out completely empty rows & calculate totals for midweek */
      const validRecords = records
        .filter((r: any) => {
          const hasValue = r.attendance > 0 || r.offering > 0;
          return hasValue;
        })
        .map((r: any) => ({
          date: r.date,
          day: r.day,
          attendance: Number(r.attendance) || 0,
          offering: Number(r.offering) || 0,
          total: Number(r.offering) || 0,
        }));

      if (validRecords.length === 0) {
        return NextResponse.json(
          { error: "No valid records to save" },
          { status: 400 }
        );
      }

      const report = await MidweekServiceReport.findOneAndUpdate(
        { assembly, month },
        {
          assembly,
          submittedBy,
          month,
          records: validRecords,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

      console.log("Saved midweek report – records:", validRecords.length);

      return NextResponse.json({
        success: true,
        message: `${validRecords.length} record(s) saved`,
      });
    }
    // Handle Sunday Service Reports (default)
    else {
      /* Filter out completely empty rows & calculate totals for sunday */
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
          const { totalAttendance, totalOfferings } = calcSundayTotals(r);

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
            total: totalOfferings,
            totalAttendance,
          };
        });

      if (validRecords.length === 0) {
        return NextResponse.json(
          { error: "No valid records to save" },
          { status: 400 }
        );
      }

      const report = await SundayServiceReport.findOneAndUpdate(
        { assembly, month },
        {
          assembly,
          submittedBy,
          month,
          records: validRecords,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

      console.log("Saved sunday report – records:", validRecords.length);

      return NextResponse.json({
        success: true,
        message: `${validRecords.length} record(s) saved`,
      });
    }
  } catch (err: any) {
    console.error("POST error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

/* ---------- GET – fetch latest report for assembly+month ---------- */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await dbConnect();
    console.log("Connected to MongoDB (GET)");

    const { searchParams } = new URL(request.url);
    const assembly = searchParams.get("assembly");
    const month = searchParams.get("month");
    const serviceType = searchParams.get("serviceType") || "sunday";

    if (!assembly || !month) {
      return NextResponse.json(
        { error: "assembly and month required" },
        { status: 400 }
      );
    }

    // Define empty response structure
    const emptyResponse = {
      _id: null,
      assembly,
      submittedBy: "",
      month,
      records: [],
      createdAt: null,
      updatedAt: null,
      __v: 0,
    };

    // Return empty response for missing service type
    if (!serviceType) {
      return NextResponse.json(emptyResponse);
    }

    // Handle Sunday Service Reports (default)
    if (serviceType === "sunday") {
      const doc = await SundayServiceReport.findOne({ assembly, month })
        .sort({ createdAt: -1 })
        .lean<SundayReportDocument>();

      if (!doc) {
        return NextResponse.json(emptyResponse);
      }

      // Recalculate totals for each record to ensure correctness
      const updatedRecords = doc.records.map((record: any) => {
        const { totalAttendance, totalOfferings } = calcSundayTotals(record);

        // Return record with recalculated totals
        return {
          ...record,
          total: totalOfferings,
          totalAttendance: totalAttendance,
        };
      });

      // Return document with corrected records
      return NextResponse.json({
        ...doc,
        records: updatedRecords,
      });
    }
    // Handle Special Service Reports
    else if (serviceType === "special") {
      const doc = await SpecialServiceReport.findOne({ assembly, month })
        .sort({ createdAt: -1 })
        .lean<SpecialReportDocument>();

      if (!doc) {
        return NextResponse.json(emptyResponse);
      }

      return NextResponse.json(doc);
    }
    // Handle Midweek Service Reports
    else if (serviceType === "midweek") {
      const doc = await MidweekServiceReport.findOne({ assembly, month })
        .sort({ createdAt: -1 })
        .lean<MidweekReportDocument>();

      if (!doc) {
        return NextResponse.json(emptyResponse);
      }

      return NextResponse.json(doc);
    }

    // Add a default return statement for the TypeScript compiler
    return NextResponse.json(emptyResponse);
  } catch (err: any) {
    console.error("GET error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
