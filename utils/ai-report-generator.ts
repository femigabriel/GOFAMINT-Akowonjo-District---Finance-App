// utils/ai-report-generator.ts
interface GenerateAIReportParams {
  reports: any[];
  summary: any;
  serviceType: string;
  assembly?: string;
  month?: string;
  year?: string;
}

export async function generateAIFinancialReport(params: GenerateAIReportParams) {
  try {
    const response = await fetch('/api/ai/financial-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to generate AI report');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating AI report:', error);
    throw error;
  }
}