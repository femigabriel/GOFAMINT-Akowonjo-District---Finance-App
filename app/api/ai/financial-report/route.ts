// app/api/ai/financial-report/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ReportData {
  reports: any[];
  summary: {
    totalIncome: number;
    totalAttendance: number;
    sundayReports: number;
    midweekReports: number;
    specialReports: number;
    sundayIncome: number;
    midweekIncome: number;
    specialIncome: number;
    sundayTithes: number;
    sundayAttendance: number;
    midweekAttendance: number;
    specialAttendance: number;
  };
  serviceType: string;
  assembly?: string;
  month?: string;
  year?: string;
}

interface FinancialReportResponse {
  executive_summary: string;
  key_findings: string[];
  recommendations: string[];
  financial_analysis: {
    revenue_trends: string;
    attendance_patterns: string;
    collection_efficiency: string;
  };
  formatted_report: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reports, summary, serviceType, assembly, month, year } = body as ReportData;

    if (!reports || !summary) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    // Format the data for OpenAI
    const prompt = createAnalysisPrompt(reports, summary, serviceType, assembly, month, year);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a financial analyst for GOFAMINT Akowonjo District, Region 28. 
          Analyze the church service financial data and provide professional insights, 
          recommendations, and a comprehensive financial report.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const analysis: FinancialReportResponse = JSON.parse(response.choices[0].message.content || "{}");

    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        generated_at: new Date().toISOString(),
        total_reports: reports.length,
        total_income: summary.totalIncome,
        total_attendance: summary.totalAttendance,
        period: month ? `${month}${year ? ` ${year}` : ''}` : 'All Time'
      }
    });

  } catch (error: any) {
    console.error("AI financial report error:", error);
    
    // Fallback report if OpenAI fails - now properly receiving parameters
    const fallbackReport = generateFallbackReport(
      (error as any)?.reports || [],
      (error as any)?.summary || getDefaultSummary(),
      (error as any)?.serviceType || "all",
      (error as any)?.assembly,
      (error as any)?.month,
      (error as any)?.year
    );
    
    return NextResponse.json({
      success: true,
      data: fallbackReport,
      metadata: {
        generated_at: new Date().toISOString(),
        note: "Fallback report generated due to AI service issue",
        total_reports: fallbackReport.formatted_report.includes("Number of Reports") ? 
          parseInt(fallbackReport.formatted_report.match(/Number of Reports: (\d+)/)?.[1] || "0") : 0,
        total_income: parseFloat(fallbackReport.formatted_report.match(/Total Income: NGN ([\d,]+)/)?.[1].replace(/,/g, '') || "0"),
        total_attendance: parseFloat(fallbackReport.formatted_report.match(/Total Attendance: ([\d,]+)/)?.[1].replace(/,/g, '') || "0"),
        period: fallbackReport.formatted_report.match(/Period: (.+)/)?.[1] || 'All Time'
      }
    });
  }
}

function createAnalysisPrompt(
  reports: any[], 
  summary: any, 
  serviceType: string, 
  assembly?: string, 
  month?: string, 
  year?: string
): string {
  return `Analyze the following GOFAMINT church service financial data and generate a professional financial report:

DATA OVERVIEW:
- Total Reports: ${reports.length}
- Service Type: ${serviceType.toUpperCase()}
- Assembly: ${assembly || 'All Assemblies'}
- Period: ${month || 'All Months'} ${year || ''}
- Total Income: NGN ${summary.totalIncome.toLocaleString()}
- Total Attendance: ${summary.totalAttendance.toLocaleString()}
- Sunday Reports: ${summary.sundayReports}
- Midweek Reports: ${summary.midweekReports}
- Special Reports: ${summary.specialReports}

FINANCIAL BREAKDOWN:
- Sunday Income: NGN ${summary.sundayIncome.toLocaleString()}
- Midweek Income: NGN ${summary.midweekIncome.toLocaleString()}
- Special Income: NGN ${summary.specialIncome.toLocaleString()}
- Sunday Tithes: NGN ${summary.sundayTithes.toLocaleString()}
- Sunday Attendance: ${summary.sundayAttendance.toLocaleString()}
- Midweek Attendance: ${summary.midweekAttendance.toLocaleString()}
- Special Attendance: ${summary.specialAttendance.toLocaleString()}

REPORTS SAMPLE (first 3 reports):
${JSON.stringify(reports.slice(0, 3), null, 2)}

Please provide a comprehensive financial report including:
1. Executive Summary: Brief overview of financial performance
2. Key Findings: 5-7 key insights from the data
3. Recommendations: 3-5 actionable recommendations for improvement
4. Financial Analysis: Detailed analysis of revenue trends, attendance patterns, and collection efficiency
5. Formatted Report: A professionally formatted report text suitable for church leadership

Format the response as JSON with the following structure:
{
  "executive_summary": "string",
  "key_findings": ["string", "string"],
  "recommendations": ["string", "string"],
  "financial_analysis": {
    "revenue_trends": "string",
    "attendance_patterns": "string",
    "collection_efficiency": "string"
  },
  "formatted_report": "string"
}

Ensure the report is professional, data-driven, and tailored for church financial management.`;
}

function generateFallbackReport(
  reports: any[], 
  summary: any, 
  serviceType: string, 
  assembly?: string, 
  month?: string, 
  year?: string
): FinancialReportResponse {
  
  // Extract values from summary object or use defaults
  const totalIncome = summary.totalIncome || 0;
  const totalAttendance = summary.totalAttendance || 0;
  const sundayReports = summary.sundayReports || 0;
  const midweekReports = summary.midweekReports || 0;
  const specialReports = summary.specialReports || 0;
  const sundayIncome = summary.sundayIncome || 0;
  const midweekIncome = summary.midweekIncome || 0;
  const specialIncome = summary.specialIncome || 0;
  const sundayTithes = summary.sundayTithes || 0;
  const sundayAttendance = summary.sundayAttendance || 0;
  const midweekAttendance = summary.midweekAttendance || 0;
  const specialAttendance = summary.specialAttendance || 0;
  
  const avgIncomePerReport = reports.length > 0 ? totalIncome / reports.length : 0;
  const avgAttendancePerReport = reports.length > 0 ? totalAttendance / reports.length : 0;
  const sundayPercentage = totalIncome > 0 ? (sundayIncome / totalIncome) * 100 : 0;
  const midweekPercentage = totalIncome > 0 ? (midweekIncome / totalIncome) * 100 : 0;
  const specialPercentage = totalIncome > 0 ? (specialIncome / totalIncome) * 100 : 0;
  
  return {
    executive_summary: `This financial report covers ${reports.length} service reports for ${assembly || 'all assemblies'} during ${month || 'the selected period'} ${year || ''}. Total income collected was NGN ${totalIncome.toLocaleString()} with ${totalAttendance.toLocaleString()} total attendees across all services.`,
    key_findings: [
      `Sunday services contributed ${sundayPercentage.toFixed(1)}% (NGN ${sundayIncome.toLocaleString()}) of total income`,
      `Midweek services contributed ${midweekPercentage.toFixed(1)}% (NGN ${midweekIncome.toLocaleString()}) of total income`,
      `Special services contributed ${specialPercentage.toFixed(1)}% (NGN ${specialIncome.toLocaleString()}) of total income`,
      `Average income per report: NGN ${Math.round(avgIncomePerReport).toLocaleString()}`,
      `Average attendance per report: ${Math.round(avgAttendancePerReport).toLocaleString()} attendees`,
      `Total tithes collected: NGN ${sundayTithes.toLocaleString()}`
    ],
    recommendations: [
      "Consider increasing focus on midweek service promotion to boost attendance and offerings",
      "Implement digital giving options to improve collection efficiency",
      "Analyze attendance patterns to optimize service scheduling",
      "Provide regular financial reports to assemblies for transparency",
      "Set quarterly financial targets based on historical data"
    ],
    financial_analysis: {
      revenue_trends: `Revenue is primarily driven by Sunday services (${sundayPercentage.toFixed(1)}%). Midweek services show potential for growth, currently contributing ${midweekPercentage.toFixed(1)}% of total income.`,
      attendance_patterns: `Average attendance per service is ${Math.round(avgAttendancePerReport)}. Consider analyzing peak attendance periods to optimize service scheduling and resource allocation.`,
      collection_efficiency: `With an average of NGN ${Math.round(avgIncomePerReport)} per service, collection efficiency appears steady. Implementing multiple giving channels could further improve collection rates.`
    },
    formatted_report: `GOFAMINT AKOWONJO DISTRICT - REGION 28
FINANCIAL ANALYSIS REPORT
Period: ${month || 'All Months'} ${year || ''}
Assembly: ${assembly || 'All Assemblies'}
Service Type: ${serviceType.toUpperCase()}

EXECUTIVE SUMMARY
Total Income: NGN ${totalIncome.toLocaleString()}
Total Attendance: ${totalAttendance.toLocaleString()}
Number of Reports: ${reports.length}

PERFORMANCE BREAKDOWN
1. Sunday Services: ${sundayReports} reports, NGN ${sundayIncome.toLocaleString()} income, ${sundayAttendance.toLocaleString()} attendance
2. Midweek Services: ${midweekReports} reports, NGN ${midweekIncome.toLocaleString()} income, ${midweekAttendance.toLocaleString()} attendance
3. Special Services: ${specialReports} reports, NGN ${specialIncome.toLocaleString()} income, ${specialAttendance.toLocaleString()} attendance

KEY METRICS
- Average Income per Report: NGN ${Math.round(avgIncomePerReport).toLocaleString()}
- Average Attendance per Report: ${Math.round(avgAttendancePerReport)}
- Tithes Collection: NGN ${sundayTithes.toLocaleString()}

RECOMMENDATIONS
1. Enhance midweek service participation through targeted programs
2. Implement digital giving platforms for convenience
3. Regular financial performance reviews with assembly leaders
4. Set progressive financial goals based on historical trends
5. Improve attendance tracking for better resource planning

This report provides a foundation for data-driven decision making in church financial management.`
  };
}

// Helper function to get default summary when data is not available
function getDefaultSummary() {
  return {
    totalIncome: 0,
    totalAttendance: 0,
    sundayReports: 0,
    midweekReports: 0,
    specialReports: 0,
    sundayIncome: 0,
    midweekIncome: 0,
    specialIncome: 0,
    sundayTithes: 0,
    sundayAttendance: 0,
    midweekAttendance: 0,
    specialAttendance: 0
  };
}