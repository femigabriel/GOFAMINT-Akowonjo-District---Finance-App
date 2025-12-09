// lib/api/ai-report.ts
export interface AIReportRequest {
  assembly: string;
  reports: any[];
  period: {
    from: string;
    to: string;
  };
  location: string;
}

export async function generateAIReport(data: AIReportRequest): Promise<any> {
  const response = await fetch('/api/ai/report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to generate AI report');
  }

  return response.json();
}

export async function downloadReportAsPDF(data: {
  assembly: string;
  report: string;
  date: string;
}): Promise<void> {
  const response = await fetch('/api/ai/report/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to download PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.assembly}-AI-Report-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}