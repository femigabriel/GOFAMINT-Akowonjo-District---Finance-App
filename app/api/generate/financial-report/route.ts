// app/api/admin/reports/ai-generate/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { assemblies } from "@/lib/assemblies";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// safe sum util
const sum = (arr: number[]) => arr.reduce((a, b) => a + (b || 0), 0);

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

// UPDATED: Calculate all three attendance metrics
function getAttendanceMetrics(record: any) {
  const attendance = record?.attendance || 0;
  const sbsAttendance = record?.sbsAttendance || 0;

  // 1. Raw sum (what was being incorrectly used before)
  const rawSumAttendance = attendance + sbsAttendance;

  // 2. Database totalAttendance (might be wrong in some records)
  const dbTotalAttendance = record?.totalAttendance || 0;

  // 3. Unique attendance (corrected - from API or calculated)
  let uniqueAttendance = record?.uniqueAttendance;
  let estimatedOverlap = record?.estimatedOverlap;
  let attendanceType = record?.attendanceType || "estimated";

  // If uniqueAttendance not provided, calculate it
  if (uniqueAttendance === undefined || uniqueAttendance === null) {
    // If we have both numbers, estimate
    if (attendance > 0 && sbsAttendance > 0) {
      estimatedOverlap = Math.min(attendance, sbsAttendance) * 0.75;
      uniqueAttendance = Math.max(
        Math.max(attendance, sbsAttendance),
        Math.round(attendance + sbsAttendance - estimatedOverlap)
      );
    } else {
      uniqueAttendance = rawSumAttendance;
      estimatedOverlap = 0;
    }
  }

  // Determine which totalAttendance to use
  const totalAttendance =
    dbTotalAttendance > 0 ? dbTotalAttendance : rawSumAttendance;

  return {
    rawSum: rawSumAttendance,
    dbTotal: totalAttendance,
    unique: uniqueAttendance,
    estimatedOverlap: estimatedOverlap || 0,
    attendanceType,
    attendance,
    sbsAttendance,
  };
}

// UPDATED: Aggregate with all attendance metrics
function aggregateDetailedResponse(detailedJson: any) {
  const reports = detailedJson?.data?.reports || [];
  const map: Record<string, any> = {};

  for (const r of reports) {
    const assembly = r.assembly || "Unknown";
    if (!map[assembly]) {
      map[assembly] = {
        assembly,
        totalIncome: 0,
        totalTithes: 0,
        totalAttendance: 0, // CORRECTED: unique attendance
        totalAttendanceRaw: 0, // Raw sum (attendance + sbsAttendance)
        totalAttendanceDB: 0, // From database (might be wrong)
        estimatedTotalOverlap: 0, // Sum of estimated overlaps
        totalRecords: 0,
        offeringsBreakdown: {},
        attendanceType: "estimated", // 'actual' if all records have uniqueAttendance
        serviceBreakdown: {
          sunday: { records: 0, attendance: 0, uniqueAttendance: 0 },
          midweek: { records: 0, attendance: 0 },
          special: { records: 0, attendance: 0 },
        },
      };
    }

    const recs = Array.isArray(r.records) ? r.records : [];
    map[assembly].totalRecords += recs.length;

    // Track service types
    const serviceType = r.serviceType || "sunday";
    if (!map[assembly].serviceBreakdown[serviceType]) {
      map[assembly].serviceBreakdown[serviceType] = {
        records: 0,
        attendance: 0,
        uniqueAttendance: 0,
      };
    }
    map[assembly].serviceBreakdown[serviceType].records += recs.length;

    for (const rec of recs) {
      // Income calculations
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

      // Build offerings breakdown
      const ob = map[assembly].offeringsBreakdown;
      ob.tithes = (ob.tithes || 0) + tithes;
      ob.offerings = (ob.offerings || 0) + offerings;
      ob.specialOfferings = (ob.specialOfferings || 0) + specialOfferings;
      ob.pastorsWarfare = (ob.pastorsWarfare || 0) + pastorsWarfare;
      ob.thanksgiving = (ob.thanksgiving || 0) + thanksgiving;
      ob.etf = (ob.etf || 0) + etf;
      ob.districtSupport = (ob.districtSupport || 0) + districtSupport;

      // Income contribution
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

      // ATTENDANCE METRICS - All three versions
      const metrics = getAttendanceMetrics(rec);

      // For Sunday services: use unique attendance
      if (serviceType === "sunday") {
        map[assembly].totalAttendance += metrics.unique;
        map[assembly].serviceBreakdown[serviceType].uniqueAttendance +=
          metrics.unique;
      } else {
        // For midweek/special: just use attendance
        map[assembly].totalAttendance += rec.attendance || 0;
      }

      // Track all metrics
      map[assembly].totalAttendanceRaw += metrics.rawSum;
      map[assembly].totalAttendanceDB += metrics.dbTotal;
      map[assembly].estimatedTotalOverlap += metrics.estimatedOverlap;
      map[assembly].serviceBreakdown[serviceType].attendance +=
        rec.attendance || 0;

      // Update attendance type if we have actual data
      if (metrics.attendanceType === "actual") {
        map[assembly].attendanceType = "actual";
      }
    }
  }

  // Convert map to array, ensure assemblies with zero data are included
  const result: any[] = [];
  for (const a of Array.isArray(assemblies) ? assemblies : []) {
    const name = String(a);
    if (map[name]) {
      // Add correction percentage
      const correctionPct =
        map[name].totalAttendanceRaw > 0
          ? ((map[name].totalAttendanceRaw - map[name].totalAttendance) /
              map[name].totalAttendanceRaw) *
            100
          : 0;

      result.push({
        ...map[name],
        attendanceCorrectionPct: Math.round(correctionPct),
        // Per capita metrics
        incomePerAttendee:
          map[name].totalAttendance > 0
            ? Math.round(map[name].totalIncome / map[name].totalAttendance)
            : 0,
        tithesPerAttendee:
          map[name].totalAttendance > 0
            ? Math.round(map[name].totalTithes / map[name].totalAttendance)
            : 0,
      });
    } else {
      result.push({
        assembly: name,
        totalIncome: 0,
        totalTithes: 0,
        totalAttendance: 0,
        totalAttendanceRaw: 0,
        totalAttendanceDB: 0,
        estimatedTotalOverlap: 0,
        totalRecords: 0,
        attendanceCorrectionPct: 0,
        incomePerAttendee: 0,
        tithesPerAttendee: 0,
        offeringsBreakdown: {},
        attendanceType: "estimated",
        serviceBreakdown: {
          sunday: { records: 0, attendance: 0, uniqueAttendance: 0 },
          midweek: { records: 0, attendance: 0 },
          special: { records: 0, attendance: 0 },
        },
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
            totalAttendanceRaw: 0,
            totalAttendanceDB: 0,
            estimatedTotalOverlap: 0,
            totalRecords: 0,
            attendanceCorrectionPct: 0,
            offeringsBreakdown: {},
            attendanceType: "estimated",
            serviceBreakdown: {
              sunday: { records: 0, attendance: 0, uniqueAttendance: 0 },
              midweek: { records: 0, attendance: 0 },
              special: { records: 0, attendance: 0 },
            },
          })),
        });
      }
    }

    // Build comparison structure per assembly with all metrics
    const comparisons: any[] = [];

    for (const a of assemblies) {
      const name = String(a);
      const current = mainAggregated.find((x: any) => x.assembly === name) || {
        totalIncome: 0,
        totalTithes: 0,
        totalAttendance: 0,
        totalAttendanceRaw: 0,
        totalAttendanceDB: 0,
        estimatedTotalOverlap: 0,
      };

      // previous months
      const prev1Agg = prevAggregatedList[0]?.agg?.find(
        (x: any) => x.assembly === name
      ) || {
        totalIncome: 0,
        totalTithes: 0,
        totalAttendance: 0,
        totalAttendanceRaw: 0,
        totalAttendanceDB: 0,
      };

      const prev2Agg = prevAggregatedList[1]?.agg?.find(
        (x: any) => x.assembly === name
      ) || {
        totalIncome: 0,
        totalTithes: 0,
        totalAttendance: 0,
        totalAttendanceRaw: 0,
        totalAttendanceDB: 0,
      };

      comparisons.push({
        assembly: name,
        current: {
          totalIncome: current.totalIncome || 0,
          totalTithes: current.totalTithes || 0,
          totalAttendance: current.totalAttendance || 0,
          totalAttendanceRaw: current.totalAttendanceRaw || 0,
          totalAttendanceDB: current.totalAttendanceDB || 0,
          estimatedTotalOverlap: current.estimatedTotalOverlap || 0,
          attendanceCorrectionPct: current.attendanceCorrectionPct || 0,
          incomePerAttendee: current.incomePerAttendee || 0,
          tithesPerAttendee: current.tithesPerAttendee || 0,
          totalRecords: current.totalRecords || 0,
          attendanceType: current.attendanceType || "estimated",
          serviceBreakdown: current.serviceBreakdown || {},
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

    // Build district totals with all metrics
    const districtTotals = {
      totalIncome: sum(mainAggregated.map((x: any) => x.totalIncome || 0)),
      totalAttendance: sum(
        mainAggregated.map((x: any) => x.totalAttendance || 0)
      ),
      totalAttendanceRaw: sum(
        mainAggregated.map((x: any) => x.totalAttendanceRaw || 0)
      ),
      totalAttendanceDB: sum(
        mainAggregated.map((x: any) => x.totalAttendanceDB || 0)
      ),
      totalTithes: sum(mainAggregated.map((x: any) => x.totalTithes || 0)),
      estimatedTotalOverlap: sum(
        mainAggregated.map((x: any) => x.estimatedTotalOverlap || 0)
      ),
      totalRecords: sum(mainAggregated.map((x: any) => x.totalRecords || 0)),
      attendanceCorrection:
        sum(mainAggregated.map((x: any) => x.totalAttendanceRaw || 0)) -
        sum(mainAggregated.map((x: any) => x.totalAttendance || 0)),
      attendanceCorrectionPct:
        sum(mainAggregated.map((x: any) => x.totalAttendanceRaw || 0)) > 0
          ? Math.round(
              ((sum(mainAggregated.map((x: any) => x.totalAttendanceRaw || 0)) -
                sum(mainAggregated.map((x: any) => x.totalAttendance || 0))) /
                sum(
                  mainAggregated.map((x: any) => x.totalAttendanceRaw || 0)
                )) *
                100
            )
          : 0,
      incomePerAttendee:
        sum(mainAggregated.map((x: any) => x.totalAttendance || 0)) > 0
          ? Math.round(
              sum(mainAggregated.map((x: any) => x.totalIncome || 0)) /
                sum(mainAggregated.map((x: any) => x.totalAttendance || 0))
            )
          : 0,
      assembliesWithActualData: mainAggregated.filter(
        (x: any) => x.attendanceType === "actual"
      ).length,
    };

    // Prepare structured payload for AI - include all attendance metrics
    const payloadForAI = {
      month: `${month} ${year}`,
      assemblies: mainAggregated,
      comparisons,
      districtTotals,
      previousMonths: previous.map((p) => `${p.month} ${p.year}`),
      attendanceMetricsNote:
        "IMPORTANT: Attendance data uses corrected 'uniqueAttendance' to avoid double-counting. The same people often attend both Sunday School (SBS) and main service. 'totalAttendance' shows unique attendees, 'totalAttendanceRaw' shows the double-counted sum, and 'estimatedTotalOverlap' shows estimated duplicates.",
    };

    // UPDATED prompt to explain attendance metrics
    const prompt = `
You are a senior financial analyst and church administration expert.
You will produce a comprehensive MONTHLY FINANCIAL & NUMERICAL REPORT for a church district.

CRITICAL ATTENDANCE NOTE: The attendance data has been CORRECTED to avoid double-counting. 
- Many people attend both Sunday School (SBS) and the main Sunday service
- Previously, attendance was calculated as: attendance + sbsAttendance = total (DOUBLE-COUNTED)
- Now we use 'uniqueAttendance' which estimates the actual number of unique people
- Example: If 51 attend service and 32 attend SBS, with ~24 estimated overlap, unique attendance is ~59 (not 83)
- The correction reduces reported attendance by 25-40% but is more accurate

STRICT RULES (DO NOT BREAK):
- DO NOT invent numbers, statistics, percentages, or assemblies.
- Use ONLY the numbers in the provided JSON.
- For attendance analysis, ALWAYS use 'totalAttendance' (corrected unique attendance), not 'totalAttendanceRaw' (double-counted).
- Mention the attendance correction in your analysis when relevant.
- If data is missing or zero, interpret it realistically.

=========== INPUT JSON ===========
${JSON.stringify(payloadForAI, null, 2)}
==================================

Generate a full professional report with the following sections:

# 1. Executive Summary
- 2–4 sentences summarising the district's overall financial and attendance performance.
- Mention the attendance correction if significant (e.g., "using corrected attendance figures to avoid double-counting").
- Highlight only trends supported by the data.

# 2. District Totals Overview
Present CORRECTED figures:
- Total Income: ${districtTotals.totalIncome}
- Total Attendance (Corrected/Unique): ${districtTotals.totalAttendance} 
- Total Attendance (Old method/Raw): ${districtTotals.totalAttendanceRaw}
- Attendance Correction: ${districtTotals.attendanceCorrection} people (${
      districtTotals.attendanceCorrectionPct
    }% reduction)
- Total Tithes: ${districtTotals.totalTithes}
- Estimated Total Overlap: ${
      districtTotals.estimatedTotalOverlap
    } (people attending both services)
- Income per Attendee: ${districtTotals.incomePerAttendee}

Add 1-2 sentences interpreting these corrected numbers.

# 3. Assembly Performance Table
Create a clean Markdown table with CORRECTED attendance:
| Assembly | Income | Attendance (Corrected) | Attendance (Raw/Old) | Correction % | Tithes | % Income Change |
|----------|--------|------------------------|----------------------|--------------|--------|-----------------|
${mainAggregated
  .map(
    (a) =>
      `| ${a.assembly} | ${a.totalIncome} | ${a.totalAttendance} | ${
        a.totalAttendanceRaw
      } | ${a.attendanceCorrectionPct}% | ${a.totalTithes} | ${
        comparisons
          .find((c) => c.assembly === a.assembly)
          ?.change?.incomeVsPrev1?.toFixed(1) || 0
      }% |`
  )
  .join("\n")}

# 4. Attendance Analysis Section
For EACH assembly, analyze:
- Unique attendance vs. double-counted attendance
- Estimated overlap between SBS and service
- Whether using actual or estimated data
- Service breakdown (Sunday vs. Midweek attendance)

# 5. Top 3 Performing Assemblies (by corrected attendance)
- Rank by 'totalAttendance' (corrected)
- Explain their attendance patterns (SBS vs Service ratio)
- Mention if their data is actual or estimated

# 6. Bottom 3 Assemblies 
- Identify by lowest corrected attendance
- Analyze their attendance overlap patterns
- Note any data quality issues

# 7. Data Quality & Correction Assessment
- How many assemblies have actual vs estimated attendance data?
- Magnitude of attendance correction across assemblies
- Recommendations for improving data collection (collect 'attendedBoth' count)

# 8. Financial Health with Corrected Attendance
- Income per unique attendee (more accurate now)
- Tithes per unique attendee
- How correction affects per capita metrics

# 9. Ministry Impact with Accurate Numbers
- True reach of ministries (unique individuals)
- SBS effectiveness analysis
- Service engagement patterns

# 10. Strategic Recommendations Based on Accurate Data
- Focus on assemblies with low unique attendance
- SBS engagement strategies
- Data collection improvements

Write everything in clean, excellent Markdown. Keep it professional, pastoral, and data-grounded.
Always reference that you're using corrected attendance figures to avoid double-counting.
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
      attendanceNote:
        "Note: Attendance figures use 'uniqueAttendance' to avoid double-counting. The same people often attend both Sunday School and main service. Old method (totalAttendanceRaw) would double-count these individuals.",
    });
  } catch (err: any) {
    console.error("Generate report error:", err);
    return NextResponse.json(
      { success: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
