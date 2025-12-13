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
  CalculatorOutlined,
  PieChartOutlined,
  BulbOutlined,
  CalendarOutlined,
  BankOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  BarChartOutlined as BarChart,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// Updated type to include new attendance metrics
type ComparisonRow = {
  assembly: string;
  current: {
    totalIncome: number;
    totalAttendance: number;
    totalAttendanceRaw: number;
    totalAttendanceDB: number;
    estimatedTotalOverlap: number;
    attendanceCorrectionPct: number;
    attendanceType: string;
    totalTithes: number;
    totalRecords: number;
    incomePerAttendee: number;
    tithesPerAttendee: number;
    serviceBreakdown: any;
  };
  prev1: {
    month?: string | null;
    totalIncome: number;
    totalTithes: number;
    totalAttendance: number;
  };
  prev2: {
    month?: string | null;
    totalIncome: number;
    totalTithes: number;
    totalAttendance: number;
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

  // Calculate per attendee metrics - use corrected attendance
  const perAttendeeMetrics = districtTotals
    ? {
        incomePerAttendee: Math.round(
          districtTotals.totalIncome / (districtTotals.totalAttendance || 1)
        ),
        tithesPerAttendee: Math.round(
          districtTotals.totalTithes / (districtTotals.totalAttendance || 1)
        ),
      }
    : null;

  // Main table columns - updated with attendance metrics
  const columns: ColumnsType<any> = [
    {
      title: "Assembly",
      dataIndex: "assembly",
      key: "assembly",
      fixed: "left",
      width: 130,
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
      width: 140,
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
      key: "attendance",
      width: 180,
      render: (_, record) => {
        const corrected = record.current.totalAttendance || 0;
        const raw = record.current.totalAttendanceRaw || 0;
        const db = record.current.totalAttendanceDB || 0;
        const correctionPct = record.current.attendanceCorrectionPct || 0;
        const isCorrected =
          record.current.attendanceType === "estimated" ||
          record.current.attendanceType === "actual";

        return (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-1">
              <TeamOutlined className="text-blue-500" />
              <Tooltip
                title={`Corrected/Unique: ${corrected} (not double-counted)`}
              >
                <span className="font-medium text-blue-700">
                  {corrected.toLocaleString()}
                </span>
              </Tooltip>
            </div>
            <div className="text-xs space-y-0.5">
              <div className="text-gray-500">
                <EyeOutlined className="mr-1" />
                Raw: {raw.toLocaleString()}
              </div>
              {correctionPct > 0 && (
                <div className="text-red-500">
                  <InfoCircleOutlined className="mr-1" />-{correctionPct}%
                  overlap
                </div>
              )}
            </div>
          </div>
        );
      },
      sorter: (a, b) => a.current.totalAttendance - b.current.totalAttendance,
    },
    {
      title: (
        <Tooltip title="Corrected attendance (avoiding double-counting)">
          <span>
            Unique Attendees <InfoCircleOutlined className="ml-1" />
          </span>
        </Tooltip>
      ),
      dataIndex: ["current", "totalAttendance"],
      key: "uniqueAttendance",
      width: 120,
      render: (v: number, record) => (
        <div className="flex items-center">
          <div
            className={`font-semibold ${
              v === 0 ? "text-gray-400" : "text-blue-700"
            }`}
          >
            {v.toLocaleString()}
          </div>
          {record.current.attendanceType === "estimated" && v > 0 && (
            <Tooltip title="Estimated (not actual count)">
              <Tag color="orange" className="ml-1">
                est.
              </Tag>
            </Tooltip>
          )}
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
      width: 140,
      render: (_, record) => {
        const income = record.current.totalIncome || 0;
        const attendance = record.current.totalAttendance || 0;
        if (income === 0 || attendance === 0)
          return <span className="text-gray-400">-</span>;
        const perPerson = Math.round(income / attendance);
        return (
          <div className="flex flex-col">
            <div className="font-medium text-gray-700">
              ₦{perPerson.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Corrected</div>
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

  // Attendance breakdown columns
  const attendanceColumns: ColumnsType<any> = [
    {
      title: "Assembly",
      dataIndex: "assembly",
      key: "assembly",
      fixed: "left",
      width: 120,
      render: (text) => <div className="font-semibold">{text}</div>,
    },
    {
      title: (
        <Tooltip title="Corrected unique attendance (no double-counting)">
          <span>
            Unique <InfoCircleOutlined />
          </span>
        </Tooltip>
      ),
      dataIndex: "totalAttendance",
      key: "unique",
      width: 100,
      render: (v: number, record) => (
        <div className="flex items-center">
          <div
            className={`font-semibold ${
              v === 0 ? "text-gray-400" : "text-green-600"
            }`}
          >
            {v.toLocaleString()}
          </div>
          {record.attendanceType === "estimated" && v > 0 && (
            <Tag color="orange" className="ml-1">
              est.
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: (
        <Tooltip title="Raw sum (attendance + sbsAttendance)">
          <span>
            Raw <InfoCircleOutlined />
          </span>
        </Tooltip>
      ),
      dataIndex: "totalAttendanceRaw",
      key: "raw",
      width: 100,
      render: (v: number) => (
        <div
          className={`font-medium ${
            v === 0 ? "text-gray-400" : "text-blue-600"
          }`}
        >
          {v.toLocaleString()}
        </div>
      ),
    },
    {
      title: "DB Value",
      dataIndex: "totalAttendanceDB",
      key: "db",
      width: 100,
      render: (v: number) => (
        <div
          className={`font-medium ${
            v === 0 ? "text-gray-400" : "text-purple-600"
          }`}
        >
          {v.toLocaleString()}
        </div>
      ),
    },
    {
      title: (
        <Tooltip title="Estimated people attending both SBS and service">
          <span>
            Overlap <InfoCircleOutlined />
          </span>
        </Tooltip>
      ),
      dataIndex: "estimatedTotalOverlap",
      key: "overlap",
      width: 100,
      render: (v: number) => (
        <div
          className={`font-medium ${
            v === 0 ? "text-gray-400" : "text-red-500"
          }`}
        >
          {v.toLocaleString()}
        </div>
      ),
    },
    {
      title: "% Correction",
      dataIndex: "attendanceCorrectionPct",
      key: "correction",
      width: 100,
      render: (v: number) => (
        <div className="flex items-center">
          <Tag color={v > 0 ? "red" : "green"} className="font-medium">
            {v > 0 ? `-${v}%` : "0%"}
          </Tag>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "attendanceType",
      key: "type",
      width: 100,
      render: (v: string) => (
        <Tag color={v === "actual" ? "green" : "orange"} className="capitalize">
          {v || "estimated"}
        </Tag>
      ),
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
        filename: `Financial-Report-${
          value?.format("MMMM-YYYY") || "report"
        }.pdf`,
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

  // Get assemblies with attendance data
  const assembliesWithAttendance = rawAggregated.filter(
    (a) => a.totalAttendance > 0
  );

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
              <Paragraph className="text-gray-700 text-sm leading-relaxed mb-4">
                In {value?.format("MMMM YYYY")}, the district's combined
                financial performance shows{" "}
                {districtTotals.totalIncome ? "strong" : "moderate"} results.
                Using <strong>corrected attendance figures</strong> (avoiding
                double-counting), we have a more accurate picture of ministry
                reach.
              </Paragraph>

              <Alert
                message="Attendance Correction Applied"
                description={
                  <div>
                    <p>
                      Old method: {districtTotals.totalAttendanceRaw}{" "}
                      (double-counted)
                    </p>
                    <p>
                      New method: {districtTotals.totalAttendance} (corrected
                      unique)
                    </p>
                    <p>
                      Correction:{" "}
                      <strong>
                        -{districtTotals.attendanceCorrectionPct || 0}%
                      </strong>{" "}
                      ({districtTotals.attendanceCorrection || 0} fewer
                      duplicates)
                    </p>
                  </div>
                }
                type="info"
                showIcon
                className="mb-4"
              />
            </div>
          </div>
        </Card>

        {/* 2. District Totals Overview with Attendance Correction */}
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
                Using corrected attendance to avoid double-counting
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
                <div className="mb-2">
                  <Tooltip title="Corrected unique attendance (not double-counted)">
                    <Text strong className="text-gray-700">
                      Attendance (Corrected)
                    </Text>
                  </Tooltip>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {districtTotals.totalAttendance?.toLocaleString() || "0"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Raw:{" "}
                  {districtTotals.totalAttendanceRaw?.toLocaleString() || "0"}{" "}
                  (-{districtTotals.attendanceCorrectionPct || 0}%)
                </div>
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
                        {perAttendeeMetrics?.incomePerAttendee.toLocaleString() ||
                          "0"}
                      </Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text>Tithes/Attendee:</Text>
                      <Text strong className="text-purple-600">
                        ₦
                        {perAttendeeMetrics?.tithesPerAttendee.toLocaleString() ||
                          "0"}
                      </Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text>Data Type:</Text>
                      <Tag
                        color={
                          districtTotals.assembliesWithActualData > 0
                            ? "green"
                            : "orange"
                        }
                      >
                        {districtTotals.assembliesWithActualData > 0
                          ? "Actual"
                          : "Estimated"}
                      </Tag>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Attendance Correction Summary */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <Title level={4} className="!mb-4 flex items-center gap-2">
              <InfoCircleOutlined /> Attendance Correction Summary
            </Title>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700 mb-2">
                    {districtTotals.estimatedTotalOverlap?.toLocaleString() ||
                      "0"}
                  </div>
                  <div className="text-gray-600">
                    Estimated People Attending Both
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    (SBS + Main Service)
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700 mb-2">
                    {districtTotals.totalAttendance?.toLocaleString() || "0"}
                  </div>
                  <div className="text-gray-600">Actual Unique People</div>
                  <div className="text-sm text-gray-500 mt-1">
                    (Corrected count)
                  </div>
                </div>
              </Col>
            </Row>
            <Divider />
            <Alert
              message="Why this matters"
              description="The same people often attend both Sunday School (SBS) and the main service. Previously, these individuals were counted twice. Now we use 'uniqueAttendance' which estimates actual unique attendees, giving a more accurate picture of ministry reach."
              type="info"
              showIcon
            />
          </div>
        </Card>

        {/* 3. Attendance Breakdown Table */}
        <Card className="mb-6 border-0 shadow-lg" id="attendance-breakdown">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <TeamOutlined className="text-green-600 text-2xl" />
            </div>
            <div>
              <Title level={2} className="!mb-3 text-gray-800">
                Attendance Breakdown
              </Title>
              <Text type="secondary" className="text-base">
                Showing corrected vs raw attendance figures
              </Text>
            </div>
          </div>

          <Alert
            message="Attendance Data Types"
            description={
              <div className="space-y-2">
                <div>
                  <Tag color="green">Actual</Tag> - Direct count of unique
                  attendees (when "attendedBoth" is collected)
                </div>
                <div>
                  <Tag color="orange">Estimated</Tag> - Calculated estimate (75%
                  overlap between SBS and service)
                </div>
                <div>
                  <strong>Correction %</strong> shows how much attendance was
                  reduced to avoid double-counting
                </div>
              </div>
            }
            type="info"
            showIcon
            className="mb-6"
          />

          <div className="overflow-x-auto">
            <Table
              columns={attendanceColumns}
              dataSource={assembliesWithAttendance}
              rowKey="assembly"
              pagination={false}
              bordered
              size="middle"
              scroll={{ x: 800 }}
              summary={() => (
                <Table.Summary.Row className="bg-gray-50">
                  <Table.Summary.Cell index={0}>
                    <Text strong>District Totals</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong className="text-green-600">
                      {districtTotals.totalAttendance?.toLocaleString() || "0"}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Text strong className="text-blue-600">
                      {districtTotals.totalAttendanceRaw?.toLocaleString() ||
                        "0"}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Text strong className="text-purple-600">
                      {districtTotals.totalAttendanceDB?.toLocaleString() ||
                        "0"}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <Text strong className="text-red-500">
                      {districtTotals.estimatedTotalOverlap?.toLocaleString() ||
                        "0"}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <Tag color="red" className="font-medium">
                      -{districtTotals.attendanceCorrectionPct || 0}%
                    </Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6}>
                    <Tag
                      color={
                        districtTotals.assembliesWithActualData > 0
                          ? "green"
                          : "orange"
                      }
                    >
                      {districtTotals.assembliesWithActualData > 0
                        ? "Mixed"
                        : "All Estimated"}
                    </Tag>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>
        </Card>

        {/* 4. Assembly Performance Table (Main) */}
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
                Using corrected attendance figures (not double-counted)
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
                      ₦{districtTotals.totalIncome?.toLocaleString() || "0"}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Tooltip
                      title={`Unique: ${
                        districtTotals.totalAttendance || 0
                      }, Raw: ${districtTotals.totalAttendanceRaw || 0}`}
                    >
                      <Text strong>
                        {districtTotals.totalAttendance?.toLocaleString() ||
                          "0"}
                      </Text>
                    </Tooltip>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Text strong>
                      {districtTotals.totalAttendance?.toLocaleString() || "0"}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <Text strong>
                      ₦{districtTotals.totalTithes?.toLocaleString() || "0"}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <Text strong>
                      ₦
                      {perAttendeeMetrics?.incomePerAttendee.toLocaleString() ||
                        "0"}
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
                          (comparisons.filter((c) => c.current.totalIncome > 0)
                            .length || 1)) *
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

        {/* 5. Special Offerings Breakdown */}
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
        </Card>

        {/* 6. Top & Bottom Performers */}
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
                  Based on corrected attendance and income
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
                        <div className="flex items-center gap-2">
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
                          <Tooltip
                            title={`Attendance: ${assembly.current.totalAttendance} (corrected)`}
                          >
                            <Tag color="blue">
                              {assembly.current.totalAttendance} unique
                            </Tag>
                          </Tooltip>
                        </div>
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
                      <div className="text-sm text-gray-500">
                        Unique Attendees
                      </div>
                      <div className="text-lg font-bold text-blue-700">
                        {assembly.current.totalAttendance}
                      </div>
                      {assembly.current.attendanceCorrectionPct > 0 && (
                        <div className="text-xs text-red-500">
                          -{assembly.current.attendanceCorrectionPct}% overlap
                        </div>
                      )}
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
                    No financial or attendance data reported.
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
                        <div className="flex items-center gap-2">
                          <Tag
                            color="orange"
                            icon={<ExclamationCircleOutlined />}
                          >
                            Low Performance
                          </Tag>
                          <Tooltip
                            title={`Attendance: ${assembly.current.totalAttendance} (corrected)`}
                          >
                            <Tag color="blue"x>
                              {assembly.current.totalAttendance} unique
                            </Tag>
                          </Tooltip>
                        </div>
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
                      <div className="text-sm text-gray-500">
                        Unique Attendees
                      </div>
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

        {/* 7. Trend Analysis */}
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
                Using corrected attendance figures for accurate comparison
              </Text>
            </div>
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
                      <Tooltip
                        title={`Corrected attendance: ${assembly.current.totalAttendance}`}
                      >
                        <Tag color="blue">
                          {assembly.current.totalAttendance} unique
                        </Tag>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      Attendance Trend
                    </div>
                    <div
                      className={`font-bold ${
                        assembly.change.attendanceVsPrev1 >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {assembly.change.attendanceVsPrev1 >= 0 ? "+" : ""}
                      {assembly.change.attendanceVsPrev1}%
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </>
    );
  };

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
              Financial Reporting System with Corrected Attendance Metrics
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
                {/* <p className="text-sm">
                  Now with corrected attendance metrics (avoiding
                  double-counting)
                </p> */}
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
                Ready to Generate Enhanced AI Report
              </Title>
              {/* <Paragraph type="secondary" className="text-lg mb-6">
                <Alert
                  message="Important Notice"
                  description="Reports now use corrected attendance figures to avoid double-counting. The same people often attend both Sunday School and main service, so we estimate unique attendees for accuracy."
                  type="info"
                  showIcon
                  className="mb-4"
                />
              </Paragraph> */}
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
                  Calculating corrected attendance metrics (avoiding
                  double-counting)...
                </Text>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
