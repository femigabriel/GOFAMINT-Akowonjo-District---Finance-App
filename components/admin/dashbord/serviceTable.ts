// ==================== INTERFACE DEFINITIONS ====================
export interface SundayRecord {
  id: string;
  week: string;
  date: string;
  attendance: number;
  sbsAttendance: number;
  visitors: number;
  tithes: number;
  offerings: number;
  specialOfferings: number;
  etf: number;
  pastorsWarfare: number;
  vigil: number;
  thanksgiving: number;
  retirees: number;
  missionaries: number;
  youthOfferings: number;
  districtSupport: number;
  total: number;
  totalAttendance: number;
}

export interface MidweekRecord {
  id: string;
  date: string;
  day: "tuesday" | "thursday";
  attendance: number;
  offering: number;
  total: number;
}

export interface SpecialRecord {
  id: string;
  serviceName: string;
  date: string;
  attendance: number;
  offering: number;
  total: number;
}

export interface BaseReport {
  id: string;
  assembly: string;
  month: string;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
  serviceType: "sunday" | "midweek" | "special";
  records: any[];
  totalIncome: number;
  totalAttendance: number;
  averagePerRecord: number;
}

export interface SundayReport extends BaseReport {
  records: SundayRecord[];
  weekCount: number;
  tithesTotal: number;
}

export interface MidweekReport extends BaseReport {
  records: MidweekRecord[];
  dayCount: number;
}

export interface SpecialReport extends BaseReport {
  records: SpecialRecord[];
  eventCount: number;
}

export interface ReportsResponse {
  success: boolean;
  data: {
    reports: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    summary: {
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
    };
  };
}
