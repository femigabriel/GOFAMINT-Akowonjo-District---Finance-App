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
} from "antd";
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

// ──────────────────────────────────────────────────────────────
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

export default function DashboardPage() {
  const [assembly, setAssembly] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [submissions, setSubmissions] = useState<SundayServiceRecord[]>([]);
  const [allMonthlyData, setAllMonthlyData] = useState<SundayServiceData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
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

  const parseDate = (v: any): string => {
    console.log("🔍 parseDate input:", v);
    
    if (!v) {
      console.log("❌ parseDate: No value provided");
      return "";
    }
    
    let timestamp: number;

    // Handle MongoDB extended JSON format
    if (typeof v === "object" && v.$date) {
      if (v.$date.$numberLong) {
        timestamp = parseInt(v.$date.$numberLong, 10);
        console.log("📅 parseDate: MongoDB long format, timestamp:", timestamp);
      } else {
        // If it's a direct date object
        const date = dayjs(v.$date);
        if (date.isValid()) {
          console.log("📅 parseDate: Direct date object:", date.format("YYYY-MM-DD"));
          return date.format("YYYY-MM-DD");
        }
        timestamp = new Date(v.$date).getTime();
      }
    } else if (typeof v === "string") {
      // Check if it's a timestamp string
      if (!isNaN(Number(v))) {
        timestamp = parseInt(v, 10);
        console.log("📅 parseDate: Timestamp string, timestamp:", timestamp);
      } else {
        // Try to parse as date string
        const date = dayjs(v);
        if (date.isValid()) {
          console.log("📅 parseDate: Date string:", date.format("YYYY-MM-DD"));
          return date.format("YYYY-MM-DD");
        }
        console.log("❌ parseDate: Invalid date string");
        return "";
      }
    } else if (typeof v === "number") {
      timestamp = v;
      console.log("📅 parseDate: Number timestamp:", timestamp);
    } else {
      console.log("❌ parseDate: Unsupported format", typeof v, v);
      return "";
    }

    const result = dayjs(timestamp).format("YYYY-MM-DD");
    console.log("✅ parseDate result:", result);
    return result;
  };

  const fetchAllSundayServiceReports = async (): Promise<void> => {
    if (!assembly) return;

    setLoading(true);
    try {
      const year = dateRange[0].year();
      const allData: SundayServiceData[] = [];

      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];

      console.log("🔄 Starting to fetch data for year:", year);

      // Fetch all monthly data first
      for (const m of months) {
        const monthKey = `${m}-${year}`;
        try {
          console.log(`📡 Fetching data for: ${monthKey}`);
          const res = await fetch(
            `/api/sunday-service-reports?assembly=${encodeURIComponent(
              assembly
            )}&month=${encodeURIComponent(monthKey)}`
          );
          if (res.ok) {
            const data: SundayServiceData = await res.json();
            console.log(`✅ Successfully fetched ${monthKey}:`, data);
            allData.push(data);
          } else {
            console.log(`❌ No data for ${monthKey}, status:`, res.status);
          }
        } catch (error) {
          console.error(`❌ Error fetching ${monthKey}:`, error);
        }
      }
      
      console.log("📊 All monthly data collected:", allData);
      setAllMonthlyData(allData);

      // Now fetch current month data separately
      const curMonth = dateRange[0].format("MMMM-YYYY");
      console.log(`🎯 Fetching current month data: ${curMonth}`);
      
      const curRes = await fetch(
        `/api/sunday-service-reports?assembly=${encodeURIComponent(
          assembly
        )}&month=${encodeURIComponent(curMonth)}`
      );

      if (curRes.ok) {
        const responseData = await curRes.json();
        console.log("🎯 Full API response for current month:", responseData);
        
        // Check if we have a valid document with records
        if (responseData.records && Array.isArray(responseData.records)) {
          const transformed: SundayServiceRecord[] = responseData.records.map((r: any, index: number) => {
            console.log(`📝 Transforming record ${index}:`, r);
            
            const attendance = parseNum(r.attendance);
            const sbs = parseNum(r.sbsAttendance);
            const visitors = parseNum(r.visitors);

            // Use the date from the record itself, not calculated from createdAt
            const recordDate = r.date || "";
            console.log(`📅 Record ${index} date from DB:`, recordDate);

            return {
              week: r.week ?? `Week ${index + 1}`,
              date: recordDate, // Use the stored date
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
              totalAttendance: attendance + sbs + visitors,
              submittedBy: responseData.submittedBy || "Unknown", // From main document
              _id: r._id?.$oid || r._id,
            };
          });

          console.log("🎉 Final transformed submissions:", transformed);
          setSubmissions(transformed);
          calculateStats(transformed, allData);
        } else {
          console.log("❌ No records array in response");
          setSubmissions([]);
          calculateStats([], allData);
        }
      } else {
        console.log("❌ Current month API request failed, status:", curRes.status);
        setSubmissions([]);
        calculateStats([], allData);
      }
    } catch (err) {
      console.error("💥 Error in fetchAllSundayServiceReports:", err);
      message.error("Failed to fetch data");
      setSubmissions([]);
      setAllMonthlyData([]);
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
    });
  };

  useEffect(() => {
    console.log("🚀 Dashboard mounted, starting data fetch...");
    fetchAllSundayServiceReports();
  }, [dateRange, assembly]);

  const calculateStats = (
    curMonth: SundayServiceRecord[],
    allYear: SundayServiceData[]
  ): void => {
    console.log("📈 Calculating stats with:", { curMonth, allYear });
    
    const totalThisMonth = curMonth.reduce((s, r) => s + r.total, 0);
    const submissionCount = curMonth.length;
    const averageWeekly = submissionCount ? totalThisMonth / submissionCount : 0;
    const totalThisWeek =
      curMonth.length > 0 ? curMonth[curMonth.length - 1].total : 0;

    const totalTithes = curMonth.reduce((s, r) => s + r.tithes, 0);
    const totalAllOfferings = curMonth.reduce(
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

    const totalThisYear = allYear.reduce((y, m) => {
      const monthSum = m.records.reduce(
        (ms, rec: any) => ms + parseNum(rec.total),
        0
      );
      return y + monthSum;
    }, 0);

    const monthsWithData = allYear.filter((m) => m.records.length > 0).length;
    const monthlyAverage = monthsWithData ? totalThisYear / monthsWithData : 0;

    let growthPercentage = 0;
    const curIdx = allYear.findIndex(
      (d) => d.month === dateRange[0].format("MMMM-YYYY")
    );
    if (curIdx > 0) {
      const prev = allYear[curIdx - 1];
      const prevTotal = prev.records.reduce(
        (s, rec: any) => s + parseNum(rec.total),
        0
      );
      if (prevTotal > 0) {
        growthPercentage = ((totalThisMonth - prevTotal) / prevTotal) * 100;
      }
    }

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
      console.log("💾 Starting export with submissions:", submissions);
      
      const monthName = dateRange[0].format("MMMM YYYY");
      const submittedBy = submissions[0]?.submittedBy || "N/A";

      const headers = [
        "PPS ASSEMBLY - SUNDAY SERVICE FINANCIAL REPORT",
        `${monthName} | Submitted by: ${submittedBy}`,
        "", // spacer
        "Week,Date,Attendance,SBS,Visitors,Total Attendance,Tithes,Regular Offerings,Special Offerings,ETF,Pastor's Warfare,Vigil,Thanksgiving,Retirees,Missionaries,Youth Offerings,District Support,Total,Submitted By",
      ];

      const rows = submissions.map((r) => [
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

      // Add total row
      const totals = [
        "TOTAL",
        "",
        submissions.reduce((s, r) => s + r.attendance, 0),
        submissions.reduce((s, r) => s + r.sbsAttendance, 0),
        submissions.reduce((s, r) => s + r.visitors, 0),
        submissions.reduce((s, r) => s + r.totalAttendance, 0),
        submissions.reduce((s, r) => s + r.tithes, 0),
        submissions.reduce((s, r) => s + r.offerings, 0),
        submissions.reduce((s, r) => s + r.specialOfferings, 0),
        submissions.reduce((s, r) => s + r.etf, 0),
        submissions.reduce((s, r) => s + r.pastorsWarfare, 0),
        submissions.reduce((s, r) => s + r.vigil, 0),
        submissions.reduce((s, r) => s + r.thanksgiving, 0),
        submissions.reduce((s, r) => s + r.retirees, 0),
        submissions.reduce((s, r) => s + r.missionaries, 0),
        submissions.reduce((s, r) => s + r.youthOfferings, 0),
        submissions.reduce((s, r) => s + r.districtSupport, 0),
        submissions.reduce((s, r) => s + r.total, 0),
        "",
      ];

      const csvLines = [
        ...headers,
        ...rows.map((row) => row.join(",")),
        totals.join(","),
      ];

      const csvContent = csvLines.join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `PPS_Sunday_Service_Report_${monthName.replace(" ", "_")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      message.success("Financial report exported successfully!");
    } catch (e) {
      console.error("💥 Export error:", e);
      message.error("Export failed");
    }
  };

  // ────── Chart Data ──────
  const barData: ChartData = {
    labels: [
      "Tithes",
      "Regular Offerings",
      "Special Offerings",
      "ETF",
      "Pastor's Warfare",
      "Vigil",
      "Thanksgiving",
      "Retirees",
      "Missionaries",
      "Youth Offerings",
      "District Support",
    ],
    datasets: [
      {
        label: "Financial Breakdown (₦)",
        data: (() => {
          const init = new Array(11).fill(0);
          submissions.forEach((r) => {
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
      },
    ],
  };

  const pieData: ChartData = {
    labels: [
      "Regular Offerings",
      "Special Offerings",
      "ETF",
      "Pastor's Warfare",
      "Vigil",
      "Thanksgiving",
      "Retirees",
      "Missionaries",
      "Youth Offerings",
      "District Support",
    ],
    datasets: [
      {
        label: "Offerings",
        data: (() => {
          const init = new Array(10).fill(0);
          submissions.forEach((r) => {
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
      },
    ],
  };

  // ────── Table Columns ──────
  const columns = [
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
      render: (d: string) => {
        console.log("📅 Rendering date:", d);
        return d && dayjs(d).isValid() ? dayjs(d).format("MMM DD, YYYY") : "N/A";
      },
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
      render: (text: string) => {
        console.log("👤 Rendering submittedBy:", text);
        return <Tag color="purple">{text || "Unknown"}</Tag>;
      },
      width: 150,
    },
  ];

  const handleDateRangeChange = (dates: any) => {
    if (dates?.[0] && dates?.[1]) setDateRange([dates[0], dates[1]]);
  };
  const handleRefresh = () => fetchAllSundayServiceReports();
  const handleAddReport = () => router.push("/sunday-service-reports");
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
              Sunday Service Dashboard
            </Title>
            <Text className="text-gray-600 text-sm sm:text-base">
              {assembly} Assembly • {dateRange[0].format("MMM DD")} -{" "}
              {dateRange[1].format("MMM DD, YYYY")}
            </Text>
          </div>

          <div className="flex gap-2 flex-wrap">
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
          <Col xs={12} sm={8} lg={8}>
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

          <Col xs={12} sm={8} lg={8}>
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

          <Col xs={24} sm={8} lg={8}>
            <Card className="h-full border-0 rounded-xl shadow-md bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Text className="text-purple-100 text-xs font-semibold">YEAR TO DATE</Text>
                  <div className="text-lg sm:text-xl font-bold mt-1">{formatCurrency(stats.totalThisYear)}</div>
                  <Text className="text-purple-200 text-xs mt-1">
                    {allMonthlyData.filter((d) => d.records.length > 0).length} months
                  </Text>
                </div>
                <div className="p-2 bg-white bg-opacity-20 rounded-lg ml-2">
                  <FileText size={18} />
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
            title={<div className="flex items-center gap-2"><PieChart size={16} />Offerings</div>}
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
            <span>Sunday Service Reports</span>
            <Tag color="blue">{submissions.length} records</Tag>
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
          dataSource={submissions}
          columns={columns}
          pagination={{ pageSize: 10 }}
          rowKey={(record) => record._id || `record-${record.week}-${record.date}`}
          scroll={{ x: "max-content" }}
          loading={loading}
        />
      </Card>

      {/* Summary */}
      <Card
        className="border-0 rounded-xl shadow-md"
        title="Financial Summary"
        extra={<Text strong>{dateRange[0].format("MMMM YYYY")}</Text>}
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