// app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SundayServiceReport from "@/models/SundayServiceReport";

export async function GET(request: Request) {
  try {
    await dbConnect();
    console.log("Connected to MongoDB (Admin Dashboard)");

    const { searchParams } = new URL(request.url);
    const assembly = searchParams.get("assembly");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const includeDetails = searchParams.get("details") === "true"; // Add this parameter

    console.log("Admin dashboard filters:", { assembly, month, year, includeDetails });

    // Build query based on filters
    const query: any = {};
    
    if (assembly && assembly !== 'all') {
      query.assembly = assembly;
    }
    
    if (month && month !== 'all' && year && year !== 'all') {
      query.month = `${month}-${year}`;
    } else if (year && year !== 'all') {
      // Filter by year for all months
      query.month = { $regex: `-${year}$` };
    }

    console.log("Query:", query);

    // Fetch all reports based on filters
    const reports = await SundayServiceReport.find(query)
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${reports.length} reports`);

    // Calculate statistics
    const totalAssemblies = new Set(reports.map(report => report.assembly)).size;
    
    let totalMembers = 0;
    let totalIncome = 0;
    let totalReports = reports.length;

    // Process all records from all reports
    reports.forEach(report => {
      report.records.forEach((record: any) => {
        // Sum up attendance for active members estimation
        totalMembers += (record.attendance || 0) + (record.sbsAttendance || 0) + (record.visitors || 0);
        
        // Sum up total income
        totalIncome += record.total || 0;
      });
    });

    // Generate recent activities from reports
    const recentActivities = reports.slice(0, 5).map((report, index) => ({
      id: index,
      user: report.submittedBy || "Unknown User",
      action: "submitted Sunday service report for",
      target: report.assembly,
      time: new Date(report.createdAt).toLocaleDateString(),
      avatar: report.submittedBy?.charAt(0)?.toUpperCase() || "U"
    }));

    // Mock upcoming events (you can replace this with real events data)
    const upcomingEvents = [
      {
        title: "District Prayer Meeting",
        time: "Tomorrow, 6:00 PM",
        color: "blue"
      },
      {
        title: "Youth Conference",
        time: "Next Saturday, 9:00 AM",
        color: "green"
      },
      {
        title: "Leadership Training",
        time: "Next Month, 10:00 AM",
        color: "orange"
      }
    ];

    const dashboardData = {
      totalAssemblies,
      activeMembers: totalMembers,
      monthlyIncome: totalIncome,
      reportsGenerated: totalReports,
      recentActivities,
      upcomingEvents,
      // Additional data for more insights
      assemblyBreakdown: getAssemblyBreakdown(reports),
      monthlyTrends: getMonthlyTrends(reports),
      totalRecords: reports.reduce((acc, report) => acc + report.records.length, 0),
      // Include the detailed reports if requested
      ...(includeDetails && { detailedReports: reports })
    };

    console.log("Dashboard data calculated:", dashboardData);

    return NextResponse.json({
      success: true,
      data: dashboardData,
      // Include reports separately for easy access
      ...(includeDetails && { reports: formatReportsForClient(reports) })
    });

  } catch (err: any) {
    console.error("Admin dashboard error:", err);
    return NextResponse.json({ 
      success: false,
      error: err.message || "Server error" 
    }, { status: 500 });
  }
}

// NEW: Format reports specifically for client display
function formatReportsForClient(reports: any[]) {
  return reports.map(report => ({
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
}

// OR create a separate endpoint for detailed reports:
export async function POST(request: Request) {
  try {
    await dbConnect();
    const { assembly, month, year } = await request.json();
    
    const query: any = {};
    if (assembly && assembly !== 'all') query.assembly = assembly;
    if (month && month !== 'all' && year && year !== 'all') {
      query.month = `${month}-${year}`;
    } else if (year && year !== 'all') {
      query.month = { $regex: `-${year}$` };
    }
    
    const reports = await SundayServiceReport.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      reports: formatReportsForClient(reports),
      count: reports.length,
      totalRecords: reports.reduce((acc, report) => acc + report.records.length, 0)
    });
    
  } catch (err: any) {
    console.error("Detailed reports error:", err);
    return NextResponse.json({ 
      success: false,
      error: err.message || "Server error" 
    }, { status: 500 });
  }
}

// Helper functions remain the same...
function getAssemblyBreakdown(reports: any[]) {
  const assemblyData: { [key: string]: { income: number; records: number; attendance: number } } = {};
  
  reports.forEach(report => {
    if (!assemblyData[report.assembly]) {
      assemblyData[report.assembly] = { income: 0, records: 0, attendance: 0 };
    }
    
    report.records.forEach((record: any) => {
      assemblyData[report.assembly].income += record.total || 0;
      assemblyData[report.assembly].records += 1;
      assemblyData[report.assembly].attendance += 
        (record.attendance || 0) + (record.sbsAttendance || 0) + (record.visitors || 0);
    });
  });

  return Object.entries(assemblyData).map(([assembly, data]) => ({
    assembly,
    ...data
  }));
}

function getMonthlyTrends(reports: any[]) {
  const monthlyData: { [key: string]: number } = {};
  
  reports.forEach(report => {
    const month = report.month;
    if (!monthlyData[month]) {
      monthlyData[month] = 0;
    }
    
    report.records.forEach((record: any) => {
      monthlyData[month] += record.total || 0;
    });
  });

  return Object.entries(monthlyData)
    .map(([month, income]) => ({ month, income }))
    .sort((a, b) => {
      const [aMonth, aYear] = a.month.split('-');
      const [bMonth, bYear] = b.month.split('-');
      return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
    });
}