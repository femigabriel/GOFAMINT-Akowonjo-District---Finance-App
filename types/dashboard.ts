// types/dashboard.ts

// Service types for the dashboard
export type ServiceType = "sunday" | "midweek" | "special" | "all";

// Base service record interface
export interface BaseServiceRecord {
  id: string;
  date: string;
  total: number;
  submittedBy: string;
  serviceType: ServiceType;
  createdAt?: string;
  updatedAt?: string;
}

// Sunday service record interface
export interface SundayServiceRecord extends BaseServiceRecord {
  serviceType: "sunday";
  week: string;
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
  totalAttendance: number;
}

// Midweek service record interface
export interface MidweekServiceRecord extends BaseServiceRecord {
  serviceType: "midweek";
  day: string;
  attendance: number;
  offering: number;
}

// Special service record interface
export interface SpecialServiceRecord extends BaseServiceRecord {
  serviceType: "special";
  serviceName: string;
  attendance: number;
  offering: number;
}

// Union type for all service records
export type ServiceRecord = SundayServiceRecord | MidweekServiceRecord | SpecialServiceRecord;

// Monthly report data interface
export interface MonthlyReportData {
  id: string;
  assembly: string;
  month: string;
  submittedBy: string;
  serviceType: ServiceType;
  records: ServiceRecord[];
  createdAt: string;
  updatedAt: string;
}

// Dashboard statistics interface
export interface DashboardStats {
  totalThisWeek: number;
  totalThisMonth: number;
  totalThisYear: number;
  averageWeekly: number;
  growthPercentage: number;
  submissionCount: number;
  totalTithes: number;
  totalAllOfferings: number;
  monthlyAverage: number;
  totalAttendance: number;
  sundayIncome: number;
  midweekIncome: number;
  specialIncome: number;
  sundayAttendance: number;
  midweekAttendance: number;
  specialAttendance: number;
}

// AI Report request interface
export interface AIReportRequest {
  assembly: string;
  reports: MonthlyReportData[];
  period: {
    from: string;
    to: string;
  };
  location: string;
}

// AI Report response interface
export interface AIReportResponse {
  success: boolean;
  report: string;
  metrics: {
    totalIncome: number;
    sundayIncome: number;
    midweekIncome: number;
    specialIncome: number;
    totalAttendance: number;
    sundayAttendance: number;
    midweekAttendance: number;
    specialAttendance: number;
  };
  generatedAt: string;
}

// Tab configuration interface
export interface TabConfig {
  key: ServiceType | "all";
  label: string;
  color: string;
  icon: React.ReactNode;
  count: number;
}

// Chart data interface
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}