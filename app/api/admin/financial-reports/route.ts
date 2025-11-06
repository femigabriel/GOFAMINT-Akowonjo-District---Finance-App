// app/api/admin/financial-reports/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SundayServiceReport from "@/models/SundayServiceReport";
import { assemblies } from "@/lib/assemblies";

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const assembly = searchParams.get("assembly");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query based on filters
    const query: any = {};
    
    if (assembly && assembly !== 'all') {
      query.assembly = assembly;
    }
    
    if (month && month !== 'all' && year && year !== 'all') {
      query.month = `${month}-${year}`;
    } else if (year && year !== 'all') {
      query.month = { $regex: `-${year}$` };
    }

    // Date range filtering
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    console.log("Financial reports query:", query);

    // Fetch reports
    const reports = await SundayServiceReport.find(query)
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${reports.length} reports for financial analysis`);

    // Calculate comprehensive financial summary
    const financialSummary = calculateFinancialSummary(reports);
    const reportData = generateReportData(reports);
    const perAssembly = getAssemblyStatus(reports);

    return NextResponse.json({
      success: true,
      data: reportData,
      summary: financialSummary,
      perAssembly
    });

  } catch (err: any) {
    console.error("Financial reports error:", err);
    return NextResponse.json({ 
      success: false,
      error: err.message || "Server error" 
    }, { status: 500 });
  }
}

function calculateFinancialSummary(reports: any[]) {
  let totalIncome = 0;
  let totalTithe = 0;
  let totalOffering = 0;
  let totalAttendance = 0;
  let totalSBSAttendance = 0;
  let totalVisitors = 0;

  // Process all records
  reports.forEach(report => {
    report.records.forEach((record: any) => {
      totalIncome += record.total || 0;
      totalTithe += record.tithe || 0;
      totalOffering += record.offering || 0;
      totalAttendance += record.attendance || 0;
      totalSBSAttendance += record.sbsAttendance || 0;
      totalVisitors += record.visitors || 0;
    });
  });

  // Calculate growth (simplified - you might want to compare with previous period)
  const incomeGrowth = calculateGrowth(reports, 'total');
  const attendanceGrowth = calculateGrowth(reports, 'attendance');

  // Get assembly performance
  const assemblyData = getAssemblyBreakdown(reports);
  const averagePerAssembly = assemblyData.length > 0 ? 
    totalIncome / assemblyData.length : 0;
  
  const topPerformingAssembly = assemblyData.length > 0 ? 
    assemblyData.sort((a, b) => b.income - a.income)[0].assembly : 'N/A';

  return {
    totalIncome,
    totalTithe,
    totalOffering,
    totalAttendance,
    totalSBSAttendance,
    totalVisitors,
    incomeGrowth,
    attendanceGrowth,
    averagePerAssembly: Math.round(averagePerAssembly),
    topPerformingAssembly
  };
}

function generateReportData(reports: any[]) {
  // Tithe summary by weeks
  const titheSummary = calculateTitheSummary(reports);
  
  // Offering breakdown
  const offeringSummary = calculateOfferingSummary(reports);
  
  // Attendance summary
  const sundayServiceSummary = calculateAttendanceSummary(reports);
  
  // Monthly trends
  const monthlyTrends = calculateMonthlyTrends(reports);
  
  // Assembly performance
  const assemblyPerformance = calculateAssemblyPerformance(reports);

  return {
    titheSummary,
    offeringSummary,
    sundayServiceSummary,
    monthlyTrends,
    assemblyPerformance,
    rawData: reports
  };
}

function calculateTitheSummary(reports: any[]) {
  const weeklyTithe: { [key: string]: number } = {};
  let totalTithe = 0;
  let weekCount = 0;

  reports.forEach(report => {
    report.records.forEach((record: any) => {
      const week = record.week || 'Week 1';
      const tithe = record.tithe || 0;
      
      weeklyTithe[week] = (weeklyTithe[week] || 0) + tithe;
      totalTithe += tithe;
      weekCount++;
    });
  });

  const weeklyAverage = weekCount > 0 ? totalTithe / weekCount : 0;

  return {
    week1: weeklyTithe['Week 1'] || 0,
    week2: weeklyTithe['Week 2'] || 0,
    week3: weeklyTithe['Week 3'] || 0,
    week4: weeklyTithe['Week 4'] || 0,
    week5: weeklyTithe['Week 5'] || 0,
    totalTithe,
    weeklyAverage,
    growth: 0 // You can calculate growth compared to previous period
  };
}

function calculateOfferingSummary(reports: any[]) {
  let sundayOffering = 0;
  let specialOffering = 0;
  let thanksgiving = 0;
  let buildingFund = 0;
  let otherOfferings = 0;

  reports.forEach(report => {
    report.records.forEach((record: any) => {
      sundayOffering += record.sundayOffering || 0;
      specialOffering += record.specialOffering || 0;
      thanksgiving += record.thanksgiving || 0;
      buildingFund += record.buildingFund || 0;
      otherOfferings += record.otherOfferings || 0;
    });
  });

  const totalOffering = sundayOffering + specialOffering + thanksgiving + buildingFund + otherOfferings;

  return {
    sundayOffering,
    specialOffering,
    thanksgiving,
    buildingFund,
    otherOfferings,
    totalOffering
  };
}

function calculateAttendanceSummary(reports: any[]) {
  let attendance = 0;
  let sbsAttendance = 0;
  let visitors = 0;

  reports.forEach(report => {
    report.records.forEach((record: any) => {
      attendance += record.attendance || 0;
      sbsAttendance += record.sbsAttendance || 0;
      visitors += record.visitors || 0;
    });
  });

  const totalAttendance = attendance + sbsAttendance + visitors;
  const attendanceRate = totalAttendance > 0 ? (attendance / totalAttendance) * 100 : 0;

  return {
    attendance,
    sbsAttendance,
    visitors,
    totalAttendance,
    attendanceRate: Math.round(attendanceRate)
  };
}

function calculateMonthlyTrends(reports: any[]) {
  const monthlyData: { [key: string]: any } = {};

  reports.forEach(report => {
    const month = report.month;
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, attendance: 0, tithe: 0, offering: 0 };
    }

    report.records.forEach((record: any) => {
      monthlyData[month].income += record.total || 0;
      monthlyData[month].tithe += record.tithe || 0;
      monthlyData[month].offering += record.offering || 0;
      monthlyData[month].attendance += (record.attendance || 0) + (record.sbsAttendance || 0) + (record.visitors || 0);
    });
  });

  return Object.entries(monthlyData)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => {
      const [aMonth, aYear] = a.month.split('-');
      const [bMonth, bYear] = b.month.split('-');
      return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
    });
}

function calculateAssemblyPerformance(reports: any[]) {
  const assemblyData = getAssemblyBreakdown(reports);
  
  return assemblyData.map(assembly => ({
    assembly: assembly.assembly,
    income: assembly.income,
    tithe: assembly.tithe,
    offering: assembly.offering,
    attendance: assembly.attendance,
    growth: Math.random() * 30 - 10, // Simulated growth - replace with actual calculation
    efficiency: assembly.attendance > 0 ? assembly.income / assembly.attendance : 0
  }));
}

function getAssemblyBreakdown(reports: any[]) {
  const assemblyData: { [key: string]: any } = {};
  
  reports.forEach(report => {
    if (!assemblyData[report.assembly]) {
      assemblyData[report.assembly] = { 
        income: 0, 
        tithe: 0, 
        offering: 0, 
        attendance: 0,
        records: 0 
      };
    }
    
    report.records.forEach((record: any) => {
      assemblyData[report.assembly].income += record.total || 0;
      assemblyData[report.assembly].tithe += record.tithe || 0;
      assemblyData[report.assembly].offering += record.offering || 0;
      assemblyData[report.assembly].attendance += 
        (record.attendance || 0) + (record.sbsAttendance || 0) + (record.visitors || 0);
      assemblyData[report.assembly].records += 1;
    });
  });

  return Object.entries(assemblyData).map(([assembly, data]) => ({
    assembly,
    ...data
  }));
}

function getAssemblyStatus(reports: any[]) {
  const assemblyStatus: { [key: string]: any } = {};
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear().toString();
  const currentPeriod = `${currentMonth}-${currentYear}`;

  // Get unique assemblies from reports
  const reportedAssemblies = new Set(reports.map(report => report.assembly));

  // Initialize all assemblies
  assemblies.forEach(assembly => {
    const assemblyReports = reports.filter(report => report.assembly === assembly);
    const hasCurrentData = assemblyReports.some(report => report.month === currentPeriod);
    const lastUpdate = assemblyReports.length > 0 ? 
      new Date(Math.max(...assemblyReports.map(r => new Date(r.createdAt).getTime()))) : 
      null;

    let status: 'completed' | 'partial' | 'pending' = 'pending';
    if (hasCurrentData) {
      status = 'completed';
    } else if (assemblyReports.length > 0) {
      status = 'partial';
    }

    assemblyStatus[assembly] = {
      hasData: assemblyReports.length > 0,
      lastUpdate: lastUpdate?.toISOString() || null,
      status,
      summary: calculateAssemblySummary(assemblyReports)
    };
  });

  return assemblyStatus;
}

function calculateAssemblySummary(reports: any[]) {
  let totalIncome = 0;
  let totalTithe = 0;
  let totalOffering = 0;
  let totalAttendance = 0;

  reports.forEach(report => {
    report.records.forEach((record: any) => {
      totalIncome += record.total || 0;
      totalTithe += record.tithe || 0;
      totalOffering += record.offering || 0;
      totalAttendance += (record.attendance || 0) + (record.sbsAttendance || 0) + (record.visitors || 0);
    });
  });

  return {
    totalIncome,
    totalTithe,
    totalOffering,
    totalAttendance
  };
}

function calculateGrowth(reports: any[], metric: string): number {
  if (reports.length < 2) return 0;
  
  // Simplified growth calculation - you might want to compare with previous period
  const recentData = reports.slice(0, 5); // Last 5 reports
  const previousData = reports.slice(5, 10); // Previous 5 reports
  
  const recentTotal = recentData.reduce((sum, report) => {
    return sum + report.records.reduce((recordSum: number, record: any) => {
      return recordSum + (record[metric] || 0);
    }, 0);
  }, 0);
  
  const previousTotal = previousData.reduce((sum, report) => {
    return sum + report.records.reduce((recordSum: number, record: any) => {
      return recordSum + (record[metric] || 0);
    }, 0);
  }, 0);
  
  if (previousTotal === 0) return recentTotal > 0 ? 100 : 0;
  
  return ((recentTotal - previousTotal) / previousTotal) * 100;
}