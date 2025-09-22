// components/dashboard/DashboardPage.tsx
"use client";

import { useState, useEffect } from "react";
import { Button, Card, Form, Select, Table, Typography, message, Statistic, Row, Col, DatePicker } from "antd";
import { LogOut, Calendar, Download, TrendingUp, TrendingDown } from "lucide-react";
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
  Tooltip,
  Legend,
} from "chart.js";
import MainLayout from "../layout/DashboardLayout";
import dayjs from "dayjs";

// Define the Submission interface to match database structure
export interface Submission {
  week: string;
  date: string;
  tithe: number;
  offeringGeneral: number;
  offeringSpecial: number;
  welfare: number;
  missionaryFund: number;
  total: number;
  remarks: string;
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function DashboardPage() {
  const [assembly, setAssembly] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get assembly from localStorage
    const storedAssembly = localStorage.getItem("assembly");
    if (!storedAssembly) {
      message.error("Please log in again");
      router.push("/");
    } else {
      setAssembly(storedAssembly);
    }
  }, [router]);

  // Fetch submissions data for the logged-in assembly
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!assembly) return; // Wait until assembly is set
      setLoading(true);
      try {
        const response = await fetch(
          `/api/submissions?start=${dateRange[0].toISOString()}&end=${dateRange[1].toISOString()}&assembly=${encodeURIComponent(assembly)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch submissions");
        }
        const data = await response.json();
        // Transform data: ensure it's an array and map to Submission format
        const transformedSubmissions = Array.isArray(data)
          ? data.map((entry: any) => ({
              week: entry.week || "",
              date: entry.date || new Date(entry.date).toISOString().split("T")[0],
              tithe: Number(entry.tithe) || 0,
              offeringGeneral: Number(entry.offeringGeneral) || 0,
              offeringSpecial: Number(entry.offeringSpecial) || 0,
              welfare: Number(entry.welfare) || 0,
              missionaryFund: Number(entry.missionaryFund) || 0,
              total: Number(entry.total) || 0,
              remarks: entry.remarks || "",
            }))
          : [];
        setSubmissions(transformedSubmissions);
      } catch (error) {
        message.error("Failed to fetch submissions");
        console.error(error);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [dateRange, assembly]);

  // Stats calculations with fallback for empty submissions
  const totalThisMonth = submissions.length
    ? submissions.reduce((sum, s) => sum + s.total, 0)
    : 0;
  const totalThisYear = totalThisMonth * 12; // Simplified
  const lastMonthComparison = 10; // Placeholder
  const pendingReports = 0; // Placeholder

  // Table columns updated for new Submission interface
  const columns = [
    {
      title: "Week",
      dataIndex: "week",
      key: "week",
      responsive: ["md"] as any,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      responsive: ["sm"] as any,
    },
    {
      title: "Tithe (₦)",
      dataIndex: "tithe",
      key: "tithe",
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "General Offering (₦)",
      dataIndex: "offeringGeneral",
      key: "offeringGeneral",
      render: (value: number) => value.toLocaleString(),
      responsive: ["md"] as any,
    },
    {
      title: "Special Offering (₦)",
      dataIndex: "offeringSpecial",
      key: "offeringSpecial",
      render: (value: number) => value.toLocaleString(),
      responsive: ["md"] as any,
    },
    {
      title: "Welfare (₦)",
      dataIndex: "welfare",
      key: "welfare",
      render: (value: number) => value.toLocaleString(),
      responsive: ["lg"] as any,
    },
    {
      title: "Missionary Fund (₦)",
      dataIndex: "missionaryFund",
      key: "missionaryFund",
      render: (value: number) => value.toLocaleString(),
      responsive: ["lg"] as any,
    },
    {
      title: "Total (₦)",
      dataIndex: "total",
      key: "total",
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
      responsive: ["xl"] as any,
    },
  ];

  // Chart data updated for new Submission interface
  const barData = {
    labels: ["Tithe", "General Offering", "Special Offering", "Welfare", "Missionary Fund"],
    datasets: [
      {
        label: "Contributions (₦)",
        data: [
          submissions.length ? submissions.reduce((sum, s) => sum + s.tithe, 0) : 0,
          submissions.length ? submissions.reduce((sum, s) => sum + s.offeringGeneral, 0) : 0,
          submissions.length ? submissions.reduce((sum, s) => sum + s.offeringSpecial, 0) : 0,
          submissions.length ? submissions.reduce((sum, s) => sum + s.welfare, 0) : 0,
          submissions.length ? submissions.reduce((sum, s) => sum + s.missionaryFund, 0) : 0,
        ],
        backgroundColor: ["#1e3a8a", "#f59e0b", "#fbbf24", "#10b981", "#3b82f6"],
      },
    ],
  };

  const lineData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    datasets: [
      {
        label: "Monthly Total (₦)",
        data: Array(8).fill(0).concat([totalThisMonth]),
        borderColor: "#1e3a8a",
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const pieData = {
    labels: ["Tithe", "General Offering", "Special Offering", "Welfare", "Missionary Fund"],
    datasets: [
      {
        data: [
          submissions.length ? submissions.reduce((sum, s) => sum + s.tithe, 0) : 0,
          submissions.length ? submissions.reduce((sum, s) => sum + s.offeringGeneral, 0) : 0,
          submissions.length ? submissions.reduce((sum, s) => sum + s.offeringSpecial, 0) : 0,
          submissions.length ? submissions.reduce((sum, s) => sum + s.welfare, 0) : 0,
          submissions.length ? submissions.reduce((sum, s) => sum + s.missionaryFund, 0) : 0,
        ],
        backgroundColor: ["#1e3a8a", "#f59e0b", "#fbbf24", "#10b981", "#3b82f6"],
      },
    ],
  };

  // Convert number to words (simplified)
  const numberToWords = (num: number) => {
    if (num === 0) return "Zero";

    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    if (num >= 1000000) {
      return `${Math.floor(num / 1000000)} Million`;
    } else if (num >= 1000) {
      return `${Math.floor(num / 1000)} Thousand`;
    } else {
      return "Amount in Naira";
    }
  };

  const onRangeChange = (dates: any) => {
    if (dates) {
      setDateRange(dates);
    }
  };

  return (
    <MainLayout activeItem="dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Title level={2} className="text-primary mb-1">
            Welcome, {assembly || "Assembly"}
          </Title>
          <Text className="text-gray-500 text-lg">{dayjs().format("dddd, MMMM D, YYYY")}</Text>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
            <Calendar className="w-4 h-4 text-primary" />
            <Text className="text-gray-700">Date Range:</Text>
            <RangePicker
              value={dateRange}
              onChange={onRangeChange}
              format="MMM D, YYYY"
              className="border-none bg-transparent w-full sm:w-auto"
              size="small"
              suffixIcon={null}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full shadow-card border-0 rounded-xl">
            <Statistic
              title="This Month's Total"
              value={totalThisMonth}
              precision={2}
              valueStyle={{ color: "#1e3a8a" }}
              prefix="₦"
              suffix={<TrendingUp className="w-4 h-4 text-green-500 ml-1" />}
              formatter={(value) => (
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">₦{Number(value).toLocaleString()}</span>
                </div>
              )}
            />
            <Text type="secondary" className="text-xs mt-2 block">
              +{lastMonthComparison}% from last month
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full shadow-card border-0 rounded-xl">
            <Statistic
              title="This Year's Total"
              value={totalThisYear}
              precision={2}
              valueStyle={{ color: "#1e3a8a" }}
              prefix="₦"
              formatter={(value) => (
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">₦{Number(value).toLocaleString()}</span>
                </div>
              )}
            />
            <Text type="secondary" className="text-xs mt-2 block">
              Year-to-date contributions
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full shadow-card border-0 rounded-xl">
            <Statistic
              title="Average Weekly"
              value={submissions.length ? totalThisMonth / submissions.length : 0}
              precision={2}
              valueStyle={{ color: "#1e3a8a" }}
              prefix="₦"
              formatter={(value) => (
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">₦{Number(value).toLocaleString()}</span>
                </div>
              )}
            />
            <Text type="secondary" className="text-xs mt-2 block">
              Based on {submissions.length} weeks
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full shadow-card border-0 rounded-xl">
            <Statistic
              title="Pending Reports"
              value={pendingReports}
              valueStyle={{ color: pendingReports > 0 ? "#cf1322" : "#389e0d" }}
              formatter={(value) => (
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{value}</span>
                </div>
              )}
            />
            <Text type="secondary" className="text-xs mt-2 block">
              Reports awaiting submission
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card
            title="Contributions by Category"
            className="shadow-card border-0 rounded-xl"
            extra={<Text className="text-primary">₦{totalThisMonth.toLocaleString()}</Text>}
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
          <Card title="Category Percentage Split" className="shadow-card border-0 rounded-xl">
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
            title="Monthly Trend"
            className="shadow-card border-0 rounded-xl"
            extra={<Text className="text-primary">Jan - Sep 2025</Text>}
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
                          return "₦" + value.toLocaleString();
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

      {/* Reports Table */}
      <Card
        title="Monthly Breakdown"
        className="shadow-card border-0 rounded-xl mb-6"
        extra={
          <Button type="primary" icon={<Download size={16} />} onClick={() => message.info("Download/Print coming soon")}>
            Export
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <Table
            dataSource={submissions}
            columns={columns}
            pagination={false}
            rowKey="week"
            scroll={{ x: "max-content" }}
            size="middle"
            loading={loading}
          />
        </div>
      </Card>

      {/* Summation & Analysis */}
      <Card
        title="Summation & Analysis"
        className="shadow-card border-0 rounded-xl"
        extra={<Text className="text-primary font-semibold">{selectedMonth.format("MMMM YYYY")}</Text>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Text strong className="block mb-2">
              Financial Summary
            </Text>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text>Grand Total:</Text>
                <Text strong>₦{totalThisMonth.toLocaleString()}</Text>
              </div>
              <div className="flex justify-between">
                <Text>In Words:</Text>
                <Text italic>{numberToWords(totalThisMonth)} Naira</Text>
              </div>
              <div className="flex justify-between">
                <Text>Weeks in Month:</Text>
                <Text>{submissions.length}</Text>
              </div>
            </div>
          </div>

          <div>
            <Text strong className="block mb-2">
              Actions
            </Text>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="primary" className="flex-1" onClick={() => message.info("Download/Print coming soon")}>
                Download Submission Form
              </Button>
              <Button className="flex-1" onClick={() => message.info("Email report feature coming soon")}>
                Email Report
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </MainLayout>
  );
}