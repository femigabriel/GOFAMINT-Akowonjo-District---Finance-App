// app/api/admin/reports/detailed/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SundayServiceReport from "@/models/SundayServiceReport";

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const assembly = searchParams.get("assembly");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;
    
    const query: any = {};
    if (assembly && assembly !== 'all') query.assembly = assembly;
    if (month && month !== 'all' && year && year !== 'all') {
      query.month = `${month}-${year}`;
    } else if (year && year !== 'all') {
      query.month = { $regex: `-${year}$` };
    }
    
    const [reports, total] = await Promise.all([
      SundayServiceReport.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SundayServiceReport.countDocuments(query)
    ]);
    
    const formattedReports = reports.map(report => ({
      id: report._id,
      assembly: report.assembly,
      month: report.month,
      submittedBy: report.submittedBy,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      records: report.records.map((record: any) => ({
        id: record._id,
        week: record.week,
        date: record.date,
        attendance: record.attendance,
        sbsAttendance: record.sbsAttendance,
        visitors: record.visitors,
        tithes: record.tithes,
        offerings: record.offerings,
        specialOfferings: record.specialOfferings,
        etf: record.etf,
        pastorsWarfare: record.pastorsWarfare,
        vigil: record.vigil,
        thanksgiving: record.thanksgiving,
        retirees: record.retirees,
        missionaries: record.missionaries,
        youthOfferings: record.youthOfferings,
        districtSupport: record.districtSupport,
        total: record.total,
        totalAttendance: record.totalAttendance
      }))
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        reports: formattedReports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        summary: {
          totalReports: total,
          totalRecords: reports.reduce((acc, report) => acc + report.records.length, 0),
          totalAssemblies: new Set(reports.map(r => r.assembly)).size
        }
      }
    });
    
  } catch (err: any) {
    console.error("Detailed reports error:", err);
    return NextResponse.json({ 
      success: false,
      error: err.message || "Server error" 
    }, { status: 500 });
  }
}