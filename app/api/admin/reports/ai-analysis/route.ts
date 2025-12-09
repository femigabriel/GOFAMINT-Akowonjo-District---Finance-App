import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ReportRecord {
  id: string;
  week?: string;
  date: string;
  attendance: number;
  sbsAttendance?: number;
  visitors?: number;
  tithes?: number;
  offerings?: number;
  specialOfferings?: number;
  etf?: number;
  pastorsWarfare?: number;
  vigil?: number;
  thanksgiving?: number;
  retirees?: number;
  missionaries?: number;
  youthOfferings?: number;
  districtSupport?: number;
  total: number;
  totalAttendance?: number;
  offering?: number; // For midweek
  day?: string; // For midweek
}

interface Report {
  id: string;
  assembly: string;
  month: string;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
  serviceType: 'sunday' | 'midweek' | 'special';
  records: ReportRecord[];
}

interface Summary {
  totalReports: number;
  totalRecords: number;
  totalAssemblies: number;
  sundayReports: number;
  midweekReports: number;
  specialReports: number;
  totalIncome: number;
  sundayIncome: number;
  midweekIncome: number;
  specialIncome: number;
  sundayTithes: number;
  totalAttendance: number;
  sundayAttendance: number;
  midweekAttendance: number;
  specialAttendance: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ReportData {
  reports: Report[];
  pagination: Pagination;
  summary: Summary;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month') || 'December-2025';
    const detailed = searchParams.get('detailed') === 'true';
    
    // Fetch reports from your existing endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const reportsResponse = await fetch(`${baseUrl}/api/admin/reports/detailed?month=${month}`);
    
    if (!reportsResponse.ok) {
      throw new Error('Failed to fetch reports data');
    }
    
    const reportsData = await reportsResponse.json();
    
    if (!reportsData.success) {
      throw new Error('Failed to fetch reports');
    }
    
    const data: ReportData = reportsData.data;
    
    // Prepare data for AI analysis
    const analysis = await generateAIAnalysis(data);
    
    // If detailed analysis is requested, generate comprehensive report
    let detailedAnalysis = null;
    if (detailed) {
      detailedAnalysis = await generateDetailedReport(data);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        analysis,
        detailedReport: detailedAnalysis,
        timestamp: new Date().toISOString(),
        month: month,
      }
    });
    
  } catch (error: any) {
    console.error('Error generating AI report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate AI report',
      },
      { status: 500 }
    );
  }
}

async function generateAIAnalysis(data: ReportData) {
  const { reports, summary } = data;
  
  // Calculate additional metrics
  const assemblies = Array.from(new Set(reports.map(r => r.assembly)));
  const monthlyData = analyzeMonthlyData(reports);
  const assemblyPerformance = analyzeAssemblyPerformance(reports);
  const financialHealth = analyzeFinancialHealth(data);
  const growthTrends = analyzeGrowthTrends(reports);
  
  const prompt = createAnalysisPrompt(summary, assemblies, monthlyData, assemblyPerformance, financialHealth, growthTrends);
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a church financial and growth analyst. Provide insightful, data-driven analysis for church leadership. Focus on key metrics, trends, and actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });
    
    return {
      summary: completion.choices[0].message.content,
      metrics: {
        totalAssemblies: assemblies.length,
        totalIncome: summary.totalIncome,
        averageAssemblyIncome: Math.round(summary.totalIncome / assemblies.length),
        averageAttendance: Math.round(summary.totalAttendance / summary.totalRecords),
        incomePerAttendee: summary.totalIncome / summary.totalAttendance,
        tithesPercentage: (summary.sundayTithes / summary.sundayIncome * 100).toFixed(1),
        assemblyPerformance,
        financialHealth,
        growthIndicators: growthTrends,
      }
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateFallbackAnalysis(summary, assemblies, assemblyPerformance, financialHealth, growthTrends);
  }
}

async function generateDetailedReport(data: ReportData) {
  const { reports, summary } = data;
  
  const detailedPrompt = createDetailedReportPrompt(data);
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a church administration expert. Generate a comprehensive monthly report including executive summary, financial analysis, attendance analysis, assembly performance, recommendations, and next steps."
        },
        {
          role: "user",
          content: detailedPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });
    
    return completion.choices[0].message.content;
    
  } catch (error) {
    console.error('OpenAI API error for detailed report:', error);
    return generateFallbackDetailedReport(data);
  }
}

function analyzeMonthlyData(reports: Report[]) {
  // Group data by assembly and service type
  const assemblyData: Record<string, any> = {};
  
  reports.forEach(report => {
    if (!assemblyData[report.assembly]) {
      assemblyData[report.assembly] = {
        sunday: { income: 0, attendance: 0, records: 0 },
        midweek: { income: 0, attendance: 0, records: 0 }
      };
    }
    
    const serviceKey = report.serviceType === 'sunday' ? 'sunday' : 'midweek';
    const totalIncome = report.records.reduce((sum, record) => sum + record.total, 0);
    const totalAttendance = report.records.reduce((sum, record) => sum + (record.attendance || 0), 0);
    
    assemblyData[report.assembly][serviceKey].income += totalIncome;
    assemblyData[report.assembly][serviceKey].attendance += totalAttendance;
    assemblyData[report.assembly][serviceKey].records += report.records.length;
  });
  
  return assemblyData;
}

function analyzeAssemblyPerformance(reports: Report[]) {
  const assemblyMetrics: Record<string, any> = {};
  
  reports.forEach(report => {
    if (!assemblyMetrics[report.assembly]) {
      assemblyMetrics[report.assembly] = {
        totalIncome: 0,
        totalAttendance: 0,
        recordsCount: 0,
        services: new Set()
      };
    }
    
    const totalIncome = report.records.reduce((sum, record) => sum + record.total, 0);
    const totalAttendance = report.records.reduce((sum, record) => sum + (record.attendance || 0), 0);
    
    assemblyMetrics[report.assembly].totalIncome += totalIncome;
    assemblyMetrics[report.assembly].totalAttendance += totalAttendance;
    assemblyMetrics[report.assembly].recordsCount += report.records.length;
    assemblyMetrics[report.assembly].services.add(report.serviceType);
  });
  
  // Calculate performance metrics
  const performance = Object.entries(assemblyMetrics).map(([assembly, metrics]) => {
    const avgIncomePerService = metrics.totalIncome / metrics.recordsCount;
    const avgAttendancePerService = metrics.totalAttendance / metrics.recordsCount;
    const incomePerAttendee = metrics.totalIncome / metrics.totalAttendance;
    
    let performanceRating = 'Average';
    if (avgIncomePerService > 20000) performanceRating = 'Excellent';
    else if (avgIncomePerService > 10000) performanceRating = 'Good';
    else if (avgIncomePerService < 5000) performanceRating = 'Needs Improvement';
    
    return {
      assembly,
      totalIncome: metrics.totalIncome,
      totalAttendance: metrics.totalAttendance,
      servicesCount: metrics.services.size,
      recordsCount: metrics.recordsCount,
      avgIncomePerService: Math.round(avgIncomePerService),
      avgAttendancePerService: Math.round(avgAttendancePerService),
      incomePerAttendee: Math.round(incomePerAttendee),
      performanceRating
    };
  });
  
  // Sort by total income (descending)
  return performance.sort((a, b) => b.totalIncome - a.totalIncome);
}

function analyzeFinancialHealth(data: ReportData) {
  const { summary, reports } = data;
  
  // Calculate tithe percentage
  const tithePercentage = summary.sundayTithes / summary.sundayIncome * 100;
  
  // Calculate offering distribution
  const sundayReports = reports.filter(r => r.serviceType === 'sunday');
  let totalOfferings = 0;
  let totalPastorsWarfare = 0;
  let totalThanksgiving = 0;
  
  sundayReports.forEach(report => {
    report.records.forEach(record => {
      totalOfferings += record.offerings || 0;
      totalPastorsWarfare += record.pastorsWarfare || 0;
      totalThanksgiving += record.thanksgiving || 0;
    });
  });
  
  return {
    tithePercentage: tithePercentage.toFixed(1),
    offeringsPercentage: ((totalOfferings / summary.sundayIncome) * 100).toFixed(1),
    pastorsWarfarePercentage: ((totalPastorsWarfare / summary.sundayIncome) * 100).toFixed(1),
    thanksgivingPercentage: ((totalThanksgiving / summary.sundayIncome) * 100).toFixed(1),
    financialHealthScore: calculateFinancialHealthScore(summary),
    recommendations: generateFinancialRecommendations(tithePercentage, summary)
  };
}

function analyzeGrowthTrends(reports: Report[]) {
  // This would ideally compare with previous months
  // For now, analyze current data patterns
  
  const assemblies = Array.from(new Set(reports.map(r => r.assembly)));
  const sundayReports = reports.filter(r => r.serviceType === 'sunday');
  
  let totalSbsAttendance = 0;
  let totalVisitors = 0;
  
  sundayReports.forEach(report => {
    report.records.forEach(record => {
      totalSbsAttendance += record.sbsAttendance || 0;
      totalVisitors += record.visitors || 0;
    });
  });
  
  const sbsRatio = totalSbsAttendance / (reports.reduce((sum, r) => sum + r.records.reduce((s, rec) => s + (rec.attendance || 0), 0), 0));
  const visitorRate = totalVisitors / assemblies.length;
  
  return {
    sbsParticipationRate: (sbsRatio * 100).toFixed(1),
    averageVisitorsPerAssembly: visitorRate.toFixed(1),
    growthPotential: sbsRatio > 0.5 ? 'High' : 'Moderate',
    visitorEngagement: visitorRate > 2 ? 'Excellent' : 'Good'
  };
}

function createAnalysisPrompt(
  summary: Summary,
  assemblies: string[],
  monthlyData: any,
  assemblyPerformance: any[],
  financialHealth: any,
  growthTrends: any
): string {
  return `
Analyze this church district performance data and provide key insights:

MONTHLY SUMMARY:
- Total Assemblies: ${assemblies.length}
- Total Income: ₦${summary.totalIncome.toLocaleString()}
- Total Attendance: ${summary.totalAttendance}
- Sunday Services: ${summary.sundayReports} reports, ₦${summary.sundayIncome.toLocaleString()} income
- Midweek Services: ${summary.midweekReports} reports, ₦${summary.midweekIncome.toLocaleString()} income

ASSEMBLY PERFORMANCE (Top 3 by income):
${assemblyPerformance.slice(0, 3).map(asm => 
  `- ${asm.assembly}: ₦${asm.totalIncome.toLocaleString()} (${asm.performanceRating})`
).join('\n')}

FINANCIAL HEALTH:
- Tithe Percentage: ${financialHealth.tithePercentage}%
- Financial Health Score: ${financialHealth.financialHealthScore}/10

GROWTH INDICATORS:
- SBS Participation: ${growthTrends.sbsParticipationRate}%
- Visitor Rate: ${growthTrends.averageVisitorsPerAssembly} per assembly

Please provide:
1. EXECUTIVE SUMMARY: Key achievements and areas for improvement
2. FINANCIAL ANALYSIS: Revenue streams, giving patterns, financial health
3. ATTENDANCE ANALYSIS: Growth patterns, engagement levels
4. ASSEMBLY HIGHLIGHTS: Top performers and those needing support
5. RECOMMENDATIONS: Actionable steps for improvement
6. NEXT STEPS: Priority areas for next month

Keep the analysis data-driven, practical, and focused on church growth and financial sustainability.`;
}

function createDetailedReportPrompt(data: ReportData): string {
  const { reports, summary } = data;
  
  // Generate assembly-specific details
  const assemblyDetails = reports.reduce((acc: Record<string, any>, report) => {
    if (!acc[report.assembly]) {
      acc[report.assembly] = {
        sunday: { income: 0, attendance: 0, records: [] },
        midweek: { income: 0, attendance: 0, records: [] }
      };
    }
    
    const serviceKey = report.serviceType === 'sunday' ? 'sunday' : 'midweek';
    const totalIncome = report.records.reduce((sum, record) => sum + record.total, 0);
    const totalAttendance = report.records.reduce((sum, record) => sum + (record.attendance || 0), 0);
    
    acc[report.assembly][serviceKey].income += totalIncome;
    acc[report.assembly][serviceKey].attendance += totalAttendance;
    acc[report.assembly][serviceKey].records.push(...report.records);
    
    return acc;
  }, {});
  
  let detailedText = `DETAILED MONTHLY CHURCH REPORT\n`;
  detailedText += `Month: ${reports[0]?.month || 'N/A'}\n\n`;
  
  detailedText += `ASSEMBLY BREAKDOWN:\n`;
  Object.entries(assemblyDetails).forEach(([assembly, data]: [string, any]) => {
    detailedText += `\n${assembly}:\n`;
    detailedText += `  Sunday: ₦${data.sunday.income.toLocaleString()} (${data.sunday.attendance} attendees)\n`;
    detailedText += `  Midweek: ₦${data.midweek.income.toLocaleString()} (${data.midweek.attendance} attendees)\n`;
  });
  
  detailedText += `\nFINANCIAL SUMMARY:\n`;
  detailedText += `Total Income: ₦${summary.totalIncome.toLocaleString()}\n`;
  detailedText += `Sunday Income: ₦${summary.sundayIncome.toLocaleString()}\n`;
  detailedText += `Midweek Income: ₦${summary.midweekIncome.toLocaleString()}\n`;
  detailedText += `Tithes: ₦${summary.sundayTithes.toLocaleString()}\n`;
  
  detailedText += `\nATTENDANCE SUMMARY:\n`;
  detailedText += `Total Attendance: ${summary.totalAttendance}\n`;
  detailedText += `Sunday Attendance: ${summary.sundayAttendance}\n`;
  detailedText += `Midweek Attendance: ${summary.midweekAttendance}\n`;
  
  detailedText += `\nPlease generate a comprehensive report including:\n`;
  detailedText += `1. Executive Summary with key metrics\n`;
  detailedText += `2. Detailed Financial Analysis\n`;
  detailedText += `3. Attendance and Growth Analysis\n`;
  detailedText += `4. Assembly Performance Comparison\n`;
  detailedText += `5. Giving Patterns and Trends\n`;
  detailedText += `6. Strategic Recommendations\n`;
  detailedText += `7. Action Plan for Next Month\n\n`;
  detailedText += `Format as a professional church administration report.`;
  
  return detailedText;
}

function calculateFinancialHealthScore(summary: Summary): number {
  let score = 5; // Base score
  
  // Evaluate based on various metrics
  const incomePerAssembly = summary.totalIncome / summary.totalAssemblies;
  if (incomePerAssembly > 30000) score += 2;
  else if (incomePerAssembly > 15000) score += 1;
  else if (incomePerAssembly < 5000) score -= 2;
  
  const tithePercentage = summary.sundayTithes / summary.sundayIncome;
  if (tithePercentage > 0.15) score += 1;
  else if (tithePercentage < 0.05) score -= 1;
  
  const attendancePerAssembly = summary.totalAttendance / summary.totalAssemblies;
  if (attendancePerAssembly > 100) score += 1;
  else if (attendancePerAssembly < 30) score -= 1;
  
  return Math.min(10, Math.max(1, score));
}

function generateFinancialRecommendations(tithePercentage: number, summary: Summary): string[] {
  const recommendations: string[] = [];
  
  if (tithePercentage < 10) {
    recommendations.push("Consider emphasizing tithing teachings to increase tithe percentage");
  }
  
  if (summary.midweekIncome / summary.totalIncome < 0.1) {
    recommendations.push("Focus on midweek service engagement to diversify income streams");
  }
  
  const incomePerAttendee = summary.totalIncome / summary.totalAttendance;
  if (incomePerAttendee < 500) {
    recommendations.push("Implement stewardship programs to increase giving per attendee");
  }
  
  return recommendations;
}

function generateFallbackAnalysis(
  summary: Summary,
  assemblies: string[],
  assemblyPerformance: any[],
  financialHealth: any,
  growthTrends: any
) {
  return {
    summary: `Fallback Analysis: District with ${assemblies.length} assemblies generated ₦${summary.totalIncome.toLocaleString()} total income with ${summary.totalAttendance} total attendance. Top performing assembly: ${assemblyPerformance[0]?.assembly || 'N/A'}.`,
    metrics: {
      totalAssemblies: assemblies.length,
      totalIncome: summary.totalIncome,
      averageAssemblyIncome: Math.round(summary.totalIncome / assemblies.length),
      averageAttendance: Math.round(summary.totalAttendance / summary.totalRecords),
      incomePerAttendee: summary.totalIncome / summary.totalAttendance,
      tithesPercentage: (summary.sundayTithes / summary.sundayIncome * 100).toFixed(1),
      assemblyPerformance,
      financialHealth,
      growthIndicators: growthTrends,
    }
  };
}

function generateFallbackDetailedReport(data: ReportData): string {
  const { summary, reports } = data;
  
  return `MONTHLY CHURCH REPORT - FALLBACK VERSION

Executive Summary:
This month, ${summary.totalAssemblies} assemblies reported a total income of ₦${summary.totalIncome.toLocaleString()} with ${summary.totalAttendance} total attendees.

Financial Overview:
- Total Income: ₦${summary.totalIncome.toLocaleString()}
- Sunday Services: ₦${summary.sundayIncome.toLocaleString()}
- Midweek Services: ₦${summary.midweekIncome.toLocaleString()}
- Tithes Collected: ₦${summary.sundayTithes.toLocaleString()}

Attendance Summary:
- Total: ${summary.totalAttendance} attendees
- Sunday: ${summary.sundayAttendance}
- Midweek: ${summary.midweekAttendance}

Assemblies Reporting: ${reports.map(r => r.assembly).filter((v, i, a) => a.indexOf(v) === i).join(', ')}

Recommendations:
1. Review giving patterns across assemblies
2. Focus on increasing midweek engagement
3. Monitor attendance growth trends
4. Consider stewardship teaching emphasis

Note: This is a fallback report. For AI-generated insights, ensure OpenAI API is properly configured.`;
}