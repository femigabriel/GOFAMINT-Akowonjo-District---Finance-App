// File: app/api/admin/reports/comparison/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const assembly1 = searchParams.get('assembly1');
    const assembly2 = searchParams.get('assembly2');
    const month = searchParams.get('month') || 'December-2025';
    
    if (!assembly1 || !assembly2) {
      return NextResponse.json(
        { success: false, error: 'Please provide two assemblies to compare' },
        { status: 400 }
      );
    }
    
    // Fetch reports
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const reportsResponse = await fetch(`${baseUrl}/api/admin/reports/detailed?month=${month}`);
    
    if (!reportsResponse.ok) {
      throw new Error('Failed to fetch reports data');
    }
    
    const reportsData = await reportsResponse.json();
    
    if (!reportsData.success) {
      throw new Error('Failed to fetch reports');
    }
    
    const reports = reportsData.data.reports;
    
    // Filter reports for the two assemblies
    const assembly1Reports = reports.filter((r: { assembly: string; }) => r.assembly === assembly1);
    const assembly2Reports = reports.filter((r: { assembly: string; }) => r.assembly === assembly2);
    
    if (assembly1Reports.length === 0 || assembly2Reports.length === 0) {
      return NextResponse.json(
        { success: false, error: 'One or both assemblies not found for the given month' },
        { status: 404 }
      );
    }
    
    // Calculate metrics for comparison
    const assembly1Metrics = calculateAssemblyMetrics(assembly1Reports);
    const assembly2Metrics = calculateAssemblyMetrics(assembly2Reports);
    
    // Generate AI comparison
    const comparison = await generateComparisonAnalysis(
      assembly1,
      assembly2,
      assembly1Metrics,
      assembly2Metrics,
      month
    );
    
    return NextResponse.json({
      success: true,
      data: {
        comparison,
        metrics: {
          [assembly1]: assembly1Metrics,
          [assembly2]: assembly2Metrics,
        },
        month
      }
    });
    
  } catch (error: any) {
    console.error('Error generating comparison:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate comparison',
      },
      { status: 500 }
    );
  }
}

function calculateAssemblyMetrics(reports: any[]) {
  const metrics = {
    totalIncome: 0,
    totalAttendance: 0,
    sundayIncome: 0,
    sundayAttendance: 0,
    midweekIncome: 0,
    midweekAttendance: 0,
    tithes: 0,
    offerings: 0,
    pastorsWarfare: 0,
    thanksgiving: 0,
    sbsAttendance: 0,
    visitors: 0,
    recordsCount: 0,
    services: {
      sunday: 0,
      midweek: 0,
      special: 0
    }
  };
  
  reports.forEach(report => {
    report.records.forEach((record: any) => {
      metrics.totalIncome += record.total || 0;
      metrics.totalAttendance += record.attendance || 0;
      metrics.recordsCount++;
      
      if (report.serviceType === 'sunday') {
        metrics.sundayIncome += record.total || 0;
        metrics.sundayAttendance += record.attendance || 0;
        metrics.tithes += record.tithes || 0;
        metrics.offerings += record.offerings || 0;
        metrics.pastorsWarfare += record.pastorsWarfare || 0;
        metrics.thanksgiving += record.thanksgiving || 0;
        metrics.sbsAttendance += record.sbsAttendance || 0;
        metrics.visitors += record.visitors || 0;
        metrics.services.sunday++;
      } else if (report.serviceType === 'midweek') {
        metrics.midweekIncome += record.total || 0;
        metrics.midweekAttendance += record.attendance || 0;
        metrics.services.midweek++;
      } else {
        metrics.services.special++;
      }
    });
  });
  
  // Calculate derived metrics
  const derivedMetrics = {
    ...metrics,
    incomePerAttendee: metrics.totalIncome / metrics.totalAttendance || 0,
    tithePercentage: (metrics.tithes / metrics.sundayIncome * 100) || 0,
    sbsParticipationRate: (metrics.sbsAttendance / metrics.sundayAttendance * 100) || 0,
    visitorRate: metrics.visitors / metrics.services.sunday || 0,
    avgSundayAttendance: metrics.sundayAttendance / metrics.services.sunday || 0,
    avgMidweekAttendance: metrics.midweekAttendance / metrics.services.midweek || 0
  };
  
  return derivedMetrics;
}

async function generateComparisonAnalysis(
  assembly1: string,
  assembly2: string,
  metrics1: any,
  metrics2: any,
  month: string
) {
  const prompt = `
Compare the performance of two church assemblies for ${month}:

${assembly1.toUpperCase()}:
- Total Income: ₦${metrics1.totalIncome.toLocaleString()}
- Total Attendance: ${metrics1.totalAttendance}
- Sunday Attendance: ${metrics1.sundayAttendance} (Avg: ${Math.round(metrics1.avgSundayAttendance)})
- Midweek Attendance: ${metrics1.midweekAttendance} (Avg: ${Math.round(metrics1.avgMidweekAttendance)})
- Tithes: ₦${metrics1.tithes.toLocaleString()} (${metrics1.tithePercentage.toFixed(1)}% of Sunday income)
- Income per Attendee: ₦${Math.round(metrics1.incomePerAttendee)}
- SBS Participation: ${metrics1.sbsParticipationRate.toFixed(1)}%
- Visitors: ${metrics1.visitors}

${assembly2.toUpperCase()}:
- Total Income: ₦${metrics2.totalIncome.toLocaleString()}
- Total Attendance: ${metrics2.totalAttendance}
- Sunday Attendance: ${metrics2.sundayAttendance} (Avg: ${Math.round(metrics2.avgSundayAttendance)})
- Midweek Attendance: ${metrics2.midweekAttendance} (Avg: ${Math.round(metrics2.avgMidweekAttendance)})
- Tithes: ₦${metrics2.tithes.toLocaleString()} (${metrics2.tithePercentage.toFixed(1)}% of Sunday income)
- Income per Attendee: ₦${Math.round(metrics2.incomePerAttendee)}
- SBS Participation: ${metrics2.sbsParticipationRate.toFixed(1)}%
- Visitors: ${metrics2.visitors}

Please provide a comparative analysis covering:
1. FINANCIAL PERFORMANCE: Income comparison, giving patterns
2. ATTENDANCE & GROWTH: Size comparison, engagement levels
3. SPIRITUAL INDICATORS: SBS participation, visitor engagement
4. STRENGTHS: What each assembly does well
5. AREAS FOR IMPROVEMENT: Specific opportunities for each
6. CROSS-LEARNING: What can each learn from the other
7. RECOMMENDATIONS: Tailored suggestions for growth

Focus on actionable insights and practical recommendations.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a church growth consultant specializing in comparative analysis between church assemblies. Provide balanced, data-driven insights that highlight both strengths and growth opportunities."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    return completion.choices[0].message.content;
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateFallbackComparison(assembly1, assembly2, metrics1, metrics2);
  }
}

function generateFallbackComparison(assembly1: string, assembly2: string, metrics1: any, metrics2: any) {
  let comparison = `COMPARISON: ${assembly1} vs ${assembly2}\n\n`;
  
  // Financial comparison
  const incomeDifference = metrics1.totalIncome - metrics2.totalIncome;
  const incomePercent = (Math.abs(incomeDifference) / Math.max(metrics1.totalIncome, metrics2.totalIncome) * 100).toFixed(1);
  
  comparison += `FINANCIAL:\n`;
  comparison += `- ${assembly1}: ₦${metrics1.totalIncome.toLocaleString()}\n`;
  comparison += `- ${assembly2}: ₦${metrics2.totalIncome.toLocaleString()}\n`;
  comparison += `- Difference: ₦${Math.abs(incomeDifference).toLocaleString()} (${incomePercent}% ${incomeDifference > 0 ? 'higher' : 'lower'})\n\n`;
  
  // Attendance comparison
  const attendanceDifference = metrics1.totalAttendance - metrics2.totalAttendance;
  comparison += `ATTENDANCE:\n`;
  comparison += `- ${assembly1}: ${metrics1.totalAttendance} total\n`;
  comparison += `- ${assembly2}: ${metrics2.totalAttendance} total\n`;
  comparison += `- Difference: ${Math.abs(attendanceDifference)} attendees\n\n`;
  
  // Tithe comparison
  comparison += `TITHING:\n`;
  comparison += `- ${assembly1}: ${metrics1.tithePercentage.toFixed(1)}% of Sunday income\n`;
  comparison += `- ${assembly2}: ${metrics2.tithePercentage.toFixed(1)}% of Sunday income\n\n`;
  
  // Recommendations
  comparison += `RECOMMENDATIONS:\n`;
  
  if (metrics1.incomePerAttendee > metrics2.incomePerAttendee * 1.5) {
    comparison += `- ${assembly2} could learn from ${assembly1}'s giving culture\n`;
  }
  
  if (metrics1.sbsParticipationRate > metrics2.sbsParticipationRate + 10) {
    comparison += `- ${assembly2} should focus on SBS participation improvement\n`;
  }
  
  if (metrics2.visitors > metrics1.visitors * 2) {
    comparison += `- ${assembly1} could improve visitor engagement strategies\n`;
  }
  
  return comparison;
}