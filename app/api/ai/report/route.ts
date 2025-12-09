// app/api/ai/report/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { assembly, reports, period, location } = data;

    // Calculate statistics from reports
    const allRecords = reports.flatMap((r: any) => r.records || []);
    const sundayRecords = reports
      .filter((r: any) => r.serviceType === "sunday")
      .flatMap((r: any) => r.records || []);
    const midweekRecords = reports
      .filter((r: any) => r.serviceType === "midweek")
      .flatMap((r: any) => r.records || []);

    // Calculate key metrics
    const totalIncome = allRecords.reduce(
      (sum: number, r: any) => sum + (r.total || 0),
      0
    );
    const sundayIncome = sundayRecords.reduce(
      (sum: number, r: any) => sum + (r.total || 0),
      0
    );
    const midweekIncome = midweekRecords.reduce(
      (sum: number, r: any) => sum + (r.total || 0),
      0
    );
    const totalAttendance = allRecords.reduce(
      (sum: number, r: any) => sum + (r.totalAttendance || r.attendance || 0),
      0
    );
    const sundayAttendance = sundayRecords.reduce(
      (sum: number, r: any) => sum + (r.totalAttendance || 0),
      0
    );
    const midweekAttendance = midweekRecords.reduce(
      (sum: number, r: any) => sum + (r.attendance || 0),
      0
    );

    // Prepare prompt for OpenAI
    const prompt = `
You are a senior Nigerian church growth consultant (15+ years experience) who
writes high-level ministry audit reports for pastors. Your reports must be:

- Very professional, like a consultant's audit
- Data-driven and honest (no sugarcoating)
- Deep, diagnostic, and contextual
- Balanced: firm but pastoral
- Highly specific to Lagos, Nigeria
- Strategic, not generic

STRICT RULES:
- Do not fabricate numbers, trends, or historical comparisons.
- Base every insight ONLY on the data supplied.
- Do not assume anything that is not explicitly in the dataset.
- No imaginary attendance patterns, demographic assumptions, or financial history.

TONE REQUIREMENT:
- Firm but respectful.
- Truthful but not insulting.
- Pastoral, not condemning.
- Professional, not emotional.

FORMATTING RULE:
- Include ALL 10 SECTIONS exactly as listed.
- Each section must have a clear header.
- Do not merge sections.
- No markdown formatting.

BASE EVERYTHING STRICTLY ON THE DATA PROVIDED.

CHURCH DATA:
- Assembly: ${assembly}
- Location: ${location}
- Period: ${new Date(period.from).toLocaleDateString()} to ${new Date(
      period.to
    ).toLocaleDateString()}

FINANCIAL DATA:
- Total Income: ₦${totalIncome.toLocaleString()}
- Sunday Service Income: ₦${sundayIncome.toLocaleString()}
- Midweek Service Income: ₦${midweekIncome.toLocaleString()}
- Average Weekly Income: ₦${(
      totalIncome / (reports.length || 1)
    ).toLocaleString()}

ATTENDANCE DATA:
- Total Attendance: ${totalAttendance.toLocaleString()}
- Sunday Attendance: ${sundayAttendance.toLocaleString()}
- Midweek Attendance: ${midweekAttendance.toLocaleString()}
- Average Weekly Attendance: ${Math.round(
      totalAttendance / (reports.length || 1)
    ).toLocaleString()}

ADDITIONAL METRICS:
- Number of Services: ${reports.length}
- Total Records: ${allRecords.length}
- Sunday Services: ${
      reports.filter((r: any) => r.serviceType === "sunday").length
    }
- Midweek Services: ${
      reports.filter((r: any) => r.serviceType === "midweek").length
    }

REQUIRED REPORT SECTIONS (WRITE IN CLEAR, POLISHED PARAGRAPHS):

1. EXECUTIVE SUMMARY:
   - Deliver a direct, honest overview of the church’s reality.
   - If performance is weak, state clearly and professionally.
   - Identify the biggest threat to the church’s growth.

2. FINANCIAL ANALYSIS:
   - Evaluate sustainability.
   - Identify giving culture strength/weakness.
   - Comment on dependence on Sunday income.
   - Explain what the church MUST fix in the next 90 days.

3. ATTENDANCE ANALYSIS:
   - Evaluate growth, decline, and engagement.
   - Explain why midweek attendance is low using Lagos context:
     • traffic patterns
     • working hours
     • transportation cost
     • school schedules
   - Show the spiritual implications of weak midweeks.

4. STRENGTHS:
   - Only use REAL, DATA-PROVEN strengths.
   - No forced positivity.

5. WEAKNESSES & GAPS:
   - Explain the ministry consequences if each gap continues.
   - Highlight systems breakdown, discipleship gaps, leadership issues,
     engagement gaps, follow-up system weaknesses, etc.

6. LAGOS CONTEXT RECOMMENDATIONS:
   - Provide solutions tailored to Lagos urban realities.
   - Think: working-class schedules, young demographic, bus/taxi routes,
     noise culture, digital-heavy lifestyle.

7. GROWTH STRATEGIES:
   Provide:
   - 2-week quick wins
   - 1–3 month mid-term strategies
   - 6–12 month long-term strategies

8. DIGITAL MINISTRY STRATEGY:
   - WhatsApp-based discipleship and retention
   - Short-form content ideas for Nigerian audience
   - Streaming recommendations
   - Suggested posting schedule

9. YOUTH & FAMILY ENGAGEMENT:
   - Ministry structure
   - Service style adjustments
   - Volunteer pipelines
   - Event ideas that work in Lagos

10. FINANCIAL STEWARDSHIP:
   - Teaching modules
   - Giving systems
   - Accountability processes
   - Partnership ideas
   - How to shift from “Sunday-only” income

REPORT INSTRUCTIONS:
- Write in polished, natural paragraphs.
- Be specific, firm, and insightful.
- Give measurable, actionable recommendations.
- Use Nigerian English expressions where appropriate, but remain professional.
`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an experienced church growth consultant specializing in Nigerian churches, with deep knowledge of Lagos context, cultural dynamics, and effective ministry strategies.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiReport = completion.choices[0].message.content;

    return NextResponse.json({
      success: true,
      report: aiReport,
      metrics: {
        totalIncome,
        sundayIncome,
        midweekIncome,
        totalAttendance,
        sundayAttendance,
        midweekAttendance,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("AI Report Generation Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate AI report",
      },
      { status: 500 }
    );
  }
}
