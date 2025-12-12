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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import html2pdf from "html2pdf.js";
import ReactMarkdown from "react-markdown";

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

// Custom Markdown components for better styling
const markdownComponents = {
  h1: ({ children }: any) => (
    <Title level={1} className="!mt-6 !mb-4 text-blue-800 border-b pb-2">
      {children}
    </Title>
  ),
  h2: ({ children }: any) => (
    <Title level={2} className="!mt-5 !mb-3 text-blue-700">
      {children}
    </Title>
  ),
  h3: ({ children }: any) => (
    <Title level={3} className="!mt-4 !mb-2 text-gray-800">
      {children}
    </Title>
  ),
  p: ({ children }: any) => (
    <Paragraph className="text-gray-700 mb-3 leading-relaxed">
      {children}
    </Paragraph>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse border border-gray-300">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-gray-50">{children}</thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-gray-200">{children}</tbody>
  ),
  tr: ({ children }: any) => <tr className="hover:bg-gray-50">{children}</tr>,
  th: ({ children }: any) => (
    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="border border-gray-300 px-4 py-2 text-gray-600">
      {children}
    </td>
  ),
  strong: ({ children }: any) => (
    <strong className="text-gray-900 font-semibold">{children}</strong>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>
  ),
  li: ({ children }: any) => <li className="text-gray-700">{children}</li>,
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
    // Check if we're on client side
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

  function downloadPdf() {
    if (!reportRef.current || typeof window === "undefined")
      return message.error("Nothing to download");

    // Create church header for PDF
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

    // Clone the report content
    const content = reportRef.current.cloneNode(true) as HTMLElement;

    // Insert church header at the beginning
    content.insertBefore(churchHeader, content.firstChild);

    const opt: Html2PdfOptions = {
      margin: 0.5,
      filename: `Financial-Report-${
        value?.format("MMMM-YYYY") || "report"
      }.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(content).save();
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
          {/* Quick Stats Overview */}
          {districtTotals && (
            <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="text-center mb-6">
                <Title level={3} className="!mb-2 text-gray-800">
                  Quick Stats - {value?.format("MMMM YYYY")}
                </Title>
              </div>

              <Row gutter={[16, 16]} className="mb-4">
                <Col xs={24} md={8}>
                  <Card className="border-0 bg-white shadow-sm">
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
                <Col xs={24} md={8}>
                  <Card className="border-0 bg-white shadow-sm">
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
                <Col xs={24} md={8}>
                  <Card className="border-0 bg-white shadow-sm">
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
              </Row>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div>
                  <Text strong className="block mb-2 text-gray-700">
                    Top Performing Assemblies
                  </Text>
                  <div className="space-y-2">
                    {getTopPerformers().map((assembly, index) => (
                      <div
                        key={assembly.assembly}
                        className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 flex items-center justify-center rounded-full ${
                              index === 0
                                ? "bg-yellow-100 text-yellow-600"
                                : index === 1
                                ? "bg-gray-100 text-gray-600"
                                : "bg-orange-100 text-orange-600"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <Text strong>{assembly.assembly}</Text>
                        </div>
                        <Text strong className="text-green-700">
                          ₦{assembly.current.totalIncome.toLocaleString()}
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Text strong className="block mb-2 text-gray-700">
                    Inactive Assemblies
                  </Text>
                  <div className="space-y-2">
                    {getInactiveAssemblies().map((assembly) => (
                      <div
                        key={assembly.assembly}
                        className="flex items-center justify-between bg-red-50 p-3 rounded-lg shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                            ⚠️
                          </div>
                          <Text strong className="text-red-600">
                            {assembly.assembly}
                          </Text>
                        </div>
                        <Tag color="red">No Data</Tag>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Text strong className="block mb-2 text-gray-700">
                    Active Assemblies
                  </Text>
                  <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                    <Title level={2} className="!mb-2 text-blue-600">
                      {
                        comparisons.filter((c) => c.current.totalIncome > 0)
                          .length
                      }
                    </Title>
                    <Text type="secondary">
                      out of {comparisons.length} total
                    </Text>
                    <div className="mt-2">
                      <Progress
                        percent={Math.round(
                          (comparisons.filter((c) => c.current.totalIncome > 0)
                            .length /
                            comparisons.length) *
                            100
                        )}
                        strokeColor="#52c41a"
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* AI Analysis Report */}
          {reportMd && (
            <Card className="mb-6 border-0 shadow-lg" id="ai-analysis">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <Title level={3} className="!mb-2 text-gray-800">
                    AI Analysis Report
                  </Title>
                  <Text type="secondary">
                    Comprehensive AI-generated insights and recommendations
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Tag color="blue">AI Generated</Tag>
                  <Tag color="green">
                    {comparisons.length} Assemblies Analyzed
                  </Tag>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <ReactMarkdown components={markdownComponents}>
                  {reportMd}
                </ReactMarkdown>
              </div>
            </Card>
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
                    Total Income:{" "}
                  </Text>
                  <Tag color="blue" className="text-lg">
                    ₦{districtTotals?.totalIncome?.toLocaleString() || "0"}
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
                  onRow={(record) => ({
                    onClick: () => {
                      // You could add click functionality here
                    },
                  })}
                />
              </div>
            </Card>
          )}

          {/* Detailed Breakdown */}
          {rawAggregated.length > 0 && (
            <Card className="mb-6 border-0 shadow-lg" id="detailed-breakdown">
              <Title level={3} className="!mb-6 text-gray-800">
                Detailed Assembly Breakdown
              </Title>

              <Collapse
                ghost
                expandIconPosition="right"
                className="assembly-breakdown-collapse"
              >
                {rawAggregated.map((assembly) => {
                  const offerings = assembly.offeringsBreakdown || {};
                  const hasOfferings = Object.keys(offerings).length > 0;
                  const isInactive = assembly.totalIncome === 0;

                  return (
                    <Panel
                      key={assembly.assembly}
                      header={
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                isInactive ? "bg-red-500" : "bg-green-500"
                              }`}
                            />
                            <Title level={5} className="!mb-0">
                              {assembly.assembly}
                            </Title>
                            {isInactive && <Tag color="red">Inactive</Tag>}
                          </div>
                          <div className="flex gap-4">
                            <div className="text-right">
                              <Text strong className="block">
                                Income
                              </Text>
                              <Text
                                className={
                                  isInactive ? "text-red-500" : "text-green-700"
                                }
                              >
                                ₦{assembly.totalIncome.toLocaleString()}
                              </Text>
                            </div>
                            <div className="text-right">
                              <Text strong className="block">
                                Attendance
                              </Text>
                              <Text>{assembly.totalAttendance}</Text>
                            </div>
                          </div>
                        </div>
                      }
                    >
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <Row gutter={[16, 16]}>
                          <Col xs={24} md={8}>
                            <Card size="small" className="text-center">
                              <Text type="secondary" className="block">
                                Total Records
                              </Text>
                              <Title level={4} className="!my-2">
                                {assembly.totalRecords}
                              </Title>
                            </Card>
                          </Col>
                          <Col xs={24} md={8}>
                            <Card size="small" className="text-center">
                              <Text type="secondary" className="block">
                                Total Tithes
                              </Text>
                              <Title level={4} className="!my-2">
                                ₦{assembly.totalTithes.toLocaleString()}
                              </Title>
                            </Card>
                          </Col>
                          <Col xs={24} md={8}>
                            <Card size="small" className="text-center">
                              <Text type="secondary" className="block">
                                Average Per Record
                              </Text>
                              <Title level={4} className="!my-2">
                                ₦
                                {assembly.totalRecords > 0
                                  ? Math.round(
                                      assembly.totalIncome /
                                        assembly.totalRecords
                                    ).toLocaleString()
                                  : "0"}
                              </Title>
                            </Card>
                          </Col>
                        </Row>

                        {hasOfferings && (
                          <>
                            <Text strong className="block mt-6 mb-3">
                              Offerings Breakdown
                            </Text>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                              {Object.entries(offerings).map(
                                ([key, value]: [string, unknown]) => {
                                  const numValue = Number(value);
                                  if (numValue === 0) return null;

                                  const categoryNames: Record<string, string> =
                                    {
                                      tithes: "Tithes",
                                      offerings: "Regular Offerings",
                                      specialOfferings: "Special Offerings",
                                      pastorsWarfare: "Pastors Welfare",
                                      thanksgiving: "Thanksgiving",
                                      etf: "ETF",
                                      districtSupport: "District Support",
                                    };

                                  return (
                                    <Card
                                      key={key}
                                      size="small"
                                      className="text-center hover:shadow-md transition-shadow"
                                    >
                                      <div className="text-xs text-gray-500 font-medium">
                                        {categoryNames[key] ||
                                          key.replace(/([A-Z])/g, " $1").trim()}
                                      </div>
                                      <div className="font-bold text-lg mt-1">
                                        ₦{numValue.toLocaleString()}
                                      </div>
                                      <div className="text-xs text-gray-400 mt-1">
                                        {(
                                          (numValue / assembly.totalIncome) *
                                          100
                                        ).toFixed(1)}
                                        % of total
                                      </div>
                                    </Card>
                                  );
                                }
                              )}
                            </div>
                          </>
                        )}

                        {!hasOfferings && !isInactive && (
                          <div className="text-center py-4 text-gray-500">
                            No detailed offerings breakdown available
                          </div>
                        )}

                        {isInactive && (
                          <div className="text-center py-6 bg-red-50 rounded-lg mt-4">
                            <div className="text-red-600 font-medium mb-2">
                              ⚠️ No Activity Reported
                            </div>
                            <Text type="secondary" className="text-sm">
                              This assembly has reported no income, attendance,
                              or tithes for this period. Requires pastoral
                              follow-up.
                            </Text>
                          </div>
                        )}
                      </div>
                    </Panel>
                  );
                })}
              </Collapse>
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
              <Button type="primary" size="large" onClick={generate}>
                Generate AI Report
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
