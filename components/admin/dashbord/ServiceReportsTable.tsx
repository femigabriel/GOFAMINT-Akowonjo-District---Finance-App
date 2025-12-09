// components/admin/ServiceReportsTable.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Modal,
  Input,
  Select,
  DatePicker,
  Statistic,
  Row,
  Col,
  Space,
  Dropdown,
  message,
  Tooltip,
  Avatar,
  Badge,
  Typography,
  Grid,
  Descriptions,
  Tabs,
  Radio,
  notification,
  Spin,
  Alert,
  Divider,
  Progress,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  TeamOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CoffeeOutlined,
  StarOutlined,
  BankOutlined,
  EnvironmentOutlined,
  LoadingOutlined,
  RobotOutlined,
  BulbOutlined,
  RiseOutlined,
  PieChartOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { Church } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import { generateAIFinancialReport } from "@/utils/ai-report-generator";

const { Text, Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { useBreakpoint } = Grid;
const { Group: RadioGroup, Button: RadioButton } = Radio;

// ==================== INTERFACE DEFINITIONS ====================
interface SundayRecord {
  id: string;
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
}

interface MidweekRecord {
  id: string;
  date: string;
  day: "tuesday" | "thursday";
  attendance: number;
  offering: number;
  total: number;
}

interface SpecialRecord {
  id: string;
  serviceName: string;
  date: string;
  attendance: number;
  offering: number;
  total: number;
}

interface BaseReport {
  id: string;
  assembly: string;
  month: string;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
  serviceType: "sunday" | "midweek" | "special";
  records: any[];
  totalIncome: number;
  totalAttendance: number;
  averagePerRecord: number;
}

interface SundayReport extends BaseReport {
  records: SundayRecord[];
  weekCount: number;
  tithesTotal: number;
}

interface MidweekReport extends BaseReport {
  records: MidweekRecord[];
  dayCount: number;
}

interface SpecialReport extends BaseReport {
  records: SpecialRecord[];
  eventCount: number;
}

type ExtendedReport = SundayReport | MidweekReport | SpecialReport;

interface ReportsResponse {
  success: boolean;
  data: {
    reports: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    summary: {
      totalReports: number;
      totalRecords: number;
      totalAssemblies: number;
      sundayReports: number;
      midweekReports: number;
      specialReports: number;
      totalIncome: number;
      sundayIncome: number;
      midweekIncome: number;
      specialIncome: number;
      sundayTithes: number;
      totalAttendance: number;
      sundayAttendance: number;
      midweekAttendance: number;
      specialAttendance: number;
    };
  };
}

// ==================== AI REPORT MODAL COMPONENT ====================
interface AIReportModalProps {
  visible: boolean;
  loading: boolean;
  report: any;
  onClose: () => void;
  onExport: (report: any) => void;
}

const AIReportModal: React.FC<AIReportModalProps> = ({
  visible,
  loading,
  report,
  onClose,
  onExport,
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <RobotOutlined className="text-white text-lg" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              AI Financial Analysis Report
            </h2>
            <p className="text-sm text-gray-500">
              Powered by advanced analytics and insights
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={isMobile ? "95%" : "90%"}
      style={{ maxWidth: 1200 }}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="export"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => report && onExport(report)}
          disabled={!report}
        >
          Export Report
        </Button>,
      ]}
      className="ai-report-modal"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
            size="large"
          />
          <div className="mt-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Generating AI Report
            </h3>
            <p className="text-gray-600 max-w-md">
              Our AI is analyzing financial patterns and generating insights...
            </p>
            <Progress
              percent={75}
              status="active"
              strokeColor={{
                "0%": "#108ee9",
                "100%": "#87d068",
              }}
              className="mt-6 max-w-md"
            />
          </div>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card
            className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50"
            size="small"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BulbOutlined className="text-blue-600 text-xl" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  Executive Summary
                </h4>
                <div className="whitespace-pre-line text-gray-700 bg-white p-4 rounded-lg">
                  {report.executive_summary}
                </div>
              </div>
            </div>
          </Card>

          <Row gutter={[16, 16]}>
            {/* Key Findings */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <RiseOutlined className="text-green-600" />
                    <span>Key Findings</span>
                  </div>
                }
                className="h-full border-0 shadow-sm"
                size="small"
              >
                <ul className="space-y-3">
                  {report.key_findings.map((finding: string, index: number) => (
                    <li
                      key={index}
                      className="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-gray-700">{finding}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </Col>

            {/* Recommendations */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <PieChartOutlined className="text-purple-600" />
                    <span>Recommendations</span>
                  </div>
                }
                className="h-full border-0 shadow-sm"
                size="small"
              >
                <ul className="space-y-3">
                  {report.recommendations.map(
                    (recommendation: string, index: number) => (
                      <li
                        key={index}
                        className="flex items-start p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <ArrowRightOutlined className="text-xs" />
                        </div>
                        <span className="text-gray-700">{recommendation}</span>
                      </li>
                    )
                  )}
                </ul>
              </Card>
            </Col>
          </Row>

          {/* Financial Analysis */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <DollarOutlined className="text-orange-600" />
                <span>Financial Analysis</span>
              </div>
            }
            className="border-0 shadow-sm"
            size="small"
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">
                    Revenue Trends
                  </h5>
                  <p className="text-gray-700">
                    {report.financial_analysis.revenue_trends}
                  </p>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">
                    Attendance Patterns
                  </h5>
                  <p className="text-gray-700">
                    {report.financial_analysis.attendance_patterns}
                  </p>
                </div>
              </Col>
              <Col xs={24}>
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">
                    Collection Efficiency
                  </h5>
                  <p className="text-gray-700">
                    {report.financial_analysis.collection_efficiency}
                  </p>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Full Report */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <FileTextOutlined className="text-gray-600" />
                <span>Complete Financial Report</span>
              </div>
            }
            className="border-0 shadow-sm"
            size="small"
          >
            <Alert
              message="Detailed Analysis"
              description="This section contains the complete AI-generated financial report with comprehensive analysis."
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              className="mb-4"
            />
            <div className="whitespace-pre-line font-sans text-sm bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              {report.formatted_report}
            </div>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <RobotOutlined className="text-3xl text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No AI Report Generated
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Generate an AI financial analysis report to get insights and
            recommendations.
          </p>
        </div>
      )}
    </Modal>
  );
};

// ==================== MAIN COMPONENT ====================
export default function ServiceReportsTable() {
  const [reports, setReports] = useState<ExtendedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedReport, setSelectedReport] = useState<ExtendedReport | null>(
    null
  );
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all");
  const [filters, setFilters] = useState({
    assembly: "",
    month: "",
    year: "",
    search: "",
    dateRange: null as any,
    sortBy: "date",
    sortOrder: "desc" as "asc" | "desc",
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [aiReportModalVisible, setAiReportModalVisible] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);

  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const tableRef = useRef<HTMLDivElement>(null);

  const [assemblies, setAssemblies] = useState<string[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);

  useEffect(() => {
    fetchReports();
    fetchFilterOptions();
  }, [pagination.page, pagination.pageSize, filters, serviceTypeFilter]);

  const fetchFilterOptions = async () => {
    try {
      const assembliesData = [
        "Liberty",
        "Jubilee",
        "RayPower",
        "Victory",
        "Grace",
        "Mercy",
      ];
      const monthsData = [
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
      const yearsData = ["2024", "2025", "2026"];

      setAssemblies(assembliesData);
      setMonths(monthsData);
      setYears(yearsData);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.pageSize.toString(),
        ...(filters.assembly && { assembly: filters.assembly }),
        ...(filters.month && { month: filters.month }),
        ...(filters.year && { year: filters.year }),
        ...(filters.search && { search: filters.search }),
        serviceType: serviceTypeFilter,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      if (filters.dateRange) {
        params.append("startDate", filters.dateRange[0].format("YYYY-MM-DD"));
        params.append("endDate", filters.dateRange[1].format("YYYY-MM-DD"));
      }

      const response = await fetch(`/api/admin/reports/detailed?${params}`);
      const result: ReportsResponse = await response.json();

      if (result.success) {
        const extendedReports: ExtendedReport[] = result.data.reports.map(
          (report) => {
            const commonData: BaseReport = {
              ...report,
              totalIncome: report.records.reduce(
                (sum: number, record: any) => sum + (record.total || 0),
                0
              ),
              totalAttendance: report.records.reduce(
                (sum: number, record: any) =>
                  sum + (record.attendance || record.totalAttendance || 0),
                0
              ),
              averagePerRecord:
                report.records.length > 0
                  ? report.records.reduce(
                      (sum: number, record: any) => sum + (record.total || 0),
                      0
                    ) / report.records.length
                  : 0,
            };

            switch (report.serviceType) {
              case "sunday":
                return {
                  ...commonData,
                  weekCount: report.records.length,
                  tithesTotal: report.records.reduce(
                    (sum: number, record: any) => sum + (record.tithes || 0),
                    0
                  ),
                } as SundayReport;
              case "midweek":
                return {
                  ...commonData,
                  dayCount: report.records.length,
                } as MidweekReport;
              case "special":
                return {
                  ...commonData,
                  eventCount: report.records.length,
                } as SpecialReport;
              default:
                return commonData as ExtendedReport;
            }
          }
        );

        setReports(extendedReports);
        setPagination((prev) => ({
          ...prev,
          total: result.data.pagination.total,
        }));
      } else {
        message.error("Failed to fetch reports");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      message.error("Error loading reports");
    } finally {
      setLoading(false);
    }
  };

  // ==================== AI REPORT FUNCTIONS ====================
  const generateAIReport = async () => {
    setAiReportLoading(true);
    try {
      // Group reports by assembly
      const assemblyReports = reports.reduce((acc, report) => {
        if (!acc[report.assembly]) {
          acc[report.assembly] = [];
        }
        acc[report.assembly].push(report);
        return acc;
      }, {} as Record<string, ExtendedReport[]>);

      // Calculate assembly-level statistics
      const assemblyStats = Object.entries(assemblyReports).map(
        ([assemblyName, assemblyReports]) => {
          const totalIncome = assemblyReports.reduce(
            (sum, r) => sum + r.totalIncome,
            0
          );
          const totalAttendance = assemblyReports.reduce(
            (sum, r) => sum + r.totalAttendance,
            0
          );
          const sundayReports = assemblyReports.filter(
            (r) => r.serviceType === "sunday"
          ).length;
          const midweekReports = assemblyReports.filter(
            (r) => r.serviceType === "midweek"
          ).length;
          const specialReports = assemblyReports.filter(
            (r) => r.serviceType === "special"
          ).length;

          return {
            assembly: assemblyName,
            totalIncome,
            totalAttendance,
            reportCount: assemblyReports.length,
            averageIncome: totalIncome / assemblyReports.length,
            averageAttendance: totalAttendance / assemblyReports.length,
            breakdown: {
              sunday: {
                income: assemblyReports
                  .filter((r) => r.serviceType === "sunday")
                  .reduce((sum, r) => sum + r.totalIncome, 0),
                attendance: assemblyReports
                  .filter((r) => r.serviceType === "sunday")
                  .reduce((sum, r) => sum + r.totalAttendance, 0),
                reports: sundayReports,
              },
              midweek: {
                income: assemblyReports
                  .filter((r) => r.serviceType === "midweek")
                  .reduce((sum, r) => sum + r.totalIncome, 0),
                attendance: assemblyReports
                  .filter((r) => r.serviceType === "midweek")
                  .reduce((sum, r) => sum + r.totalAttendance, 0),
                reports: midweekReports,
              },
              special: {
                income: assemblyReports
                  .filter((r) => r.serviceType === "special")
                  .reduce((sum, r) => sum + r.totalIncome, 0),
                attendance: assemblyReports
                  .filter((r) => r.serviceType === "special")
                  .reduce((sum, r) => sum + r.totalAttendance, 0),
                reports: specialReports,
              },
            },
          };
        }
      );

      // Get summary data
      const summary = {
        totalIncome: reports.reduce((sum, r) => sum + r.totalIncome, 0),
        totalAttendance: reports.reduce((sum, r) => sum + r.totalAttendance, 0),
        sundayReports: reports.filter((r) => r.serviceType === "sunday").length,
        midweekReports: reports.filter((r) => r.serviceType === "midweek")
          .length,
        specialReports: reports.filter((r) => r.serviceType === "special")
          .length,
        sundayIncome: reports
          .filter((r) => r.serviceType === "sunday")
          .reduce((sum, r) => sum + r.totalIncome, 0),
        midweekIncome: reports
          .filter((r) => r.serviceType === "midweek")
          .reduce((sum, r) => sum + r.totalIncome, 0),
        specialIncome: reports
          .filter((r) => r.serviceType === "special")
          .reduce((sum, r) => sum + r.totalIncome, 0),
        sundayTithes: reports
          .filter((r) => r.serviceType === "sunday")
          .reduce((sum: number, r: any) => sum + (r.tithesTotal || 0), 0),
        sundayAttendance: reports
          .filter((r) => r.serviceType === "sunday")
          .reduce((sum, r) => sum + r.totalAttendance, 0),
        midweekAttendance: reports
          .filter((r) => r.serviceType === "midweek")
          .reduce((sum, r) => sum + r.totalAttendance, 0),
        specialAttendance: reports
          .filter((r) => r.serviceType === "special")
          .reduce((sum, r) => sum + r.totalAttendance, 0),
      };

      const result = await generateAIFinancialReport({
        reports: reports.slice(0, 10), // Send first 10 reports for analysis
        summary,
        serviceType: serviceTypeFilter,
        assembly: filters.assembly || undefined,
        month: filters.month || undefined,
        year: filters.year || undefined,
      });

      setAiReport(result.data);
      setAiReportModalVisible(true);
      notification.success({
        message: "AI Report Generated",
        description:
          "Professional financial analysis report with assembly details created successfully",
      });
    } catch (error) {
      console.error("Error generating AI report:", error);
      notification.error({
        message: "AI Report Failed",
        description: "Failed to generate AI-powered financial report",
      });
    } finally {
      setAiReportLoading(false);
    }
  };

  const exportAIReportAsPDF = (report: any) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;

      // Header
      doc.setFillColor(41, 128, 185);
      doc.roundedRect(margin, margin, pageWidth - margin * 2, 25, 3, 3, "F");

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("AI FINANCIAL ANALYSIS REPORT", pageWidth / 2, margin + 10, {
        align: "center",
      });

      doc.setFontSize(12);
      doc.text("GOFAMINT AKOWONJO DISTRICT", pageWidth / 2, margin + 18, {
        align: "center",
      });

      // Executive Summary
      let yPos = margin + 35;
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("EXECUTIVE SUMMARY", margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const execSummaryLines = doc.splitTextToSize(
        report.executive_summary,
        pageWidth - margin * 2
      );
      doc.text(execSummaryLines, margin, yPos);
      yPos += execSummaryLines.length * 5 + 10;

      // Key Findings
      if (yPos > 250) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("KEY FINDINGS", margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      report.key_findings.forEach((finding: string, index: number) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(`${index + 1}. ${finding}`, margin + 5, yPos);
        yPos += 6;
      });

      yPos += 5;

      // Recommendations
      if (yPos > 250) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("RECOMMENDATIONS", margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      report.recommendations.forEach((rec: string, index: number) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(`${index + 1}. ${rec}`, margin + 5, yPos);
        yPos += 6;
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Generated: ${dayjs().format("DD/MM/YYYY HH:mm")}`,
          margin,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - margin - 10,
          doc.internal.pageSize.height - 10,
          { align: "right" }
        );
      }

      doc.save(
        `GOFAMINT_AI_Analysis_Report_${dayjs().format("YYYY_MM_DD")}.pdf`
      );

      notification.success({
        message: "AI Report Exported",
        description: "AI analysis report downloaded as PDF",
      });
    } catch (error) {
      console.error("Error exporting AI report:", error);
      notification.error({
        message: "Export Failed",
        description: "Failed to export AI report",
      });
    }
  };

  // ==================== EXPORT FUNCTIONS ====================
  const exportToExcel = () => {
    try {
      if (reports.length === 0) {
        notification.warning({
          message: "No Data to Export",
          description: "There are no service reports to export",
        });
        return;
      }

      // ... existing exportToExcel function code ...
    } catch (error) {
      console.error("Excel export error:", error);
      notification.error({
        message: "Excel Export Failed",
        description: "Failed to export Excel file",
      });
    }
  };

  const exportSingleReportPDF = (report: ExtendedReport) => {
    // ... existing exportSingleReportPDF function code ...
  };

  const exportAllReportsPDF = () => {
    // ... existing exportAllReportsPDF function code ...
  };

  // ==================== HELPER FUNCTIONS ====================
  const getServiceTypeIcon = (serviceType: string): JSX.Element => {
    switch (serviceType) {
      case "sunday":
        return <CalendarOutlined className="text-blue-500" />;
      case "midweek":
        return <CoffeeOutlined className="text-green-500" />;
      case "special":
        return <StarOutlined className="text-purple-500" />;
      default:
        return <CalendarOutlined className="text-gray-500" />;
    }
  };

  const getServiceTypeColor = (serviceType: string): string => {
    switch (serviceType) {
      case "sunday":
        return "blue";
      case "midweek":
        return "green";
      case "special":
        return "purple";
      default:
        return "default";
    }
  };

  const getStatusColor = (report: ExtendedReport): string => {
    const daysSinceUpdate = dayjs().diff(dayjs(report.updatedAt), "days");
    if (daysSinceUpdate > 30) return "error";
    if (daysSinceUpdate > 7) return "warning";
    return "success";
  };

  const getStatusText = (report: ExtendedReport): string => {
    const daysSinceUpdate = dayjs().diff(dayjs(report.updatedAt), "days");
    if (daysSinceUpdate > 30) return "Outdated";
    if (daysSinceUpdate > 7) return "Needs Review";
    return "Up to Date";
  };

  const showReportDetails = (report: ExtendedReport): void => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

  // ==================== COLUMNS DEFINITION ====================
  const columns: ColumnsType<ExtendedReport> = [
    {
      title: "Assembly",
      dataIndex: "assembly",
      key: "assembly",
      width: isMobile ? 120 : 150,
      fixed: isMobile ? false : "left",
      render: (assembly: string, record: ExtendedReport) => (
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              record.serviceType === "sunday"
                ? "bg-blue-100"
                : record.serviceType === "midweek"
                ? "bg-green-100"
                : "bg-purple-100"
            }`}
          >
            <Church
              size={16}
              className={
                record.serviceType === "sunday"
                  ? "text-blue-600"
                  : record.serviceType === "midweek"
                  ? "text-green-600"
                  : "text-purple-600"
              }
            />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">
              {assembly}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Tag
                color={getServiceTypeColor(record.serviceType)}
                className="text-xs"
              >
                {record.serviceType.slice(0, 1).toUpperCase()}
              </Tag>
              <div className="text-xs text-gray-500 truncate">
                {record.month}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    ...(isMobile
      ? []
      : [
          {
            title: "Service Type",
            dataIndex: "serviceType",
            key: "serviceType",
            width: 120,
            render: (serviceType: string) => (
              <div className="flex items-center gap-2">
                {getServiceTypeIcon(serviceType)}
                <span className="font-medium capitalize">{serviceType}</span>
              </div>
            ),
          } as ColumnsType<ExtendedReport>[0],
          {
            title: "Details",
            key: "details",
            width: 100,
            render: (_, record: ExtendedReport) => {
              let detailText = "";
              if (record.serviceType === "sunday") {
                detailText = `${(record as SundayReport).weekCount} w`;
              } else if (record.serviceType === "midweek") {
                detailText = `${(record as MidweekReport).dayCount} d`;
              } else {
                detailText = `${(record as SpecialReport).eventCount} e`;
              }
              return (
                <div className="text-center">
                  <div className="font-medium">{detailText}</div>
                  <div className="text-xs text-gray-500">
                    {record.records.length} rec
                  </div>
                </div>
              );
            },
          } as ColumnsType<ExtendedReport>[0],
        ]),
    {
      title: "Income",
      key: "totalIncome",
      width: isMobile ? 100 : 120,
      sorter: (a: ExtendedReport, b: ExtendedReport) =>
        a.totalIncome - b.totalIncome,
      render: (_, record: ExtendedReport) => (
        <div className="text-right">
          <div className="font-bold text-green-600">
            ₦{record.totalIncome.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            ₦{Math.round(record.averagePerRecord).toLocaleString()}/avg
          </div>
        </div>
      ),
    },
    {
      title: "Attendance",
      key: "attendance",
      width: isMobile ? 90 : 100,
      sorter: (a: ExtendedReport, b: ExtendedReport) =>
        a.totalAttendance - b.totalAttendance,
      render: (_, record: ExtendedReport) => (
        <div className="text-center">
          <TeamOutlined className="text-blue-500 mr-1" />
          <span className="font-semibold">
            {record.totalAttendance.toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: isMobile ? 90 : 100,
      render: (_, record: ExtendedReport) => {
        const statusColor = getStatusColor(record);
        const statusText = getStatusText(record);

        return (
          <Tooltip title={statusText}>
            <Badge
              color={
                statusColor === "error"
                  ? "red"
                  : statusColor === "warning"
                  ? "orange"
                  : "green"
              }
              text={
                <span className="text-xs">
                  {statusText === "Up to Date"
                    ? "Current"
                    : statusText.slice(0, 6)}
                </span>
              }
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      fixed: isMobile ? false : "right",
      render: (_, record: ExtendedReport) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showReportDetails(record)}
              size="small"
              className="text-blue-600 hover:text-blue-800"
            />
          </Tooltip>
          <Tooltip title="Export PDF">
            <Button
              type="text"
              icon={<FilePdfOutlined />}
              onClick={() => exportSingleReportPDF(record)}
              size="small"
              className="text-red-600 hover:text-red-800"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ==================== STATS CARDS ====================
  const renderStatsCards = () => {
    const summary = {
      sundayReports: reports.filter((r) => r.serviceType === "sunday").length,
      midweekReports: reports.filter((r) => r.serviceType === "midweek").length,
      specialReports: reports.filter((r) => r.serviceType === "special").length,
      totalIncome: reports.reduce((sum, r) => sum + r.totalIncome, 0),
      totalAttendance: reports.reduce((sum, r) => sum + r.totalAttendance, 0),
    };

    return (
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={12} sm={6}>
          <Card
            className="h-full border-0 shadow-sm hover:shadow-md transition-all duration-300"
            size="small"
            bodyStyle={{ padding: isMobile ? 12 : 16 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Sunday</div>
                <div className="text-xl font-bold text-blue-600 mt-1">
                  {summary.sundayReports}
                </div>
              </div>
              <CalendarOutlined className="text-blue-500 text-lg" />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            className="h-full border-0 shadow-sm hover:shadow-md transition-all duration-300"
            size="small"
            bodyStyle={{ padding: isMobile ? 12 : 16 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Midweek</div>
                <div className="text-xl font-bold text-green-600 mt-1">
                  {summary.midweekReports}
                </div>
              </div>
              <CoffeeOutlined className="text-green-500 text-lg" />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            className="h-full border-0 shadow-sm hover:shadow-md transition-all duration-300"
            size="small"
            bodyStyle={{ padding: isMobile ? 12 : 16 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Income</div>
                <div className="text-xl font-bold text-orange-600 mt-1">
                  ₦{(summary.totalIncome / 1000).toFixed(0)}K
                </div>
              </div>
              <DollarOutlined className="text-orange-500 text-lg" />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            className="h-full border-0 shadow-sm hover:shadow-md transition-all duration-300"
            size="small"
            bodyStyle={{ padding: isMobile ? 12 : 16 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Attendance</div>
                <div className="text-xl font-bold text-purple-600 mt-1">
                  {summary.totalAttendance.toFixed(0)}
                </div>
              </div>
              <TeamOutlined className="text-purple-500 text-lg" />
            </div>
          </Card>
        </Col>
      </Row>
    );
  };

  // ==================== EXPORT MENU ITEMS ====================
  const exportMenuItems: MenuProps["items"] = [
    {
      key: "excel",
      label: "Export All as Excel (CSV)",
      icon: <FileExcelOutlined />,
      onClick: exportToExcel,
    },
    {
      key: "pdf-all",
      label: "Export All as PDF Summary",
      icon: <FilePdfOutlined />,
      onClick: exportAllReportsPDF,
    },
  ];
  // Helper function to render records table based on report type
  const renderRecordsTable = (report: ExtendedReport) => {
    switch (report.serviceType) {
      case "sunday":
        const sundayReport = report as SundayReport;
        return (
          <Table
            columns={[
              { title: "Week", dataIndex: "week", key: "week" },
              {
                title: "Date",
                dataIndex: "date",
                key: "date",
                render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
              },
              {
                title: "Attendance",
                dataIndex: "totalAttendance",
                key: "totalAttendance",
              },
              {
                title: "Tithes",
                dataIndex: "tithes",
                key: "tithes",
                render: (value: number) => `₦${value.toLocaleString()}`,
              },
              {
                title: "Total",
                dataIndex: "total",
                key: "total",
                render: (value: number) => (
                  <span className="font-bold text-green-600">
                    ₦{value.toLocaleString()}
                  </span>
                ),
              },
            ]}
            dataSource={sundayReport.records}
            rowKey="id"
            pagination={false}
            size="small"
          />
        );

      case "midweek":
        const midweekReport = report as MidweekReport;
        return (
          <Table
            columns={[
              {
                title: "Day",
                dataIndex: "day",
                key: "day",
                render: (day: string) =>
                  day.charAt(0).toUpperCase() + day.slice(1),
              },
              {
                title: "Date",
                dataIndex: "date",
                key: "date",
                render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
              },
              {
                title: "Attendance",
                dataIndex: "attendance",
                key: "attendance",
              },
              {
                title: "Offering",
                dataIndex: "offering",
                key: "offering",
                render: (value: number) => `₦${value.toLocaleString()}`,
              },
              {
                title: "Total",
                dataIndex: "total",
                key: "total",
                render: (value: number) => (
                  <span className="font-bold text-green-600">
                    ₦{value.toLocaleString()}
                  </span>
                ),
              },
            ]}
            dataSource={midweekReport.records}
            rowKey="id"
            pagination={false}
            size="small"
          />
        );

      case "special":
        const specialReport = report as SpecialReport;
        return (
          <Table
            columns={[
              {
                title: "Service Name",
                dataIndex: "serviceName",
                key: "serviceName",
              },
              {
                title: "Date",
                dataIndex: "date",
                key: "date",
                render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
              },
              {
                title: "Attendance",
                dataIndex: "attendance",
                key: "attendance",
              },
              {
                title: "Offering",
                dataIndex: "offering",
                key: "offering",
                render: (value: number) => (
                  <span className="font-bold text-green-600">
                    ₦{value.toLocaleString()}
                  </span>
                ),
              },
            ]}
            dataSource={specialReport.records}
            rowKey="id"
            pagination={false}
            size="small"
          />
        );

      default:
        return <div>No records available</div>;
    }
  };

  // Helper function for compact table in expandable rows
const renderCompactRecordsTable = (report: ExtendedReport) => {
  switch (report.serviceType) {
    case "sunday":
      const sundayReport = report as SundayReport;
      return (
        <Table<SundayRecord>
          columns={[
            { title: "Week", dataIndex: "week", key: "week", width: 80 },
            {
              title: "Date",
              dataIndex: "date",
              key: "date",
              width: 100,
              render: (date: string) => dayjs(date).format("DD/MM/YY"),
            },
            {
              title: "Attend",
              dataIndex: "totalAttendance",
              key: "totalAttendance",
              width: 80,
            },
            {
              title: "Total",
              dataIndex: "total",
              key: "total",
              width: 100,
              render: (value: number) => (
                <span className="font-semibold text-green-600">
                  ₦{value.toLocaleString()}
                </span>
              ),
            },
          ]}
          dataSource={sundayReport.records}
          pagination={false}
          size="small"
          rowKey="id"
          className="compact-table"
          scroll={{ x: 400 }}
        />
      );

    case "midweek":
      const midweekReport = report as MidweekReport;
      return (
        <Table<MidweekRecord>
          columns={[
            {
              title: "Day",
              dataIndex: "day",
              key: "day",
              width: 80,
              render: (day: string) =>
                day.charAt(0).toUpperCase() + day.slice(1),
            },
            {
              title: "Date",
              dataIndex: "date",
              key: "date",
              width: 100,
              render: (date: string) => dayjs(date).format("DD/MM/YY"),
            },
            {
              title: "Attend",
              dataIndex: "attendance",
              key: "attendance",
              width: 80,
            },
            {
              title: "Total",
              dataIndex: "total",
              key: "total",
              width: 100,
              render: (value: number) => (
                <span className="font-semibold text-green-600">
                  ₦{value.toLocaleString()}
                </span>
              ),
            },
          ]}
          dataSource={midweekReport.records}
          pagination={false}
          size="small"
          rowKey="id"
          className="compact-table"
          scroll={{ x: 400 }}
        />
      );

    case "special":
      const specialReport = report as SpecialReport;
      return (
        <Table<SpecialRecord>
          columns={[
            {
              title: "Service",
              dataIndex: "serviceName",
              key: "serviceName",
              width: 150,
            },
            {
              title: "Date",
              dataIndex: "date",
              key: "date",
              width: 100,
              render: (date: string) => dayjs(date).format("DD/MM/YY"),
            },
            {
              title: "Attend",
              dataIndex: "attendance",
              key: "attendance",
              width: 80,
            },
            {
              title: "Offering",
              dataIndex: "offering",
              key: "offering",
              width: 100,
              render: (value: number) => (
                <span className="font-semibold text-green-600">
                  ₦{value.toLocaleString()}
                </span>
              ),
            },
          ]}
          dataSource={specialReport.records}
          pagination={false}
          size="small"
          rowKey="id"
          className="compact-table"
          scroll={{ x: 450 }}
        />
      );

    default:
      return <div>No records available</div>;
  }
};

  return (
    <div className="p-3 md:p-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChartOutlined className="text-blue-600" />
              Service Reports Dashboard
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Comprehensive overview of all service reports across assemblies
            </p>
          </div>

          {/* Service Type Filter - Mobile optimized */}
          <div className="w-full">
            <RadioGroup
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              buttonStyle="solid"
              size="small"
              className="w-full flex flex-wrap gap-1"
            >
              <RadioButton value="all" className="flex-1 min-w-[60px]">
                All
              </RadioButton>
              <RadioButton value="sunday" className="flex-1 min-w-[60px]">
                Sunday
              </RadioButton>
              <RadioButton value="midweek" className="flex-1 min-w-[60px]">
                Midweek
              </RadioButton>
              <RadioButton value="special" className="flex-1 min-w-[60px]">
                Special
              </RadioButton>
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {isMobile ? (
              <Dropdown
                menu={{ items: exportMenuItems }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  loading={exportLoading}
                  size="middle"
                  className="flex-1"
                >
                  Export
                </Button>
              </Dropdown>
            ) : (
              <>
                <Dropdown menu={{ items: exportMenuItems }} trigger={["click"]}>
                  <Button
                    type="default"
                    icon={<DownloadOutlined />}
                    loading={exportLoading}
                    size="middle"
                  >
                    Export
                  </Button>
                </Dropdown>
                <Button
                  type="primary"
                  icon={<RobotOutlined />}
                  loading={aiReportLoading}
                  onClick={generateAIReport}
                  size="middle"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
                >
                  Generate AI Report
                </Button>
              </>
            )}
            {isMobile && (
              <Button
                type="primary"
                icon={<RobotOutlined />}
                loading={aiReportLoading}
                onClick={generateAIReport}
                size="middle"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
              >
                AI Report
              </Button>
            )}
            <Button
              icon={<FilterOutlined />}
              onClick={() => setFilterDrawerVisible(!filterDrawerVisible)}
              size="middle"
              className={isMobile ? "flex-1" : ""}
            >
              {isMobile ? "Filters" : "Advanced Filters"}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {renderStatsCards()}

      {/* Filters Drawer for Mobile */}
      {isMobile && filterDrawerVisible && (
        <Card className="mb-4 border-0 shadow-lg">
          <div className="space-y-3">
            <Input
              placeholder="Search reports..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              size="middle"
              allowClear
            />
            <Select
              placeholder="Assembly"
              value={filters.assembly || undefined}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, assembly: value }))
              }
              className="w-full"
              size="middle"
              allowClear
            >
              {assemblies.map((assembly) => (
                <Option key={assembly} value={assembly}>
                  {assembly}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Month"
              value={filters.month || undefined}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, month: value }))
              }
              className="w-full"
              size="middle"
              allowClear
            >
              {months.map((month) => (
                <Option key={month} value={month}>
                  {month}
                </Option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Button
                onClick={() => setFilterDrawerVisible(false)}
                className="flex-1"
              >
                Apply
              </Button>
              <Button
                onClick={() => {
                  setFilters({
                    assembly: "",
                    month: "",
                    year: "",
                    search: "",
                    dateRange: null,
                    sortBy: "date",
                    sortOrder: "desc",
                  });
                  setFilterDrawerVisible(false);
                }}
                className="flex-1"
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filters for Desktop */}
      {/* {!isMobile && (
        <Card className="mb-4 border-0 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search reports by assembly, submitter, or month..."
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                size="large"
                allowClear
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                placeholder="Assembly"
                value={filters.assembly || undefined}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, assembly: value }))
                }
                style={{ width: 150 }}
                size="large"
                allowClear
              >
                {assemblies.map((assembly) => (
                  <Option key={assembly} value={assembly}>
                    {assembly}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Month"
                value={filters.month || undefined}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, month: value }))
                }
                style={{ width: 150 }}
                size="large"
                allowClear
              >
                {months.map((month) => (
                  <Option key={month} value={month}>
                    {month}
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        </Card>
      )} */}

      {/* Main Table */}
      <Card className="border-0 shadow-sm overflow-hidden" ref={tableRef}>
        <Table
          columns={columns}
          dataSource={reports}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: !isMobile,
            showQuickJumper: !isMobile,
            showTotal: isMobile
              ? (total) => `${total} reports`
              : (total, range) => `${range[0]}-${range[1]} of ${total} reports`,
            size: isMobile ? "small" : "default",
            simple: isMobile,
          }}
          onChange={(newPagination) => {
            setPagination({
              page: newPagination.current || 1,
              pageSize: newPagination.pageSize || 10,
              total: newPagination.total || 0,
            });
          }}
          expandable={{
            expandedRowRender: (record: ExtendedReport) => {
              return (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3 text-sm">
                    {record.serviceType === "sunday"
                      ? "Sunday Service Weekly Breakdown"
                      : record.serviceType === "midweek"
                      ? "Midweek Service Breakdown"
                      : "Special Services Breakdown"}
                  </h4>
                  {renderCompactRecordsTable(record)}
                </div>
              );
            },
            rowExpandable: (record: ExtendedReport) =>
              record.records.length > 0,
            expandIcon: ({ expanded, onExpand, record }) =>
              record.records.length > 0 ? (
                <Button
                  type="text"
                  size="small"
                  onClick={(e) => onExpand(record, e)}
                  icon={
                    expanded ? (
                      <EyeOutlined className="text-gray-500" />
                    ) : (
                      <EyeOutlined className="text-gray-400" />
                    )
                  }
                />
              ) : null,
          }}
          scroll={{ x: isMobile ? 800 : 1200 }}
          size={isMobile ? "small" : "middle"}
          className="service-reports-table"
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            {selectedReport && getServiceTypeIcon(selectedReport.serviceType)}
            <span>Report Details</span>
            {selectedReport && (
              <Tag color={getServiceTypeColor(selectedReport.serviceType)}>
                {selectedReport.serviceType.toUpperCase()}
              </Tag>
            )}
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={isMobile ? "95%" : "90%"}
        style={{ maxWidth: 1200 }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="export"
            type="primary"
            icon={<DownloadOutlined />}
            loading={exportLoading}
            onClick={() =>
              selectedReport && exportSingleReportPDF(selectedReport)
            }
          >
            Export PDF Report
          </Button>,
        ]}
      >
        {selectedReport && (
          <div className="space-y-4">
            {/* Mobile optimized details view */}
            {isMobile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Card size="small" className="bg-gray-50">
                    <div className="text-sm text-gray-600">Assembly</div>
                    <div className="font-semibold">
                      {selectedReport.assembly}
                    </div>
                  </Card>
                  <Card size="small" className="bg-gray-50">
                    <div className="text-sm text-gray-600">Month</div>
                    <div className="font-semibold">{selectedReport.month}</div>
                  </Card>
                  <Card size="small" className="bg-gray-50">
                    <div className="text-sm text-gray-600">Income</div>
                    <div className="font-semibold text-green-600">
                      ₦{selectedReport.totalIncome.toLocaleString()}
                    </div>
                  </Card>
                  <Card size="small" className="bg-gray-50">
                    <div className="text-sm text-gray-600">Attendance</div>
                    <div className="font-semibold">
                      {selectedReport.totalAttendance.toLocaleString()}
                    </div>
                  </Card>
                </div>

                <Tabs
                  size="small"
                  items={[
                    {
                      key: "records",
                      label: "Records",
                      children: renderRecordsTable(selectedReport),
                    },
                    {
                      key: "stats",
                      label: "Statistics",
                      children: (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Average per Record:</span>
                            <span className="font-semibold">
                              ₦
                              {Math.round(
                                selectedReport.averagePerRecord
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Submitted On:</span>
                            <span>
                              {dayjs(selectedReport.createdAt).format(
                                "DD/MM/YYYY"
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <Tag color={getStatusColor(selectedReport)}>
                              {getStatusText(selectedReport)}
                            </Tag>
                          </div>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            ) : (
              // Desktop view - Simplified to avoid type issues
              <div className="space-y-6">
                <Descriptions
                  title="Report Summary"
                  bordered
                  column={2}
                  size="small"
                >
                  <Descriptions.Item label="Assembly">
                    {selectedReport.assembly}
                  </Descriptions.Item>
                  <Descriptions.Item label="Month">
                    {selectedReport.month}
                  </Descriptions.Item>
                  <Descriptions.Item label="Service Type">
                    <Tag
                      color={getServiceTypeColor(selectedReport.serviceType)}
                    >
                      {selectedReport.serviceType.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Submitted By">
                    {selectedReport.submittedBy}
                  </Descriptions.Item>
                  <Descriptions.Item label="Records">
                    {selectedReport.records.length}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(selectedReport)}>
                      {getStatusText(selectedReport)}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>

                {/* Financial Summary */}
                <Card title="Summary Statistics" size="small">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8}>
                      <Statistic
                        title="Total Income"
                        value={selectedReport.totalIncome}
                        prefix="₦"
                        valueStyle={{ color: "#52c41a" }}
                        formatter={(value) => Number(value).toLocaleString()}
                      />
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Statistic
                        title="Total Attendance"
                        value={selectedReport.totalAttendance}
                        valueStyle={{ color: "#1890ff" }}
                        formatter={(value) => Number(value).toLocaleString()}
                      />
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Statistic
                        title="Average per Record"
                        value={Math.round(selectedReport.averagePerRecord)}
                        prefix="₦"
                        valueStyle={{ color: "#fa8c16" }}
                        formatter={(value) => Number(value).toLocaleString()}
                      />
                    </Col>
                  </Row>
                </Card>

                {/* Records Table - Using helper function */}
                <Card title="Detailed Records" size="small">
                  <Tabs
                    defaultActiveKey="1"
                    items={[
                      {
                        key: "1",
                        label: "Table View",
                        children: renderRecordsTable(selectedReport),
                      },
                    ]}
                  />
                </Card>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* AI Report Modal */}
      <AIReportModal
        visible={aiReportModalVisible}
        loading={aiReportLoading}
        report={aiReport}
        onClose={() => setAiReportModalVisible(false)}
        onExport={exportAIReportAsPDF}
      />
    </div>
  );
}
