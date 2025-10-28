// app/api/financial-reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import TitheRecord from "@/models/TitheRecord";
import OfferingRecord from "@/models/OfferingRecord";
import SundayServiceReport from "@/models/SundayServiceReport";
import { assemblies } from "@/lib/assemblies";

export async function GET(request: NextRequest) {
  try {
    await dbConnect("gof-akowonjo");

    const { searchParams } = new URL(request.url);
    const assemblyParam = searchParams.get("assembly") || "all";
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    // Build base filters without assembly
    const baseFilters: any = {};
    const monthStr = monthParam && monthParam !== "all" ? monthParam : null;
    const yearStr = yearParam && yearParam !== "all" ? yearParam : null;

    if (monthStr || yearStr) {
      let regexStr = "";
      if (monthStr && yearStr) {
        regexStr = `^${monthStr}-${yearStr}$`;
      } else if (monthStr) {
        regexStr = `^${monthStr}-\\d{4}$`;
      } else {
        regexStr = `^\\w+-${yearStr}$`;
      }
      baseFilters.month = { $regex: regexStr, $options: "i" };
    }

    // Apply assembly filter if not 'all'
    const isAll = assemblyParam === "all";
    const assemblyFilter = isAll ? {} : { assembly: assemblyParam };

    // Final filters
    const titheFilter = { ...assemblyFilter, ...baseFilters };
    const offeringFilter = { ...assemblyFilter, ...baseFilters };
    const sundayServiceFilter = { ...assemblyFilter, ...baseFilters };

    // Fetch data
    const [titheRecords, offeringRecords, sundayServiceReports] = await Promise.all([
      TitheRecord.find(titheFilter),
      OfferingRecord.find(offeringFilter),
      SundayServiceReport.find(sundayServiceFilter),
    ]);

    let processedData = processFinancialData(titheRecords, offeringRecords, sundayServiceReports);
    let summary = generateSummary(processedData);
    let perAssembly = null;

    if (isAll) {
      perAssembly = {};
      assemblies.forEach((ass) => {
        const titheForAss = titheRecords.filter((r) => r.assembly === ass);
        const offeringForAss = offeringRecords.filter((r) => r.assembly === ass);
        const sundayForAss = sundayServiceReports.filter((r) => r.assembly === ass);

        const assProcessed = processFinancialData(titheForAss, offeringForAss, sundayForAss);
        const assSummary = generateSummary(assProcessed);

        const timestamps = [
          ...titheForAss.map((r) => new Date(r.createdAt).getTime()),
          ...offeringForAss.map((r) => new Date(r.createdAt).getTime()),
          ...sundayForAss.map((r) => new Date(r.createdAt).getTime()),
        ];
        const lastUpdate = timestamps.length > 0 ? Math.max(...timestamps) : 0;

        perAssembly[ass] = {
          hasData: titheForAss.length > 0 || offeringForAss.length > 0 || sundayForAss.length > 0,
          lastUpdate: lastUpdate > 0 ? new Date(lastUpdate).toISOString() : null,
          summary: assSummary,
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: processedData,
      summary,
      ...(perAssembly && { perAssembly }),
    });
  } catch (error) {
    console.error("Error fetching financial reports:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch financial reports" },
      { status: 500 }
    );
  }
}

function processFinancialData(tithes: any[], offerings: any[], sundayServices: any[]) {
  // Process tithe data
  const titheSummary = tithes.reduce(
    (acc, record) => {
      if (record.records) {
        record.records.forEach((item: any) => {
          acc.totalTithe += item.total || 0;
          acc.week1 += item.week1 || 0;
          acc.week2 += item.week2 || 0;
          acc.week3 += item.week3 || 0;
          acc.week4 += item.week4 || 0;
          acc.week5 += item.week5 || 0;
        });
      }
      return acc;
    },
    { totalTithe: 0, week1: 0, week2: 0, week3: 0, week4: 0, week5: 0 }
  );

  // Process offering data
  const offeringSummary = offerings.reduce(
    (acc, record) => {
      if (record.records) {
        record.records.forEach((item: any) => {
          acc.totalOffering += item.total || 0;
          acc.sundayOffering += item.amount || 0;
        });
      }
      return acc;
    },
    { totalOffering: 0, sundayOffering: 0 }
  );

  // Process Sunday service data (add more fields if needed for full income breakdown)
  const sundayServiceSummary = sundayServices.reduce(
    (acc, record) => {
      if (record.records) {
        record.records.forEach((item: any) => {
          acc.totalIncome += item.total || 0;
          acc.tithes += item.tithes || 0;
          acc.offerings += item.offerings || 0;
          acc.specialOfferings += item.specialOfferings || 0;
          acc.attendance += item.attendance || 0;
          acc.sbsAttendance += item.sbsAttendance || 0;
          acc.visitors += item.visitors || 0;
          // Add other income fields if needed
          // acc.etf += item.etf || 0;
          // etc.
        });
      }
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
  // Sum distinct sources; adjust for overlaps as needed (e.g., if Sunday includes tithes/offerings, subtract)
  const totalIncome =
    data.titheSummary.totalTithe +
    data.offeringSummary.totalOffering +
    data.sundayServiceSummary.specialOfferings; // Excluding sunday.tithes and sunday.offerings to avoid double-counting

  return {
    totalIncome,
    totalTithe: data.titheSummary.totalTithe,
    totalOffering: data.offeringSummary.totalOffering,
    totalAttendance: data.sundayServiceSummary.attendance,
    totalSBSAttendance: data.sundayServiceSummary.sbsAttendance,
    totalVisitors: data.sundayServiceSummary.visitors,
  };
}