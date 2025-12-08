// components/dashboard/DashboardPage.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  Table,
  Typography,
  message,
  Row,
  Col,
  DatePicker,
  Spin,
  Tag,
  Grid,
  Tooltip,
  Empty,
  Tabs,
  Select,
} from "antd";
import type { ColumnsType } from 'antd/es/table';
import {
  Download,
  TrendingUp,
  TrendingDown,
  FileText,
  DollarSign,
  Calendar,
  RefreshCw,
  Plus,
  Mail,
  BarChart3,
  PieChart,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import MainLayout from "../layout/DashboardLayout";
import dayjs, { Dayjs } from "dayjs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  ChartTooltip,
  Legend
);

// ──────────────────────────────────────────────────────────────
// Types
interface SundayServiceRecord {
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
  submittedBy: string;
  _id?: string;
}

interface MidweekServiceRecord {
  date: string;
  day: string;
  attendance: number;
  offering: number;
  total: number;
  submittedBy: string;
  _id?: string;
}

// Base record type with common properties
interface BaseRecord {
  date: string;
  total: number;
  submittedBy: string;
  _id?: string;
}

// Combined record type for the table
type CombinedRecord = (SundayServiceRecord & { serviceType: 'sunday' }) | (MidweekServiceRecord & { serviceType: 'midweek' });

interface SundayServiceData {
  _id: string;
  assembly: string;
  submittedBy: string;
  month: string;
  records: any[];
  createdAt: string | { $date: { $numberLong: string } };
  updatedAt: string;
  __v: number;
}

interface MidweekServiceData {
  _id: string;
  assembly: string;
  submittedBy: string;
  month: string;
  records: any[];
  createdAt: string | { $date: { $numberLong: string } };
  updatedAt: string;
  __v: number;
}

interface DashboardStats {
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
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

// Table configuration interface
interface TableConfig {
  columns: ColumnsType<any>;
  dataSource: any[];
  rowKey: string | ((record: any) => string);
}

// ──────────────────────────────────────────────────────────────
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;
const { TabPane } = Tabs;
const { Option } = Select;

type ServiceType = "sunday" | "midweek" | "combined";

export default function DashboardPage() {
  const [assembly, setAssembly] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [sundaySubmissions, setSundaySubmissions] = useState<SundayServiceRecord[]>([]);
  const [midweekSubmissions, setMidweekSubmissions] = useState<MidweekServiceRecord[]>([]);
  const [allSundayMonthlyData, setAllSundayMonthlyData] = useState<SundayServiceData[]>([]);
  const [allMidweekMonthlyData, setAllMidweekMonthlyData] = useState<MidweekServiceData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeServiceType, setActiveServiceType] = useState<ServiceType>("sunday");
  const [stats, setStats] = useState<DashboardStats>({
    totalThisWeek: 0,
    totalThisMonth: 0,
    totalThisYear: 0,
    averageWeekly: 0,
    growthPercentage: 0,
    submissionCount: 0,
    totalTithes: 0,
    totalAllOfferings: 0,
    monthlyAverage: 0,
    totalAttendance: 0,
  });
  const router = useRouter();
  const screens = useBreakpoint();

  useEffect(() => {
    const stored = localStorage.getItem("assembly");
    if (!stored) {
      message.error("Please log in again");
      router.push("/");
    } else {
      setAssembly(stored);
    }
  }, [router]);

  const parseNum = (v: any): number => {
    if (v == null) return 0;
    if (typeof v === "object" && "$numberInt" in v) {
      return parseInt(v.$numberInt, 10);
    }
    if (typeof v === "object" && "$numberLong" in v) {
      return parseInt(v.$numberLong, 10);
    }
    return typeof v === "number" ? v : 0;
  };

  const fetchAllServiceReports = async (): Promise<void> => {
    if (!assembly) return;

    setLoading(true);
    try {
      const year = dateRange[0].year();
      const allSundayData: SundayServiceData[] = [];
      const allMidweekData: MidweekServiceData[] = [];

      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];

      console.log("🔄 Starting to fetch data for year:", year);

      // Fetch all Sunday monthly data
      for (const m of months) {
        const monthKey = `${m}-${year}`;
        try {
          console.log(`📡 Fetching Sunday data for: ${monthKey}`);
          const res = await fetch(
            `/api/sunday-service-reports?assembly=${encodeURIComponent(
              assembly
            )}&month=${encodeURIComponent(monthKey)}&serviceType=sunday`
          );
          if (res.ok) {
            const data: SundayServiceData = await res.json();
            console.log(`✅ Successfully fetched Sunday ${monthKey}:`, data);
            allSundayData.push(data);
          } else {
            console.log(`❌ No Sunday data for ${monthKey}, status:`, res.status);
          }
        } catch (error) {
          console.error(`❌ Error fetching Sunday ${monthKey}:`, error);
        }
      }

      // Fetch all Midweek monthly data
      for (const m of months) {
        const monthKey = `${m}-${year}`;
        try {
          console.log(`📡 Fetching Midweek data for: ${monthKey}`);
          const res = await fetch(
            `/api/sunday-service-reports?assembly=${encodeURIComponent(
              assembly
            )}&month=${encodeURIComponent(monthKey)}&serviceType=midweek`
          );
          if (res.ok) {
            const data: MidweekServiceData = await res.json();
            console.log(`✅ Successfully fetched Midweek ${monthKey}:`, data);
            allMidweekData.push(data);
          } else {
            console.log(`❌ No Midweek data for ${monthKey}, status:`, res.status);
          }
        } catch (error) {
          console.error(`❌ Error fetching Midweek ${monthKey}:`, error);
        }
      }
      
      setAllSundayMonthlyData(allSundayData);
      setAllMidweekMonthlyData(allMidweekData);

      // Fetch current month data for both services
      const curMonth = dateRange[0].format("MMMM-YYYY");
      
      // Fetch Sunday data
      console.log(`🎯 Fetching current month Sunday data: ${curMonth}`);
      const sundayRes = await fetch(
        `/api/sunday-service-reports?assembly=${encodeURIComponent(
          assembly
        )}&month=${encodeURIComponent(curMonth)}&serviceType=sunday`
      );

      let currentSundaySubmissions: SundayServiceRecord[] = [];
      let currentMidweekSubmissions: MidweekServiceRecord[] = [];

      if (sundayRes.ok) {
        const responseData = await sundayRes.json();
        console.log("🎯 Full Sunday API response for current month:", responseData);
        
        if (responseData.records && Array.isArray(responseData.records)) {
          currentSundaySubmissions = responseData.records.map((r: any, index: number) => {
            const attendance = parseNum(r.attendance);
            const sbs = parseNum(r.sbsAttendance);
            const visitors = parseNum(r.visitors);

            const recordDate = r.date || "";

            return {
              week: r.week ?? `Week ${index + 1}`,
              date: recordDate,
              attendance,
              sbsAttendance: sbs,
              visitors,
              tithes: parseNum(r.tithes),
              offerings: parseNum(r.offerings),
              specialOfferings: parseNum(r.specialOfferings),
              etf: parseNum(r.etf),
              pastorsWarfare: parseNum(r.pastorsWarfare),
              vigil: parseNum(r.vigil),
              thanksgiving: parseNum(r.thanksgiving),
              retirees: parseNum(r.retirees),
              missionaries: parseNum(r.missionaries),
              youthOfferings: parseNum(r.youthOfferings),
              districtSupport: parseNum(r.districtSupport),
              total: parseNum(r.total),
totalAttendance: attendance, // Only main service attendance
              submittedBy: responseData.submittedBy || "Unknown",
              _id: r._id?.$oid || r._id,
            };
          });
        }
      }

      // Fetch Midweek data
      console.log(`🎯 Fetching current month Midweek data: ${curMonth}`);
      const midweekRes = await fetch(
        `/api/sunday-service-reports?assembly=${encodeURIComponent(
          assembly
        )}&month=${encodeURIComponent(curMonth)}&serviceType=midweek`
      );

      if (midweekRes.ok) {
        const responseData = await midweekRes.json();
        console.log("🎯 Full Midweek API response for current month:", responseData);
        
        if (responseData.records && Array.isArray(responseData.records)) {
          currentMidweekSubmissions = responseData.records.map((r: any, index: number) => {
            const recordDate = r.date || "";

            return {
              date: recordDate,
              day: r.day || "",
              attendance: parseNum(r.attendance),
              offering: parseNum(r.offering),
              total: parseNum(r.total),
              submittedBy: responseData.submittedBy || "Unknown",
              _id: r._id?.$oid || r._id,
            };
          });
        }
      }

      console.log("🎉 Final transformed submissions:", {
        sunday: currentSundaySubmissions,
        midweek: currentMidweekSubmissions
      });

      setSundaySubmissions(currentSundaySubmissions);
      setMidweekSubmissions(currentMidweekSubmissions);
      
      // Calculate stats with the new data
      calculateStats(currentSundaySubmissions, currentMidweekSubmissions, allSundayData, allMidweekData);

    } catch (err) {
      console.error("💥 Error in fetchAllServiceReports:", err);
      message.error("Failed to fetch data");
      setSundaySubmissions([]);
      setMidweekSubmissions([]);
      setAllSundayMonthlyData([]);
      setAllMidweekMonthlyData([]);
      resetStats();
    } finally {
      setLoading(false);
    }
  };

  const resetStats = () => {
    setStats({
      totalThisWeek: 0,
      totalThisMonth: 0,
      totalThisYear: 0,
      averageWeekly: 0,
      growthPercentage: 0,
      submissionCount: 0,
      totalTithes: 0,
      totalAllOfferings: 0,
      monthlyAverage: 0,
      totalAttendance: 0,
    });
  };

  useEffect(() => {
    console.log("🚀 Dashboard mounted, starting data fetch...");
    fetchAllServiceReports();
  }, [dateRange, assembly]);

  // Separate useEffect to recalculate stats when service type changes
  useEffect(() => {
    calculateStats(sundaySubmissions, midweekSubmissions, allSundayMonthlyData, allMidweekMonthlyData);
  }, [activeServiceType, sundaySubmissions, midweekSubmissions]);

  const calculateStats = (
    sundayData: SundayServiceRecord[],
    midweekData: MidweekServiceRecord[],
    allSundayYear: SundayServiceData[],
    allMidweekYear: MidweekServiceData[]
  ): void => {
    console.log("📈 Calculating stats for service type:", activeServiceType);
    
    let totalThisMonth = 0;
    let totalThisWeek = 0;
    let submissionCount = 0;
    let totalTithes = 0;
    let totalAllOfferings = 0;
    let totalAttendance = 0;

    // Calculate current month totals
    if (activeServiceType === "sunday" || activeServiceType === "combined") {
      totalThisMonth += sundayData.reduce((s, r) => s + r.total, 0);
      submissionCount += sundayData.length;
      totalTithes += sundayData.reduce((s, r) => s + r.tithes, 0);
      totalAllOfferings += sundayData.reduce(
        (s, r) =>
          s +
          r.offerings +
          r.specialOfferings +
          r.etf +
          r.pastorsWarfare +
          r.vigil +
          r.thanksgiving +
          r.retirees +
          r.missionaries +
          r.youthOfferings +
          r.districtSupport,
        0
      );
      totalAttendance += sundayData.reduce((s, r) => s + r.totalAttendance, 0);
      
      // Get latest week total
      if (sundayData.length > 0) {
        const latestSunday = sundayData[sundayData.length - 1];
        totalThisWeek += latestSunday.total;
      }
    }

    if (activeServiceType === "midweek" || activeServiceType === "combined") {
      totalThisMonth += midweekData.reduce((s, r) => s + r.total, 0);
      submissionCount += midweekData.length;
      totalAllOfferings += midweekData.reduce((s, r) => s + r.offering, 0);
      totalAttendance += midweekData.reduce((s, r) => s + r.attendance, 0);
      
      // Get latest midweek total
      if (midweekData.length > 0) {
        const latestMidweek = midweekData[midweekData.length - 1];
        totalThisWeek += latestMidweek.total;
      }
    }

    const averageWeekly = submissionCount ? totalThisMonth / submissionCount : 0;

    // Calculate year totals - FIXED CALCULATION
    let totalThisYear = 0;
    
    if (activeServiceType === "sunday" || activeServiceType === "combined") {
      totalThisYear += allSundayYear.reduce((yearTotal, monthlyData) => {
        const monthTotal = monthlyData.records?.reduce((monthSum: number, record: any) => {
          return monthSum + (parseNum(record.total) || 0);
        }, 0) || 0;
        return yearTotal + monthTotal;
      }, 0);
    }

    if (activeServiceType === "midweek" || activeServiceType === "combined") {
      totalThisYear += allMidweekYear.reduce((yearTotal, monthlyData) => {
        const monthTotal = monthlyData.records?.reduce((monthSum: number, record: any) => {
          return monthSum + (parseNum(record.total) || 0);
        }, 0) || 0;
        return yearTotal + monthTotal;
      }, 0);
    }

    // Calculate growth percentage - FIXED
    let growthPercentage = 0;
    const currentMonthTotal = totalThisMonth;
    
    // Get previous month total for comparison
    const prevMonth = dateRange[0].subtract(1, 'month').format("MMMM-YYYY");
    const currentMonth = dateRange[0].format("MMMM-YYYY");
    
    let prevMonthTotal = 0;
    
    // Calculate previous month total based on service type
    if (activeServiceType === "sunday" || activeServiceType === "combined") {
      const prevSundayData = allSundayYear.find(d => d.month === prevMonth);
      if (prevSundayData?.records) {
        prevMonthTotal += prevSundayData.records.reduce((sum: number, record: any) => sum + (parseNum(record.total) || 0), 0);
      }
    }
    
    if (activeServiceType === "midweek" || activeServiceType === "combined") {
      const prevMidweekData = allMidweekYear.find(d => d.month === prevMonth);
      if (prevMidweekData?.records) {
        prevMonthTotal += prevMidweekData.records.reduce((sum: number, record: any) => sum + (parseNum(record.total) || 0), 0);
      }
    }

    if (prevMonthTotal > 0) {
      growthPercentage = ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100;
    }

    const monthsWithData = Math.max(
      allSundayYear.filter((m) => m.records && m.records.length > 0).length,
      allMidweekYear.filter((m) => m.records && m.records.length > 0).length
    );
    
    const monthlyAverage = monthsWithData ? totalThisYear / monthsWithData : 0;

    const newStats = {
      totalThisWeek,
      totalThisMonth,
      totalThisYear,
      averageWeekly,
      growthPercentage,
      submissionCount,
      totalTithes,
      totalAllOfferings,
      monthlyAverage,
      totalAttendance,
    };

    console.log("📊 Final stats calculated:", newStats);
    setStats(newStats);
  };

  const formatCurrency = (amt: number): string => {
    return `₦${(amt ?? 0).toLocaleString()}`;
  };

  // ────── PROFESSIONAL EXCEL EXPORT ──────
  const handleExportToExcel = (): void => {
    try {
      let csvContent = "";
      const monthName = dateRange[0].format("MMMM YYYY");
      const submittedBy = sundaySubmissions[0]?.submittedBy || midweekSubmissions[0]?.submittedBy || "N/A";

      if (activeServiceType === "sunday") {
        const headers = [
          "PPS ASSEMBLY - SUNDAY SERVICE FINANCIAL REPORT",
          `${monthName} | Submitted by: ${submittedBy}`,
          "",
          "Week,Date,Attendance,SBS,Visitors,Total Attendance,Tithes,Regular Offerings,Special Offerings,ETF,Pastor's Warfare,Vigil,Thanksgiving,Retirees,Missionaries,Youth Offerings,District Support,Total,Submitted By",
        ];

        const rows = sundaySubmissions.map((r) => [
          r.week,
          r.date && dayjs(r.date).isValid() ? dayjs(r.date).format("MMM DD, YYYY") : "N/A",
          r.attendance,
          r.sbsAttendance,
          r.visitors,
          r.totalAttendance,
          r.tithes,
          r.offerings,
          r.specialOfferings,
          r.etf,
          r.pastorsWarfare,
          r.vigil,
          r.thanksgiving,
          r.retirees,
          r.missionaries,
          r.youthOfferings,
          r.districtSupport,
          r.total,
          r.submittedBy,
        ]);

        const totals = [
          "TOTAL",
          "",
          sundaySubmissions.reduce((s, r) => s + r.attendance, 0),
          sundaySubmissions.reduce((s, r) => s + r.sbsAttendance, 0),
          sundaySubmissions.reduce((s, r) => s + r.visitors, 0),
          sundaySubmissions.reduce((s, r) => s + r.totalAttendance, 0),
          sundaySubmissions.reduce((s, r) => s + r.tithes, 0),
          sundaySubmissions.reduce((s, r) => s + r.offerings, 0),
          sundaySubmissions.reduce((s, r) => s + r.specialOfferings, 0),
          sundaySubmissions.reduce((s, r) => s + r.etf, 0),
          sundaySubmissions.reduce((s, r) => s + r.pastorsWarfare, 0),
          sundaySubmissions.reduce((s, r) => s + r.vigil, 0),
          sundaySubmissions.reduce((s, r) => s + r.thanksgiving, 0),
          sundaySubmissions.reduce((s, r) => s + r.retirees, 0),
          sundaySubmissions.reduce((s, r) => s + r.missionaries, 0),
          sundaySubmissions.reduce((s, r) => s + r.youthOfferings, 0),
          sundaySubmissions.reduce((s, r) => s + r.districtSupport, 0),
          sundaySubmissions.reduce((s, r) => s + r.total, 0),
          "",
        ];

        csvContent = [
          ...headers,
          ...rows.map((row) => row.join(",")),
          totals.join(","),
        ].join("\n");

      } else if (activeServiceType === "midweek") {
        const headers = [
          "PPS ASSEMBLY - MIDWEEK SERVICE FINANCIAL REPORT",
          `${monthName} | Submitted by: ${submittedBy}`,
          "",
          "Date,Day,Attendance,Offerings,Total,Submitted By",
        ];

        const rows = midweekSubmissions.map((r) => [
          r.date && dayjs(r.date).isValid() ? dayjs(r.date).format("MMM DD, YYYY") : "N/A",
          r.day,
          r.attendance,
          r.offering,
          r.total,
          r.submittedBy,
        ]);

        const totals = [
          "TOTAL",
          "",
          midweekSubmissions.reduce((s, r) => s + r.attendance, 0),
          midweekSubmissions.reduce((s, r) => s + r.offering, 0),
          midweekSubmissions.reduce((s, r) => s + r.total, 0),
          "",
        ];

        csvContent = [
          ...headers,
          ...rows.map((row) => row.join(",")),
          totals.join(","),
        ].join("\n");

      } else { // combined
        const headers = [
          "PPS ASSEMBLY - COMBINED SERVICE FINANCIAL REPORT",
          `${monthName} | Submitted by: ${submittedBy}`,
          "",
          "Service Type,Week/Date,Date,Day,Attendance,SBS,Visitors,Total Attendance,Tithes,Regular Offerings,Special Offerings,ETF,Pastor's Warfare,Vigil,Thanksgiving,Retirees,Missionaries,Youth Offerings,District Support,Total,Submitted By",
        ];

        const sundayRows = sundaySubmissions.map((r) => [
          "Sunday Service",
          r.week,
          r.date && dayjs(r.date).isValid() ? dayjs(r.date).format("MMM DD, YYYY") : "N/A",
          "Sunday",
          r.attendance,
          r.sbsAttendance,
          r.visitors,
          r.totalAttendance,
          r.tithes,
          r.offerings,
          r.specialOfferings,
          r.etf,
          r.pastorsWarfare,
          r.vigil,
          r.thanksgiving,
          r.retirees,
          r.missionaries,
          r.youthOfferings,
          r.districtSupport,
          r.total,
          r.submittedBy,
        ]);

        const midweekRows = midweekSubmissions.map((r) => [
          "Midweek Service",
          "",
          r.date && dayjs(r.date).isValid() ? dayjs(r.date).format("MMM DD, YYYY") : "N/A",
          r.day,
          r.attendance,
          "", "", // SBS, Visitors
          r.attendance, // Total Attendance
          "", // Tithes
          r.offering, // Regular Offerings
          "", "", "", "", "", "", "", "", "", // Other offerings
          r.total,
          r.submittedBy,
        ]);

        csvContent = [
          ...headers,
          ...sundayRows.map((row) => row.join(",")),
          ...midweekRows.map((row) => row.join(",")),
        ].join("\n");
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const filename = activeServiceType === "sunday" 
        ? `PPS_Sunday_Service_Report_${monthName.replace(" ", "_")}.csv`
        : activeServiceType === "midweek"
        ? `PPS_Midweek_Service_Report_${monthName.replace(" ", "_")}.csv`
        : `PPS_Combined_Service_Report_${monthName.replace(" ", "_")}.csv`;
      
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      message.success("Financial report exported successfully!");
    } catch (e) {
      console.error("💥 Export error:", e);
      message.error("Export failed");
    }
  };

  // ────── Chart Data ──────
  const getChartData = () => {
    if (activeServiceType === "sunday") {
      return {
        barData: {
          labels: [
            "Tithes", "Regular Offerings", "Special Offerings", "ETF", "Pastor's Warfare",
            "Vigil", "Thanksgiving", "Retirees", "Missionaries", "Youth Offerings", "District Support"
          ],
          datasets: [{
            label: "Financial Breakdown (₦)",
            data: (() => {
              const init = new Array(11).fill(0);
              sundaySubmissions.forEach((r) => {
                init[0] += r.tithes;
                init[1] += r.offerings;
                init[2] += r.specialOfferings;
                init[3] += r.etf;
                init[4] += r.pastorsWarfare;
                init[5] += r.vigil;
                init[6] += r.thanksgiving;
                init[7] += r.retirees;
                init[8] += r.missionaries;
                init[9] += r.youthOfferings;
                init[10] += r.districtSupport;
              });
              return init;
            })(),
            backgroundColor: [
              "#1e3a8a", "#f59e0b", "#fbbf24", "#10b981", "#3b82f6",
              "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316", "#64748b",
            ],
          }],
        },
        pieData: {
          labels: [
            "Regular Offerings", "Special Offerings", "ETF", "Pastor's Warfare",
            "Vigil", "Thanksgiving", "Retirees", "Missionaries", "Youth Offerings", "District Support"
          ],
          datasets: [{
            label: "Offerings",
            data: (() => {
              const init = new Array(10).fill(0);
              sundaySubmissions.forEach((r) => {
                init[0] += r.offerings;
                init[1] += r.specialOfferings;
                init[2] += r.etf;
                init[3] += r.pastorsWarfare;
                init[4] += r.vigil;
                init[5] += r.thanksgiving;
                init[6] += r.retirees;
                init[7] += r.missionaries;
                init[8] += r.youthOfferings;
                init[9] += r.districtSupport;
              });
              return init;
            })(),
            backgroundColor: [
              "#f59e0b", "#fbbf24", "#10b981", "#3b82f6", "#ef4444",
              "#8b5cf6", "#06b6d4", "#84cc16", "#f97316", "#64748b",
            ],
            borderWidth: 2,
            borderColor: ["#fff"],
          }],
        }
      };
    } else if (activeServiceType === "midweek") {
      const totalMidweekOfferings = midweekSubmissions.reduce((sum, r) => sum + r.offering, 0);
      return {
        barData: {
          labels: ["Midweek Offerings"],
          datasets: [{
            label: "Midweek Offerings (₦)",
            data: [totalMidweekOfferings],
            backgroundColor: ["#8b5cf6"],
          }],
        },
        pieData: {
          labels: ["Midweek Offerings"],
          datasets: [{
            label: "Midweek Offerings",
            data: [totalMidweekOfferings],
            backgroundColor: ["#8b5cf6"],
            borderWidth: 2,
            borderColor: ["#fff"],
          }],
        }
      };
    } else { // combined
      const sundayOfferings = sundaySubmissions.reduce((sum, r) => 
        sum + r.offerings + r.specialOfferings + r.etf + r.pastorsWarfare + 
        r.vigil + r.thanksgiving + r.retirees + r.missionaries + 
        r.youthOfferings + r.districtSupport, 0
      );
      const midweekOfferings = midweekSubmissions.reduce((sum, r) => sum + r.offering, 0);

      return {
        barData: {
          labels: ["Sunday Offerings", "Midweek Offerings"],
          datasets: [{
            label: "Combined Offerings (₦)",
            data: [sundayOfferings, midweekOfferings],
            backgroundColor: ["#3b82f6", "#8b5cf6"],
          }],
        },
        pieData: {
          labels: ["Sunday Offerings", "Midweek Offerings"],
          datasets: [{
            label: "Combined Offerings",
            data: [sundayOfferings, midweekOfferings],
            backgroundColor: ["#3b82f6", "#8b5cf6"],
            borderWidth: 2,
            borderColor: ["#fff"],
          }],
        }
      };
    }
  };

  const { barData, pieData } = getChartData();

  // ────── Table Configuration ──────
  const getTableConfig = (): TableConfig => {
    if (activeServiceType === "sunday") {
      const columns: ColumnsType<SundayServiceRecord> = [
        {
          title: "Week",
          dataIndex: "week",
          key: "week",
          render: (t: string) => <Tag color="blue">{t}</Tag>,
          width: 100,
        },
        {
          title: "Date",
          dataIndex: "date",
          key: "date",
          render: (d: string) => d && dayjs(d).isValid() ? dayjs(d).format("MMM DD, YYYY") : "N/A",
          width: 130,
        },
        {
          title: "Attendance",
          key: "totalAttendance",
          render: (_: any, r: SundayServiceRecord) => (
            <Text strong className="text-green-600">
              {r.totalAttendance.toLocaleString()}
            </Text>
          ),
          width: 110,
        },
        {
          title: "Tithes",
          key: "tithes",
          render: (_: any, r: SundayServiceRecord) => formatCurrency(r.tithes),
          width: 120,
        },
        {
          title: "Offerings",
          key: "offerings",
          render: (_: any, r: SundayServiceRecord) => formatCurrency(r.offerings),
          width: 130,
        },
        {
          title: "Special",
          key: "special",
          render: (_: any, r: SundayServiceRecord) => formatCurrency(r.specialOfferings),
          width: 130,
        },
        {
          title: "Total",
          key: "total",
          render: (_: any, r: SundayServiceRecord) => (
            <Text strong className="text-blue-600 text-lg">
              {formatCurrency(r.total)}
            </Text>
          ),
          width: 140,
        },
        {
          title: "Submitted By",
          dataIndex: "submittedBy",
          key: "submittedBy",
          render: (text: string) => <Tag color="purple">{text || "Unknown"}</Tag>,
          width: 150,
        },
      ];

      return {
        columns,
        dataSource: sundaySubmissions,
        rowKey: (record: SundayServiceRecord) => record._id || `sunday-${record.week}-${record.date}`
      };

    } else if (activeServiceType === "midweek") {
      const columns: ColumnsType<MidweekServiceRecord> = [
        {
          title: "Date",
          dataIndex: "date",
          key: "date",
          render: (d: string) => d && dayjs(d).isValid() ? dayjs(d).format("MMM DD, YYYY") : "N/A",
          width: 130,
        },
        {
          title: "Day",
          dataIndex: "day",
          key: "day",
          render: (d: string) => <Tag color="orange">{d}</Tag>,
          width: 100,
        },
        {
          title: "Attendance",
          dataIndex: "attendance",
          key: "attendance",
          render: (att: number) => (
            <Text strong className="text-green-600">
              {att.toLocaleString()}
            </Text>
          ),
          width: 110,
        },
        {
          title: "Offerings",
          dataIndex: "offering",
          key: "offering",
          render: (amt: number) => formatCurrency(amt),
          width: 130,
        },
        {
          title: "Total",
          dataIndex: "total",
          key: "total",
          render: (amt: number) => (
            <Text strong className="text-blue-600 text-lg">
              {formatCurrency(amt)}
            </Text>
          ),
          width: 140,
        },
        {
          title: "Submitted By",
          dataIndex: "submittedBy",
          key: "submittedBy",
          render: (text: string) => <Tag color="purple">{text || "Unknown"}</Tag>,
          width: 150,
        },
      ];

      return {
        columns,
        dataSource: midweekSubmissions,
        rowKey: (record: MidweekServiceRecord) => record._id || `midweek-${record.date}-${record.day}`
      };

    } else { // combined
      const combinedData: CombinedRecord[] = [
        ...sundaySubmissions.map(r => ({ ...r, serviceType: 'sunday' as const })),
        ...midweekSubmissions.map(r => ({ ...r, serviceType: 'midweek' as const }))
      ].sort((a, b) => dayjs(a.date).isBefore(dayjs(b.date)) ? -1 : 1);

      const columns: ColumnsType<CombinedRecord> = [
        {
          title: "Service",
          key: "serviceType",
          render: (_: any, r: CombinedRecord) => (
            <Tag color={r.serviceType === 'sunday' ? "blue" : "orange"}>
              {r.serviceType === 'sunday' ? "Sunday" : "Midweek"}
            </Tag>
          ),
          width: 100,
        },
        {
          title: "Week/Day",
          key: "weekDay",
          render: (_: any, r: CombinedRecord) => 
            r.serviceType === 'sunday' ? 
              <Tag color="blue">{(r as SundayServiceRecord).week}</Tag> : 
              <Tag color="orange">{(r as MidweekServiceRecord).day}</Tag>,
          width: 120,
        },
        {
          title: "Date",
          dataIndex: "date",
          key: "date",
          render: (d: string) => d && dayjs(d).isValid() ? dayjs(d).format("MMM DD, YYYY") : "N/A",
          width: 130,
        },
        {
          title: "Attendance",
          key: "attendance",
          render: (_: any, r: CombinedRecord) => (
            <Text strong className="text-green-600">
              {r.serviceType === 'sunday' ? 
                (r as SundayServiceRecord).totalAttendance.toLocaleString() : 
                (r as MidweekServiceRecord).attendance.toLocaleString()}
            </Text>
          ),
          width: 110,
        },
        {
          title: "Money Coming In",
          key: "money",
          render: (_: any, r: CombinedRecord) => (
            <div className="text-xs">
              {r.serviceType === 'sunday' ? 
                `Sunday: ${formatCurrency((r as SundayServiceRecord).tithes)}` : 
                `Midweek: ${formatCurrency((r as MidweekServiceRecord).offering)}`}
              {r.serviceType === 'sunday' && (r as SundayServiceRecord).specialOfferings > 0 && 
                `, Special: ${formatCurrency((r as SundayServiceRecord).specialOfferings)}`}
            </div>
          ),
          width: 200,
        },
        {
          title: "Total",
          key: "total",
          render: (_: any, r: CombinedRecord) => (
            <Text strong className="text-blue-600 text-lg">
              {formatCurrency(r.total)}
            </Text>
          ),
          width: 140,
        },
        {
          title: "Submitted By",
          dataIndex: "submittedBy",
          key: "submittedBy",
          render: (text: string) => <Tag color="purple">{text || "Unknown"}</Tag>,
          width: 150,
        },
      ];

      return {
        columns,
        dataSource: combinedData,
        rowKey: (record: CombinedRecord) => 
          record._id || `${record.serviceType}-${record.date}-${record.serviceType === 'sunday' ? (record as SundayServiceRecord).week : (record as MidweekServiceRecord).day}`
      };
    }
  };

  const tableConfig = getTableConfig();

  const handleServiceTypeChange = (type: ServiceType) => {
    setActiveServiceType(type);
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates?.[0] && dates?.[1]) setDateRange([dates[0], dates[1]]);
  };
  
  const handleRefresh = () => fetchAllServiceReports();
  
  const handleAddReport = () => {
    if (activeServiceType === "sunday") {
      router.push("/sunday-service-reports");
    } else {
      router.push("/midweek-service-reports");
    }
  };
  
  const handleEmailReport = () => message.info("Coming soon!");

  if (!assembly) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <MainLayout
      activeItem="dashboard"
      showHeader
      assembly={assembly}
      dateRange={dateRange}
      onRangeChange={handleDateRangeChange}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <Title level={2} className="!mb-2 text-gray-900 text-xl sm:text-2xl">
             Dashboard
            </Title>
            <Text className="text-gray-600 text-sm sm:text-base">
              {assembly} Assembly • {dateRange[0].format("MMM DD")} -{" "}
              {dateRange[1].format("MMM DD, YYYY")}
            </Text>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select
              value={activeServiceType}
              onChange={handleServiceTypeChange}
              className="w-32"
              size="small"
            >
              <Option value="sunday">Sunday Only</Option>
              <Option value="midweek">Midweek Only</Option>
              <Option value="combined">Combined</Option>
            </Select>

            <Tooltip title="Refresh">
              <Button
                icon={<RefreshCw size={16} />}
                onClick={handleRefresh}
                loading={loading}
                className="rounded-lg h-10 px-3 sm:px-4"
                size="small"
              >
                {screens.sm && "Refresh"}
              </Button>
            </Tooltip>

            <Button
              type="primary"
              icon={<Download size={16} />}
              onClick={handleExportToExcel}
              className="rounded-lg h-10 px-4 bg-green-600 border-0 font-semibold"
              size="small"
            >
              {screens.sm ? "Export Report" : "Export"}
            </Button>

            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={handleAddReport}
              className="rounded-lg h-10 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-purple-600 border-0 font-semibold"
              size="small"
            >
              {screens.sm ? "Add Report" : "Add"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <Row gutter={[12, 12]} className="mb-6">
          <Col xs={12} sm={8} lg={6}>
            <Card className="h-full border-0 rounded-xl shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Text className="text-blue-100 text-xs font-semibold">THIS WEEK</Text>
                  <div className="text-lg sm:text-xl font-bold mt-1">{formatCurrency(stats.totalThisWeek)}</div>
                  <Text className="text-blue-200 text-xs mt-1">Current week total</Text>
                </div>
                <div className="p-2 bg-white bg-opacity-20 rounded-lg ml-2">
                  <Calendar size={18} />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={12} sm={8} lg={6}>
            <Card className="h-full border-0 rounded-xl shadow-md bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Text className="text-green-100 text-xs font-semibold">THIS MONTH</Text>
                  <div className="text-lg sm:text-xl font-bold mt-1">{formatCurrency(stats.totalThisMonth)}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {stats.growthPercentage >= 0 ? (
                      <TrendingUp size={12} className="text-green-300" />
                    ) : (
                      <TrendingDown size={12} className="text-red-300" />
                    )}
                    <Text className="text-green-200 text-xs">
                      {stats.growthPercentage >= 0 ? "+" : ""}
                      {stats.growthPercentage.toFixed(1)}%
                    </Text>
                  </div>
                </div>
                <div className="p-2 bg-white bg-opacity-20 rounded-lg ml-2">
                  <DollarSign size={18} />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={12} sm={8} lg={6}>
            <Card className="h-full border-0 rounded-xl shadow-md bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Text className="text-purple-100 text-xs font-semibold">YEAR TO DATE</Text>
                  <div className="text-lg sm:text-xl font-bold mt-1">{formatCurrency(stats.totalThisYear)}</div>
                  <Text className="text-purple-200 text-xs mt-1">
                    {allSundayMonthlyData.filter((d) => d.records && d.records.length > 0).length + allMidweekMonthlyData.filter((d) => d.records && d.records.length > 0).length} months
                  </Text>
                </div>
                <div className="p-2 bg-white bg-opacity-20 rounded-lg ml-2">
                  <FileText size={18} />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={12} sm={8} lg={6}>
            <Card className="h-full border-0 rounded-xl shadow-md bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Text className="text-orange-100 text-xs font-semibold">ATTENDANCE</Text>
                  <div className="text-lg sm:text-xl font-bold mt-1">{stats.totalAttendance.toLocaleString()}</div>
                  <Text className="text-orange-200 text-xs mt-1">Total attendance</Text>
                </div>
                <div className="p-2 bg-white bg-opacity-20 rounded-lg ml-2">
                  <Users size={18} />
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Charts */}
      <Row gutter={[12, 12]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card
            className="border-0 rounded-xl shadow-md h-full"
            title={<div className="flex items-center gap-2"><BarChart3 size={16} />Financial Breakdown</div>}
            extra={<Tag color="blue">{formatCurrency(stats.totalThisMonth)}</Tag>}
            bodyStyle={{ padding: "12px" }}
          >
            <div className="h-64">
              {stats.totalThisMonth > 0 ? (
                <Bar data={barData} options={{ maintainAspectRatio: false, responsive: true }} />
              ) : (
                <Empty description="No data" />
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            className="border-0 rounded-xl shadow-md h-full"
            title={<div className="flex items-center gap-2"><PieChart size={16} />Offerings Distribution</div>}
            extra={<Tag color="green">{formatCurrency(stats.totalAllOfferings)}</Tag>}
            bodyStyle={{ padding: "12px" }}
          >
            <div className="h-64">
              {stats.totalAllOfferings > 0 ? (
                <Pie data={pieData} options={{ maintainAspectRatio: false, responsive: true }} />
              ) : (
                <Empty description="No offerings" />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card
        className="border-0 rounded-xl shadow-md mb-6"
        title={
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>
              {activeServiceType === "sunday" ? "Sunday Service Reports" :
               activeServiceType === "midweek" ? "Midweek Service Reports" :
               "Combined Service Reports"}
            </span>
            <Tag color="blue">{tableConfig.dataSource.length} records</Tag>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<Download size={14} />}
            onClick={handleExportToExcel}
            size="small"
          >
            Export
          </Button>
        }
      >
        <Table
          dataSource={tableConfig.dataSource}
          columns={tableConfig.columns}
          pagination={{ pageSize: 10 }}
          rowKey={tableConfig.rowKey}
          scroll={{ x: "max-content" }}
          loading={loading}
        />
      </Card>

      {/* Summary */}
      <Card
        className="border-0 rounded-xl shadow-md"
        title="Financial Summary"
        extra={
          <div className="flex items-center gap-2">
            <Text strong>{dateRange[0].format("MMMM YYYY")}</Text>
            <Tag color={activeServiceType === "sunday" ? "blue" : activeServiceType === "midweek" ? "orange" : "purple"}>
              {activeServiceType.toUpperCase()}
            </Tag>
          </div>
        }
      >
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <Text strong>Grand Total:</Text>
                <Text strong className="text-blue-600">{formatCurrency(stats.totalThisMonth)}</Text>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <Text strong>Weekly Average:</Text>
                <Text strong className="text-green-600">{formatCurrency(stats.averageWeekly)}</Text>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <Text strong>Year to Date:</Text>
                <Text strong className="text-purple-600">{formatCurrency(stats.totalThisYear)}</Text>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <Text strong>Total Attendance:</Text>
                <Text strong className="text-orange-600">{stats.totalAttendance.toLocaleString()}</Text>
              </div>
            </div>
          </Col>
          <Col xs={24} lg={12}>
            <div className="flex flex-col gap-2">
              <Button type="primary" icon={<Download size={14} />} onClick={handleExportToExcel}>
                Download Full Report
              </Button>
              <Button icon={<Mail size={14} />} onClick={handleEmailReport}>
                Email Report
              </Button>
              <Button type="dashed" icon={<Plus size={14} />} onClick={handleAddReport}>
                Add New Report
              </Button>
            </div>
          </Col>
        </Row>
      </Card>
    </MainLayout>
  );
}