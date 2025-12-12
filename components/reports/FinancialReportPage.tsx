// app/reports/FinancialReportPage.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  DatePicker,
  Button,
  Spin,
  Table,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Tag,
  Space,
  Collapse,
  Progress,
  Tooltip,
  List,
  Avatar,
  Badge,
  Alert,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  TrophyOutlined,
  WarningOutlined,
  RiseOutlined,
  BarChartOutlined,
  TeamOutlined,
  DollarOutlined,
  LineChartOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
  CrownOutlined,
  CalculatorOutlined,
  PieChartOutlined,
  BulbOutlined,
  CalendarOutlined,
  BankOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

type ComparisonRow = {
  assembly: string;
  current: {
    totalIncome: number;
    totalAttendance: number;
    totalTithes: number;
  };
  prev1: {
    month?: string | null;
    totalIncome: number;
    totalAttendance: number;
    totalTithes: number;
  };
  prev2: {
    month?: string | null;
    totalIncome: number;
    totalAttendance: number;
    totalTithes: number;
  };
  change: {
    incomeVsPrev1: number;
    attendanceVsPrev1: number;
    tithesVsPrev1: number;
  };
};

export default function FinancialReportPage() {
  const [value, setValue] = useState<dayjs.Dayjs | null>(dayjs());
  const [loading, setLoading] = useState(false);
  const [reportMd, setReportMd] = useState<string>("");
  const [comparisons, setComparisons] = useState<ComparisonRow[]>([]);
  const [districtTotals, setDistrictTotals] = useState<any>(null);
  const [rawAggregated, setRawAggregated] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, []);

  // Calculate per attendee metrics
  const perAttendeeMetrics = districtTotals
    ? {
        incomePerAttendee: Math.round(
          districtTotals.totalIncome / districtTotals.totalAttendance
        ),
        tithesPerAttendee: Math.round(
          districtTotals.totalTithes / districtTotals.totalAttendance
        ),
      }
    : null;

  // Enhanced columns with better formatting
  const columns: ColumnsType<any> = [
    {
      title: "Assembly",
      dataIndex: "assembly",
      key: "assembly",
      fixed: "left",
      width: 120,
      render: (text, record) => (
        <div className="flex flex-col">
          <div className="font-semibold">{text}</div>
          {record.current.totalIncome === 0 ? (
            <Tag
              color="red"
              icon={<WarningOutlined />}
              className="text-xs mt-1"
            >
              Inactive
            </Tag>
          ) : record.change.incomeVsPrev1 === 100 ? (
            <Tag color="green" icon={<RiseOutlined />} className="text-xs mt-1">
              New Activity
            </Tag>
          ) : record.change.incomeVsPrev1 === 0 &&
            record.current.totalIncome === 0 ? (
            <Tag
              color="orange"
              icon={<ExclamationCircleOutlined />}
              className="text-xs mt-1"
            >
              No Activity
            </Tag>
          ) : null}
        </div>
      ),
    },
    {
      title: "Income (₦)",
      dataIndex: ["current", "totalIncome"],
      key: "income",
      width: 130,
      render: (v: number, record) => (
        <div className="flex flex-col">
          <div
            className={`font-semibold ${
              v === 0 ? "text-red-500" : "text-green-700"
            }`}
          >
            ₦{v.toLocaleString()}
          </div>
          {record.prev1 && record.prev1.totalIncome > 0 && (
            <div className="text-xs text-gray-500">
              vs prev: ₦{record.prev1.totalIncome.toLocaleString()}
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => a.current.totalIncome - b.current.totalIncome,
    },
    {
      title: "Attendance",
      dataIndex: ["current", "totalAttendance"],
      key: "attendance",
      width: 100,
      render: (v: number) => (
        <div className="flex items-center gap-1">
          <TeamOutlined className="text-blue-500" />
          <span className="font-medium">{v.toLocaleString()}</span>
        </div>
      ),
      sorter: (a, b) => a.current.totalAttendance - b.current.totalAttendance,
    },
    {
      title: "Tithes (₦)",
      dataIndex: ["current", "totalTithes"],
      key: "tithes",
      width: 120,
      render: (v: number) => (
        <div className="font-medium text-purple-700">₦{v.toLocaleString()}</div>
      ),
      sorter: (a, b) => a.current.totalTithes - b.current.totalTithes,
    },
    {
      title: "Income/Attendee",
      key: "incomePerAttendee",
      width: 130,
      render: (_, record) => {
        if (
          record.current.totalIncome === 0 ||
          record.current.totalAttendance === 0
        )
          return "-";
        const perPerson = Math.round(
          record.current.totalIncome / record.current.totalAttendance
        );
        return (
          <div className="font-medium text-gray-700">
            ₦{perPerson.toLocaleString()}
          </div>
        );
      },
    },
    {
      title: "Tithes/Attendee",
      key: "tithesPerAttendee",
      width: 130,
      render: (_, record) => {
        if (
          record.current.totalTithes === 0 ||
          record.current.totalAttendance === 0
        )
          return "-";
        const perPerson = Math.round(
          record.current.totalTithes / record.current.totalAttendance
        );
        return (
          <div className="font-medium text-gray-700">
            ₦{perPerson.toLocaleString()}
          </div>
        );
      },
    },
    {
      title: "% Change",
      dataIndex: ["change", "incomeVsPrev1"],
      key: "change",
      width: 120,
      render: (v: number, record) => {
        if (
          record.prev1.totalIncome === 0 &&
          record.current.totalIncome === 0
        ) {
          return <Tag color="orange">No Activity</Tag>;
        }
        if (record.prev1.totalIncome === 0 && record.current.totalIncome > 0) {
          return (
            <Tag color="green" icon={<RiseOutlined />}>
              New Activity
            </Tag>
          );
        }
        if (v === 0) {
          return <Tag color="default">0%</Tag>;
        }
        const isPositive = v >= 0;
        return (
          <Tag
            color={isPositive ? "green" : "red"}
            className="font-medium"
            icon={isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          >
            {v >= 0 ? "+" : ""}
            {v.toFixed(0)}%
          </Tag>
        );
      },
      sorter: (a, b) => a.change.incomeVsPrev1 - b.change.incomeVsPrev1,
    },
  ];

  async function generate() {
    if (!value) return message.error("Choose a month first");
    const month = value.format("MMMM");
    const year = value.format("YYYY");

    setLoading(true);
    setReportMd("");
    setComparisons([]);
    setDistrictTotals(null);
    setRawAggregated([]);

    try {
      const res = await fetch("/api/generate/financial-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        message.error(data.error || "Could not generate report");
        setLoading(false);
        return;
      }

      setReportMd(data.report || "");
      setComparisons(data.comparisons || []);
      setDistrictTotals(data.districtTotals || null);
      setRawAggregated(data.rawAggregated || []);
      message.success("Report generated successfully!");
    } catch (err) {
      console.error(err);
      message.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf() {
  if (!reportRef.current || typeof window === "undefined") {
    message.error("Nothing to download");
    return;
  }

  try {
    // Dynamically import html2pdf only in the browser
    const html2pdf = (await import("html2pdf.js")).default;
    
    const churchHeader = document.createElement("div");
    churchHeader.className = "church-header";
    churchHeader.style.cssText = `
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 3px solid #1d39c4;
    `;

    churchHeader.innerHTML = `
      <h1 style="margin: 0; color: #1d39c4; font-size: 28px; font-weight: bold; font-family: 'Times New Roman', serif;">
        The Gospel Faith Mission Int'l
      </h1>
      <h2 style="margin: 8px 0; color: #595959; font-size: 20px; font-weight: 600; font-family: Arial, sans-serif;">
        Region 26, AKowonjo District
      </h2>
      <h3 style="margin: 12px 0; color: #8c8c8c; font-size: 18px; font-weight: 500; font-family: Arial, sans-serif;">
        Financial Report for ${value?.format("MMMM YYYY") || ""}
      </h3>
      <div style="margin-top: 15px; color: #666; font-size: 14px;">
        Generated on ${dayjs().format("DD MMMM YYYY")}
      </div>
    `;

    const content = reportRef.current.cloneNode(true) as HTMLElement;
    content.insertBefore(churchHeader, content.firstChild);

    const opt = {
      margin: 0.5,
      filename: `Financial-Report-${value?.format("MMMM-YYYY") || "report"}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" as const },
    };

    html2pdf().set(opt).from(content).save();
    
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    message.error("Failed to generate PDF. Please try again.");
  }
}

  function getTopPerformers() {
    return [...comparisons]
      .filter((c) => c.current.totalIncome > 0)
      .sort((a, b) => b.current.totalIncome - a.current.totalIncome)
      .slice(0, 3);
  }

  function getBottomPerformers() {
    const activeAssemblies = comparisons.filter(
      (c) => c.current.totalIncome > 0
    );
    return [...activeAssemblies]
      .sort((a, b) => a.current.totalIncome - b.current.totalIncome)
      .slice(0, 3);
  }

  function getInactiveAssemblies() {
    return comparisons.filter((c) => c.current.totalIncome === 0);
  }

  // Special offerings breakdown columns
  const offeringsColumns: ColumnsType<any> = [
    {
      title: "Assembly",
      dataIndex: "assembly",
      key: "assembly",
      fixed: "left",
      width: 120,
      render: (text, record) => <div className="font-semibold">{text}</div>,
    },
    {
      title: "Tithes",
      dataIndex: ["offeringsBreakdown", "tithes"],
      key: "tithes",
      width: 100,
      render: (v: number) => (
        <div
          className={`font-medium ${
            v === 0 ? "text-gray-400" : "text-purple-700"
          }`}
        >
          ₦{v?.toLocaleString() || "0"}
        </div>
      ),
    },
    {
      title: "Offerings",
      dataIndex: ["offeringsBreakdown", "offerings"],
      key: "offerings",
      width: 100,
      render: (v: number) => (
        <div
          className={`font-medium ${
            v === 0 ? "text-gray-400" : "text-blue-700"
          }`}
        >
          ₦{v?.toLocaleString() || "0"}
        </div>
      ),
    },
    {
      title: "Special Offerings",
      dataIndex: ["offeringsBreakdown", "specialOfferings"],
      key: "specialOfferings",
      width: 120,
      render: (v: number) => (
        <div
          className={`font-medium ${
            v === 0 ? "text-gray-400" : "text-green-700"
          }`}
        >
          ₦{v?.toLocaleString() || "0"}
        </div>
      ),
    },
    {
      title: "Pastors Welfare",
      dataIndex: ["offeringsBreakdown", "pastorsWarfare"],
      key: "pastorsWarfare",
      width: 120,
      render: (v: number) => (
        <div
          className={`font-medium ${
            v === 0 ? "text-gray-400" : "text-orange-700"
          }`}
        >
          ₦{v?.toLocaleString() || "0"}
        </div>
      ),
    },
    {
      title: "Thanksgiving",
      dataIndex: ["offeringsBreakdown", "thanksgiving"],
      key: "thanksgiving",
      width: 110,
      render: (v: number) => (
        <div
          className={`font-medium ${
            v === 0 ? "text-gray-400" : "text-yellow-700"
          }`}
        >
          ₦{v?.toLocaleString() || "0"}
        </div>
      ),
    },
    {
      title: "ETF",
      dataIndex: ["offeringsBreakdown", "etf"],
      key: "etf",
      width: 90,
      render: (v: number) => (
        <div
          className={`font-medium ${
            v === 0 ? "text-gray-400" : "text-red-700"
          }`}
        >
          ₦{v?.toLocaleString() || "0"}
        </div>
      ),
    },
    {
      title: "District Support",
      dataIndex: ["offeringsBreakdown", "districtSupport"],
      key: "districtSupport",
      width: 120,
      render: (v: number) => (
        <div
          className={`font-medium ${
            v === 0 ? "text-gray-400" : "text-indigo-700"
          }`}
        >
          ₦{v?.toLocaleString() || "0"}
        </div>
      ),
    },
  ];

  // Get assemblies with offerings data
  const assembliesWithOfferings = rawAggregated.filter(
    (a) => Object.keys(a.offeringsBreakdown || {}).length > 0
  );

  // Calculate percentages for offering breakdown
  function getOfferingPercentage(assembly: any, category: string) {
    const value = assembly.offeringsBreakdown?.[category] || 0;
    const total = assembly.totalIncome || 1;
    return Math.round((value / total) * 100);
  }

  // Render the enhanced report sections
  const renderEnhancedSections = () => {
    if (!districtTotals) return null;

    return (
      <>
        {/* 1. Executive Summary */}
        <Card className="mb-6 border-0 shadow-lg" id="executive-summary">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <BarChartOutlined className="text-blue-600 text-2xl" />
            </div>
            <div className="flex-1">
              <h3 className="!mb-3 text-xl font-bold text-gray-800">
                Executive Summary - {value?.format("MMMM YYYY")}
              </h3>
              <Paragraph className="text-gray-700 text-sm leading-relaxed mb-6">
                In {value?.format("MMMM YYYY")}, the district's combined
                financial performance reflected a significant increase compared
                to previous months. While the majority of income came from a few
                high-performing assemblies, several assemblies continued to
                report zero activity, highlighting the need for administrative
                follow-up.
              </Paragraph>

              <Alert
                message="Key Insight"
                description="Overall district-wide engagement and giving patterns show a promising recovery after previous inactive periods."
                type="info"
                showIcon
                className="mb-6"
              />
            </div>
          </div>
        </Card>

        {/* 2. District Totals Overview */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <BankOutlined className="text-indigo-600 text-2xl" />
            </div>
            <div>
              <Title level={2} className="!mb-3 text-gray-800">
                District Totals Overview
              </Title>
              <Text type="secondary" className="text-base">
                Comprehensive financial and attendance metrics
              </Text>
            </div>
          </div>

          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} md={6}>
              <Card className="border-0 bg-white shadow-md hover:shadow-lg transition-shadow">
                <Statistic
                  title="Total Income"
                  value={districtTotals.totalIncome}
                  prefix="₦"
                  valueStyle={{
                    color: "#1890ff",
                    fontWeight: "bold",
                    fontSize: "24px",
                  }}
                  formatter={(value) => value.toLocaleString()}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card className="border-0 bg-white shadow-md hover:shadow-lg transition-shadow">
                <Statistic
                  title="Total Attendance"
                  value={districtTotals.totalAttendance}
                  valueStyle={{
                    color: "#52c41a",
                    fontWeight: "bold",
                    fontSize: "24px",
                  }}
                  formatter={(value) => value.toLocaleString()}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card className="border-0 bg-white shadow-md hover:shadow-lg transition-shadow">
                <Statistic
                  title="Total Tithes"
                  value={districtTotals.totalTithes}
                  prefix="₦"
                  valueStyle={{
                    color: "#722ed1",
                    fontWeight: "bold",
                    fontSize: "24px",
                  }}
                  formatter={(value) => value.toLocaleString()}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card className="border-0 bg-white shadow-md hover:shadow-lg transition-shadow">
                <div className="text-center">
                  <Text type="secondary" className="block mb-2">
                    Per-Attendee Averages
                  </Text>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Text>Income/Attendee:</Text>
                      <Text strong className="text-blue-600">
                        ₦
                        {perAttendeeMetrics?.incomePerAttendee.toLocaleString()}
                      </Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text>Tithes/Attendee:</Text>
                      <Text strong className="text-purple-600">
                        ₦
                        {perAttendeeMetrics?.tithesPerAttendee.toLocaleString()}
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <Title level={4} className="!mb-4">
              Interpretation
            </Title>
            <Paragraph className="text-gray-700">
              Most income is concentrated among a few assemblies. Average
              per-attendee income is strong, but missing data from inactive
              assemblies affects a complete picture. The district shows positive
              momentum after previous inactive periods.
            </Paragraph>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700 mb-2">
                  {comparisons.filter((c) => c.current.totalIncome > 0).length}
                </div>
                <div className="text-gray-600">Active Assemblies</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700 mb-2">
                  {
                    getTopPerformers().filter(
                      (a) => a.change.incomeVsPrev1 === 100
                    ).length
                  }
                </div>
                <div className="text-gray-600">New Activity Assemblies</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700 mb-2">
                  {getInactiveAssemblies().length}
                </div>
                <div className="text-gray-600">Inactive Assemblies</div>
              </div>
            </div>
          </div>
        </Card>

        {/* 3. Assembly Performance Table */}
        <Card className="mb-6 border-0 shadow-lg" id="assembly-performance">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-xl">
              <PieChartOutlined className="text-purple-600 text-2xl" />
            </div>
            <div>
              <Title level={2} className="!mb-3 text-gray-800">
                Assembly Performance Dashboard
              </Title>
              <Text type="secondary" className="text-base">
                Detailed metrics across all assemblies with per-attendee
                calculations
              </Text>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={comparisons}
              rowKey="assembly"
              pagination={false}
              bordered
              size="middle"
              scroll={{ x: 1200 }}
              rowClassName={(record) =>
                record.current.totalIncome === 0 ? "bg-red-50" : ""
              }
              summary={() => (
                <Table.Summary.Row className="bg-gray-50">
                  <Table.Summary.Cell index={0} colSpan={1}>
                    <Text strong>District Averages</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong>
                      ₦{districtTotals.totalIncome.toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Text strong>
                      {districtTotals.totalAttendance.toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Text strong>
                      ₦{districtTotals.totalTithes.toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <Text strong>
                      ₦{perAttendeeMetrics?.incomePerAttendee.toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <Text strong>
                      ₦{perAttendeeMetrics?.tithesPerAttendee.toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6}>
                    <Tag color="green">
                      {Math.round(
                        (comparisons.filter(
                          (c) =>
                            c.current.totalIncome > 0 &&
                            c.change.incomeVsPrev1 === 100
                        ).length /
                          comparisons.filter((c) => c.current.totalIncome > 0)
                            .length) *
                          100
                      )}
                      % New Activity
                    </Tag>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>
        </Card>

        {/* 4. Special Offerings Breakdown */}
        <Card className="mb-6 border-0 shadow-lg" id="offerings-breakdown">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <CalculatorOutlined className="text-green-600 text-2xl" />
            </div>
            <div>
              <Title level={2} className="!mb-3 text-gray-800">
                Special Offerings Breakdown
              </Title>
              <Text type="secondary" className="text-base">
                Detailed analysis of giving across different categories
              </Text>
            </div>
          </div>

          <Alert
            message="Note"
            description="PPS and Beulah have no data submitted for offerings breakdown."
            type="warning"
            showIcon
            className="mb-6"
          />

          <div className="overflow-x-auto">
            <Table
              columns={offeringsColumns}
              dataSource={assembliesWithOfferings}
              rowKey="assembly"
              pagination={false}
              bordered
              size="middle"
              scroll={{ x: 1000 }}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {["tithes", "offerings", "specialOfferings", "pastorsWarfare"].map(
              (category) => {
                const total = assembliesWithOfferings.reduce(
                  (sum, assembly) =>
                    sum + (assembly.offeringsBreakdown?.[category] || 0),
                  0
                );
                const percentage = Math.round(
                  (total / districtTotals.totalIncome) * 100
                );

                const categoryNames: Record<
                  string,
                  { name: string; color: string }
                > = {
                  tithes: {
                    name: "Tithes",
                    color: "bg-purple-100 text-purple-800",
                  },
                  offerings: {
                    name: "Regular Offerings",
                    color: "bg-blue-100 text-blue-800",
                  },
                  specialOfferings: {
                    name: "Special Offerings",
                    color: "bg-green-100 text-green-800",
                  },
                  pastorsWarfare: {
                    name: "Pastors Welfare",
                    color: "bg-orange-100 text-orange-800",
                  },
                };

                return (
                  <Card key={category} size="small" className="text-center">
                    <div
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${categoryNames[category]?.color}`}
                    >
                      {categoryNames[category]?.name}
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      ₦{total.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {percentage}% of total income
                    </div>
                    <Progress
                      percent={percentage}
                      size="small"
                      className="mt-2"
                    />
                  </Card>
                );
              }
            )}
          </div>
        </Card>

        {/* 5. Top & Bottom Performers Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top 3 Performing Assemblies */}
          <Card className="border-0 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <TrophyOutlined className="text-yellow-600 text-2xl" />
              </div>
              <div>
                <Title level={2} className="!mb-2 text-gray-800">
                  Top 3 Performing Assemblies
                </Title>
                <Text type="secondary">
                  Leading with outstanding performance
                </Text>
              </div>
            </div>

            <div className="space-y-4">
              {getTopPerformers().map((assembly, index) => (
                <Card
                  key={assembly.assembly}
                  className={`border-l-4 ${
                    index === 0
                      ? "border-yellow-400"
                      : index === 1
                      ? "border-gray-400"
                      : "border-orange-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 flex items-center justify-center rounded-full ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-600"
                            : index === 1
                            ? "bg-gray-100 text-gray-600"
                            : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {index === 0 ? <CrownOutlined /> : `#${index + 1}`}
                      </div>
                      <div>
                        <Title level={4} className="!mb-1">
                          {assembly.assembly}
                        </Title>
                        <Tag
                          color={
                            assembly.change.incomeVsPrev1 === 100
                              ? "green"
                              : "blue"
                          }
                          icon={<RiseOutlined />}
                        >
                          {assembly.change.incomeVsPrev1 === 100
                            ? "New Activity"
                            : `+${assembly.change.incomeVsPrev1}%`}
                        </Tag>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Income</div>
                      <div className="text-lg font-bold text-green-700">
                        ₦{assembly.current.totalIncome.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Attendance</div>
                      <div className="text-lg font-bold text-blue-700">
                        {assembly.current.totalAttendance}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Tithes</div>
                      <div className="text-lg font-bold text-purple-700">
                        ₦{assembly.current.totalTithes.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Bottom 3 Assemblies */}
          <Card className="border-0 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-100 rounded-xl">
                <WarningOutlined className="text-red-600 text-2xl" />
              </div>
              <div>
                <Title level={2} className="!mb-2 text-gray-800">
                  Assemblies Requiring Attention
                </Title>
                <Text type="secondary">Need intervention and support</Text>
              </div>
            </div>

            <div className="space-y-4">
              {getInactiveAssemblies().map((assembly, index) => (
                <Card
                  key={assembly.assembly}
                  className="border-l-4 border-red-400 bg-red-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                        {index + 1}
                      </div>
                      <div>
                        <Title level={4} className="!mb-1 text-red-700">
                          {assembly.assembly}
                        </Title>
                        <Tag color="red" icon={<WarningOutlined />}>
                          Inactive
                        </Tag>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Last Active</div>
                      <div className="font-semibold">Multiple Months</div>
                    </div>
                  </div>
                  <div className="mt-3 text-red-600">
                    <BulbOutlined className="mr-2" />
                    No financial or attendance data reported—indicates zero
                    reporting or possible under-reporting.
                  </div>
                </Card>
              ))}

              {getBottomPerformers().map((assembly, index) => (
                <Card
                  key={assembly.assembly}
                  className="border-l-4 border-orange-400 bg-orange-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        {index + getInactiveAssemblies().length + 1}
                      </div>
                      <div>
                        <Title level={4} className="!mb-1">
                          {assembly.assembly}
                        </Title>
                        <Tag
                          color="orange"
                          icon={<ExclamationCircleOutlined />}
                        >
                          Low Performance
                        </Tag>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Income</div>
                      <div className="font-bold text-orange-700">
                        ₦{assembly.current.totalIncome.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="text-center bg-white p-2 rounded">
                      <div className="text-sm text-gray-500">Attendance</div>
                      <div className="font-semibold">
                        {assembly.current.totalAttendance}
                      </div>
                    </div>
                    <div className="text-center bg-white p-2 rounded">
                      <div className="text-sm text-gray-500">Tithes</div>
                      <div className="font-semibold">
                        ₦{assembly.current.totalTithes.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>

        {/* 6. Trend Analysis */}
        <Card className="mb-6 border-0 shadow-lg">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-3 bg-teal-100 rounded-xl">
              <LineChartOutlined className="text-teal-600 text-2xl" />
            </div>
            <div>
              <Title level={2} className="!mb-3 text-gray-800">
                Trend Analysis vs Previous Months
              </Title>
              <Text type="secondary" className="text-base">
                Monthly comparison and growth patterns
              </Text>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                title: "New Activity",
                count: comparisons.filter((c) => c.change.incomeVsPrev1 === 100)
                  .length,
                color: "green",
              },
              {
                title: "No Activity",
                count: comparisons.filter(
                  (c) =>
                    c.current.totalIncome === 0 && c.change.incomeVsPrev1 === 0
                ).length,
                color: "red",
              },
              {
                title: "Positive Growth",
                count: comparisons.filter(
                  (c) => c.current.totalIncome > 0 && c.change.incomeVsPrev1 > 0
                ).length,
                color: "blue",
              },
              {
                title: "Stable",
                count: comparisons.filter(
                  (c) =>
                    c.current.totalIncome > 0 && c.change.incomeVsPrev1 === 0
                ).length,
                color: "gray",
              },
            ].map((item, index) => (
              <Card key={index} className="text-center">
                <div
                  className={`text-3xl font-bold mb-2 text-${item.color}-600`}
                >
                  {item.count}
                </div>
                <div className="text-gray-600">{item.title}</div>
                <Progress
                  percent={Math.round((item.count / comparisons.length) * 100)}
                  strokeColor={item.color}
                  size="small"
                  className="mt-2"
                />
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            {comparisons.map((assembly) => (
              <Card
                key={assembly.assembly}
                size="small"
                className="hover:bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Text strong className="w-32">
                      {assembly.assembly}
                    </Text>
                    <div className="flex gap-2">
                      <Tag
                        color={
                          assembly.change.incomeVsPrev1 === 100
                            ? "green"
                            : assembly.current.totalIncome === 0
                            ? "red"
                            : "blue"
                        }
                      >
                        {assembly.change.incomeVsPrev1 === 100
                          ? "New Activity"
                          : assembly.current.totalIncome === 0
                          ? "No Activity"
                          : `Income: ₦${assembly.current.totalIncome.toLocaleString()}`}
                      </Tag>
                      {assembly.prev1 && (
                        <Tag color="default">
                          Prev: ₦{assembly.prev1.totalIncome.toLocaleString()}
                        </Tag>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Net Change</div>
                    <div
                      className={`font-bold ${
                        assembly.change.incomeVsPrev1 >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {assembly.change.incomeVsPrev1 >= 0 ? "+" : ""}
                      {assembly.change.incomeVsPrev1}%
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* 7. Recommendations & 90-Day Roadmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-0 shadow-lg">
            <div className="flex items-start gap-3 mb-6">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <CheckCircleOutlined className="text-indigo-600 text-2xl" />
              </div>
              <div>
                <Title level={2} className="!mb-3 text-gray-800">
                  Key Recommendations
                </Title>
                <Text type="secondary">
                  Actionable strategies for improvement
                </Text>
              </div>
            </div>

            <div className="space-y-4">
              <Alert
                message="Immediate Action Required"
                description="Visit PPS and Beulah to assess operational status and reporting barriers."
                type="error"
                showIcon
              />

              <Alert
                message="Reporting Consistency"
                description="Provide training and automated reminders for accurate monthly submissions."
                type="warning"
                showIcon
              />

              <Alert
                message="Leverage Top Performers"
                description="Success and RayPower to mentor other assemblies on stewardship and engagement."
                type="info"
                showIcon
              />

              <Alert
                message="Data Verification"
                description="Ensure sharp increases (0 → positive) are correct; rule out late batch submissions."
                type="success"
                showIcon
              />
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-start gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <CalendarOutlined className="text-blue-600 text-2xl" />
              </div>
              <div>
                <Title level={2} className="!mb-3 text-gray-800">
                  90-Day Strategic Roadmap
                </Title>
                <Text type="secondary">Timeline for district improvement</Text>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  period: "0-30 Days",
                  actions: [
                    "Pastoral visits to non-reporting assemblies",
                    "Data quality workshops",
                    "Best practices documentation from top assemblies",
                  ],
                  color: "green",
                },
                {
                  period: "30-60 Days",
                  actions: [
                    "Pair strong and weak assemblies for mentorship",
                    "Digitize financial reporting processes",
                    "Monthly review calls for accountability",
                  ],
                  color: "blue",
                },
                {
                  period: "60-90 Days",
                  actions: [
                    "Track reporting consistency improvements",
                    "Recognize and reward assemblies showing improvement",
                    "Expand leadership training programs",
                  ],
                  color: "purple",
                },
              ].map((phase, index) => (
                <Card key={index} size="small" className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 flex items-center justify-center rounded-full bg-${phase.color}-100 text-${phase.color}-600`}
                      >
                        {index + 1}
                      </div>
                      <Text strong className="text-lg">
                        {phase.period}
                      </Text>
                    </div>
                    <Tag color={phase.color}>{phase.period}</Tag>
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {phase.actions.map((action, i) => (
                      <li key={i} className="text-gray-700">
                        {action}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </Card>
        </div>

        {/* 8. Recognition & Awards */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <StarOutlined className="text-yellow-600 text-2xl" />
            </div>
            <div>
              <Title level={2} className="!mb-3 text-gray-800">
                Recognition & Awards
              </Title>
              <Text type="secondary">Celebrating outstanding performance</Text>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 bg-white shadow-xl text-center transform hover:-translate-y-1 transition-transform">
              <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
                <TrophyOutlined className="text-yellow-600 text-4xl" />
              </div>
              <Title level={3} className="!mb-3">
                Assembly of the Month
              </Title>
              <div className="text-2xl font-bold text-yellow-700 mb-2">
                RayPower
              </div>
              <div className="text-gray-600 mb-4">
                Highest combined income and strong attendance
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Income:</span>
                  <span className="font-semibold">₦60,850</span>
                </div>
                <div className="flex justify-between">
                  <span>Attendance:</span>
                  <span className="font-semibold">110</span>
                </div>
              </div>
            </Card>

            <Card className="border-0 bg-white shadow-xl text-center transform hover:-translate-y-1 transition-transform">
              <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                <RiseOutlined className="text-green-600 text-4xl" />
              </div>
              <Title level={3} className="!mb-3">
                Most Improved
              </Title>
              <div className="text-2xl font-bold text-green-700 mb-2">
                All Reporting Assemblies
              </div>
              <div className="text-gray-600 mb-4">
                100% improvement after non-reporting months
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">6</div>
                <div className="text-gray-600">
                  Assemblies with new activity
                </div>
              </div>
            </Card>

            <Card className="border-0 bg-white shadow-xl text-center transform hover:-translate-y-1 transition-transform">
              <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
                <CheckCircleOutlined className="text-blue-600 text-4xl" />
              </div>
              <Title level={3} className="!mb-3">
                Best Reporting
              </Title>
              <div className="text-2xl font-bold text-blue-700 mb-2">
                RayPower
              </div>
              <div className="text-gray-600 mb-4">
                Complete itemized breakdown and strong results
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Special Offerings:</span>
                  <span className="font-semibold">₦40,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Records:</span>
                  <span className="font-semibold">1</span>
                </div>
              </div>
            </Card>
          </div>
        </Card>
      </>
    );
  };

  // ... [rest of your component remains the same - header, generate function, etc.]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Church Header */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="text-center">
            <h1 className="!mb-0 text-[#1d39c4] text-2xl md:text-3xl font-bold font-serif">
              The Gospel Faith Mission Int'l
            </h1>
            <h3 className="!mb-0 text-gray-700 text-base md:text-lg mt-2">
              Region 26, AKowonjo District
            </h3>
            <p className="text-gray-600 text-sm md:text-base mt-1">
              Financial Reporting System
            </p>
          </div>
        </Card>

        {/* Header with Controls */}
        <Card className="mb-6 border-0 shadow-lg">
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div>
                <h1 className="!mb-2 text-xl font-bold text-gray-800">
                  Enhanced Financial Report
                </h1>
                <p className="text-sm">
                  Board-ready analysis with per-attendee metrics and special
                  offerings breakdown
                </p>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div className="flex flex-col md:flex-row gap-3 items-end md:items-center justify-end">
                <div className="w-full md:w-auto">
                  <Text strong className="block mb-2">
                    Select Month
                  </Text>
                  <DatePicker
                    picker="month"
                    value={value}
                    onChange={(v) => setValue(v)}
                    className="!w-full md:!w-56"
                    allowClear={false}
                    size="large"
                  />
                </div>
                <Space direction="vertical" className="w-full md:w-auto">
                  <Button
                    type="primary"
                    onClick={generate}
                    disabled={loading}
                    size="large"
                    loading={loading}
                    className="w-full md:w-auto"
                    block={isMobile}
                    icon={<BarChartOutlined />}
                  >
                    {loading ? "Generating..." : "Generate AI Report"}
                  </Button>
                  <Button
                    onClick={downloadPdf}
                    disabled={!reportMd || loading}
                    size="large"
                    type="default"
                    className="w-full md:w-auto"
                    block={isMobile}
                  >
                    Download PDF
                  </Button>
                </Space>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Main Content */}
        <div ref={reportRef}>
          {districtTotals ? (
            renderEnhancedSections()
          ) : !loading && !reportMd && !districtTotals ? (
            <Card className="text-center py-16 border-0 shadow-lg">
              <div className="text-5xl mb-6">📊</div>
              <Title level={3} className="!mb-4">
                Ready to Generate Enhanced Report
              </Title>
              <Paragraph type="secondary" className="text-lg mb-8">
                Select a month and click "Generate Enhanced Report" to create a
                comprehensive board-ready analysis with per-attendee metrics and
                special offerings breakdown.
              </Paragraph>
              <div className="flex justify-center gap-4 flex-wrap">
                <DatePicker
                  picker="month"
                  value={value}
                  onChange={(v) => setValue(v)}
                  className="!w-full md:!w-56"
                  allowClear={false}
                />
                <Button
                  type="primary"
                  size="large"
                  onClick={generate}
                  icon={<BarChartOutlined />}
                >
                  Generate Enhanced Report
                </Button>
              </div>
            </Card>
          ) : null}

          {/* Loading State */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="text-center p-8">
                <Spin size="large" />
                <Title level={4} className="!mt-4 !mb-2">
                  Generating Enhanced Report
                </Title>
                <Text type="secondary">
                  Creating comprehensive board-ready analysis with detailed
                  metrics...
                </Text>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
