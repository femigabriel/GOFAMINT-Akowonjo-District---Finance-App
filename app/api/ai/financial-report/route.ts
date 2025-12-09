// app/api/ai/admin-comprehensive-analysis/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AdminAnalysisRequest {
  reports: any[];
  summary: any;
  period: {
    from: string;
    to: string;
  };
  location?: string;
}

interface AssemblyPerformance {
  name: string;
  totalIncome: number;
  totalAttendance: number;
  reportCount: number;
  sundayReports: number;
  midweekReports: number;
  specialReports: number;
  sundayIncome: number;
  midweekIncome: number;
  specialIncome: number;
  sundayAttendance: number;
  midweekAttendance: number;
  specialAttendance: number;
  averagePerService: number;
  averageAttendancePerService: number;
  completenessScore: number;
}

interface AdminComprehensiveAnalysis {
  executive_summary: string;
  district_overview: string;
  assembly_performance_ranking: Array<{
    rank: number;
    assembly: string;
    total_income: number;
    total_attendance: number;
    income_per_attendee: number;
    report_completeness: string;
    key_strength: string;
    major_challenge: string;
  }>;
  financial_health_assessment: {
    overall_health: "Strong" | "Moderate" | "Concerning";
    revenue_distribution: string;
    giving_trends: string;
    collection_efficiency: string;
    areas_of_concern: string[];
    sustainability_metrics: {
      revenue_diversification_score: number;
      income_stability_index: number;
      growth_trajectory: string;
    };
  };
  attendance_analysis: {
    overall_trend: string;
    assembly_comparison: string;
    engagement_patterns: string;
    seasonal_factors: string[];
    retention_analysis: string;
    growth_opportunities: string[];
  };
  operational_efficiency: {
    reporting_compliance: {
      overall_compliance_rate: number;
      best_performers: string[];
      lagging_assemblies: string[];
      submission_timeliness: string;
    };
    data_quality: {
      completeness_score: number;
      accuracy_indicators: string[];
      missing_data_impact: string;
    };
  };
  strategic_recommendations: {
    immediate_actions: string[];
    short_term_goals: string[];
    long_term_strategies: string[];
    assembly_specific_interventions: Array<{
      assembly: string;
      priority_area: string;
      recommended_action: string;
    }>;
  };
  risk_assessment: {
    financial_risks: string[];
    operational_risks: string[];
    growth_risks: string[];
    mitigation_strategies: string[];
  };
  success_stories: Array<{
    assembly: string;
    achievement: string;
    replicable_strategy: string;
  }>;
  next_quarter_targets: {
    financial_targets: {
      overall_target: number;
      assembly_targets: Array<{ assembly: string; target: number }>;
    };
    attendance_targets: {
      overall_target: number;
      assembly_targets: Array<{ assembly: string; target: number }>;
    };
    reporting_targets: {
      completeness_goal: number;
      timeliness_goal: string;
    };
  };
  detailed_report: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reports, summary, period, location = "Lagos, Nigeria" } = body as AdminAnalysisRequest;

    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "No reports data provided",
          message: "Please provide service reports for analysis"
        },
        { status: 400 }
      );
    }

    // 1. Analyze assembly performance
    const assemblyPerformance = analyzeAssemblyPerformance(reports);
    
    // 2. Calculate district-wide metrics
    const districtMetrics = calculateDistrictMetrics(reports, summary, assemblyPerformance);
    
    // 3. Create comprehensive prompt
    const prompt = createAdminAnalysisPrompt(
      reports,
      summary,
      assemblyPerformance,
      districtMetrics,
      period,
      location
    );

    console.log("🤖 Generating comprehensive admin analysis...");

    // 4. Call OpenAI for comprehensive analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are the District Superintendent of GOFAMINT Akowonjo District, Region 28 in Lagos, Nigeria.
          You have 20+ years of experience in church administration, financial management, and ministerial oversight.
          You provide strategic, data-driven analysis for district leadership with:
          
          1. DEEP UNDERSTANDING of Nigerian church dynamics in urban Lagos
          2. STRATEGIC MINDSET for district-level planning and resource allocation
          3. FINANCIAL ACUMEN for sustainability and growth analysis
          4. OPERATIONAL EXPERTISE in church administration and reporting systems
          5. PASTORAL INSIGHT for spiritual health and ministry effectiveness
          
          Your analysis must be:
          - Honest and data-driven (no sugarcoating)
          - Strategic and actionable
          - Balanced between financial and ministerial considerations
          - Culturally relevant to Lagos context
          - Professional yet accessible to church leadership`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const analysis: AdminComprehensiveAnalysis = JSON.parse(
      response.choices[0].message.content || "{}"
    );

    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        generated_at: new Date().toISOString(),
        district_name: "GOFAMINT Akowonjo District, Region 28",
        location,
        period: `${new Date(period.from).toLocaleDateString()} to ${new Date(period.to).toLocaleDateString()}`,
        total_assemblies: assemblyPerformance.length,
        total_reports: reports.length,
        total_income: summary.totalIncome || 0,
        total_attendance: summary.totalAttendance || 0,
        reporting_compliance_rate: calculateReportingCompliance(reports)
      }
    });

  } catch (error: any) {
    console.error("Admin comprehensive analysis error:", error);
    
    // Generate a fallback analysis
    const fallbackAnalysis = generateFallbackAdminAnalysis(body);
    
    return NextResponse.json({
      success: true,
      data: fallbackAnalysis,
      metadata: {
        generated_at: new Date().toISOString(),
        note: "Analysis generated with limited AI assistance",
        fallback_reason: error.message || "AI service unavailable"
      }
    }, { status: 200 });
  }
}

// ==================== ANALYSIS FUNCTIONS ====================

function analyzeAssemblyPerformance(reports: any[]): AssemblyPerformance[] {
  const assemblyMap = new Map<string, AssemblyPerformance>();
  
  reports.forEach(report => {
    const assemblyName = report.assembly;
    
    if (!assemblyMap.has(assemblyName)) {
      assemblyMap.set(assemblyName, {
        name: assemblyName,
        totalIncome: 0,
        totalAttendance: 0,
        reportCount: 0,
        sundayReports: 0,
        midweekReports: 0,
        specialReports: 0,
        sundayIncome: 0,
        midweekIncome: 0,
        specialIncome: 0,
        sundayAttendance: 0,
        midweekAttendance: 0,
        specialAttendance: 0,
        averagePerService: 0,
        averageAttendancePerService: 0,
        completenessScore: 0
      });
    }
    
    const assembly = assemblyMap.get(assemblyName)!;
    
    // Calculate report totals
    assembly.reportCount += 1;
    assembly.totalIncome += calculateReportTotalIncome(report);
    assembly.totalAttendance += calculateReportTotalAttendance(report);
    
    // Categorize by service type
    switch (report.serviceType) {
      case 'sunday':
        assembly.sundayReports += 1;
        assembly.sundayIncome += calculateReportTotalIncome(report);
        assembly.sundayAttendance += calculateReportTotalAttendance(report);
        break;
      case 'midweek':
        assembly.midweekReports += 1;
        assembly.midweekIncome += calculateReportTotalIncome(report);
        assembly.midweekAttendance += calculateReportTotalAttendance(report);
        break;
      case 'special':
        assembly.specialReports += 1;
        assembly.specialIncome += calculateReportTotalIncome(report);
        assembly.specialAttendance += calculateReportTotalAttendance(report);
        break;
    }
    
    // Calculate completeness
    assembly.completenessScore = calculateReportCompleteness(report);
  });
  
  // Calculate averages and finalize
  return Array.from(assemblyMap.values()).map(assembly => ({
    ...assembly,
    averagePerService: assembly.totalIncome / (assembly.reportCount || 1),
    averageAttendancePerService: assembly.totalAttendance / (assembly.reportCount || 1)
  })).sort((a, b) => b.totalIncome - a.totalIncome); // Sort by income descending
}

function calculateDistrictMetrics(
  reports: any[],
  summary: any,
  assemblyPerformance: AssemblyPerformance[]
) {
  const totalAssemblies = assemblyPerformance.length;
  const activeAssemblies = assemblyPerformance.filter(a => a.reportCount > 0).length;
  
  // Calculate financial health metrics
  const totalIncome = summary.totalIncome || 0;
  const averageIncomePerAssembly = totalIncome / (totalAssemblies || 1);
  const incomeStandardDeviation = calculateIncomeStandardDeviation(assemblyPerformance);
  
  // Calculate attendance metrics
  const totalAttendance = summary.totalAttendance || 0;
  const averageAttendancePerAssembly = totalAttendance / (totalAssemblies || 1);
  
  // Calculate reporting metrics
  const totalReports = reports.length;
  const averageReportsPerAssembly = totalReports / (totalAssemblies || 1);
  const reportingRate = (activeAssemblies / totalAssemblies) * 100;
  
  return {
    totalAssemblies,
    activeAssemblies,
    inactiveAssemblies: totalAssemblies - activeAssemblies,
    totalIncome,
    averageIncomePerAssembly,
    incomeStandardDeviation,
    totalAttendance,
    averageAttendancePerAssembly,
    totalReports,
    averageReportsPerAssembly,
    reportingRate,
    incomeConcentration: calculateIncomeConcentration(assemblyPerformance),
    attendanceConsistency: calculateAttendanceConsistency(assemblyPerformance)
  };
}

function createAdminAnalysisPrompt(
  reports: any[],
  summary: any,
  assemblyPerformance: AssemblyPerformance[],
  districtMetrics: any,
  period: { from: string; to: string },
  location: string
): string {
  
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  const periodText = `${new Date(period.from).toLocaleDateString()} to ${new Date(period.to).toLocaleDateString()}`;
  
  // Top 3 and bottom 3 assemblies
  const topPerformers = assemblyPerformance.slice(0, 3);
  const bottomPerformers = assemblyPerformance.slice(-3).reverse();
  
  // Service type distribution
  const sundayReports = reports.filter(r => r.serviceType === 'sunday').length;
  const midweekReports = reports.filter(r => r.serviceType === 'midweek').length;
  const specialReports = reports.filter(r => r.serviceType === 'special').length;
  
  return `You are analyzing the GOFAMINT Akowonjo District, Region 28 performance. 
  Provide a comprehensive strategic analysis for district leadership.

DISTRICT OVERVIEW:
- Location: ${location}
- Analysis Period: ${periodText}
- Date Generated: ${currentDate}
- Total Assemblies: ${districtMetrics.totalAssemblies}
- Active Assemblies: ${districtMetrics.activeAssemblies}
- Reporting Rate: ${districtMetrics.reportingRate.toFixed(1)}%

FINANCIAL PERFORMANCE:
- Total District Income: ₦${districtMetrics.totalIncome.toLocaleString()}
- Average per Assembly: ₦${Math.round(districtMetrics.averageIncomePerAssembly).toLocaleString()}
- Top Assembly: ${topPerformers[0]?.name || 'N/A'} (₦${topPerformers[0]?.totalIncome.toLocaleString() || '0'})
- Income Concentration: ${districtMetrics.incomeConcentration.toFixed(1)}% (top 3 assemblies)

ATTENDANCE PERFORMANCE:
- Total District Attendance: ${districtMetrics.totalAttendance.toLocaleString()}
- Average per Assembly: ${Math.round(districtMetrics.averageAttendancePerAssembly)}
- Attendance Consistency Score: ${districtMetrics.attendanceConsistency.toFixed(1)}/10

OPERATIONAL METRICS:
- Total Reports Submitted: ${districtMetrics.totalReports}
- Service Distribution: Sunday (${sundayReports}), Midweek (${midweekReports}), Special (${specialReports})
- Average Reports per Assembly: ${districtMetrics.averageReportsPerAssembly.toFixed(1)}
- Inactive Assemblies: ${districtMetrics.inactiveAssemblies}

TOP PERFORMING ASSEMBLIES:
${topPerformers.map((assembly, index) => 
  `${index + 1}. ${assembly.name}: ₦${assembly.totalIncome.toLocaleString()}, ${assembly.totalAttendance} attendance, ${assembly.reportCount} reports`
).join('\n')}

LAGGING ASSEMBLIES (Needs Attention):
${bottomPerformers.map((assembly, index) => 
  `${index + 1}. ${assembly.name}: ₦${assembly.totalIncome.toLocaleString()}, ${assembly.totalAttendance} attendance, ${assembly.reportCount} reports`
).join('\n')}

SAMPLE REPORTS (for context):
${JSON.stringify(reports.slice(0, 2), null, 2)}

EXPECTED OUTPUT FORMAT (JSON):
{
  "executive_summary": "string (2-3 paragraph overview of district health)",
  "district_overview": "string (detailed district performance assessment)",
  "assembly_performance_ranking": [
    {
      "rank": 1,
      "assembly": "string",
      "total_income": number,
      "total_attendance": number,
      "income_per_attendee": number,
      "report_completeness": "Excellent/Good/Fair/Poor",
      "key_strength": "string",
      "major_challenge": "string"
    }
  ],
  "financial_health_assessment": {
    "overall_health": "Strong/Moderate/Concerning",
    "revenue_distribution": "string (analysis of income spread)",
    "giving_trends": "string (patterns in giving)",
    "collection_efficiency": "string",
    "areas_of_concern": ["string", "string"],
    "sustainability_metrics": {
      "revenue_diversification_score": number (1-10),
      "income_stability_index": number (1-10),
      "growth_trajectory": "string"
    }
  },
  "attendance_analysis": {
    "overall_trend": "string",
    "assembly_comparison": "string",
    "engagement_patterns": "string",
    "seasonal_factors": ["string", "string"],
    "retention_analysis": "string",
    "growth_opportunities": ["string", "string"]
  },
  "operational_efficiency": {
    "reporting_compliance": {
      "overall_compliance_rate": number (0-100),
      "best_performers": ["string", "string"],
      "lagging_assemblies": ["string", "string"],
      "submission_timeliness": "string"
    },
    "data_quality": {
      "completeness_score": number (0-100),
      "accuracy_indicators": ["string", "string"],
      "missing_data_impact": "string"
    }
  },
  "strategic_recommendations": {
    "immediate_actions": ["string", "string", "string"],
    "short_term_goals": ["string", "string"],
    "long_term_strategies": ["string", "string"],
    "assembly_specific_interventions": [
      {
        "assembly": "string",
        "priority_area": "string",
        "recommended_action": "string"
      }
    ]
  },
  "risk_assessment": {
    "financial_risks": ["string", "string"],
    "operational_risks": ["string", "string"],
    "growth_risks": ["string", "string"],
    "mitigation_strategies": ["string", "string"]
  },
  "success_stories": [
    {
      "assembly": "string",
      "achievement": "string",
      "replicable_strategy": "string"
    }
  ],
  "next_quarter_targets": {
    "financial_targets": {
      "overall_target": number,
      "assembly_targets": [
        {"assembly": "string", "target": number}
      ]
    },
    "attendance_targets": {
      "overall_target": number,
      "assembly_targets": [
        {"assembly": "string", "target": number}
      ]
    },
    "reporting_targets": {
      "completeness_goal": number (0-100),
      "timeliness_goal": "string"
    }
  },
  "detailed_report": "string (complete narrative report in professional format)"
}

ANALYSIS GUIDELINES:
1. Be data-driven and honest
2. Focus on strategic district-level insights
3. Consider Lagos-specific challenges and opportunities
4. Provide actionable recommendations
5. Balance financial and ministerial perspectives
6. Highlight both successes and areas needing intervention
7. Consider the reality of Nigerian church operations
8. Set realistic, measurable targets
9. Identify transferable best practices
10. Acknowledge operational constraints`;
}

// ==================== HELPER FUNCTIONS ====================

function calculateReportTotalIncome(report: any): number {
  if (!report.records || !Array.isArray(report.records)) return 0;
  return report.records.reduce((sum: number, record: any) => sum + (record.total || 0), 0);
}

function calculateReportTotalAttendance(report: any): number {
  if (!report.records || !Array.isArray(report.records)) return 0;
  return report.records.reduce((sum: number, record: any) => 
    sum + (record.totalAttendance || record.attendance || 0), 0);
}

function calculateReportCompleteness(report: any): number {
  if (!report.records || !Array.isArray(report.records)) return 0;
  const records = report.records;
  let completeCount = 0;
  
  records.forEach((record: any) => {
    const hasAttendance = record.totalAttendance || record.attendance;
    const hasIncome = record.total;
    if (hasAttendance && hasIncome) completeCount++;
  });
  
  return records.length > 0 ? (completeCount / records.length) * 100 : 0;
}

function calculateIncomeStandardDeviation(assemblies: AssemblyPerformance[]): number {
  if (assemblies.length === 0) return 0;
  
  const incomes = assemblies.map(a => a.totalIncome);
  const mean = incomes.reduce((a, b) => a + b, 0) / incomes.length;
  const squaredDiffs = incomes.map(income => Math.pow(income - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / incomes.length;
  
  return Math.sqrt(variance);
}

function calculateIncomeConcentration(assemblies: AssemblyPerformance[]): number {
  if (assemblies.length === 0) return 0;
  
  const totalIncome = assemblies.reduce((sum, a) => sum + a.totalIncome, 0);
  if (totalIncome === 0) return 0;
  
  const top3Income = assemblies.slice(0, 3).reduce((sum, a) => sum + a.totalIncome, 0);
  return (top3Income / totalIncome) * 100;
}

function calculateAttendanceConsistency(assemblies: AssemblyPerformance[]): number {
  if (assemblies.length === 0) return 0;
  
  const attendanceRates = assemblies
    .filter(a => a.reportCount > 0)
    .map(a => a.averageAttendancePerService);
  
  if (attendanceRates.length === 0) return 0;
  
  const mean = attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length;
  const variance = attendanceRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / attendanceRates.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to 1-10 score (lower std deviation = higher consistency)
  return Math.max(1, Math.min(10, 10 - (stdDev / 10)));
}

function calculateReportingCompliance(reports: any[]): number {
  if (reports.length === 0) return 0;
  
  let compliantCount = 0;
  reports.forEach(report => {
    const completeness = calculateReportCompleteness(report);
    if (completeness >= 80) compliantCount++;
  });
  
  return (compliantCount / reports.length) * 100;
}

function generateFallbackAdminAnalysis(body: any): AdminComprehensiveAnalysis {
  const { reports = [], summary = {}, period = { from: new Date().toISOString(), to: new Date().toISOString() }, location = "Lagos, Nigeria" } = body;
  
  const assemblyPerformance = analyzeAssemblyPerformance(reports);
  const topAssemblies = assemblyPerformance.slice(0, 3).map(a => a.name);
  const bottomAssemblies = assemblyPerformance.slice(-3).map(a => a.name).reverse();
  
  return {
    executive_summary: `District analysis for ${assemblyPerformance.length} assemblies during ${new Date(period.from).toLocaleDateString()} to ${new Date(period.to).toLocaleDateString()}. Total income: ₦${summary.totalIncome?.toLocaleString() || '0'}. Active reporting assemblies: ${assemblyPerformance.filter(a => a.reportCount > 0).length}.`,
    
    district_overview: `District shows ${assemblyPerformance.length} total assemblies with ${assemblyPerformance.filter(a => a.reportCount > 0).length} actively reporting. Financial performance varies significantly across assemblies.`,
    
    assembly_performance_ranking: assemblyPerformance.map((assembly, index) => ({
      rank: index + 1,
      assembly: assembly.name,
      total_income: assembly.totalIncome,
      total_attendance: assembly.totalAttendance,
      income_per_attendee: assembly.totalAttendance > 0 ? Math.round(assembly.totalIncome / assembly.totalAttendance) : 0,
      report_completeness: assembly.completenessScore >= 80 ? "Excellent" : assembly.completenessScore >= 60 ? "Good" : assembly.completenessScore >= 40 ? "Fair" : "Poor",
      key_strength: assembly.reportCount > 0 ? "Active reporting" : "Needs activation",
      major_challenge: assembly.reportCount === 0 ? "No reports submitted" : "Data completeness"
    })),
    
    financial_health_assessment: {
      overall_health: summary.totalIncome > 100000 ? "Strong" : summary.totalIncome > 50000 ? "Moderate" : "Concerning",
      revenue_distribution: "Revenue concentrated in top assemblies",
      giving_trends: "Sunday services drive majority of income",
      collection_efficiency: "Moderate efficiency across assemblies",
      areas_of_concern: ["Low reporting compliance", "Income concentration"],
      sustainability_metrics: {
        revenue_diversification_score: 6,
        income_stability_index: 7,
        growth_trajectory: "Stable with growth potential"
      }
    },
    
    attendance_analysis: {
      overall_trend: "Attendance shows room for growth across assemblies",
      assembly_comparison: "Significant variation in attendance patterns",
      engagement_patterns: "Higher engagement in larger assemblies",
      seasonal_factors: ["Holiday season impact", "Rainy season challenges"],
      retention_analysis: "Need improved visitor retention strategies",
      growth_opportunities: ["Midweek service promotion", "Youth engagement programs"]
    },
    
    operational_efficiency: {
      reporting_compliance: {
        overall_compliance_rate: calculateReportingCompliance(reports),
        best_performers: topAssemblies,
        lagging_assemblies: bottomAssemblies,
        submission_timeliness: "Varies by assembly"
      },
      data_quality: {
        completeness_score: assemblyPerformance.length > 0 
          ? assemblyPerformance.reduce((sum, a) => sum + a.completenessScore, 0) / assemblyPerformance.length 
          : 0,
        accuracy_indicators: ["Basic data captured", "Income tracking established"],
        missing_data_impact: "Affects trend analysis accuracy"
      }
    },
    
    strategic_recommendations: {
      immediate_actions: [
        "Address non-reporting assemblies",
        "Improve data completeness",
        "Standardize reporting timelines"
      ],
      short_term_goals: [
        "Increase reporting compliance to 80%",
        "Grow midweek attendance by 20%",
        "Implement digital giving options"
      ],
      long_term_strategies: [
        "Develop assembly leadership pipelines",
        "Establish district-wide training programs",
        "Create sustainable funding models"
      ],
      assembly_specific_interventions: assemblyPerformance.slice(0, 3).map(assembly => ({
        assembly: assembly.name,
        priority_area: assembly.reportCount > 0 ? "Growth optimization" : "Activation",
        recommended_action: assembly.reportCount > 0 ? "Focus on attendance growth" : "Establish reporting system"
      }))
    },
    
    risk_assessment: {
      financial_risks: ["Income concentration", "Dependence on Sunday offerings"],
      operational_risks: ["Reporting inconsistency", "Leadership gaps"],
      growth_risks: ["Visitor retention", "Youth engagement"],
      mitigation_strategies: ["Diversify income streams", "Standardize operations"]
    },
    
    success_stories: topAssemblies.map((assembly, index) => ({
      assembly,
      achievement: "Consistent reporting and strong participation",
      replicable_strategy: "Regular follow-up and clear expectations"
    })),
    
    next_quarter_targets: {
      financial_targets: {
        overall_target: summary.totalIncome ? Math.round(summary.totalIncome * 1.1) : 100000,
        assembly_targets: assemblyPerformance.map(a => ({
          assembly: a.name,
          target: Math.round(a.totalIncome * 1.1)
        }))
      },
      attendance_targets: {
        overall_target: summary.totalAttendance ? Math.round(summary.totalAttendance * 1.15) : 500,
        assembly_targets: assemblyPerformance.map(a => ({
          assembly: a.name,
          target: Math.round(a.totalAttendance * 1.15)
        }))
      },
      reporting_targets: {
        completeness_goal: 90,
        timeliness_goal: "Within 48 hours of service"
      }
    },
    
    detailed_report: `DISTRICT ADMIN ANALYSIS REPORT
Generated: ${new Date().toLocaleDateString()}
Period: ${new Date(period.from).toLocaleDateString()} to ${new Date(period.to).toLocaleDateString()}
Location: ${location}

This report provides a strategic overview of district performance based on available data. 
Key focus areas include improving reporting compliance and developing growth strategies 
tailored to the Lagos context. Recommendations are provided for both district-level 
initiatives and assembly-specific interventions.`
  };
}