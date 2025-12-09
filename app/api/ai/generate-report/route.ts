import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Extract reports
    const reports = body?.data?.reports || [];
    const summary = body?.data?.summary || {};

    if (!reports.length) {
      return NextResponse.json(
        { success: false, message: "No reports found" },
        { status: 400 }
      );
    }

    // Prepare clean data for AI (remove unnecessary fields)
    const cleanReports = reports.map((r: any) => ({
      assembly: r.assembly,
      serviceType: r.serviceType,
      records: r.records,
    }));

    // System prompt to avoid hallucination
    const systemPrompt = `
You are an AI responsible for generating district church analysis reports.
You MUST NOT hallucinate any data. 
Only use data provided in "reports" and "summary".
If a metric is not in the input, do not fabricate it.

Your report must include:
1. Financial analysis
2. Attendance & growth analysis
3. Assembly-by-assembly performance
4. Strengths & concerns
5. Trends or patterns
6. Recommendations for leadership

Do NOT add fake numbers, percentages, or extra weeks. 
Keep everything strictly tied to the input JSON.
    `;

    const userPrompt = `
Generate a full district church report based on the following:

Reports:
${JSON.stringify(cleanReports, null, 2)}

Summary:
${JSON.stringify(summary, null, 2)}
    `;

    // AI Completion
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    const aiReport = completion.choices[0].message?.content ?? "";

    return NextResponse.json({
      success: true,
      report: aiReport,
      summary,
      assemblies: cleanReports,
    });
  } catch (error) {
    console.error("AI Report Error:", error);
    return NextResponse.json(
      { success: false, message: "Error generating report", error },
      { status: 500 }
    );
  }
}
