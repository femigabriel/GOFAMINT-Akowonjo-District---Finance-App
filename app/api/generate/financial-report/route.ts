import { NextResponse } from "next/server";
import OpenAI from "openai";
import { assemblies } from "@/lib/assemblies";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// safe sum util
const sum = (arr: number[]) => arr.reduce((a, b) => a + (b || 0), 0);

// return YYYY-MM for convenience
function monthKey(month: string, year: string) {
  return `${month}-${year}`;
}

// compute previous n months (month name + year)
function prevMonths(month: string, year: string, n = 2) {
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
  const mIndex = months.findIndex(
    (m) => m.toLowerCase() === month.toLowerCase()
  );
  if (mIndex === -1) {
    throw new Error("Invalid month");
  }
  const result: { month: string; year: string }[] = [];
  let curIndex = mIndex;
  let curYear = parseInt(year, 10);

  for (let i = 1; i <= n; i++) {
    curIndex = curIndex - 1;
    if (curIndex < 0) {
      curIndex = 11;
      curYear -= 1;
    }
    result.push({ month: months[curIndex], year: String(curYear) });
  }
  return result;
}

// Fetch the detailed reports for a single month (calls internal route)
async function fetchDetailed(origin: string, month: string, year: string) {
  const url = `${origin}/api/admin/reports/detailed?month=${encodeURIComponent(
    month
  )}&year=${encodeURIComponent(
    year
  )}&serviceType=all&limit=100&page=1&assembly=all`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Detailed endpoint returned ${res.status}: ${txt}`);
  }
  const json = await res.json();
  return json;
}

// Aggregate a detailed endpoint response into per-assembly metrics
function aggregateDetailedResponse(detailedJson: any) {
  const reports = detailedJson?.data?.reports || [];
  // Map assembly -> aggregated metrics
  const map: Record<string, any> = {};

  for (const r of reports) {
    const assembly = r.assembly || "Unknown";
    if (!map[assembly]) {
      map[assembly] = {
        assembly,
        totalIncome: 0,
        totalTithes: 0,
        totalAttendance: 0,
        totalRecords: 0,
        offeringsBreakdown: {},
      };
    }

    const recs = Array.isArray(r.records) ? r.records : [];

    map[assembly].totalRecords += recs.length;

    for (const rec of recs) {
      // Income: sum sensible fields (tithes, offerings, specialOfferings, pastorsWarfare, thanksgiving, offering, total)
      const tithes = Number(rec.tithes || 0);
      const offerings = Number(rec.offerings || rec.offering || 0);
      const specialOfferings = Number(
        rec.specialOfferings || rec.specialOffering || 0
      );
      const pastorsWarfare = Number(
        rec.pastorsWarfare || rec.pastorsWelfare || 0
      );
      const thanksgiving = Number(rec.thanksgiving || 0);
      const etf = Number(rec.etf || 0);
      const districtSupport = Number(rec.districtSupport || 0);
      const totalFromRecord = Number(rec.total || 0);

      // Build an offeringsBreakdown aggregated object
      const ob = map[assembly].offeringsBreakdown;
      ob.tithes = (ob.tithes || 0) + tithes;
      ob.offerings = (ob.offerings || 0) + offerings;
      ob.specialOfferings = (ob.specialOfferings || 0) + specialOfferings;
      ob.pastorsWarfare = (ob.pastorsWarfare || 0) + pastorsWarfare;
      ob.thanksgiving = (ob.thanksgiving || 0) + thanksgiving;
      ob.etf = (ob.etf || 0) + etf;
      ob.districtSupport = (ob.districtSupport || 0) + districtSupport;

      // prefer a robust income: if `total` is present, use it; else sum components
      const incomeContribution =
        totalFromRecord ||
        tithes +
          offerings +
          specialOfferings +
          pastorsWarfare +
          thanksgiving +
          etf +
          districtSupport;

      map[assembly].totalIncome += incomeContribution;
      map[assembly].totalTithes += tithes;
      // totalAttendance may be present per record as totalAttendance else attendance
      map[assembly].totalAttendance += Number(
        rec.totalAttendance || rec.attendance || 0
      );
    }
  }

  // Convert map to array, ensure assemblies with zero data are included
  const result: any[] = [];
  for (const a of Array.isArray(assemblies) ? assemblies : []) {
    const name = String(a);
    if (map[name]) {
      result.push(map[name]);
    } else {
      result.push({
        assembly: name,
        totalIncome: 0,
        totalTithes: 0,
        totalAttendance: 0,
        totalRecords: 0,
        offeringsBreakdown: {},
      });
    }
  }

  return result;
}

// compute percent change helper
function percentChange(prev: number, current: number) {
  if (prev === 0 && current === 0) return 0;
  if (prev === 0) return 100; // from zero to something -> 100% (indicator)
  return ((current - prev) / Math.abs(prev)) * 100;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { month, year } = body || {};

    if (!month || !year) {
      return NextResponse.json(
        {
          error:
            "Month and year are required. Example: { month: 'December', year: '2025' }",
        },
        { status: 400 }
      );
    }

    // normalize month name capitalization (First letter uppercase)
    month = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();

    // origin for internal API calls (works on server)
    const origin = new URL(req.url).origin;

    // months to compare: requested month + previous 2 months
    const previous = prevMonths(month, year, 2); // returns [{month,year}, ...]

    // fetch main month
    const mainDetailed = await fetchDetailed(origin, month, year);
    const mainAggregated = aggregateDetailedResponse(mainDetailed);

    // fetch previous months
    const prevDetailedList = [];
    const prevAggregatedList = [];
    for (const p of previous) {
      try {
        const d = await fetchDetailed(origin, p.month, p.year);
        prevDetailedList.push({ month: p.month, year: p.year, data: d });
        prevAggregatedList.push({
          month: p.month,
          year: p.year,
          agg: aggregateDetailedResponse(d),
        });
      } catch (err) {
        // If a previous month fails, push zeroed structure
        prevDetailedList.push({ month: p.month, year: p.year, data: null });
        prevAggregatedList.push({
          month: p.month,
          year: p.year,
          agg: assemblies.map((a) => ({
            assembly: a,
            totalIncome: 0,
            totalTithes: 0,
            totalAttendance: 0,
            totalRecords: 0,
            offeringsBreakdown: {},
          })),
        });
      }
    }

    // Build comparison structure per assembly
    const comparisons: any[] = [];

    for (const a of assemblies) {
      const name = String(a);
      const current = mainAggregated.find((x: any) => x.assembly === name) || {
        totalIncome: 0,
        totalTithes: 0,
        totalAttendance: 0,
      };

      // previous month immediately before main (previous[0])
      const prev1Agg = prevAggregatedList[0]?.agg?.find(
        (x: any) => x.assembly === name
      ) || { totalIncome: 0, totalTithes: 0, totalAttendance: 0 };
      const prev2Agg = prevAggregatedList[1]?.agg?.find(
        (x: any) => x.assembly === name
      ) || { totalIncome: 0, totalTithes: 0, totalAttendance: 0 };

      comparisons.push({
        assembly: name,
        current: {
          totalIncome: current.totalIncome || 0,
          totalTithes: current.totalTithes || 0,
          totalAttendance: current.totalAttendance || 0,
        },
        prev1: {
          month: previous[0]
            ? `${previous[0].month} ${previous[0].year}`
            : null,
          totalIncome: prev1Agg.totalIncome || 0,
          totalTithes: prev1Agg.totalTithes || 0,
          totalAttendance: prev1Agg.totalAttendance || 0,
        },
        prev2: {
          month: previous[1]
            ? `${previous[1].month} ${previous[1].year}`
            : null,
          totalIncome: prev2Agg.totalIncome || 0,
          totalTithes: prev2Agg.totalTithes || 0,
          totalAttendance: prev2Agg.totalAttendance || 0,
        },
        change: {
          incomeVsPrev1: percentChange(
            prev1Agg.totalIncome || 0,
            current.totalIncome || 0
          ),
          attendanceVsPrev1: percentChange(
            prev1Agg.totalAttendance || 0,
            current.totalAttendance || 0
          ),
          tithesVsPrev1: percentChange(
            prev1Agg.totalTithes || 0,
            current.totalTithes || 0
          ),
        },
      });
    }

    // Build district totals (current month)
    const districtTotals = {
      totalIncome: sum(mainAggregated.map((x: any) => x.totalIncome || 0)),
      totalAttendance: sum(
        mainAggregated.map((x: any) => x.totalAttendance || 0)
      ),
      totalTithes: sum(mainAggregated.map((x: any) => x.totalTithes || 0)),
    };

    // Prepare structured payload for AI (JSON + short human instructions)
    const payloadForAI = {
      month: `${month} ${year}`,
      assemblies: mainAggregated,
      comparisons,
      districtTotals,
      previousMonths: previous.map((p) => `${p.month} ${p.year}`),
    };

    // Compose prompt - emphasize not to invent numbers and to reason from provided data
    const prompt = `
You are a senior financial analyst and church administration expert.
You will produce a comprehensive MONTHLY FINANCIAL & NUMERICAL REPORT for a church district.

STRICT RULES (DO NOT BREAK):
- DO NOT invent numbers, statistics, percentages, or assemblies.
- Use ONLY the numbers in the provided JSON.
- If data is missing or zero, interpret it realistically (e.g., “zero reporting”, “possible under-reporting”, “no attendance submitted”).
- Always reason inside the data that is given.

=========== INPUT JSON ===========
${JSON.stringify(payloadForAI, null, 2)}
==================================

Generate a full professional report with the following sections:

# 1. Executive Summary
- 2–4 sentences summarising the district’s overall financial and attendance performance.
- Mention only trends supported by the data.

# 2. District Totals Overview
Provide:
- Total Income
- Total Attendance
- Total Tithes  
Then add:
- A short analytical interpretation using only provided numbers.

# 3. Assembly Performance Table
Create a clean Markdown table:
Assembly | Income | Attendance | Tithes | % Income Change vs Last Month

# 4. Top 3 Performing Assemblies
- Rank assemblies by totalIncome.
- Explain WHY each one is top — using their figures only.

# 5. Bottom 3 Assemblies
- Identify assemblies with lowest income or attendance.
- Provide short reasons (missing data, extremely low attendance, zero reporting, etc.)

# 6. Trend Analysis vs Previous Months
For each assembly:
- Income trend (up/down/same)
- Tithes trend
- Attendance trend
- Explain the trend with clear reasoning using only provided comparisons.

# 7. Financial Health Assessment (District)
Include:
- Income stability comment
- Offering distribution insights (use breakdown available)
- Tithes-to-income relationship
- Income per attendee (do NOT compute if data missing; instead say “insufficient data for ratio”).

# 8. Attendance & Growth Insights
- Identify growth or decline patterns across assemblies.
- Highlight assemblies with unusually high or low attendance.
- Mention district-wide consistency or fluctuation.

# 9. Ministry Impact & Engagement Recommendations
Using the data:
- Suggest pastoral strategies for low-attendance assemblies.
- Suggest follow-up actions for assemblies with low reporting.
- Suggest engagement practices for stronger assemblies.

# 10. Pastoral Leadership Recommendations
- Assemblies needing pastoral visitation
- Assemblies needing administrative support
- Assemblies showing strong pastoral effectiveness

# 11. Risk Flags & Alerts
Identify assemblies that show:
- Zero reporting
- Sharp drops in income or attendance
- Sudden increases that look abnormal
- Missing offering categories
- Possible data-quality issues  
(Explain only from the given JSON — NO speculation.)

# 12. Data Quality Assessment
- Evaluate completeness of the month’s submissions.
- Identify assemblies with missing, inconsistent, or zero values.
- Suggest improvements for reporting accuracy.

# 13. 90-Day Strategic Roadmap
Provide a high-level but practical strategy:
- Immediate priorities (0–30 days)
- Mid-term (30–60 days)
- Long-term (60–90 days)

# 14. Assembly-Specific Notes
Write 1–2 sentences for EACH assembly:
- Explain their unique challenge, strength, or pattern based only on their numbers.

# 15. Accountability & Transparency Highlights
- Comment on reporting discipline
- Treasury accuracy
- Offering category breakdown usage

# 16. Recognition & Motivation
Highlight:
- Assembly of the Month (based on income + attendance combined)
- Most Improved Assembly (income change vs previous month)
- Best Reporting Assembly (non-zero, complete data)

Write everything in clean, excellent Markdown. Keep it professional, pastoral, and data-grounded.
`;

    const completion = await client.responses.create({
      model: "gpt-4.1",
      input: prompt,
    });

    const reportText = completion.output_text || "";

    return NextResponse.json({
      success: true,
      month,
      year,
      report: reportText,
      rawAggregated: mainAggregated,
      comparisons,
      districtTotals,
      previousMonths: previous,
    });
  } catch (err: any) {
    console.error("Generate report error:", err);
    return NextResponse.json(
      { success: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
