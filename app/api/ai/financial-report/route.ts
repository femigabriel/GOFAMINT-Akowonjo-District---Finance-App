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

interface WeekAnalysis {
  weekNumber: number;
  weekLabel: string;
  dates: string[];
  totalIncome: number;
  totalAttendance: number;
  reportCount: number;
  sundayData?: any;
  midweekData?: any[];
  status?: "completed" | "partial" | "pending";
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

// Helper functions
function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayWeekday = firstDay.getDay();
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
  return months.findIndex((m) => m.toLowerCase() === monthName?.toLowerCase());
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
  const totalWeeks = 4;

  if (completed === 0 && partial === 0) return "No weeks reported yet";
  if (completed >= totalWeeks) return "Month complete";
  return `${completed} full weeks + ${partial} partial weeks reported`;
}

function analyzeWeeksAndDates(
  reports: any[],
  month?: string,
  year?: string
): WeekAnalysis[] {
  const weeksMap = new Map<string, WeekAnalysis>();

  reports.forEach((report) => {
    if (report.records && Array.isArray(report.records)) {
      report.records.forEach((record: any) => {
        if (record.date) {
          try {
            const recordDate = new Date(record.date);
            if (isNaN(recordDate.getTime())) return;

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

            if (!weekData.dates.includes(record.date)) {
              weekData.dates.push(record.date);
            }

            const recordTotal = Number(record.total) || 0;
            const recordAttendance = Number(
              record.totalAttendance || record.attendance || 0
            );

            weekData.totalIncome += recordTotal;
            weekData.totalAttendance += recordAttendance;
            weekData.reportCount += 1;

            if (report.serviceType === "sunday") {
              weekData.sundayData = record;
            } else if (report.serviceType === "midweek") {
              if (!weekData.midweekData) weekData.midweekData = [];
              weekData.midweekData.push(record);
            }
          } catch (error) {
            console.error("Error processing record:", error);
          }
        }
      });
    }
  });

  const weekAnalysis = Array.from(weeksMap.values()).sort(
    (a, b) => a.weekNumber - b.weekNumber
  );

  const currentDate = new Date();
  weekAnalysis.forEach((week) => {
    const lastDateInWeek =
      week.dates.length > 0
        ? new Date(Math.max(...week.dates.map((d) => new Date(d).getTime())))
        : null;

    let status: "completed" | "partial" | "pending" = "pending";

    if (
      lastDateInWeek &&
      !isNaN(lastDateInWeek.getTime()) &&
      lastDateInWeek <= currentDate
    ) {
      const hasSunday = week.sundayData !== undefined;
      const hasMidweek = week.midweekData && week.midweekData.length >= 2;

      if (hasSunday && hasMidweek) {
        status = "completed";
      } else if (hasSunday || hasMidweek) {
        status = "partial";
      }
    }

    (week as any).status = status;
  });

  return weekAnalysis;
}

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
      ? `  Sunday: NGN ${
          week.sundayData.total?.toLocaleString() || "0"
        }, Attendance: ${week.sundayData.totalAttendance || "0"}`
      : "  Sunday: Not reported"
  }
  ${
    week.midweekData
      ? `  Midweek: ${
          week.midweekData.length
        } services, Total: NGN ${week.midweekData
          .reduce((sum: number, r: any) => sum + (Number(r.total) || 0), 0)
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
- Total Income: NGN ${summary.totalIncome?.toLocaleString() || "0"}
- Total Attendance: ${summary.totalAttendance?.toLocaleString() || "0"}

WEEK-BY-WEEK ANALYSIS:
${weeklyBreakdown}

FINANCIAL BREAKDOWN:
- Sunday Income: NGN ${summary.sundayIncome?.toLocaleString() || "0"}
- Midweek Income: NGN ${summary.midweekIncome?.toLocaleString() || "0"}
- Special Income: NGN ${summary.specialIncome?.toLocaleString() || "0"}
- Sunday Tithes: NGN ${summary.sundayTithes?.toLocaleString() || "0"}

REPORTS DETAIL (first 2):
${JSON.stringify(reports.slice(0, 2), null, 2)}

EXPECTED OUTPUT STRUCTURE:
{
  "executive_summary": "string",
  "key_findings": ["string", "string"],
  "recommendations": ["string", "string"],
  "financial_analysis": {
    "revenue_trends": "string",
    "attendance_patterns": "string",
    "collection_efficiency": "string",
    "weekly_progress": "string"
  },
  "weekly_analysis": {
    "weeks_completed": number,
    "weeks_pending": number,
    "current_progress": "string",
    "weekly_breakdown": [{"week": "Week 1", "income": number, "attendance": number, "status": "completed|partial|pending"}]
  },
  "assembly_performance": {
    "top_performers": ["string"],
    "areas_for_improvement": ["string"],
    "detailed_analysis": "string"
  },
  "formatted_report": "string"
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

  const hasData = reports.length > 0;
  const timingNote = hasData
    ? isCurrentMonth
      ? `Analysis is for the CURRENT MONTH. ${completedWeeks} weeks completed, ${pendingWeeks} weeks pending.`
      : `Analysis is for a PAST MONTH. ${completedWeeks} weeks have been reported.`
    : "No data available for analysis.";

  return {
    executive_summary: hasData
      ? `Financial analysis for ${assembly || "all assemblies"} during ${
          month || ""
        } ${year || ""}. ${timingNote} Total income: NGN ${
          summary.totalIncome?.toLocaleString() || "0"
        }.`
      : "No financial data available for analysis. Please ensure reports have been submitted.",
    key_findings: hasData
      ? [
          `${completedWeeks} complete week${
            completedWeeks !== 1 ? "s" : ""
          } of data analyzed`,
          `${partialWeeks} partial week${
            partialWeeks !== 1 ? "s" : ""
          } reported`,
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
          `Sunday services contributed NGN ${
            summary.sundayIncome?.toLocaleString() || "0"
          } (${
            summary.totalIncome > 0
              ? Math.round(
                  (Number(summary.sundayIncome) / Number(summary.totalIncome)) *
                    100
                )
              : 0
          }%)`,
        ]
      : [
          "No reports found for the selected period",
          "Please check if reports have been submitted",
          "Ensure proper data connection",
        ],
    recommendations: hasData
      ? [
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
        ]
      : [
          "Submit service reports for the selected period",
          "Verify data connectivity and API endpoints",
          "Check if reports exist in the database",
          "Ensure proper authentication and permissions",
        ],
    financial_analysis: {
      revenue_trends: hasData
        ? `Revenue shows ${
            weekAnalysis.length > 1
              ? weekAnalysis[0].totalIncome > weekAnalysis[1].totalIncome
                ? "strong start"
                : "steady progression"
              : "initial data"
          } across weeks.`
        : "No revenue data available for analysis.",
      attendance_patterns: hasData
        ? `Weekly attendance ${
            weekAnalysis.length > 0
              ? "averages " +
                Math.round(
                  weekAnalysis.reduce((sum, w) => sum + w.totalAttendance, 0) /
                    weekAnalysis.length
                ) +
                " per week"
              : "data being collected"
          }.`
        : "No attendance data available.",
      collection_efficiency: hasData
        ? `Collection patterns indicate ${
            Number(summary.totalIncome) > 10000 ? "healthy" : "developing"
          } giving culture.`
        : "Cannot assess collection efficiency without data.",
      weekly_progress: hasData
        ? weeklyBreakdown
            .map(
              (w) =>
                `${w.week}: NGN ${w.income.toLocaleString()}, ${
                  w.attendance
                } attendees (${w.status})`
            )
            .join(" | ")
        : "No weekly progress data available.",
    },
    weekly_analysis: {
      weeks_completed: completedWeeks,
      weeks_pending: pendingWeeks,
      current_progress: hasData
        ? `${completedWeeks} full + ${partialWeeks} partial weeks reported`
        : "No data available",
      weekly_breakdown: weeklyBreakdown,
    },
    assembly_performance: {
      top_performers: hasData ? [assembly || "Primary assembly"] : ["No data"],
      areas_for_improvement: hasData
        ? ["Consistency in midweek reporting", "Attendance growth"]
        : ["Data submission", "Report completeness"],
      detailed_analysis: hasData
        ? "Performance analysis focused on weekly consistency and reporting completeness."
        : "No data available for assembly performance analysis.",
    },
    formatted_report: hasData
      ? `GOFAMINT FINANCIAL ANALYSIS - WEEKLY PERSPECTIVE
Period: ${month || "N/A"} ${
          year || ""
        } | Generated: ${currentDate.toLocaleDateString()}
Assembly: ${assembly || "All Assemblies"}

TIMING CONTEXT: ${timingNote}

WEEKLY PROGRESS:
${
  weeklyBreakdown.length > 0
    ? weeklyBreakdown
        .map(
          (w) =>
            `• ${w.week}: NGN ${w.income.toLocaleString()} | Attendance: ${
              w.attendance
            } | Status: ${w.status.toUpperCase()}`
        )
        .join("\n")
    : "No weekly data available"
}

SUMMARY:
• Total Income: NGN ${summary.totalIncome?.toLocaleString() || "0"}
• Total Attendance: ${summary.totalAttendance?.toLocaleString() || "0"}
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

This analysis considers the weekly progression within the month.`
      : "NO DATA AVAILABLE\n\nNo financial reports were found for analysis. Please ensure:\n1. Service reports have been submitted\n2. The selected period contains data\n3. Reports are properly saved in the database\n4. You have appropriate permissions to view the data",
  };
}

export async function POST(request: NextRequest) {
  console.log("📊 AI Financial Report API called");

  try {
    const body = await request.json();
    console.log("📥 Request body received:", {
      hasReports: Array.isArray(body.reports),
      reportCount: body.reports?.length || 0,
      hasSummary: !!body.summary,
      serviceType: body.serviceType,
      assembly: body.assembly,
      month: body.month,
      year: body.year,
    });

    const { reports, summary, serviceType, assembly, month, year } =
      body as ReportData;

    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      console.error("❌ No reports found in request");
      return NextResponse.json(
        {
          error: "No reports data provided",
          message: "Please ensure reports are being sent in the request body",
        },
        { status: 400 }
      );
    }

    if (!summary || typeof summary !== "object") {
      console.error("❌ Invalid or missing summary");
      return NextResponse.json(
        { error: "Invalid or missing summary data" },
        { status: 400 }
      );
    }

    // Log sample data for debugging
    console.log("🔍 Sample report data:", {
      firstReport: reports[0],
      summaryKeys: Object.keys(summary),
      summaryValues: summary,
    });

    // 1. Analyze weeks and dates
    const weekAnalysis = analyzeWeeksAndDates(reports, month, year);
    console.log("📅 Week analysis:", {
      totalWeeks: weekAnalysis.length,
      weeks: weekAnalysis.map((w) => ({
        week: w.weekLabel,
        income: w.totalIncome,
        status: w.status,
      })),
    });

    // 2. Get current date context
    const currentDate = new Date();
    const currentMonthNum = currentDate.getMonth() + 1;
    const currentYearNum = currentDate.getFullYear();
    const isCurrentMonth =
      month === getMonthName(currentMonthNum) &&
      year === currentYearNum.toString();

    console.log("⏰ Timing context:", {
      currentDate: currentDate.toISOString(),
      isCurrentMonth,
      month,
      year,
      currentMonth: getMonthName(currentMonthNum),
      currentYear: currentYearNum,
    });

    try {
      // 3. Create enhanced prompt with week context
      const prompt = createEnhancedAnalysisPrompt(
        reports,
        summary,
        weekAnalysis,
        isCurrentMonth,
        serviceType || "all",
        assembly,
        month,
        year
      );

      console.log("🤖 Sending request to OpenAI...");

      // 4. Call OpenAI with enhanced context
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are a financial analyst for GOFAMINT Akowonjo District, Region 28 in Lagos, Nigeria.`,
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

      console.log("✅ OpenAI response received");

      const analysis: EnhancedReportResponse = JSON.parse(
        response.choices[0].message.content || "{}"
      );

      return NextResponse.json({
        success: true,
        data: analysis,
        metadata: {
          generated_at: new Date().toISOString(),
          total_reports: reports.length,
          total_income: summary.totalIncome || 0,
          total_attendance: summary.totalAttendance || 0,
          week_context: {
            weeks_analyzed: weekAnalysis.length,
            is_current_month: isCurrentMonth,
            weeks_completed: weekAnalysis.filter(
              (w) => w.status === "completed"
            ).length,
            current_week_progress: getCurrentWeekProgress(weekAnalysis),
          },
          period: month ? `${month}${year ? ` ${year}` : ""}` : "All Time",
        },
      });
    } catch (openaiError: any) {
      console.error("❌ OpenAI API error:", openaiError);

      // Generate fallback report
      const fallbackReport = generateEnhancedFallbackReport(
        reports,
        summary,
        weekAnalysis,
        serviceType || "all",
        assembly,
        month,
        year
      );

      return NextResponse.json({
        success: true,
        data: fallbackReport,
        metadata: {
          generated_at: new Date().toISOString(),
          note: "Fallback report generated due to OpenAI API issue",
          week_context: {
            weeks_analyzed: weekAnalysis.length,
            weeks_completed: weekAnalysis.filter(
              (w) => w.status === "completed"
            ).length,
          },
        },
      });
    }
  } catch (error: any) {
    console.error("💥 AI financial report error:", error);

    // Even if we can't parse the request, try to provide a helpful error
    try {
      const body = await request.text();
      console.error("📝 Raw request body:", body);
    } catch (e) {
      console.error("❌ Could not read request body");
    }

    // Return a minimal fallback report
    const fallbackReport = generateEnhancedFallbackReport(
      [],
      getDefaultSummary(),
      [],
      "all",
      undefined,
      undefined,
      undefined
    );

    return NextResponse.json(
      {
        success: false,
        data: fallbackReport,
        error: error.message || "Failed to process request",
        metadata: {
          generated_at: new Date().toISOString(),
          note: "Error occurred while processing the request",
        },
      },
      { status: 500 }
    );
  }
}
