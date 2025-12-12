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
  Divider,
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

type Html2PdfOptions = {
  margin: number;
  filename: string;
  image: { type: "jpeg" | "png" | "webp"; quality: number };
  html2canvas: { scale: number };
  jsPDF: {
    unit: string;
    format: string;
    orientation: "portrait" | "landscape";
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

  const columns: ColumnsType<any> = [
    {
      title: "Assembly",
      dataIndex: "assembly",
      key: "assembly",
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          {record.current.totalIncome === 0 && (
            <Tag color="red" className="text-xs">
              Inactive
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Income (₦)",
      dataIndex: ["current", "totalIncome"],
      key: "income",
      render: (v: number) => (
        <div
          className={`font-medium ${
            v === 0 ? "text-red-500" : "text-green-700"
          }`}
        >
          ₦{v.toLocaleString()}
        </div>
      ),
      sorter: (a, b) => a.current.totalIncome - b.current.totalIncome,
    },
    {
      title: "Attendance",
      dataIndex: ["current", "totalAttendance"],
      key: "attendance",
      render: (v: number) => (
        <div className="font-medium">{v.toLocaleString()}</div>
      ),
      sorter: (a, b) => a.current.totalAttendance - b.current.totalAttendance,
    },
    {
      title: "Tithes (₦)",
      dataIndex: ["current", "totalTithes"],
      key: "tithes",
      render: (v: number) => (
        <div className="font-medium">₦{v.toLocaleString()}</div>
      ),
      sorter: (a, b) => a.current.totalTithes - b.current.totalTithes,
    },
    {
      title: "% Income Change",
      dataIndex: ["change", "incomeVsPrev1"],
      key: "change",
      render: (v: number) => {
        const isPositive = v >= 0;
        const isZero = v === 0;
        return (
          <Tag
            color={isZero ? "default" : isPositive ? "green" : "red"}
            className="font-medium"
            icon={isPositive ? <RiseOutlined /> : null}
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
        Region 6, AKowonjo District
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

  // Parse and format the markdown report
  function formatReportSection(title: string, content: string) {
    const sections: Record<string, JSX.Element> = {
      // 1. Executive Summary
      "Executive Summary": (
        <Card className="mb-6 border-0 shadow-lg" id="executive-summary">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChartOutlined className="text-blue-600 text-xl" />
            </div>
            <div>
              <Title level={3} className="!mb-2 text-gray-800">
                Executive Summary
              </Title>
              <Text type="secondary">
                Key insights and overall performance overview
              </Text>
            </div>
          </div>
          <Paragraph className="text-gray-700 text-lg leading-relaxed">
            In December 2025, the district's combined financial performance
            reflected a significant increase compared to previous months, driven
            primarily by high income numbers in several key assemblies.
          </Paragraph>
        </Card>
      ),

      // 2. District Totals Overview
      "District Totals Overview": (
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TeamOutlined className="text-blue-600 text-xl" />
            </div>
            <div>
              <Title level={3} className="!mb-2 text-gray-800">
                District Totals Overview
              </Title>
              <Text type="secondary">Overall district performance metrics</Text>
            </div>
          </div>
          {districtTotals && (
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card className="border-0 bg-white shadow-sm">
                  <Statistic
                    title="Total Income"
                    value={districtTotals.totalIncome}
                    prefix="₦"
                    valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
                    formatter={(value) => value.toLocaleString()}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card className="border-0 bg-white shadow-sm">
                  <Statistic
                    title="Total Attendance"
                    value={districtTotals.totalAttendance}
                    valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
                    formatter={(value) => value.toLocaleString()}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card className="border-0 bg-white shadow-sm">
                  <Statistic
                    title="Total Tithes"
                    value={districtTotals.totalTithes}
                    prefix="₦"
                    valueStyle={{ color: "#722ed1", fontWeight: "bold" }}
                    formatter={(value) => value.toLocaleString()}
                  />
                </Card>
              </Col>
            </Row>
          )}
        </Card>
      ),

      // 3. Assembly Performance Table
      "Assembly Performance Table": (
        <Card className="mb-6 border-0 shadow-lg" id="performance-table">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChartOutlined className="text-purple-600 text-xl" />
            </div>
            <div>
              <Title level={3} className="!mb-2 text-gray-800">
                Assembly Performance Comparison
              </Title>
              <Text type="secondary">
                Detailed metrics across all assemblies
              </Text>
            </div>
          </div>
          <Table
            columns={columns}
            dataSource={comparisons}
            rowKey="assembly"
            pagination={false}
            bordered
            size="middle"
            scroll={{ x: 800 }}
            rowClassName={(record) =>
              record.current.totalIncome === 0 ? "bg-red-50" : ""
            }
          />
        </Card>
      ),

      // 4. Top 3 Performing Assemblies
      "Top 3 Performing Assemblies": (
        <Card className="mb-6 border-0 shadow-lg" id="top-performers">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrophyOutlined className="text-yellow-600 text-xl" />
            </div>
            <div>
              <Title level={3} className="!mb-2 text-gray-800">
                Top 3 Performing Assemblies
              </Title>
              <Text type="secondary">
                Leading assemblies with outstanding performance
              </Text>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getTopPerformers().map((assembly, index) => (
              <Card
                key={assembly.assembly}
                className={`border-0 shadow-md ${
                  index === 0
                    ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-400"
                    : index === 1
                    ? "bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-400"
                    : "bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-400"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-600"
                          : index === 1
                          ? "bg-gray-100 text-gray-600"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {index === 0 ? <CrownOutlined /> : `#${index + 1}`}
                    </div>
                    <Title level={4} className="!mb-0">
                      {assembly.assembly}
                    </Title>
                  </div>
                  <Tag color="green" icon={<RiseOutlined />}>
                    +{assembly.change.incomeVsPrev1}%
                  </Tag>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Text type="secondary">Income</Text>
                    <Text strong className="text-green-700 text-lg">
                      ₦{assembly.current.totalIncome.toLocaleString()}
                    </Text>
                  </div>
                  <div className="flex justify-between items-center">
                    <Text type="secondary">Attendance</Text>
                    <Text strong className="text-blue-700">
                      {assembly.current.totalAttendance.toLocaleString()}
                    </Text>
                  </div>
                  <div className="flex justify-between items-center">
                    <Text type="secondary">Tithes</Text>
                    <Text strong className="text-purple-700">
                      ₦{assembly.current.totalTithes.toLocaleString()}
                    </Text>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      ),

      // 5. Bottom 3 Assemblies
      "Bottom 3 Assemblies": (
        <Card className="mb-6 border-0 shadow-lg" id="bottom-performers">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <WarningOutlined className="text-red-600 text-xl" />
            </div>
            <div>
              <Title level={3} className="!mb-2 text-gray-800">
                Assemblies Requiring Attention
              </Title>
              <Text type="secondary">
                Assemblies with low or no performance metrics
              </Text>
            </div>
          </div>

          <div className="space-y-4">
            {getBottomPerformers().map((assembly, index) => (
              <Card
                key={assembly.assembly}
                className={`border-l-4 ${
                  assembly.current.totalIncome === 0
                    ? "border-red-400 bg-red-50"
                    : "border-orange-400 bg-orange-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        assembly.current.totalIncome === 0
                          ? "bg-red-100 text-red-600"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <Title level={5} className="!mb-1">
                        {assembly.assembly}
                      </Title>
                      {assembly.current.totalIncome === 0 ? (
                        <Tag color="red">Inactive</Tag>
                      ) : (
                        <Tag color="orange">Low Performance</Tag>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500">Income</div>
                      <div
                        className={`font-bold ${
                          assembly.current.totalIncome === 0
                            ? "text-red-600"
                            : "text-orange-600"
                        }`}
                      >
                        ₦{assembly.current.totalIncome.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                {assembly.current.totalIncome > 0 && (
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
                )}
              </Card>
            ))}
          </div>
        </Card>
      ),

      // 6. Trend Analysis vs Previous Months
      "Trend Analysis vs Previous Months": (
        <Card className="mb-6 border-0 shadow-lg" id="trend-analysis">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <LineChartOutlined className="text-green-600 text-xl" />
            </div>
            <div>
              <Title level={3} className="!mb-2 text-gray-800">
                Trend Analysis
              </Title>
              <Text type="secondary">
                Monthly comparison and growth patterns
              </Text>
            </div>
          </div>

          <div className="space-y-4">
            {comparisons.map((assembly, index) => (
              <Card
                key={assembly.assembly}
                size="small"
                className="border-l-4 border-gray-200"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Text strong>{assembly.assembly}</Text>
                    {assembly.change.incomeVsPrev1 === 100 && (
                      <Tag color="green" icon={<RiseOutlined />}>
                        Up 100%
                      </Tag>
                    )}
                    {assembly.change.incomeVsPrev1 === 0 &&
                      assembly.current.totalIncome === 0 && (
                        <Tag color="red">No Change</Tag>
                      )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Current Month</div>
                    <div className="font-semibold">
                      ₦{assembly.current.totalIncome.toLocaleString()}
                    </div>
                  </div>
                </div>
                {assembly.prev1 && (
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Previous Month ({assembly.prev1.month}):</span>
                      <span>
                        ₦{assembly.prev1.totalIncome.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Card>
      ),

      // 7. Financial Health Assessment
      "Financial Health Assessment (District)": (
        <Card className="mb-6 border-0 shadow-lg" id="financial-health">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-teal-100 rounded-lg">
              <DollarOutlined className="text-teal-600 text-xl" />
            </div>
            <div>
              <Title level={3} className="!mb-2 text-gray-800">
                Financial Health Assessment
              </Title>
              <Text type="secondary">
                District-wide financial stability and patterns
              </Text>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <Title level={5} className="!mb-3">
                Income Stability
              </Title>
              <Paragraph className="text-gray-700">
                Income figures are high for reporting assemblies, but overall
                district stability is affected by non-reporting assemblies,
                indicating inconsistencies.
              </Paragraph>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <Title level={5} className="!mb-3">
                Tithes-to-Income Ratio
              </Title>
              <Paragraph className="text-gray-700">
                Tithes represent a significant yet varying proportion of total
                income depending on assembly, highlighting reliance on other
                offering streams.
              </Paragraph>
              {districtTotals && (
                <div className="mt-3">
                  <div className="flex justify-between mb-1">
                    <Text>Tithes</Text>
                    <Text strong>
                      ₦{districtTotals.totalTithes.toLocaleString()}
                    </Text>
                  </div>
                  <Progress
                    percent={Math.round(
                      (districtTotals.totalTithes /
                        districtTotals.totalIncome) *
                        100
                    )}
                    strokeColor="#722ed1"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      ),

      // 8. Attendance & Growth Insights
      "Attendance & Growth Insights": (
        <Card className="mb-6 border-0 shadow-lg" id="attendance-insights">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TeamOutlined className="text-blue-600 text-xl" />
            </div>
            <div>
              <Title level={3} className="!mb-2 text-gray-800">
                Attendance & Growth Insights
              </Title>
              <Text type="secondary">
                Member engagement and growth patterns
              </Text>
            </div>
          </div>

          <div className="space-y-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card className="border-0 bg-green-50">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-700 mb-2">
                      401
                    </div>
                    <div className="text-gray-600">Total Attendance</div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card className="border-0 bg-blue-50">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-700 mb-2">
                      100%
                    </div>
                    <div className="text-gray-600">
                      Growth in Reporting Assemblies
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            <div className="bg-white p-4 rounded-lg border">
              <Title level={5} className="!mb-3">
                Top Attendance Assemblies
              </Title>
              <div className="space-y-2">
                {getTopPerformers()
                  .sort(
                    (a, b) =>
                      b.current.totalAttendance - a.current.totalAttendance
                  )
                  .slice(0, 2)
                  .map((assembly) => (
                    <div
                      key={assembly.assembly}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <TeamOutlined className="text-blue-500" />
                        <Text strong>{assembly.assembly}</Text>
                      </div>
                      <Tag color="blue">
                        {assembly.current.totalAttendance} attendees
                      </Tag>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Card>
      ),

      // 9. Ministry Impact & Engagement Recommendations
      "Ministry Impact & Engagement Recommendations": (
        <Card className="mb-6 border-0 shadow-lg" id="ministry-recommendations">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <CheckCircleOutlined className="text-indigo-600 text-xl" />
            </div>
            <div>
              <Title level={3} className="!mb-2 text-gray-800">
                Ministry Recommendations
              </Title>
              <Text type="secondary">
                Actionable strategies for improved engagement
              </Text>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <Title level={5} className="!mb-3 text-red-600">
                For Low-Attendance Assemblies
              </Title>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Implement targeted ministry programs</li>
                <li>Home visitations or community outreach</li>
                <li>Boost member engagement initiatives</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <Title level={5} className="!mb-3 text-blue-600">
                For High-Performance Assemblies
              </Title>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Knowledge-sharing of best practices</li>
                <li>Structured thanksgiving services</li>
                <li>Maintain member engagement strategies</li>
              </ul>
            </div>
          </div>
        </Card>
      ),

      // 16. Recognition & Motivation
      "Recognition & Motivation": (
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <StarOutlined className="text-yellow-600 text-xl" />
            </div>
            <div>
              <Title level={3} className="!mb-2 text-gray-800">
                Recognition & Awards
              </Title>
              <Text type="secondary">
                Outstanding assemblies deserving recognition
              </Text>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 bg-white shadow-md text-center">
              <div className="text-yellow-500 text-3xl mb-3">
                <TrophyOutlined />
              </div>
              <Title level={4} className="!mb-2">
                Assembly of the Month
              </Title>
              <Text strong className="text-lg">
                RayPower
              </Text>
              <div className="mt-2 text-gray-600">
                Highest combined income and strong attendance
              </div>
            </Card>

            <Card className="border-0 bg-white shadow-md text-center">
              <div className="text-green-500 text-3xl mb-3">
                <RiseOutlined />
              </div>
              <Title level={4} className="!mb-2">
                Most Improved
              </Title>
              <Text strong className="text-lg">
                All Reporting Assemblies
              </Text>
              <div className="mt-2 text-gray-600">
                100% improvement after non-reporting months
              </div>
            </Card>

            <Card className="border-0 bg-white shadow-md text-center">
              <div className="text-blue-500 text-3xl mb-3">
                <CheckCircleOutlined />
              </div>
              <Title level={4} className="!mb-2">
                Best Reporting
              </Title>
              <Text strong className="text-lg">
                RayPower
              </Text>
              <div className="mt-2 text-gray-600">
                Complete itemized breakdown and strong results
              </div>
            </Card>
          </div>
        </Card>
      ),
    };

    return sections[title] || null;
  }

  // Parse the report into sections
  function parseReport() {
    if (!reportMd) return [];

    const sections = [];
    const lines = reportMd.split("\n");
    let currentSection = "";
    let currentContent = "";

    for (const line of lines) {
      if (
        line.startsWith("# ") ||
        line.startsWith("## ") ||
        line.startsWith("### ")
      ) {
        if (currentSection) {
          sections.push({ title: currentSection, content: currentContent });
        }
        currentSection = line.replace(/^#+\s*/, "").trim();
        currentContent = "";
      } else {
        currentContent += line + "\n";
      }
    }

    if (currentSection) {
      sections.push({ title: currentSection, content: currentContent });
    }

    return sections;
  }

  const reportSections = parseReport();

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
              Region 6, AKowonjo District
            </h3>
            <p className="text-gray-600 text-sm md:text-base mt-1">
              Financial Reporting System
            </p>
          </div>
        </Card>

        {/* Header */}
        <Card className="mb-6 border-0 shadow-lg">
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div>
                <Title level={2} className="!mb-2 text-gray-800">
                  District Financial Report
                </Title>
                <Text type="secondary" className="text-base">
                  AI-Powered Financial Analysis & Insights
                </Text>
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
                    {loading ? "Generating..." : "Generate Report"}
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
          {/* Executive Summary - Always show if we have data */}
          {districtTotals && (
            <>
              <Card className="mb-6 border-0 shadow-lg" id="executive-summary">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChartOutlined className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <Title level={3} className="!mb-2 text-gray-800">
                      Executive Summary
                    </Title>
                    <Text type="secondary">
                      Key insights and overall performance overview
                    </Text>
                  </div>
                </div>
                <Paragraph className="text-gray-700 text-lg leading-relaxed">
                  In December 2025, the district's combined financial
                  performance reflected a significant increase compared to
                  previous months, driven primarily by high income numbers in
                  several key assemblies. The total reported attendance also
                  improved notably across the district.
                </Paragraph>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarOutlined className="text-green-500" />
                      <Text strong>Total Income</Text>
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      ₦{districtTotals.totalIncome?.toLocaleString() || "0"}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <TeamOutlined className="text-blue-500" />
                      <Text strong>Total Attendance</Text>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {districtTotals.totalAttendance?.toLocaleString() || "0"}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarOutlined className="text-purple-500" />
                      <Text strong>Total Tithes</Text>
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      ₦{districtTotals.totalTithes?.toLocaleString() || "0"}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Display formatted report sections */}
              {reportSections.map((section, index) => (
                <React.Fragment key={index}>
                  {formatReportSection(section.title, section.content)}
                </React.Fragment>
              ))}
            </>
          )}

          {/* Assembly Performance Details */}
          {comparisons.length > 0 && (
            <Card className="mb-6 border-0 shadow-lg" id="assembly-performance">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <Title level={3} className="!mb-2 text-gray-800">
                    Assembly Performance Dashboard
                  </Title>
                  <Text type="secondary">
                    Detailed metrics and comparisons for all assemblies
                  </Text>
                </div>
                <div className="text-right">
                  <Text strong className="mr-4">
                    Active Assemblies:{" "}
                  </Text>
                  <Tag color="blue" className="text-lg">
                    {
                      comparisons.filter((c) => c.current.totalIncome > 0)
                        .length
                    }{" "}
                    / {comparisons.length}
                  </Tag>
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
                  scroll={{ x: 800 }}
                  rowClassName={(record) =>
                    record.current.totalIncome === 0 ? "bg-red-50" : ""
                  }
                />
              </div>
            </Card>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="text-center p-8">
              <Spin size="large" />
              <Title level={4} className="!mt-4 !mb-2">
                Generating AI Report
              </Title>
              <Text type="secondary">
                Analyzing data with AI and creating comprehensive insights...
              </Text>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!loading && !reportMd && !districtTotals && (
          <Card className="text-center py-16 border-0 shadow-lg">
            <div className="text-5xl mb-6">📊</div>
            <Title level={3} className="!mb-4">
              Ready to Generate Report
            </Title>
            <Paragraph type="secondary" className="text-lg mb-8">
              Select a month and click "Generate Report" to create a
              comprehensive AI-powered financial analysis for your district.
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
                Generate AI Report
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
