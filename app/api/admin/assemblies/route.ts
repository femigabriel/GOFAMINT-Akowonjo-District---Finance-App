// app/api/admin/assemblies/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SundayServiceReport from "@/models/SundayServiceReport";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Get all unique assemblies from the reports
    const assemblies = await SundayServiceReport.distinct("assembly");

    // For each assembly, get aggregated data
    const assemblyData = await Promise.all(
      assemblies.map(async (assemblyName) => {
        const reports = await SundayServiceReport.find({ assembly: assemblyName });
        
        let totalIncome = 0;
        let totalAttendance = 0;
        let totalRecords = 0;
        let lastReportDate: Date | null = null;
        let pastors = new Set<string>();

        reports.forEach(report => {
          report.records.forEach((record: any) => {
            totalIncome += record.total || 0;
            totalAttendance += (record.attendance || 0) + (record.sbsAttendance || 0) + (record.visitors || 0);
            totalRecords += 1;
          });
          
          pastors.add(report.submittedBy);
          if (!lastReportDate || report.createdAt > lastReportDate) {
            lastReportDate = report.createdAt;
          }
        });

        // Get the most recent pastor (latest report submitter)
        const latestReport = await SundayServiceReport.findOne({ assembly: assemblyName })
          .sort({ createdAt: -1 });

        return {
          name: assemblyName,
          pastor: latestReport?.submittedBy || "Unknown Pastor",
          members: Math.round(totalAttendance / Math.max(reports.length, 1)), // Average attendance
          totalIncome,
          reportsCount: reports.length,
          totalRecords,
          lastReport: lastReportDate,
          status: 'active' as const, // You might want to determine this based on activity
          location: `${assemblyName} Assembly`, // You can store this in your database if needed
          established: reports.length > 0 ? reports[0].createdAt : new Date() // First report date as established
        };
      })
    );

    // Filter by status if provided
    const filteredData = status 
      ? assemblyData.filter(assembly => assembly.status === status)
      : assemblyData;

    return NextResponse.json({
      success: true,
      data: filteredData
    });

  } catch (err: any) {
    console.error("Assemblies API error:", err);
    return NextResponse.json({ 
      success: false,
      error: err.message || "Server error" 
    }, { status: 500 });
  }
}