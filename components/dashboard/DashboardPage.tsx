// components/dashboard/DashboardPage.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Button, 
  Card, 
  Table, 
  Typography, 
  message, 
  Statistic, 
  Row, 
  Col, 
  DatePicker,
  Spin,
  Tag,
  Grid,
  Tooltip
} from "antd";
import { 
  Download, 
  TrendingUp, 
  TrendingDown,
  FileText,
  DollarSign,
  Users,
  Calendar,
  RefreshCw,
  Plus,
  Mail
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import MainLayout from "../layout/DashboardLayout";
import dayjs, { Dayjs } from "dayjs";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  ChartTooltip,
  Legend
);

// Types
interface Submission {
  _id: string;
  week: string;
  date: string;
  tithe: number;
  offeringGeneral: number;
  offeringSpecial: number;
  welfare: number;
  missionaryFund: number;
  total: number;
  remarks: string;
  assembly?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DashboardStats {
  totalThisMonth: number;
  totalThisYear: number;
  averageWeekly: number;
  pendingReports: number;
  growthPercentage: number;
  submissionCount: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[] | undefined;
    borderWidth?: number | undefined;
    fill?: boolean | undefined; // Added fill property
    tension?: number | undefined; // Added tension property for completeness
  }[];
}

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

export default function DashboardPage() {
  const [assembly, setAssembly] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalThisMonth: 0,
    totalThisYear: 0,
    averageWeekly: 0,
    pendingReports: 0,
    growthPercentage: 0,
    submissionCount: 0
  });
  const router = useRouter();
  const screens = useBreakpoint();

  useEffect(() => {
    const storedAssembly = localStorage.getItem("assembly");
    if (!storedAssembly) {
      message.error("Please log in again");
      router.push("/");
    } else {
      setAssembly(storedAssembly);
    }
  }, [router]);

  // Fetch submissions data
  useEffect(() => {
    const fetchSubmissions = async (): Promise<void> => {
      if (!assembly) return;
      
      setLoading(true);
      try {
        const response = await fetch(
          `/api/submissions?start=${dateRange[0].toISOString()}&end=${dateRange[1].toISOString()}&assembly=${encodeURIComponent(assembly)}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch submissions: ${response.status}`);
        }
        
        const data: Submission[] = await response.json();
        
        // Transform and validate data
        const transformedSubmissions: Submission[] = data.map((entry: Submission) => ({
          _id: entry._id || Math.random().toString(),
          week: entry.week || "Week 1",
          date: entry.date || new Date().toISOString().split("T")[0],
          tithe: Number(entry.tithe) || 0,
          offeringGeneral: Number(entry.offeringGeneral) || 0,
          offeringSpecial: Number(entry.offeringSpecial) || 0,
          welfare: Number(entry.welfare) || 0,
          missionaryFund: Number(entry.missionaryFund) || 0,
          total: Number(entry.total) || 0,
          remarks: entry.remarks || "",
          assembly: entry.assembly,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt
        }));
        
        setSubmissions(transformedSubmissions);
        calculateStats(transformedSubmissions);
        
      } catch (error) {
        console.error("Error fetching submissions:", error);
        message.error("Failed to fetch submissions data");
        setSubmissions([]);
        setStats({
          totalThisMonth: 0,
          totalThisYear: 0,
          averageWeekly: 0,
          pendingReports: 0,
          growthPercentage: 0,
          submissionCount: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [dateRange, assembly]);

  const calculateStats = (data: Submission[]): void => {
    const totalThisMonth = data.reduce((sum: number, s: Submission) => sum + s.total, 0);
    const submissionCount = data.length;
    const averageWeekly = submissionCount > 0 ? totalThisMonth / submissionCount : 0;
    
    // Calculate growth (placeholder logic - you might want to compare with previous period)
    const previousMonthTotal = totalThisMonth * 0.8; // Simulated previous month data
    const growthPercentage = previousMonthTotal > 0 
      ? ((totalThisMonth - previousMonthTotal) / previousMonthTotal) * 100 
      : 0;

    setStats({
      totalThisMonth,
      totalThisYear: totalThisMonth * 12, // Simplified calculation
      averageWeekly,
      pendingReports: Math.max(0, 4 - submissionCount), // Assuming 4 weeks per month
      growthPercentage,
      submissionCount
    });
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString()}`;
  };

  // Number to words function
  const numberToWords = (num: number): string => {
    if (num === 0) return "Zero";
    if (num >= 1000000) {
      return `${Math.floor(num / 1000000)} Million`;
    } else if (num >= 1000) {
      return `${Math.floor(num / 1000)} Thousand`;
    } else {
      return "Amount in Naira";
    }
  };

  // Chart data configurations
  const barData: ChartData = {
    labels: ["Tithe", "General Offering", "Special Offering", "Welfare", "Missionary Fund"],
    datasets: [
      {
        label: "Contributions (₦)",
        data: [
          submissions.reduce((sum: number, s: Submission) => sum + s.tithe, 0),
          submissions.reduce((sum: number, s: Submission) => sum + s.offeringGeneral, 0),
          submissions.reduce((sum: number, s: Submission) => sum + s.offeringSpecial, 0),
          submissions.reduce((sum: number, s: Submission) => sum + s.welfare, 0),
          submissions.reduce((sum: number, s: Submission) => sum + s.missionaryFund, 0),
        ],
        backgroundColor: ["#1e3a8a", "#f59e0b", "#fbbf24", "#10b981", "#3b82f6"],
      },
    ],
  };

 const lineData: ChartData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  datasets: [
    {
      label: "Monthly Total (₦)",
      data: Array(11).fill(0).concat([stats.totalThisMonth]),
      borderColor: ["#1e3a8a"], 
      backgroundColor: ["rgba(30, 58, 138, 0.1)"], 
      fill: true,
      tension: 0.4,
    },
  ],
};

const pieData: ChartData = {
  labels: ["Tithe", "General Offering", "Special Offering", "Welfare", "Missionary Fund"],
  datasets: [
    {
      label: "Contribution Breakdown", // Added label
      data: [
        submissions.reduce((sum: number, s: Submission) => sum + s.tithe, 0),
        submissions.reduce((sum: number, s: Submission) => sum + s.offeringGeneral, 0),
        submissions.reduce((sum: number, s: Submission) => sum + s.offeringSpecial, 0),
        submissions.reduce((sum: number, s: Submission) => sum + s.welfare, 0),
        submissions.reduce((sum: number, s: Submission) => sum + s.missionaryFund, 0),
      ],
      backgroundColor: ["#1e3a8a", "#f59e0b", "#fbbf24", "#10b981", "#3b82f6"],
      borderWidth: 2,
      borderColor: ["#ffffff"],
    },
  ],
};

  // Table columns
  const columns = [
    {
      title: "Week",
      dataIndex: "week",
      key: "week",
      render: (week: string) => <Tag color="blue">{week}</Tag>,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
    },
    {
      title: "Tithe",
      dataIndex: "tithe",
      key: "tithe",
      render: (value: number) => (
        <Text strong className="text-green-600">
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "General Offering",
      dataIndex: "offeringGeneral",
      key: "offeringGeneral",
      render: (value: number) => formatCurrency(value),
      responsive: ["md"] as any,
    },
    {
      title: "Special Offering",
      dataIndex: "offeringSpecial",
      key: "offeringSpecial",
      render: (value: number) => formatCurrency(value),
      responsive: ["md"] as any,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (value: number) => (
        <Text strong className="text-blue-600 text-lg">
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
      render: (remarks: string) => remarks || "-",
      responsive: ["lg"] as any,
    },
  ];

  const handleDateRangeChange = (dates: any): void => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const handleExport = (): void => {
    message.success("Export feature coming soon!");
  };

  const handleEmailReport = (): void => {
    message.info("Email report feature coming soon!");
  };

  const handleRefresh = (): void => {
    // Re-fetch data
    const fetchSubmissions = async (): Promise<void> => {
      if (!assembly) return;
      
      setLoading(true);
      try {
        const response = await fetch(
          `/api/submissions?start=${dateRange[0].toISOString()}&end=${dateRange[1].toISOString()}&assembly=${encodeURIComponent(assembly)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setSubmissions(data);
          calculateStats(data);
          message.success("Data refreshed successfully!");
        }
      } catch (error) {
        message.error("Failed to refresh data");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  };

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
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <Title level={2} className="!mb-2 text-gray-900">
              Financial Dashboard
            </Title>
            <Text className="text-gray-600 text-lg">
              {assembly} Assembly • {dateRange[0].format("MMM DD")} - {dateRange[1].format("MMM DD, YYYY")}
            </Text>
          </div>
          <div className="flex gap-2">
            <Tooltip title="Refresh data">
              <Button 
                icon={<RefreshCw size={16} />} 
                onClick={handleRefresh}
                loading={loading}
                className="rounded-xl h-12 px-4"
              >
                {screens.sm && "Refresh"}
              </Button>
            </Tooltip>
            <Button 
              type="primary" 
              icon={<Plus size={16} />}
              className="rounded-xl h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 border-0 font-semibold"
              onClick={() => router.push("/submissions/add")}
            >
              {screens.sm ? "Add Submission" : "Add"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} sm={12} lg={6}>
            <Card className="h-full border-0 rounded-2xl shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-blue-100 text-sm font-semibold">THIS MONTH</Text>
                  <div className="text-2xl font-bold mt-1">{formatCurrency(stats.totalThisMonth)}</div>
                  <div className="flex items-center gap-1 mt-2">
                    {stats.growthPercentage >= 0 ? (
                      <TrendingUp size={14} className="text-green-300" />
                    ) : (
                      <TrendingDown size={14} className="text-red-300" />
                    )}
                    <Text className="text-blue-200 text-xs">
                      {stats.growthPercentage >= 0 ? '+' : ''}{stats.growthPercentage.toFixed(1)}% from last month
                    </Text>
                  </div>
                </div>
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <DollarSign size={24} />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="h-full border-0 rounded-2xl shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-green-100 text-sm font-semibold">YEAR TO DATE</Text>
                  <div className="text-2xl font-bold mt-1">{formatCurrency(stats.totalThisYear)}</div>
                  <Text className="text-green-200 text-xs mt-2 block">
                    Projected annual total
                  </Text>
                </div>
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <Calendar size={24} />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="h-full border-0 rounded-2xl shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-purple-100 text-sm font-semibold">WEEKLY AVG</Text>
                  <div className="text-2xl font-bold mt-1">{formatCurrency(stats.averageWeekly)}</div>
                  <Text className="text-purple-200 text-xs mt-2 block">
                    Based on {stats.submissionCount} weeks
                  </Text>
                </div>
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <FileText size={24} />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="h-full border-0 rounded-2xl shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-orange-100 text-sm font-semibold">PENDING</Text>
                  <div className="text-2xl font-bold mt-1">{stats.pendingReports}</div>
                  <Text className="text-orange-200 text-xs mt-2 block">
                    Reports awaiting submission
                  </Text>
                </div>
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <Users size={24} />
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Charts Section */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} lg={12}>
          <Card 
            className="border-0 rounded-2xl shadow-lg"
            title={
              <div className="flex items-center gap-2">
                <DollarSign size={18} />
                <span>Contributions by Category</span>
              </div>
            }
            extra={<Tag color="blue">{formatCurrency(stats.totalThisMonth)}</Tag>}
          >
            <div className="h-64 mt-4">
              <Bar
                data={barData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "top" as const,
                    },
                  },
                }}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            className="border-0 rounded-2xl shadow-lg"
            title={
              <div className="flex items-center gap-2">
                <FileText size={18} />
                <span>Category Distribution</span>
              </div>
            }
          >
            <div className="h-64 mt-4">
              <Pie
                data={pieData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "bottom" as const,
                    },
                  },
                }}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24}>
          <Card 
            className="border-0 rounded-2xl shadow-lg"
            title={
              <div className="flex items-center gap-2">
                <TrendingUp size={18} />
                <span>Monthly Trends</span>
              </div>
            }
            extra={<Tag color="green">2024</Tag>}
          >
            <div className="h-64 mt-4">
              <Line
                data={lineData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "top" as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function (value) {
                          return "₦" + Number(value).toLocaleString();
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Data Table */}
      <Card
        className="border-0 rounded-2xl shadow-lg mb-8"
        title={
          <div className="flex items-center gap-2">
            <Calendar size={18} />
            <span>Monthly Breakdown</span>
            <Tag color="blue">{submissions.length} records</Tag>
          </div>
        }
        extra={
          <Button 
            type="primary" 
            icon={<Download size={16} />} 
            onClick={handleExport}
            className="rounded-xl"
          >
            Export Data
          </Button>
        }
      >
        <Table
          dataSource={submissions}
          columns={columns}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          rowKey="_id"
          scroll={{ x: 'max-content' }}
          loading={loading}
          size="middle"
          locale={{
            emptyText: (
              <div className="py-8 text-center">
                <FileText size={48} className="text-gray-300 mx-auto mb-4" />
                <Text className="text-gray-500">No submission records found</Text>
                <br />
                <Button 
                  type="primary" 
                  onClick={() => router.push("/submissions/add")}
                  className="mt-4"
                >
                  Add First Submission
                </Button>
              </div>
            )
          }}
        />
      </Card>

      {/* Summary Section */}
      <Card
        className="border-0 rounded-2xl shadow-lg"
        title="Financial Summary & Analysis"
        extra={
          <Text strong className="text-blue-600">
            {dateRange[0].format("MMMM YYYY")}
          </Text>
        }
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <Text strong>Grand Total:</Text>
                <Text strong className="text-2xl text-blue-600">
                  {formatCurrency(stats.totalThisMonth)}
                </Text>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <Text strong>In Words:</Text>
                <Text italic className="text-right">
                  {numberToWords(stats.totalThisMonth)} Naira Only
                </Text>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <Text strong>Weeks Recorded:</Text>
                <Tag color={stats.submissionCount > 0 ? "green" : "orange"}>
                  {stats.submissionCount} weeks
                </Tag>
              </div>
            </div>
          </Col>
          
          <Col xs={24} lg={12}>
            <div className="space-y-4">
              <Text strong className="block mb-4">Quick Actions</Text>
              <div className="flex flex-col gap-3">
                <Button 
                  type="primary" 
                  icon={<Download size={16} />}
                  size="large"
                  onClick={handleExport}
                  className="rounded-xl h-12"
                >
                  Download Full Report
                </Button>
                <Button 
                  icon={<Mail size={16} />}
                  size="large"
                  onClick={handleEmailReport}
                  className="rounded-xl h-12"
                >
                  Email Summary Report
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </MainLayout>
  );
}