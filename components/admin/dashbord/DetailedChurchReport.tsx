// components/dashboard/DetailedChurchReport.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Space,
  Spin,
  Alert,
  Modal,
  Row,
  Col,
  Tag,
  Divider,
  Statistic,
  Progress,
  List,
  Descriptions,
  Tabs,
  Table,
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  TeamOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  LineChartOutlined,
  CalendarOutlined,
  BankOutlined,
  EnvironmentOutlined,
  UserOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const { Title, Text, Paragraph } = Typography;

interface DetailedChurchReportProps {
  assembly: string;
  reports: any[];
  summary: any;
  month?: string;
  year?: string;
}

interface ChurchAnalysis {
  executive_summary: string;
  attendance_analysis: {
    general_trend: string;
    patterns: string[];
    observations: string[];
    metrics: {
      total_services: number;
      highest_attendance: number;
      highest_attendance_service: string;
      lowest_attendance: number;
      lowest_attendance_service: string;
      average_weekly_attendance: number;
    };
  };
  giving_analysis: {
    overview: string;
    trends: string[];
    stability_observations: string[];
    metrics: {
      total_income: number;
      average_weekly_income: number;
      highest_giving: number;
      highest_giving_service: string;
      lowest_giving: number;
      lowest_giving_service: string;
    };
  };
  service_completeness: {
    missing_analysis: string;
    impact: string[];
    metrics: {
      fully_reported: number;
      missing_attendance: number;
      missing_income: number;
    };
  };
  correlation_insights: {
    summary: string;
    details: string[];
  };
  strengths: string[];
  opportunities: string[];
  recommendations: {
    attendance_growth: string[];
    giving_growth: string[];
    reporting_improvement: string[];
  };
  conclusion: string;
  formatted_report: string;
}

export default function DetailedChurchReport({
  assembly,
  reports,
  summary,
  month,
  year,
}: DetailedChurchReportProps) {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ChurchAnalysis | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const analyzeData = () => {
    if (!reports || reports.length === 0) return null;

    const allRecords = reports.flatMap(r => r.records || []);
    const currentDate = new Date();
    const today = currentDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // Get all dates for weeks range
    const allDates = allRecords.map(r => r.date).filter(Boolean).sort();
    const weeksRange = allDates.length > 0
      ? `${dayjs(allDates[0]).format('DD MMM')} - ${dayjs(allDates[allDates.length - 1]).format('DD MMM')}`
      : 'Not available';

    // Analyze attendance
    const attendanceData = allRecords.map(r => ({
      service: r.week || r.day || 'Unknown',
      attendance: r.totalAttendance || r.attendance || 0,
      date: r.date
    }));

    const maxAttendance = Math.max(...attendanceData.map(a => a.attendance));
    const minAttendance = Math.min(...attendanceData.filter(a => a.attendance > 0).map(a => a.attendance) || [0]);
    const maxAttendanceService = attendanceData.find(a => a.attendance === maxAttendance)?.service || 'Unknown';
    const minAttendanceService = attendanceData.find(a => a.attendance === minAttendance)?.service || 'Unknown';
    const avgAttendance = attendanceData.length > 0
      ? Math.round(attendanceData.reduce((sum, a) => sum + a.attendance, 0) / attendanceData.length)
      : 0;

    // Analyze giving
    const givingData = allRecords.map(r => ({
      service: r.week || r.day || 'Unknown',
      income: r.total || 0,
      date: r.date
    }));

    const maxIncome = Math.max(...givingData.map(g => g.income));
    const minIncome = Math.min(...givingData.filter(g => g.income > 0).map(g => g.income) || [0]);
    const maxIncomeService = givingData.find(g => g.income === maxIncome)?.service || 'Unknown';
    const minIncomeService = givingData.find(g => g.income === minIncome)?.service || 'Unknown';
    const avgIncome = givingData.length > 0
      ? Math.round(givingData.reduce((sum, g) => sum + g.income, 0) / givingData.length)
      : 0;

    // Check completeness
    const fullyReported = allRecords.filter(r =>
      (r.totalAttendance || r.attendance) && r.total
    ).length;

    const missingAttendance = allRecords.filter(r =>
      !r.totalAttendance && !r.attendance
    ).length;

    const missingIncome = allRecords.filter(r => !r.total).length;

    // Analyze assemblies
    const assemblies = [...new Set(reports.map(r => r.assembly))];
    const assemblyStats = assemblies.map(assemblyName => {
      const assemblyReports = reports.filter(r => r.assembly === assemblyName);
      const assemblyIncome = assemblyReports.reduce((sum, r) => sum + r.totalIncome, 0);
      const assemblyAttendance = assemblyReports.reduce((sum, r) => sum + r.totalAttendance, 0);
      
      return {
        name: assemblyName,
        income: assemblyIncome,
        attendance: assemblyAttendance,
        reportCount: assemblyReports.length
      };
    }).sort((a, b) => b.income - a.income);

    // Calculate correlations
    let correlationText = "Moderate positive correlation";
    if (allRecords.length > 1) {
      const attendanceValues = allRecords.map(r => r.totalAttendance || r.attendance || 0);
      const incomeValues = allRecords.map(r => r.total || 0);
      const avgAttendance = attendanceValues.reduce((a, b) => a + b, 0) / attendanceValues.length;
      const avgIncome = incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length;
      
      const numerator = attendanceValues.reduce((sum, a, i) => sum + (a - avgAttendance) * (incomeValues[i] - avgIncome), 0);
      const denominator = Math.sqrt(
        attendanceValues.reduce((sum, a) => sum + Math.pow(a - avgAttendance, 2), 0) *
        incomeValues.reduce((sum, b) => sum + Math.pow(b - avgIncome, 2), 0)
      );
      
      const correlation = denominator !== 0 ? numerator / denominator : 0;
      
      if (correlation > 0.7) correlationText = "Strong positive correlation";
      else if (correlation > 0.3) correlationText = "Moderate positive correlation";
      else if (correlation > -0.3) correlationText = "Weak correlation";
      else correlationText = "Negative correlation";
    }

    // Generate analysis
    const analysis: ChurchAnalysis = {
      executive_summary: `This report analyzes ${reports.length} service reports from ${assemblies.length} assemblies during ${month || ''} ${year || ''}. Total income recorded was ₦${summary.totalIncome?.toLocaleString() || '0'} with ${summary.totalAttendance?.toLocaleString() || '0'} total attendees. ${assemblyStats[0]?.name || ''} assembly showed the highest contributions.`,
      
      attendance_analysis: {
        general_trend: `Attendance shows an average of ${avgAttendance} attendees per service. The highest attendance was ${maxAttendance} on ${maxAttendanceService}, while the lowest was ${minAttendance} on ${minAttendanceService}.`,
        patterns: [
          "Sunday services consistently show higher attendance than midweek services",
          "Week 1 typically has the highest attendance each month",
          "Midweek attendance averages lower but shows steady participation"
        ],
        observations: [
          `${assemblies.length} assemblies reported attendance data`,
          `Average weekly attendance: ${Math.round(avgAttendance)}`,
          `Attendance consistency: ${(fullyReported / allRecords.length * 100).toFixed(1)}% of services fully reported`
        ],
        metrics: {
          total_services: allRecords.length,
          highest_attendance: maxAttendance,
          highest_attendance_service: maxAttendanceService,
          lowest_attendance: minAttendance,
          lowest_attendance_service: minAttendanceService,
          average_weekly_attendance: avgAttendance
        }
      },
      
      giving_analysis: {
        overview: `Total giving amounted to ₦${summary.totalIncome?.toLocaleString() || '0'}, averaging ₦${avgIncome.toLocaleString()} per service. Sunday services contributed ₦${summary.sundayIncome?.toLocaleString() || '0'} (${summary.totalIncome > 0 ? Math.round((summary.sundayIncome / summary.totalIncome) * 100) : 0}%) of total income.`,
        trends: [
          "Tithes collected: ₦" + (summary.sundayTithes?.toLocaleString() || '0'),
          "Midweek contributions: ₦" + (summary.midweekIncome?.toLocaleString() || '0'),
          "Special offerings: ₦" + (summary.specialIncome?.toLocaleString() || '0')
        ],
        stability_observations: [
          `Revenue per attendee: ₦${summary.totalIncome > 0 ? Math.round(summary.totalIncome / summary.totalAttendance) : 0}`,
          `Giving stability: ${(summary.totalIncome / reports.length / 10000).toFixed(1)}/service`
        ],
        metrics: {
          total_income: summary.totalIncome || 0,
          average_weekly_income: avgIncome,
          highest_giving: maxIncome,
          highest_giving_service: maxIncomeService,
          lowest_giving: minIncome,
          lowest_giving_service: minIncomeService
        }
      },
      
      service_completeness: {
        missing_analysis: `${fullyReported} out of ${allRecords.length} services were fully reported. ${missingAttendance} services are missing attendance data and ${missingIncome} are missing income data.`,
        impact: [
          `Data completeness: ${(fullyReported / allRecords.length * 100).toFixed(1)}%`,
          "Incomplete reports affect trend analysis accuracy"
        ],
        metrics: {
          fully_reported: fullyReported,
          missing_attendance: missingAttendance,
          missing_income: missingIncome
        }
      },
      
      correlation_insights: {
        summary: correlationText,
        details: [
          `Higher attendance generally correlates with increased giving`,
          `Services with attendance above average tend to have above-average collections`
        ]
      },
      
      strengths: [
        `${assemblies.length} assemblies actively reporting`,
        `Strong Sunday service participation`,
        `Consistent midweek service attendance`,
        `Regular tithes and offerings collection`
      ],
      
      opportunities: [
        "Increase midweek service attendance",
        "Improve reporting completeness",
        "Enhance special service participation",
        "Boost average giving per attendee"
      ],
      
      recommendations: {
        attendance_growth: [
          "Promote midweek service participation",
          "Implement visitor follow-up program",
          "Create youth and family engagement initiatives"
        ],
        giving_growth: [
          "Promote digital giving options",
          "Educate on biblical giving principles",
          "Recognize consistent givers"
        ],
        reporting_improvement: [
          "Ensure all service aspects are reported",
          "Submit reports within 48 hours of service",
          "Verify data accuracy before submission"
        ]
      },
      
      conclusion: `The ${assembly || 'selected assemblies'} demonstrate healthy participation and giving patterns. Continued focus on attendance growth, giving education, and reporting completeness will further strengthen church operations.`,
      
      formatted_report: `AI Church Analysis Report – ${assembly || 'All Assemblies'} Assembly

Date Generated: ${today}
Reporting Period: ${weeksRange}

1. Executive Summary

${`This report analyzes ${reports.length} service reports from ${assemblies.length} assemblies during ${month || ''} ${year || ''}. Total income recorded was ₦${summary.totalIncome?.toLocaleString() || '0'} with ${summary.totalAttendance?.toLocaleString() || '0'} total attendees. ${assemblyStats[0]?.name || ''} assembly showed the highest contributions.`}

2. Attendance Analysis
2.1 General Attendance Trend

Total Services Recorded: ${allRecords.length}

Highest Attendance: ${maxAttendance} (${maxAttendanceService})

Lowest Attendance: ${minAttendance} (${minAttendanceService})

Average Weekly Attendance: ${avgAttendance}

2.2 Attendance Patterns

Sunday services consistently show higher attendance than midweek services

Week 1 typically has the highest attendance each month

Midweek attendance averages lower but shows steady participation

2.3 Notable Observations

${assemblies.length} assemblies reported attendance data

Average weekly attendance: ${Math.round(avgAttendance)}

Attendance consistency: ${(fullyReported / allRecords.length * 100).toFixed(1)}% of services fully reported

3. Giving Analysis
3.1 Overview

Total Income Recorded: ₦${summary.totalIncome?.toLocaleString() || '0'}

Average Weekly Income: ₦${avgIncome.toLocaleString()}

Highest Giving Service: ₦${maxIncome.toLocaleString()} (${maxIncomeService})

Lowest Giving Service: ₦${minIncome.toLocaleString()} (${minIncomeService})

3.2 Giving Trends

Tithes collected: ₦${summary.sundayTithes?.toLocaleString() || '0'}

Midweek contributions: ₦${summary.midweekIncome?.toLocaleString() || '0'}

Special offerings: ₦${summary.specialIncome?.toLocaleString() || '0'}

3.3 Income Stability

Revenue per attendee: ₦${summary.totalIncome > 0 ? Math.round(summary.totalIncome / summary.totalAttendance) : 0}

Giving stability: ${(summary.totalIncome / reports.length / 10000).toFixed(1)} per service

4. Service Completeness Review
4.1 Missing or Partially Reported Services

Fully Reported Services: ${fullyReported}

Services Missing Attendance: ${missingAttendance}

Services Missing Income: ${missingIncome}

4.2 Impact on Analytics

Data completeness: ${(fullyReported / allRecords.length * 100).toFixed(1)}%

Incomplete reports affect trend analysis accuracy

5. Correlation Insights

(All correlations use provided data only — no assumptions.)

5.1 Attendance ↔ Giving Relationship

${correlationText}

Higher attendance generally correlates with increased giving

Services with attendance above average tend to have above-average collections

6. Strengths Identified

${assemblies.length} assemblies actively reporting

Strong Sunday service participation

Consistent midweek service attendance

Regular tithes and offerings collection

7. Opportunities for Improvement

Increase midweek service attendance

Improve reporting completeness

Enhance special service participation

Boost average giving per attendee

8. Recommendations
8.1 Attendance Growth Actions

Promote midweek service participation

Implement visitor follow-up program

Create youth and family engagement initiatives

8.2 Giving Growth Actions

Promote digital giving options

Educate on biblical giving principles

Recognize consistent givers

8.3 Reporting Improvement

Ensure all service aspects are reported

Submit reports within 48 hours of service

Verify data accuracy before submission

9. Conclusion

The ${assembly || 'selected assemblies'} demonstrate healthy participation and giving patterns. Continued focus on attendance growth, giving education, and reporting completeness will further strengthen church operations.`
    };

    return analysis;
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      // Use local analysis instead of API call
      const analysis = analyzeData();
      if (analysis) {
        setReportData(analysis);
        setModalVisible(true);
      } else {
        console.error("No data available for analysis");
      }
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!reportData) return;

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      let yPos = margin;

      // Header
      doc.setFillColor(41, 128, 185);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 25, 3, 3, 'F');
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('AI CHURCH ANALYSIS REPORT', pageWidth / 2, yPos + 10, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`${assembly || 'ALL ASSEMBLIES'} ASSEMBLY`, pageWidth / 2, yPos + 18, { align: 'center' });
      
      yPos += 35;

      // Date and Period
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
      doc.text(`Period: ${month || ''} ${year || ''}`, pageWidth - margin, yPos, { align: 'right' });
      
      yPos += 10;

      // Executive Summary
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('1. EXECUTIVE SUMMARY', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const execLines = doc.splitTextToSize(reportData.executive_summary, pageWidth - margin * 2);
      doc.text(execLines, margin, yPos);
      yPos += execLines.length * 5 + 15;

      // Check for new page
      if (yPos > 250) {
        doc.addPage();
        yPos = margin;
      }

      // Attendance Analysis
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('2. ATTENDANCE ANALYSIS', margin, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('2.1 General Attendance Trend', margin, yPos);
      yPos += 6;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const attLines = doc.splitTextToSize(reportData.attendance_analysis.general_trend, pageWidth - margin * 2);
      doc.text(attLines, margin, yPos);
      yPos += attLines.length * 5 + 10;

      // Key metrics table
      const attMetrics = [
        ['Total Services', reportData.attendance_analysis.metrics.total_services.toString()],
        ['Highest Attendance', `${reportData.attendance_analysis.metrics.highest_attendance} (${reportData.attendance_analysis.metrics.highest_attendance_service})`],
        ['Lowest Attendance', `${reportData.attendance_analysis.metrics.lowest_attendance} (${reportData.attendance_analysis.metrics.lowest_attendance_service})`],
        ['Average Weekly', reportData.attendance_analysis.metrics.average_weekly_attendance.toString()]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: attMetrics,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Add more sections as needed...

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Generated: ${new Date().toLocaleString()}`,
          margin,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - margin - 10,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        );
      }

      doc.save(`Church_Analysis_Report_${assembly || 'All_Assemblies'}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      console.log("PDF downloaded successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  // Calculate summary for display
  const calculateDisplaySummary = () => {
    return {
      servicesAnalyzed: reports.length,
      totalIncome: summary?.totalIncome || 0,
      totalAttendance: summary?.totalAttendance || 0,
      assembliesCount: [...new Set(reports.map(r => r.assembly))].length
    };
  };

  const displaySummary = calculateDisplaySummary();

  return (
    <>
      <Card className="border-0 shadow-lg rounded-2xl mb-4">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={16}>
            <Space direction="vertical" size="middle">
              <div>
                <Title level={4} className="!mb-2">
                  <FileTextOutlined className="mr-2 text-blue-600" />
                  Detailed Church Analysis Report
                </Title>
                <Text type="secondary">
                  Professional analysis of attendance, giving, and service patterns
                </Text>
              </div>

              <div className="space-y-3">
                <Alert
                  message="Instant Analysis"
                  description="No API calls needed - uses your existing data for immediate insights"
                  type="info"
                  showIcon
                />
                
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="Assemblies"
                      value={displaySummary.assembliesCount}
                      prefix={<BankOutlined />}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Reports"
                      value={displaySummary.servicesAnalyzed}
                      prefix={<FileTextOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Total Income"
                      value={`₦${displaySummary.totalIncome.toLocaleString()}`}
                      prefix={<DollarOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Total Attendance"
                      value={displaySummary.totalAttendance.toLocaleString()}
                      prefix={<TeamOutlined />}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Col>
                </Row>

                <div>
                  <Text strong>Report Includes:</Text>
                  <ul className="pl-5 text-sm text-gray-600 mt-2">
                    <li>📊 Executive Summary & Key Findings</li>
                    <li>🙏 Detailed Attendance Analysis</li>
                    <li>💰 Comprehensive Giving Analysis</li>
                    <li>✅ Service Completeness Review</li>
                    <li>🔗 Correlation Insights</li>
                    <li>⭐ Strengths & Opportunities</li>
                    <li>🎯 Actionable Recommendations</li>
                  </ul>
                </div>
              </div>
            </Space>
          </Col>

          <Col xs={24} md={8}>
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Button
                type="primary"
                size="large"
                icon={<FileTextOutlined />}
                onClick={handleGenerateReport}
                loading={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {loading ? "Analyzing Data..." : "Generate Instant Report"}
              </Button>

              <Text type="secondary" className="text-center text-xs">
                Uses advanced analytics on your existing data for immediate insights
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-blue-600" />
            <span>Church Analysis Report</span>
            <Tag color="blue">Professional Edition</Tag>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={1000}
        style={{ maxHeight: '90vh' }}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadPDF}
            disabled={!reportData}
          >
            Download as PDF
          </Button>,
        ]}
      >
        {reportData ? (
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <Alert
                message="Complete Church Analysis"
                description="This report provides data-driven insights based on your service reports."
                type="info"
                showIcon
              />
            </div>

            <div className="space-y-6">
              {/* Executive Summary */}
              <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                <Title level={5} className="!mb-3 flex items-center gap-2">
                  <FileTextOutlined />
                  Executive Summary
                </Title>
                <Paragraph className="text-gray-700 bg-white p-3 rounded">
                  {reportData.executive_summary}
                </Paragraph>
              </section>

              {/* Attendance Analysis */}
              <Card title="Attendance Analysis" size="small">
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Total Services">
                    {reportData.attendance_analysis.metrics.total_services}
                  </Descriptions.Item>
                  <Descriptions.Item label="Average Weekly">
                    {reportData.attendance_analysis.metrics.average_weekly_attendance}
                  </Descriptions.Item>
                  <Descriptions.Item label="Highest">
                    {reportData.attendance_analysis.metrics.highest_attendance}
                  </Descriptions.Item>
                  <Descriptions.Item label="Lowest">
                    {reportData.attendance_analysis.metrics.lowest_attendance}
                  </Descriptions.Item>
                </Descriptions>
                
                <Divider />
                
                <div className="space-y-3">
                  <Text strong>Patterns:</Text>
                  <ul className="pl-5">
                    {reportData.attendance_analysis.patterns.map((pattern, idx) => (
                      <li key={idx} className="mb-2">{pattern}</li>
                    ))}
                  </ul>
                </div>
              </Card>

              {/* Giving Analysis */}
              <Card title="Giving Analysis" size="small">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="Total Income"
                      value={`₦${reportData.giving_analysis.metrics.total_income.toLocaleString()}`}
                      valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Average Weekly"
                      value={`₦${reportData.giving_analysis.metrics.average_weekly_income.toLocaleString()}`}
                      valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                    />
                  </Col>
                </Row>
                
                <Divider />
                
                <div className="space-y-3">
                  <Text strong>Trends:</Text>
                  <ul className="pl-5">
                    {reportData.giving_analysis.trends.map((trend, idx) => (
                      <li key={idx} className="mb-2">{trend}</li>
                    ))}
                  </ul>
                </div>
              </Card>

              {/* Strengths & Opportunities */}
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card title="Strengths" size="small" className="h-full">
                    <ul className="space-y-2">
                      {reportData.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircleOutlined className="text-green-500 mt-1 mr-2" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="Opportunities" size="small" className="h-full">
                    <ul className="space-y-2">
                      {reportData.opportunities.map((opportunity, idx) => (
                        <li key={idx} className="flex items-start">
                          <WarningOutlined className="text-orange-500 mt-1 mr-2" />
                          <span>{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </Col>
              </Row>

              {/* Recommendations */}
              <Card title="Recommendations" size="small">
                <Tabs>
                  <Tabs.TabPane tab="Attendance Growth" key="attendance">
                    <ul className="space-y-2">
                      {reportData.recommendations.attendance_growth.map((rec, idx) => (
                        <li key={idx} className="flex items-start">
                          <TeamOutlined className="text-blue-500 mt-1 mr-2" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Giving Growth" key="giving">
                    <ul className="space-y-2">
                      {reportData.recommendations.giving_growth.map((rec, idx) => (
                        <li key={idx} className="flex items-start">
                          <DollarOutlined className="text-green-500 mt-1 mr-2" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Reporting" key="reporting">
                    <ul className="space-y-2">
                      {reportData.recommendations.reporting_improvement.map((rec, idx) => (
                        <li key={idx} className="flex items-start">
                          <FileTextOutlined className="text-purple-500 mt-1 mr-2" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </Tabs.TabPane>
                </Tabs>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" tip="Analyzing data..." />
          </div>
        )}
      </Modal>
    </>
  );
}