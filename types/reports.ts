// types/reports.ts
export interface ReportRecord {
  id: string;
  week?: string;
  date?: string;
  day?: string;
  attendance: number;
  sbsAttendance?: number;
  visitors?: number;
  tithes: number;
  offerings: number;
  specialOfferings?: number;
  etf?: number;
  pastorsWarfare?: number;
  vigil?: number;
  thanksgiving?: number;
  retirees?: number;
  missionaries?: number;
  youthOfferings?: number;
  districtSupport?: number;
  total: number;
  totalAttendance?: number;
  offering?: number; // For midweek
}

export interface Report {
  id: string;
  assembly: string;
  month: string;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
  serviceType: 'sunday' | 'midweek' | 'special';
  records: ReportRecord[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface FinancialSummary {
  totalReports: number;
  totalRecords: number;
  totalAssemblies: number;
  sundayReports: number;
  midweekReports: number;
  specialReports: number;
  totalIncome: number;
  sundayIncome: number;
  midweekIncome: number;
  specialIncome: number;
  sundayTithes: number;
  totalAttendance: number;
  sundayAttendance: number;
  midweekAttendance: number;
  specialAttendance: number;
}

export interface DetailedReportResponse {
  success: boolean;
  data: {
    reports: Report[];
    pagination: Pagination;
    summary: FinancialSummary;
  };
}


