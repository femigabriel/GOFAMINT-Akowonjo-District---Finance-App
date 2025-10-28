// app/api/financial-reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import TitheRecord from "@/models/TitheRecord";
import OfferingRecord from "@/models/OfferingRecord";
import SundayServiceReport from "@/models/SundayServiceReport";

export async function GET(request: NextRequest) {
  try {
    await dbConnect("gof-akowonjo");

    const { searchParams } = new URL(request.url);
    const assembly = searchParams.get("assembly");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    // Build query filters
    const titheFilter: any = {};
    const offeringFilter: any = {};
    const sundayServiceFilter: any = {};

    if (assembly && assembly !== "all") {
      titheFilter.assembly = assembly;
      offeringFilter.assembly = assembly;
      sundayServiceFilter.assembly = assembly;
    }

    if (month && month !== "all") {
      const monthRegex = new RegExp(month, "i");
      titheFilter.month = monthRegex;
      offeringFilter.month = monthRegex;
      sundayServiceFilter.month = monthRegex;
    }

    if (year && year !== "all") {
      const yearRegex = new RegExp(year, "i");
      titheFilter.month = yearRegex;
      offeringFilter.month = yearRegex;
      sundayServiceFilter.month = yearRegex;
    }

    // Fetch data from all collections
    const [titheRecords, offeringRecords, sundayServiceReports] =
      await Promise.all([
        TitheRecord.find(titheFilter),
        OfferingRecord.find(offeringFilter),
        SundayServiceReport.find(sundayServiceFilter),
      ]);

    // Process and combine data
    const processedData = processFinancialData(
      titheRecords,
      offeringRecords,
      sundayServiceReports
    );

    return NextResponse.json({
      success: true,
      data: processedData,
      summary: generateSummary(processedData),
    });
  } catch (error) {
    console.error("Error fetching financial reports:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch financial reports" },
      { status: 500 }
    );
  }
}

function processFinancialData(
  tithes: any[],
  offerings: any[],
  sundayServices: any[]
) {
  // Process tithe data
  const titheSummary = tithes.reduce(
    (acc, record) => {
      record.records.forEach((item: any) => {
        acc.totalTithe += item.total || 0;
        acc.week1 += item.week1 || 0;
        acc.week2 += item.week2 || 0;
        acc.week3 += item.week3 || 0;
        acc.week4 += item.week4 || 0;
        acc.week5 += item.week5 || 0;
      });
      return acc;
    },
    { totalTithe: 0, week1: 0, week2: 0, week3: 0, week4: 0, week5: 0 }
  );

  // Process offering data
  const offeringSummary = offerings.reduce(
    (acc, record) => {
      record.records.forEach((item: any) => {
        acc.totalOffering += item.total || 0;
        acc.sundayOffering += item.amount || 0;
      });
      return acc;
    },
    { totalOffering: 0, sundayOffering: 0 }
  );

  // Process Sunday service data
  const sundayServiceSummary = sundayServices.reduce(
    (acc, record) => {
      record.records.forEach((item: any) => {
        acc.totalIncome += item.total || 0;
        acc.tithes += item.tithes || 0;
        acc.offerings += item.offerings || 0;
        acc.specialOfferings += item.specialOfferings || 0;
        acc.attendance += item.attendance || 0;
        acc.sbsAttendance += item.sbsAttendance || 0;
        acc.visitors += item.visitors || 0;
      });
      return acc;
    },
    {
      totalIncome: 0,
      tithes: 0,
      offerings: 0,
      specialOfferings: 0,
      attendance: 0,
      sbsAttendance: 0,
      visitors: 0,
    }
  );

  return {
    titheSummary,
    offeringSummary,
    sundayServiceSummary,
    rawData: {
      tithes,
      offerings,
      sundayServices,
    },
  };
}

function generateSummary(data: any) {
  const totalIncome =
    data.titheSummary.totalTithe +
    data.offeringSummary.totalOffering +
    data.sundayServiceSummary.totalIncome;

  return {
    totalIncome,
    totalTithe: data.titheSummary.totalTithe,
    totalOffering: data.offeringSummary.totalOffering,
    totalAttendance: data.sundayServiceSummary.attendance,
    totalSBSAttendance: data.sundayServiceSummary.sbsAttendance,
    totalVisitors: data.sundayServiceSummary.visitors,
  };
}
