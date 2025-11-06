// app/api/admin/assembly-details/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SundayServiceReport from "@/models/SundayServiceReport";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const assembly = searchParams.get("assembly");

    if (!assembly) {
      return NextResponse.json({ error: "Assembly name required" }, { status: 400 });
    }

    // Fetch all reports for this assembly
    const reports = await SundayServiceReport.find({ assembly })
      .sort({ createdAt: -1 })
      .lean();

    if (reports.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No data found for this assembly" 
      });
    }

    // Calculate totals
    let totalIncome = 0;
    let totalAttendance = 0;
    let totalRecords = 0;

    // Group by month for monthly breakdown
    const monthlyData: { [key: string]: { income: number; attendance: number; records: number } } = {};
    
    reports.forEach(report => {
      report.records.forEach((record: any) => {
        totalIncome += record.total || 0;
        totalAttendance += (record.attendance || 0) + (record.sbsAttendance || 0) + (record.visitors || 0);
        totalRecords += 1;

        // Group by month
        if (!monthlyData[report.month]) {
          monthlyData[report.month] = { income: 0, attendance: 0, records: 0 };
        }
        monthlyData[report.month].income += record.total || 0;
        monthlyData[report.month].attendance += (record.attendance || 0) + (record.sbsAttendance || 0) + (record.visitors || 0);
        monthlyData[report.month].records += 1;
      });
    });

    // Prepare recent reports
    const recentReports = reports.slice(0, 5).map(report => ({
      month: report.month,
      submittedBy: report.submittedBy,
      createdAt: report.createdAt,
      totalRecords: report.records.length
    }));

    const assemblyDetails = {
      assembly,
      income: totalIncome,
      attendance: totalAttendance,
      records: totalRecords,
      monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...data
      })).sort((a, b) => {
        // Sort months chronologically
        const [aMonth, aYear] = a.month.split('-');
        const [bMonth, bYear] = b.month.split('-');
        return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
      }),
      recentReports
    };

    return NextResponse.json({
      success: true,
      data: assemblyDetails
    });

  } catch (err: any) {
    console.error("Assembly details error:", err);
    return NextResponse.json({ 
      success: false,
      error: err.message || "Server error" 
    }, { status: 500 });
  }
}