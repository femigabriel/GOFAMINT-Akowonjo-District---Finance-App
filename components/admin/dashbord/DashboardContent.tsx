// components/admin/DashboardContent.tsx
"use client";

import {
  Card,
  Statistic,
  Row,
  Col,
  Button,
  Tag,
  Progress,
  List,
  Avatar,
  Timeline,
  message,
  Select,
  Spin,
  Table,
  Modal,
} from "antd";
import {
  Church,
  Users,
  DollarSign,
  BarChart3,
  Download,
  TrendingUp,
  Calendar,
  Filter,
  Building2,
  FileText,
  PieChart,
  Eye,
  ArrowUp,
  ArrowDown,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Target,
  TrendingDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { assemblies as ASSEMBLIES } from "@/lib/assemblies";
import SundayServiceReportsTable from "./SundayServiceReportsTable";

const { Option } = Select;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface DashboardData {
  totalAssemblies: number;
  activeMembers: number;
  monthlyIncome: number;
  reportsGenerated: number;
  recentActivities: Array<{
    id: number;
    user: string;
    action: string;
    target: string;
    time: string;
    avatar: string;
  }>;
  upcomingEvents: Array<{
    title: string;
    time: string;
    color: string;
  }>;
  assemblyBreakdown: Array<{
    assembly: string;
    income: number;
    records: number;
    attendance: number;
    lastUpdated?: string;
  }>;
  monthlyTrends: Array<{
    month: string;
    income: number;
  }>;
  totalRecords: number;
}

interface AssemblyDetails {
  assembly: string;
  income: number;
  records: number;
  attendance: number;
  monthlyData: Array<{
    month: string;
    income: number;
    attendance: number;
    records: number;
  }>;
  recentReports: Array<{
    month: string;
    submittedBy: string;
    createdAt: string;
    totalRecords: number;
  }>;
}

interface FinancialInsights {
  topPerformers: Array<{ assembly: string; income: number; growth?: number }>;
  areasOfConcern: Array<{
    assembly: string;
    issue: string;
    severity: "low" | "medium" | "high";
  }>;
  trends: Array<{
    type: string;
    description: string;
    impact: "positive" | "negative" | "neutral";
  }>;
  recommendations: Array<{
    action: string;
    priority: "high" | "medium" | "low";
    reasoning: string;
  }>;
  keyMetrics: {
    averageAttendance: number;
    averageIncome: number;
    incomeGrowth: number;
    attendanceGrowth: number;
    efficiencyRatio: number;
  };
}

export default function DashboardContent() {
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 7 }, (_, i) =>
    (currentYear - 5 + i).toString()
  );

  const currentMonthIndex = new Date().getMonth();
  const currentMonth = MONTHS[currentMonthIndex];

  const [loading, setLoading] = useState(false);
  const [selectedAssembly, setSelectedAssembly] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>(
    currentYear.toString()
  );
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [assemblyModalVisible, setAssemblyModalVisible] = useState(false);
  const [selectedAssemblyDetails, setSelectedAssemblyDetails] =
    useState<AssemblyDetails | null>(null);
  const [assemblyDetailsLoading, setAssemblyDetailsLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsInsights, setAnalyticsInsights] =
    useState<FinancialInsights | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedAssembly, selectedMonth, selectedYear]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAssembly !== "all")
        params.append("assembly", selectedAssembly);
      if (selectedMonth !== "all") params.append("month", selectedMonth);
      if (selectedYear !== "all") params.append("year", selectedYear);

      const response = await fetch(`/api/admin/dashboard?${params}`);
      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
        // Generate insights when data is loaded
        if (showAnalytics) {
          generateFinancialInsights(result.data);
        }
      } else {
        message.error("Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      message.error("Error fetching dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssemblyDetails = async (assemblyName: string) => {
    setAssemblyDetailsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/assembly-details?assembly=${encodeURIComponent(
          assemblyName
        )}`
      );
      const result = await response.json();

      if (result.success) {
        setSelectedAssemblyDetails(result.data);
        setAssemblyModalVisible(true);
      } else {
        message.error("Failed to fetch assembly details");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      message.error("Error fetching assembly details");
    } finally {
      setAssemblyDetailsLoading(false);
    }
  };

  const generateFinancialInsights = (data: any) => {
    const assemblies = data.assemblyBreakdown || [];
    const monthlyTrends = data.monthlyTrends || [];

    // Calculate key metrics
    const totalIncome = data.monthlyIncome || 0;
    const totalAttendance = data.activeMembers || 0;
    const assemblyCount = assemblies.length;

    const averageIncome = assemblyCount > 0 ? totalIncome / assemblyCount : 0;
    const averageAttendance =
      assemblyCount > 0 ? totalAttendance / assemblyCount : 0;

    // Calculate growth (simplified)
    const incomeGrowth = calculateGrowth(monthlyTrends, "income");
    const attendanceGrowth = calculateGrowth(monthlyTrends, "attendance");

    // Efficiency ratio: Income per attendee
    const efficiencyRatio =
      totalAttendance > 0 ? totalIncome / totalAttendance : 0;

    // Identify top performers (top 3 by income)
    const topPerformers = assemblies
      .sort((a: any, b: any) => b.income - a.income)
      .slice(0, 3)
      .map((assembly: any) => ({
        assembly: assembly.assembly,
        income: assembly.income,
        growth: Math.random() * 20 - 5, // Simulated growth for demo
      }));

    // Identify areas of concern
    const areasOfConcern = identifyConcerns(
      assemblies,
      averageIncome,
      averageAttendance
    );

    // Generate trends
    const trends = generateTrends(
      incomeGrowth,
      attendanceGrowth,
      efficiencyRatio
    );

    // Generate recommendations
    const recommendations = generateRecommendations(
      assemblies,
      areasOfConcern,
      trends
    );

    setAnalyticsInsights({
      topPerformers,
      areasOfConcern,
      trends,
      recommendations,
      keyMetrics: {
        averageAttendance: Math.round(averageAttendance),
        averageIncome: Math.round(averageIncome),
        incomeGrowth,
        attendanceGrowth,
        efficiencyRatio: Math.round(efficiencyRatio),
      },
    });
  };

  const calculateGrowth = (trends: any[], metric: string): number => {
    if (trends.length < 2) return 0;

    const recent = trends[trends.length - 1][metric] || 0;
    const previous = trends[trends.length - 2][metric] || 1;

    return ((recent - previous) / previous) * 100;
  };

  const identifyConcerns = (
    assemblies: any[],
    avgIncome: number,
    avgAttendance: number
  ) => {
    const concerns = [];

    for (const assembly of assemblies) {
      const issues = [];

      if (assembly.income < avgIncome * 0.5) {
        issues.push({
          issue: "Low income generation",
          severity: "high" as const,
        });
      } else if (assembly.income < avgIncome * 0.8) {
        issues.push({
          issue: "Below average income",
          severity: "medium" as const,
        });
      }

      if (assembly.attendance < avgAttendance * 0.4) {
        issues.push({ issue: "Low attendance", severity: "high" as const });
      } else if (assembly.attendance < avgAttendance * 0.7) {
        issues.push({
          issue: "Below average attendance",
          severity: "medium" as const,
        });
      }

      if (assembly.records < 3) {
        issues.push({
          issue: "Inconsistent reporting",
          severity: "medium" as const,
        });
      }

      for (const issue of issues) {
        concerns.push({
          assembly: assembly.assembly,
          ...issue,
        });
      }
    }

    return concerns.slice(0, 5);
  };

  const generateTrends = (
    incomeGrowth: number,
    attendanceGrowth: number,
    efficiency: number
  ) => {
    const trends = [];

    if (incomeGrowth > 10) {
      trends.push({
        type: "Revenue",
        description: `Strong income growth of ${incomeGrowth.toFixed(1)}%`,
        impact: "positive" as const,
      });
    } else if (incomeGrowth < -5) {
      trends.push({
        type: "Revenue",
        description: `Income decline of ${Math.abs(incomeGrowth).toFixed(
          1
        )}% needs attention`,
        impact: "negative" as const,
      });
    }

    if (attendanceGrowth > 15) {
      trends.push({
        type: "Attendance",
        description: `Excellent attendance growth of ${attendanceGrowth.toFixed(
          1
        )}%`,
        impact: "positive" as const,
      });
    } else if (attendanceGrowth < -10) {
      trends.push({
        type: "Attendance",
        description: `Concerning attendance drop of ${Math.abs(
          attendanceGrowth
        ).toFixed(1)}%`,
        impact: "negative" as const,
      });
    }

    if (efficiency > 5000) {
      trends.push({
        type: "Efficiency",
        description: `High giving per member (₦${efficiency.toLocaleString()})`,
        impact: "positive" as const,
      });
    } else if (efficiency < 2000) {
      trends.push({
        type: "Efficiency",
        description: `Low giving per member (₦${efficiency.toLocaleString()})`,
        impact: "negative" as const,
      });
    }

    return trends;
  };

  const generateRecommendations = (
    assemblies: any[],
    concerns: any[],
    trends: any[]
  ) => {
    const recommendations = [];

    // Based on concerns
    const highConcernAssemblies = concerns.filter((c) => c.severity === "high");
    if (highConcernAssemblies.length > 0) {
      recommendations.push({
        action: `Focus support on ${highConcernAssemblies
          .map((c) => c.assembly)
          .join(", ")}`,
        priority: "high" as const,
        reasoning:
          "These assemblies show significant challenges in key metrics",
      });
    }

    // Based on efficiency
    const lowEfficiencyAssemblies = assemblies.filter((a: any) => {
      const efficiency = a.attendance > 0 ? a.income / a.attendance : 0;
      return efficiency < 2000;
    });

    if (lowEfficiencyAssemblies.length > 0) {
      recommendations.push({
        action: "Implement stewardship programs in low-giving assemblies",
        priority: "medium" as const,
        reasoning: `${lowEfficiencyAssemblies.length} assemblies show below-average giving per member`,
      });
    }

    return recommendations.slice(0, 3);
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Filter stats to remove Total Assemblies
  const statsData = dashboardData
    ? [
        {
          title: "Active Members",
          value: dashboardData.activeMembers.toLocaleString(),
          change:
            dashboardData.activeMembers > 0
              ? "+" +
                Math.round((dashboardData.activeMembers / 1000) * 100) +
                "%"
              : "0%",
          icon: <Users size={20} />,
          color: "#10b981",
          progress: Math.min((dashboardData.activeMembers / 5000) * 100, 100),
          description: "Based on service attendance",
        },
        {
          title: "Total Income",
          value: formatCurrency(dashboardData.monthlyIncome),
          change:
            dashboardData.monthlyIncome > 0
              ? "+" +
                Math.round((dashboardData.monthlyIncome / 1000000) * 100) +
                "%"
              : "0%",
          icon: <DollarSign size={20} />,
          color: "#f59e0b",
          progress: Math.min(
            (dashboardData.monthlyIncome / 5000000) * 100,
            100
          ),
          description: "From all assemblies",
        },
        {
          title: "Reports Generated",
          value: dashboardData.reportsGenerated,
          change:
            dashboardData.reportsGenerated > 0
              ? `+${dashboardData.reportsGenerated}`
              : "0",
          icon: <BarChart3 size={20} />,
          color: "#8b5cf6",
          progress: Math.min((dashboardData.reportsGenerated / 50) * 100, 100),
          description: `${dashboardData.totalRecords} individual records`,
        },
      ]
    : [];

  const assemblyColumns = [
    {
      title: "Assembly",
      dataIndex: "assembly",
      key: "assembly",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
          <span className="font-medium text-sm lg:text-base">{text}</span>
        </div>
      ),
      responsive: ["xs", "sm", "md"] as any,
    },
    {
      title: "Income",
      dataIndex: "income",
      key: "income",
      render: (amount: number) => (
        <span className="font-semibold text-green-600 text-sm lg:text-base">
          {formatCurrency(amount)}
        </span>
      ),
      sorter: (a: any, b: any) => a.income - b.income,
      responsive: ["sm"] as any,
    },
    {
      title: "Attendance",
      dataIndex: "attendance",
      key: "attendance",
      render: (count: number) => (
        <span className="text-sm lg:text-base">{count.toLocaleString()}</span>
      ),
      sorter: (a: any, b: any) => a.attendance - b.attendance,
      responsive: ["md"] as any,
    },
    {
      title: "Records",
      dataIndex: "records",
      key: "records",
      render: (count: number) => (
        <Tag color="blue" className="text-xs lg:text-sm">
          {count} records
        </Tag>
      ),
      sorter: (a: any, b: any) => a.records - b.records,
      responsive: ["lg"] as any,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<Eye size={14} />}
          onClick={() => fetchAssemblyDetails(record.assembly)}
          className="text-blue-600 p-0 lg:p-1 text-xs lg:text-base"
          size="small"
        >
          <span className="hidden sm:inline">View</span>
          <span className="sm:hidden">View</span>
        </Button>
      ),
      responsive: ["xs", "sm", "md", "lg"] as any,
    },
  ];

  // Get all assemblies with data for the dropdown
  const assembliesWithData =
    dashboardData?.assemblyBreakdown.map((item) => item.assembly) || [];

  // Combine all assemblies (from ASSEMBLIES) and mark which ones have data
  const allAssembliesWithStatus = ASSEMBLIES.map((assembly) => ({
    name: assembly,
    hasData: assembliesWithData.includes(assembly),
  }));

  const handleAnalyticsToggle = () => {
    setShowAnalytics(!showAnalytics);
    if (!showAnalytics && dashboardData && !analyticsInsights) {
      generateFinancialInsights(dashboardData);
    }
  };
  // console.log({dashboardData})

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-8 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 lg:gap-3 mb-2">
            <div className="p-2 bg-white rounded-lg shadow-sm border hidden sm:block">
              <BarChart3 className="text-blue-600" size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl lg:text-3xl font-bold text-gray-900 truncate">
                District Financial Dashboard
              </h1>
              <p className="text-sm lg:text-lg text-gray-600 truncate">
                Akowonjo District - Financial Overview
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-500 mt-1 lg:mt-2">
            <Calendar size={12} className="flex-shrink-0" />
            <span className="truncate">
              Viewing: {selectedMonth === "all" ? "All Months" : selectedMonth}{" "}
              {selectedYear}
              {selectedAssembly !== "all" && ` • ${selectedAssembly}`}
            </span>
          </div>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <Button
            icon={<Download size={14} />}
            onClick={() => message.info("Export feature coming soon")}
            size="small"
            className="flex-1 lg:flex-none text-xs"
          >
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button
            type={showAnalytics ? "primary" : "default"}
            icon={<BarChart3 size={14} />}
            onClick={handleAnalyticsToggle}
            size="small"
            className="flex-1 lg:flex-none text-xs"
          >
            <span className="hidden sm:inline">
              {showAnalytics ? "Hide Analytics" : "Analytics"}
            </span>
            <span className="sm:hidden">
              {showAnalytics ? "Hide" : "Analysis"}
            </span>
          </Button>
        </div>
      </div>

      {/* Filters - Mobile Optimized */}
      <Card className="border-0 shadow-lg lg:shadow-xl bg-white/80 backdrop-blur-sm mb-6 lg:mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center">
            <Filter size={16} className="mr-2 text-blue-600 flex-shrink-0" />
            <span className="font-semibold text-gray-700 text-sm lg:text-base">
              Dashboard Filters:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select
              placeholder="Assembly"
              className="w-full"
              value={selectedAssembly}
              onChange={setSelectedAssembly}
              suffixIcon={<Building2 size={14} />}
              size="small"
            >
              <Option value="all">All Assemblies</Option>
              {allAssembliesWithStatus.map((assembly) => (
                <Option key={assembly.name} value={assembly.name}>
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          assembly.hasData ? "bg-green-500" : "bg-gray-300"
                        }`}
                      ></div>
                      <span className="truncate">{assembly.name}</span>
                    </div>
                    {!assembly.hasData && (
                      <Tag color="default" className="flex-shrink-0">
                        No Data
                      </Tag>
                    )}
                  </div>
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Month"
              className="w-full"
              value={selectedMonth}
              onChange={setSelectedMonth}
              suffixIcon={<Calendar size={14} />}
              size="small"
            >
              <Option value="all">All Months</Option>
              {MONTHS.map((month) => (
                <Option key={month} value={month}>
                  {month}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Year"
              className="w-full"
              value={selectedYear}
              onChange={setSelectedYear}
              size="small"
            >
              <Option value="all">All Years</Option>
              {YEARS.map((year) => (
                <Option key={year} value={year}>
                  {year}
                </Option>
              ))}
            </Select>

            <Button
              onClick={fetchDashboardData}
              loading={loading}
              size="small"
              className="w-full bg-green-600 hover:bg-green-700 text-white border-0 h-auto py-1.5"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-48 lg:h-64">
          <Spin size="large" />
          <span className="ml-3 text-gray-600 text-sm lg:text-base">
            Loading dashboard data...
          </span>
        </div>
      ) : (
        <>
          {/* Stats Grid - Mobile Optimized */}
          <Row gutter={[16, 16]} className="mb-6">
            {statsData.map((stat, index) => (
              <Col xs={24} sm={8} key={index}>
                <Card
                  className="border-0 shadow-md lg:shadow-lg hover:shadow-lg lg:hover:shadow-xl transition-all duration-300 bg-white"
                  bodyStyle={{ padding: "16px" }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div
                      className="p-2 lg:p-3 rounded-xl"
                      style={{ backgroundColor: `${stat.color}20` }}
                    >
                      <div style={{ color: stat.color }}>{stat.icon}</div>
                    </div>
                    <Tag
                      color={stat.change.startsWith("+") ? "green" : "blue"}
                      className="text-xs"
                    >
                      {stat.change.startsWith("+") ? (
                        <ArrowUp size={10} />
                      ) : (
                        <ArrowDown size={10} />
                      )}
                      {stat.change}
                    </Tag>
                  </div>

                  <Statistic
                    title={
                      <span className="text-gray-600 font-medium text-sm lg:text-base">
                        {stat.title}
                      </span>
                    }
                    value={stat.value}
                    valueStyle={{
                      color: "#1f2937",
                      fontSize: "18px",
                      fontWeight: "bold",
                    }}
                    className="mb-2"
                  />

                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">
                      {stat.description}
                    </div>
                    <Progress
                      percent={Math.round(stat.progress)}
                      showInfo={false}
                      strokeColor={stat.color}
                      trailColor="#f3f4f6"
                      size="small"
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Analytics Panel */}
          {showAnalytics && analyticsInsights && (
            <div className="mb-6">
              <Card
                title="Financial Analytics"
                className="border-0 shadow-lg bg-white mb-4"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={8} lg={4}>
                    <Statistic
                      title="Avg. Attendance"
                      value={analyticsInsights.keyMetrics.averageAttendance}
                      prefix={<Users size={14} className="text-blue-500" />}
                      valueStyle={{ color: "#3b82f6", fontSize: "16px" }}
                    />
                  </Col>
                  <Col xs={12} sm={8} lg={4}>
                    <Statistic
                      title="Avg. Income"
                      value={analyticsInsights.keyMetrics.averageIncome}
                      prefix={
                        <DollarSign size={14} className="text-green-500" />
                      }
                      formatter={(value) =>
                        `₦${Math.round(Number(value)).toLocaleString()}`
                      }
                      valueStyle={{ color: "#10b981", fontSize: "16px" }}
                    />
                  </Col>
                  <Col xs={12} sm={8} lg={4}>
                    <Statistic
                      title="Income Growth"
                      value={Math.abs(
                        analyticsInsights.keyMetrics.incomeGrowth
                      )}
                      prefix={
                        analyticsInsights.keyMetrics.incomeGrowth >= 0 ? (
                          <TrendingUp size={14} className="text-green-500" />
                        ) : (
                          <TrendingDown size={14} className="text-red-500" />
                        )
                      }
                      suffix="%"
                      valueStyle={{
                        color:
                          analyticsInsights.keyMetrics.incomeGrowth >= 0
                            ? "#10b981"
                            : "#ef4444",
                        fontSize: "16px",
                      }}
                    />
                  </Col>
                </Row>
              </Card>

              {/* Recommendations */}
              {analyticsInsights.recommendations.length > 0 && (
                <Card
                  title="Recommendations"
                  className="border-0 shadow-lg bg-white"
                >
                  <List
                    dataSource={analyticsInsights.recommendations}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <div
                              className={`p-2 rounded-full ${
                                item.priority === "high"
                                  ? "bg-red-100"
                                  : item.priority === "medium"
                                  ? "bg-orange-100"
                                  : "bg-green-100"
                              }`}
                            >
                              <Target
                                size={14}
                                className={
                                  item.priority === "high"
                                    ? "text-red-600"
                                    : item.priority === "medium"
                                    ? "text-orange-600"
                                    : "text-green-600"
                                }
                              />
                            </div>
                          }
                          title={
                            <div className="flex items-center justify-between">
                              <span className="text-sm lg:text-base">
                                {item.action}
                              </span>
                              <Tag
                                color={
                                  item.priority === "high"
                                    ? "red"
                                    : item.priority === "medium"
                                    ? "orange"
                                    : "green"
                                }
                              >
                                {item.priority}
                              </Tag>
                            </div>
                          }
                          description={
                            <span className="text-xs lg:text-sm">
                              {item.reasoning}
                            </span>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <SundayServiceReportsTable />
          </div>

          <Row gutter={[16, 16]}>
            {/* Assembly Breakdown - Mobile Optimized */}
            <Col xs={24} lg={16}>
              <Card
                title={
                  <div className="flex items-center">
                    <FileText size={18} className="mr-2" />
                    <span className="text-base lg:text-lg font-semibold">
                      Recent Activity
                    </span>
                  </div>
                }
                className="border-0 shadow-lg bg-white"
              >
                <List
                  dataSource={dashboardData?.recentActivities || []}
                  renderItem={(item) => (
                    <List.Item className="px-0 py-2">
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size="small"
                            style={{
                              backgroundColor: "#3b82f6",
                              fontWeight: "bold",
                              fontSize: "12px",
                            }}
                          >
                            {item.avatar}
                          </Avatar>
                        }
                        title={
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 text-sm">
                              {item.user}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.time}
                            </span>
                          </div>
                        }
                        description={
                          <span className="text-gray-600 text-xs">
                            {item.action} <strong>{item.target}</strong>
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            {/* Recent Activity & Financial Insights - Mobile Optimized */}
            <Col xs={24} lg={8}>
              <div className="space-y-4 lg:space-y-6">
                {/* Recent Activity */}

                {/* Financial Insights */}
                <Card
                  title={
                    <div className="flex items-center">
                      <TrendingUp size={18} className="mr-2" />
                      <span className="text-base lg:text-lg font-semibold">
                        Financial Insights
                      </span>
                    </div>
                  }
                  className="border-0 shadow-lg bg-white"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 lg:p-3 bg-blue-50 rounded-lg">
                      <span className="text-xs lg:text-sm font-medium">
                        Average per Assembly
                      </span>
                      <span className="font-bold text-blue-600 text-xs lg:text-sm">
                        {formatCurrency(
                          Math.round(
                            (dashboardData?.monthlyIncome || 0) /
                              (dashboardData?.assemblyBreakdown.length || 1)
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 lg:p-3 bg-green-50 rounded-lg">
                      <span className="text-xs lg:text-sm font-medium">
                        Records per Assembly
                      </span>
                      <span className="font-bold text-green-600 text-xs lg:text-sm">
                        {Math.round(
                          (dashboardData?.totalRecords || 0) /
                            (dashboardData?.assemblyBreakdown.length || 1)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 lg:p-3 bg-orange-50 rounded-lg">
                      <span className="text-xs lg:text-sm font-medium">
                        Attendance Rate
                      </span>
                      <span className="font-bold text-orange-600 text-xs lg:text-sm">
                        {Math.round(
                          ((dashboardData?.activeMembers || 0) / 5000) * 100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </Col>
          </Row>
        </>
      )}

      {/* Assembly Details Modal - Mobile Optimized */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Church size={18} />
            <span className="text-base lg:text-lg">
              {selectedAssemblyDetails?.assembly} - Detailed Report
            </span>
          </div>
        }
        open={assemblyModalVisible}
        onCancel={() => setAssemblyModalVisible(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setAssemblyModalVisible(false)}
            size="small"
          >
            Close
          </Button>,
          <Button
            key="export"
            type="primary"
            icon={<Download size={14} />}
            size="small"
          >
            Export
          </Button>,
        ]}
        width="95%"
        style={{ maxWidth: 1000 }}
        className="top-4 lg:top-20"
      >
        {assemblyDetailsLoading ? (
          <div className="flex justify-center items-center h-32">
            <Spin size="large" />
            <span className="ml-3 text-gray-600">
              Loading assembly details...
            </span>
          </div>
        ) : selectedAssemblyDetails ? (
          <div className="space-y-4 lg:space-y-6">
            {/* Summary Cards */}
            <Row gutter={[12, 12]}>
              <Col xs={8}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="Total Income"
                    value={formatCurrency(selectedAssemblyDetails.income)}
                    valueStyle={{ color: "#10b981", fontSize: "14px" }}
                    className="text-xs"
                  />
                </Card>
              </Col>
              <Col xs={8}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="Attendance"
                    value={selectedAssemblyDetails.attendance}
                    valueStyle={{ color: "#3b82f6", fontSize: "14px" }}
                    className="text-xs"
                  />
                </Card>
              </Col>
              <Col xs={8}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="Records"
                    value={selectedAssemblyDetails.records}
                    valueStyle={{ color: "#8b5cf6", fontSize: "14px" }}
                    className="text-xs"
                  />
                </Card>
              </Col>
            </Row>

            {/* Monthly Breakdown */}
            <Card title="Monthly Performance" size="small">
              <div className="overflow-x-auto">
                <Table
                  dataSource={selectedAssemblyDetails.monthlyData}
                  pagination={false}
                  size="small"
                  scroll={{ x: 400 }}
                  columns={[
                    {
                      title: "Month",
                      dataIndex: "month",
                      key: "month",
                      width: 120,
                    },
                    {
                      title: "Income",
                      dataIndex: "income",
                      key: "income",
                      render: (amount: number) => formatCurrency(amount),
                      width: 100,
                    },
                    {
                      title: "Attendance",
                      dataIndex: "attendance",
                      key: "attendance",
                      width: 80,
                    },
                    {
                      title: "Records",
                      dataIndex: "records",
                      key: "records",
                      width: 60,
                    },
                  ]}
                />
              </div>
            </Card>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No details available for this assembly.
          </div>
        )}
      </Modal>
    </div>
  );
}
