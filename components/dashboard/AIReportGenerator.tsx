// components/dashboard/AIReportGenerator.tsx
"use client";

import React, { useState } from "react";
import {
  Card,
  Button,
  Typography,
  Space,
  Spin,
  Alert,
  Tag,
  Modal,
  Row,
  Col,
  Progress,
  Divider,
} from "antd";
import {
  RobotOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  BulbOutlined,
  LineChartOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { downloadReportAsPDF, generateAIReport } from "@/lib/api/ai-report";
// import { generateAIReport, downloadReportAsPDF } from "@/lib/api/ai-report";

const { Title, Text, Paragraph } = Typography;

interface AIReportGeneratorProps {
  assembly: string;
  reports: any[];
  dateRange: [Date, Date];
}

const AIReportGenerator: React.FC<AIReportGeneratorProps> = ({
  assembly,
  reports,
  dateRange,
}) => {
  const [loading, setLoading] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const data = {
        assembly,
        reports,
        period: {
          from: dateRange[0].toISOString(),
          to: dateRange[1].toISOString(),
        },
        location: "Lagos, Nigeria",
      };

      const result = await generateAIReport(data);
      setReportContent(result.report);
      setIsModalVisible(true);
    } catch (error) {
      console.error("Error generating AI report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportContent) return;

    setDownloading(true);
    try {
      await downloadReportAsPDF({
        assembly,
        report: reportContent,
        date: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
    } finally {
      setDownloading(false);
    }
  };

  // Calculate some stats for the preview
  const calculateStats = () => {
    const allRecords = reports.flatMap((r) => r.records || []);
    const sundayRecords = reports
      .filter((r) => r.serviceType === "sunday")
      .flatMap((r) => r.records || []);
    const midweekRecords = reports
      .filter((r) => r.serviceType === "midweek")
      .flatMap((r) => r.records || []);

    return {
      totalIncome: allRecords.reduce((sum, r) => sum + (r.total || 0), 0),
      sundayIncome: sundayRecords.reduce((sum, r) => sum + (r.total || 0), 0),
      midweekIncome: midweekRecords.reduce((sum, r) => sum + (r.total || 0), 0),
      totalAttendance: allRecords.reduce(
        (sum, r) => sum + (r.totalAttendance || r.attendance || 0),
        0
      ),
      averageAttendance: allRecords.length
        ? allRecords.reduce(
            (sum, r) => sum + (r.totalAttendance || r.attendance || 0),
            0
          ) / allRecords.length
        : 0,
    };
  };

  const stats = calculateStats();
//   console.log({ stats });

  return (
    <>
      <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={16}>
            <Space direction="vertical" size="middle">
              <div>
                <Title level={4} className="!mb-2">
                  <RobotOutlined className="mr-2 text-purple-600" />
                  AI-Powered Church Analysis
                </Title>
                <Text type="secondary">
                  Get intelligent insights, financial analysis, and growth
                  recommendations tailored for {assembly} Assembly in Lagos.
                </Text>
              </div>

              <Space size="large">
                <div>
                  <Tag color="blue" className="mb-1">
                    <TeamOutlined /> {stats.totalAttendance.toLocaleString()}{" "}
                    Attendance
                  </Tag>
                  <Tag color="green" className="mb-1">
                    <LineChartOutlined /> ₦{stats.totalIncome.toLocaleString()}
                  </Tag>
                  <Tag color="orange">
                    <BulbOutlined /> Smart Insights
                  </Tag>
                </div>
              </Space>

              <div className="space-y-2">
                <div>
                  <Text strong>What you'll get:</Text>
                  <ul className="pl-5 text-sm text-gray-600">
                    <li>📊 Detailed financial breakdown & trends</li>
                    <li>🙏 Attendance analysis & growth opportunities</li>
                    {/* <li>💡 Lagos-specific ministry recommendations</li> */}
                    <li>📈 Actionable strategies for improvement</li>
                    {/* <li>🎯 Nigerian church context insights</li> */}
                  </ul>
                </div>
              </div>
            </Space>
          </Col>

          <Col xs={24} md={8}>
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center mb-6">
                <div className="mb-4">
                  <Progress
                    type="circle"
                    percent={Math.min(100, (stats.totalIncome / 100000) * 100)}
                    format={() => (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          ₦{(stats.totalIncome / 1000).toFixed(0)}K
                        </div>
                        <div className="text-xs text-gray-500">Revenue</div>
                      </div>
                    )}
                    strokeColor="#8b5cf6"
                  />
                </div>
              </div>

              <Button
                type="primary"
                size="large"
                icon={<RobotOutlined className="text-xs"/>}
                onClick={handleGenerateReport}
                loading={loading}
                className="w-full bg-gradient-to-r from-purple-600 text-sm to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 font-semibold h-12"
              >
                {loading ? "Analyzing with AI..." : "Generate Smart Report"}
              </Button>

              {/* <Text type="secondary" className="mt-4 text-center text-xs">
                Powered by OpenAI • Tailored for Nigerian Churches
              </Text> */}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Modal for displaying AI report */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <RobotOutlined className="text-purple-600" />
            <span>AI Analysis Report for GOFAMINT, Akownjo District, {assembly}Assembly</span>
            <Tag color="purple">Lagos, Nigeria</Tag>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            loading={downloading}
            onClick={handleDownloadPDF}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            Download as PDF
          </Button>,
        ]}
      >
        {reportContent ? (
          <div className="ai-report-content">
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <Alert
                message="AI-Generated Analysis"
                description="This report is generated by artificial intelligence based on your church data. Always review and verify recommendations."
                type="info"
                showIcon
              />
            </div>

            <div className="prose max-w-none">
              {reportContent.split("\n\n").map((paragraph, index) => (
                <Paragraph key={index} className="mb-4">
                  {paragraph}
                </Paragraph>
              ))}
            </div>

            <Divider />

            <div className="bg-blue-50 p-4 rounded-lg">
              <Title level={5} className="!mb-2">
                <BulbOutlined className="mr-2" />
                Key Recommendations Summary
              </Title>
              <Row gutter={[16, 16]} className="mt-4">
                <Col xs={24} sm={12}>
                  <Card size="small" className="border-l-4 border-l-green-500">
                    <Text strong>Financial Growth</Text>
                    <div className="text-sm text-gray-600 mt-1">
                      Increase offerings through digital platforms
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size="small" className="border-l-4 border-l-blue-500">
                    <Text strong>Attendance Strategy</Text>
                    <div className="text-sm text-gray-600 mt-1">
                      Youth engagement programs
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size="small" className="border-l-4 border-l-purple-500">
                    <Text strong>Community Outreach</Text>
                    <div className="text-sm text-gray-600 mt-1">
                      Lagos-specific ministry initiatives
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size="small" className="border-l-4 border-l-orange-500">
                    <Text strong>Digital Ministry</Text>
                    <div className="text-sm text-gray-600 mt-1">
                      Online service streaming
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" tip="Generating AI analysis..." />
          </div>
        )}
      </Modal>
    </>
  );
};

export default AIReportGenerator;
