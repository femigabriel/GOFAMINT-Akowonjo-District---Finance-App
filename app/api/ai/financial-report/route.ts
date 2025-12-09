// app/api/ai/financial-report/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ReportData {
  reports: any[];
  summary: any;
  serviceType: string;
  assembly?: string;
  month?: string;
  year?: string;
}

// Updated WeekAnalysis interface with status property
interface WeekAnalysis {
  weekNumber: number;
  weekLabel: string;
  dates: string[];
  totalIncome: number;
  totalAttendance: number;
  reportCount: number;
  sundayData?: any;
  midweekData?: any[];
  status?: "completed" | "partial" | "pending"; // Added status property
}

interface EnhancedReportResponse {
  executive_summary: string;
  key_findings: string[];
  recommendations: string[];
  financial_analysis: {
    revenue_trends: string;
    attendance_patterns: string;
    collection_efficiency: string;
    weekly_progress: string;
  };
  weekly_analysis: {
    weeks_completed: number;
    weeks_pending: number;
    current_progress: string;
    weekly_breakdown: Array<{
      week: string;
      income: number;
      attendance: number;
      status: "completed" | "partial" | "pending";
    }>;
  };
  assembly_performance: {
    top_performers: string[];
    areas_for_improvement: string[];
    detailed_analysis: string;
  };
  formatted_report: string;
}

// Helper functions moved to top level
function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayWeekday = firstDay.getDay(); // 0 = Sunday

  // Adjust for week starting on Sunday
  const offsetDate = date.getDate() + firstDayWeekday - 1;
  return Math.floor(offsetDate / 7) + 1;
}

function getMonthIndex(monthName: string): number {
  const months = [
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
  ];
  return months.findIndex((m) => m.toLowerCase() === monthName.toLowerCase());
}

function getMonthName(monthIndex: number): string {
  const months = [
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
  ];
  return months[monthIndex - 1] || "Unknown";
}

function getCurrentWeekProgress(weekAnalysis: WeekAnalysis[]): string {
  const completed = weekAnalysis.filter((w) => w.status === "completed").length;
  const partial = weekAnalysis.filter((w) => w.status === "partial").length;
  const totalWeeks = 4; // Assuming 4 weeks for now

  if (completed === 0 && partial === 0) return "No weeks reported yet";
  if (completed >= totalWeeks) return "Month complete";

  return `${completed} full weeks + ${partial} partial weeks reported`;
}

// Enhanced week and date analysis
function analyzeWeeksAndDates(
  reports: any[],
  month?: string,
  year?: string
): WeekAnalysis[] {
  const weeksMap = new Map<string, WeekAnalysis>();

  // Determine month boundaries if provided
  let monthStart: Date | null = null;
  let monthEnd: Date | null = null;

  if (month && year) {
    const monthIndex = getMonthIndex(month);
    if (monthIndex !== -1) {
      monthStart = new Date(parseInt(year), monthIndex, 1);
      monthEnd = new Date(parseInt(year), monthIndex + 1, 0);
    }
  }

  reports.forEach((report) => {
    if (report.records && Array.isArray(report.records)) {
      report.records.forEach((record: any) => {
        if (record.date) {
          const recordDate = new Date(record.date);
          const weekNumber = getWeekOfMonth(recordDate);
          const weekLabel = `Week ${weekNumber}`;

          if (!weeksMap.has(weekLabel)) {
            weeksMap.set(weekLabel, {
              weekNumber,
              weekLabel,
              dates: [],
              totalIncome: 0,
              totalAttendance: 0,
              reportCount: 0,
            });
          }

          const weekData = weeksMap.get(weekLabel)!;

          // Track unique dates
          if (!weekData.dates.includes(record.date)) {
            weekData.dates.push(record.date);
          }

          // Add to totals
          weekData.totalIncome += record.total || 0;
          weekData.totalAttendance +=
            record.totalAttendance || record.attendance || 0;
          weekData.reportCount += 1;

          // Store service-specific data
          if (report.serviceType === "sunday") {
            weekData.sundayData = record;
          } else if (report.serviceType === "midweek") {
            if (!weekData.midweekData) weekData.midweekData = [];
            weekData.midweekData.push(record);
          }
        }
      });
    }
  });

  // Calculate week status (completed/partial/pending)
  const weekAnalysis = Array.from(weeksMap.values()).sort(
    (a, b) => a.weekNumber - b.weekNumber
  );

  // Add status based on current date
  const currentDate = new Date();
  weekAnalysis.forEach((week) => {
    const lastDateInWeek =
      week.dates.length > 0
        ? new Date(Math.max(...week.dates.map((d) => new Date(d).getTime())))
        : null;

    let status: "completed" | "partial" | "pending" = "pending";

    if (lastDateInWeek && lastDateInWeek <= currentDate) {
      // Check if we have data for expected services
      const hasSunday = week.sundayData !== undefined;
      const hasMidweek = week.midweekData && week.midweekData.length >= 2; // Usually Tues & Thurs

      if (hasSunday && hasMidweek) {
        status = "completed";
      } else if (hasSunday || hasMidweek) {
        status = "partial";
      } else {
        status = "pending";
      }
    }

    // Add status property to the week object
    (week as WeekAnalysis & { status: typeof status }).status = status;
  });

  return weekAnalysis;
}

// Enhanced prompt creation with week context
function createEnhancedAnalysisPrompt(
  reports: any[],
  summary: any,
  weekAnalysis: WeekAnalysis[],
  isCurrentMonth: boolean,
  serviceType: string,
  assembly?: string,
  month?: string,
  year?: string
): string {
  const currentDate = new Date();
  const today = currentDate.toISOString().split("T")[0];

  // Analyze submission timing
  const latestReport =
    reports.length > 0
      ? new Date(
          Math.max(...reports.map((r) => new Date(r.createdAt).getTime()))
        )
      : null;

  const daysSinceLastReport = latestReport
    ? Math.floor(
        (currentDate.getTime() - latestReport.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  // Create week-by-week breakdown
  const weeklyBreakdown = weekAnalysis
    .map(
      (week) => `
Week ${week.weekNumber} (${week.status?.toUpperCase()}):
  - Dates: ${week.dates.join(", ")}
  - Total Income: NGN ${week.totalIncome.toLocaleString()}
  - Total Attendance: ${week.totalAttendance.toLocaleString()}
  - Reports: ${week.reportCount}
  ${
    week.sundayData
      ? `  Sunday: NGN ${week.sundayData.total.toLocaleString()}, Attendance: ${
          week.sundayData.totalAttendance
        }`
      : "  Sunday: Not reported"
  }
  ${
    week.midweekData
      ? `  Midweek: ${
          week.midweekData.length
        } services, Total: NGN ${week.midweekData
          .reduce((sum: number, r: any) => sum + (r.total || 0), 0)
          .toLocaleString()}`
      : "  Midweek: Not reported"
  }
`
    )
    .join("\n");

  const timingContext = isCurrentMonth
    ? `
TIMING CONTEXT:
- This is analysis for the CURRENT MONTH (${month} ${year})
- Today's date: ${today}
- ${
        daysSinceLastReport !== null
          ? `Last report was ${daysSinceLastReport} day${
              daysSinceLastReport !== 1 ? "s" : ""
            } ago`
          : "No report timing available"
      }
- Week progress: ${getCurrentWeekProgress(weekAnalysis)}
`
    : `
TIMING CONTEXT:
- This is analysis for PAST MONTH (${month} ${year})
- Today's date: ${today}
- Data represents complete/historical records
`;

  return `Analyze the following GOFAMINT church service financial data with sensitivity to timing and weekly progress:

${timingContext}

DATA OVERVIEW:
- Total Reports: ${reports.length}
- Service Type: ${serviceType.toUpperCase()}
- Assembly: ${assembly || "All Assemblies"}
- Period: ${month || "All Months"} ${year || ""}
- Total Income: NGN ${summary.totalIncome.toLocaleString()}
- Total Attendance: ${summary.totalAttendance.toLocaleString()}

WEEK-BY-WEEK ANALYSIS:
${weeklyBreakdown}

FINANCIAL BREAKDOWN:
- Sunday Income: NGN ${summary.sundayIncome.toLocaleString()}
- Midweek Income: NGN ${summary.midweekIncome.toLocaleString()}
- Special Income: NGN ${summary.specialIncome.toLocaleString()}
- Sunday Tithes: NGN ${summary.sundayTithes.toLocaleString()}

REPORTS DETAIL:
${JSON.stringify(reports.slice(0, 2), null, 2)}

CRITICAL CONTEXT FOR ANALYSIS:
1. Nigerian church week: Sunday services + Tuesday/Thursday midweek
2. Month has 4-5 weeks, but reports might only cover early weeks if analyzed mid-month
3. Early month analysis (Week 1-2) vs late month analysis (Week 3-4) have different implications
4. Consider if this is early feedback (weeks 1-2) or complete monthly analysis
5. Attendance often fluctuates - early month enthusiasm vs late month consistency
6. Financial patterns: Tithes are usually highest on first Sundays of the month

ANALYSIS GUIDELINES:
- Acknowledge if this is early-month data (only Weeks 1-2 reported)
- Note which weeks are complete vs pending
- Highlight if midweek attendance is consistently reported
- Comment on submission timeliness
- Provide growth projections if it's early in the month
- Suggest specific actions based on which weeks have missing data
- Consider Nigerian context: transportation, seasonal factors, local events

EXPECTED OUTPUT STRUCTURE:
{
  "executive_summary": "string (acknowledge week progress context)",
  "key_findings": ["string", "string (include week-specific insights)"],
  "recommendations": ["string", "string (timing-sensitive suggestions)"],
  "financial_analysis": {
    "revenue_trends": "string",
    "attendance_patterns": "string", 
    "collection_efficiency": "string",
    "weekly_progress": "string (week-by-week commentary)"
  },
  "weekly_analysis": {
    "weeks_completed": number,
    "weeks_pending": number,
    "current_progress": "string",
    "weekly_breakdown": [
      {"week": "Week 1", "income": number, "attendance": number, "status": "completed|partial|pending"}
    ]
  },
  "assembly_performance": {
    "top_performers": ["string"],
    "areas_for_improvement": ["string"],
    "detailed_analysis": "string"
  },
  "formatted_report": "string (include week context prominently)"
}`;
}

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
    specialAttendance: 0,
  };
}

// Enhanced fallback report generator
function generateEnhancedFallbackReport(
  reports: any[],
  summary: any,
  weekAnalysis: WeekAnalysis[],
  serviceType: string,
  assembly?: string,
  month?: string,
  year?: string
): EnhancedReportResponse {
  const currentDate = new Date();
  const isCurrentMonth =
    month === getMonthName(currentDate.getMonth() + 1) &&
    year === currentDate.getFullYear().toString();

  const completedWeeks = weekAnalysis.filter(
    (w) => w.status === "completed"
  ).length;
  const partialWeeks = weekAnalysis.filter(
    (w) => w.status === "partial"
  ).length;
  const pendingWeeks = 4 - (completedWeeks + partialWeeks);

  const weeklyBreakdown = weekAnalysis.map((week) => ({
    week: week.weekLabel,
    income: week.totalIncome,
    attendance: week.totalAttendance,
    status: week.status || "pending",
  }));

  const timingNote = isCurrentMonth
    ? `Analysis is for the CURRENT MONTH. ${completedWeeks} weeks completed, ${pendingWeeks} weeks pending.`
    : `Analysis is for a PAST MONTH. All ${completedWeeks} weeks have been reported.`;

  return {
    executive_summary: `Financial analysis for ${
      assembly || "all assemblies"
    } during ${month || ""} ${
      year || ""
    }. ${timingNote} Total income: NGN ${summary.totalIncome.toLocaleString()}.`,
    key_findings: [
      `${completedWeeks} complete week${
        completedWeeks !== 1 ? "s" : ""
      } of data analyzed`,
      `${partialWeeks} partial week${partialWeeks !== 1 ? "s" : ""} reported`,
      `Week ${
        weekAnalysis.length > 0 ? weekAnalysis[0].weekNumber : 1
      } had highest income: NGN ${
        weekAnalysis.length > 0
          ? weekAnalysis[0].totalIncome.toLocaleString()
          : "0"
      }`,
      isCurrentMonth && pendingWeeks > 0
        ? `${pendingWeeks} week${
            pendingWeeks !== 1 ? "s" : ""
          } remaining in month`
        : "Month analysis complete",
      `Sunday services contributed NGN ${summary.sundayIncome.toLocaleString()} (${
        summary.totalIncome > 0
          ? Math.round((summary.sundayIncome / summary.totalIncome) * 100)
          : 0
      }%)`,
    ],
    recommendations: [
      isCurrentMonth && pendingWeeks > 0
        ? `Focus on completing reports for remaining ${pendingWeeks} week${
            pendingWeeks !== 1 ? "s" : ""
          }`
        : "Review monthly performance trends",
      "Ensure both Tuesday and Thursday midweek services are consistently reported",
      "Compare week-over-week attendance patterns",
      "Set weekly financial targets based on historical data",
      "Provide early-month encouragement if Week 1 shows strong performance",
      "Address any missing midweek reports promptly",
    ],
    financial_analysis: {
      revenue_trends: `Revenue shows ${
        weekAnalysis.length > 1
          ? weekAnalysis[0].totalIncome > weekAnalysis[1].totalIncome
            ? "strong start"
            : "steady progression"
          : "initial data"
      } across weeks.`,
      attendance_patterns: `Weekly attendance ${
        weekAnalysis.length > 0
          ? "averages " +
            Math.round(
              weekAnalysis.reduce((sum, w) => sum + w.totalAttendance, 0) /
                weekAnalysis.length
            ) +
            " per week"
          : "data being collected"
      }.`,
      collection_efficiency: `Collection patterns indicate ${
        summary.totalIncome > 10000 ? "healthy" : "developing"
      } giving culture.`,
      weekly_progress: weeklyBreakdown
        .map(
          (w) =>
            `${w.week}: NGN ${w.income.toLocaleString()}, ${
              w.attendance
            } attendees (${w.status})`
        )
        .join(" | "),
    },
    weekly_analysis: {
      weeks_completed: completedWeeks,
      weeks_pending: pendingWeeks,
      current_progress: `${completedWeeks} full + ${partialWeeks} partial weeks reported`,
      weekly_breakdown: weeklyBreakdown,
    },
    assembly_performance: {
      top_performers: [assembly || "Primary assembly"],
      areas_for_improvement: [
        "Consistency in midweek reporting",
        "Attendance growth",
      ],
      detailed_analysis: `Performance analysis focused on weekly consistency and reporting completeness.`,
    },
    formatted_report: `GOFAMINT FINANCIAL ANALYSIS - WEEKLY PERSPECTIVE
Period: ${month} ${year} | Generated: ${currentDate.toLocaleDateString()}
Assembly: ${assembly || "All Assemblies"}

TIMING CONTEXT: ${timingNote}

WEEKLY PROGRESS:
${weeklyBreakdown
  .map(
    (w) =>
      `• ${w.week}: NGN ${w.income.toLocaleString()} | Attendance: ${
        w.attendance
      } | Status: ${w.status.toUpperCase()}`
  )
  .join("\n")}

SUMMARY:
• Total Income: NGN ${summary.totalIncome.toLocaleString()}
• Total Attendance: ${summary.totalAttendance.toLocaleString()}
• Reports Submitted: ${reports.length}
• Weeks Analyzed: ${weekAnalysis.length}

RECOMMENDATIONS:
1. ${
      isCurrentMonth && pendingWeeks > 0
        ? `Complete reporting for remaining ${pendingWeeks} week${
            pendingWeeks !== 1 ? "s" : ""
          }`
        : "Review complete monthly performance"
    }
2. Ensure both midweek services (Tuesday & Thursday) are consistently documented
3. Monitor week-over-week attendance trends
4. ${
      weekAnalysis.some((w) => w.status === "partial")
        ? "Address partially reported weeks promptly"
        : "Maintain current reporting consistency"
    }

This analysis considers the weekly progression within the month.`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reports, summary, serviceType, assembly, month, year } =
      body as ReportData;

    if (!reports || !summary) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    // 1. Analyze weeks and dates intelligently
    const weekAnalysis = analyzeWeeksAndDates(reports, month, year);

    // 2. Get current date context
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();
    const isCurrentMonth =
      month === getMonthName(currentMonth) && year === currentYear.toString();

    // 3. Create enhanced prompt with week context
    const prompt = createEnhancedAnalysisPrompt(
      reports,
      summary,
      weekAnalysis,
      isCurrentMonth,
      serviceType,
      assembly,
      month,
      year
    );

    // 4. Call OpenAI with enhanced context
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a financial analyst for GOFAMINT Akowonjo District, Region 28 in Lagos, Nigeria.
          You analyze church service data with sensitivity to Nigerian church context, month/week progress, 
          and financial patterns. You understand:
          1. Nigerian church operations (midweek=Tues/Thurs, Sunday services)
          2. Monthly reporting cycles (4-5 weeks per month)
          3. Early-month vs late-month reporting patterns
          4. Cultural and seasonal factors affecting attendance
          5. The importance of week-by-week progress tracking`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const analysis: EnhancedReportResponse = JSON.parse(
      response.choices[0].message.content || "{}"
    );

    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        generated_at: new Date().toISOString(),
        total_reports: reports.length,
        total_income: summary.totalIncome,
        total_attendance: summary.totalAttendance,
        week_context: {
          weeks_analyzed: weekAnalysis.length,
          is_current_month: isCurrentMonth,
          weeks_completed: weekAnalysis.filter((w) => w.status === "completed")
            .length,
          current_week_progress: getCurrentWeekProgress(weekAnalysis),
        },
        period: month ? `${month}${year ? ` ${year}` : ""}` : "All Time",
      },
    });
  } catch (error: any) {
    console.error("AI financial report error:", error);

    // Enhanced fallback with week analysis
    const body = await request.json().catch(() => ({}));
    const {
      reports: errorReports = [],
      summary: errorSummary = getDefaultSummary(),
      serviceType: errorServiceType = "all",
      assembly: errorAssembly,
      month: errorMonth,
      year: errorYear,
    } = body as ReportData;

    const weekAnalysis = analyzeWeeksAndDates(
      errorReports,
      errorMonth,
      errorYear
    );

    const fallbackReport = generateEnhancedFallbackReport(
      errorReports,
      errorSummary,
      weekAnalysis,
      errorServiceType,
      errorAssembly,
      errorMonth,
      errorYear
    );

    return NextResponse.json({
      success: true,
      data: fallbackReport,
      metadata: {
        generated_at: new Date().toISOString(),
        note: "Fallback report generated due to AI service issue",
        week_context: {
          weeks_analyzed: weekAnalysis.length,
          weeks_completed: weekAnalysis.filter((w) => w.status === "completed")
            .length,
        },
      },
    });
  }
}
