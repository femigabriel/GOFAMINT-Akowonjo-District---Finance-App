// components/admin/AdminComprehensiveAnalysis.tsx
"use client";

import React, { useState } from "react";
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
  Statistic,
  Progress,
  Table,
  List,
  Descriptions,
  Tabs,
  Badge,
  Tooltip,
} from "antd";
import {
  BarChartOutlined,
  DownloadOutlined,
  TeamOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  BankOutlined,
  LineChartOutlined,
  TrophyOutlined,
  FlagOutlined,
  SecurityScanOutlined,
  FileTextOutlined,
  RiseOutlined,
  FallOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

interface AdminComprehensiveAnalysisProps {
  reports: any[];
  summary: any;
  period: { from: string; to: string };
  location?: string;
}

export default function AdminComprehensiveAnalysis({
  reports,
  summary,
  period,
  location = "Lagos, Nigeria",
}: AdminComprehensiveAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleGenerateAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/admin-comprehensive-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reports,
          summary,
          period,
          location,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setAnalysisData(result.data);
        setModalVisible(true);
      } else {
        console.error("Failed to generate analysis:", result.error);
      }
    } catch (error) {
      console.error("Error generating analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health?.toLowerCase()) {
      case 'strong': return 'green';
      case 'moderate': return 'orange';
      case 'concerning': return 'red';
      default: return 'blue';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  return (
    <>
      <Card className="border-0 shadow-lg rounded-2xl mb-6">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={16}>
            <Space direction="vertical" size="middle">
              <div>
                <Title level={4} className="!mb-2">
                  <BarChartOutlined className="mr-2 text-blue-600" />
                  District Comprehensive Analysis
                </Title>
                <Text type="secondary">
                  Strategic overview of all assemblies with AI-powered insights
                </Text>
              </div>

              <div className="space-y-3">
                <Alert
                  message="District-Level Analytics"
                  description="Get strategic insights for entire district planning and resource allocation"
                  type="info"
                  showIcon
                />
                
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="Active Assemblies"
                      value={[...new Set(reports.map(r => r.assembly))].length}
                      prefix={<BankOutlined />}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="District Income"
                      value={formatCurrency(summary?.totalIncome || 0)}
                      prefix={<DollarOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Total Reports"
                      value={reports.length}
                      prefix={<FileTextOutlined />}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Total Attendance"
                      value={summary?.totalAttendance?.toLocaleString() || '0'}
                      prefix={<TeamOutlined />}
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Col>
                </Row>

                <div>
                  <Text strong>Analysis Includes:</Text>
                  <ul className="pl-5 text-sm text-gray-600 mt-2">
                    <li>📊 District Executive Summary & Overview</li>
                    <li>🏆 Assembly Performance Ranking</li>
                    <li>💰 Financial Health Assessment</li>
                    <li>📈 Attendance & Engagement Analysis</li>
                    <li>⚙️ Operational Efficiency Metrics</li>
                    <li>🎯 Strategic Recommendations</li>
                    <li>⚠️ Risk Assessment & Mitigation</li>
                    <li>📅 Next Quarter Targets</li>
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
                icon={<BarChartOutlined />}
                onClick={handleGenerateAnalysis}
                loading={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {loading ? "Analyzing District..." : "Generate District Analysis"}
              </Button>

              <Text type="secondary" className="text-center text-xs">
                AI-powered strategic analysis for district leadership decision-making
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <BarChartOutlined className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                District Comprehensive Analysis
              </h2>
              <p className="text-sm text-gray-500">
                GOFAMINT Akowonjo District, Region 26 • {location}
              </p>
            </div>
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
            onClick={() => {/* PDF export */}}
          >
            Download Full Report
          </Button>,
        ]}
      >
        {analysisData ? (
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-6">
              {/* Executive Summary */}
              <Card 
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0"
                size="small"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileTextOutlined className="text-blue-600" />
                  </div>
                  <div>
                    <Title level={5} className="!mb-2">Executive Summary</Title>
                    <Paragraph className="text-gray-700">
                      {analysisData.executive_summary}
                    </Paragraph>
                  </div>
                </div>
              </Card>

              {/* Financial Health */}
              <Card title="Financial Health Assessment" size="small">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Text strong>Overall Health:</Text>
                    <Tag color={getHealthColor(analysisData.financial_health_assessment.overall_health)}>
                      {analysisData.financial_health_assessment.overall_health}
                    </Tag>
                  </div>
                  
                  <Row gutter={[16, 16]} className="mb-4">
                    <Col span={8}>
                      <Statistic
                        title="Diversification"
                        value={analysisData.financial_health_assessment.sustainability_metrics.revenue_diversification_score}
                        suffix="/10"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Stability"
                        value={analysisData.financial_health_assessment.sustainability_metrics.income_stability_index}
                        suffix="/10"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Progress
                        type="dashboard"
                        percent={Math.round(
                          (analysisData.financial_health_assessment.sustainability_metrics.revenue_diversification_score +
                           analysisData.financial_health_assessment.sustainability_metrics.income_stability_index) / 2 * 10
                        )}
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                      />
                    </Col>
                  </Row>
                </div>
              </Card>

              {/* Assembly Ranking */}
              <Card title="Assembly Performance Ranking" size="small">
                <Table
                  dataSource={analysisData.assembly_performance_ranking}
                  columns={[
                    {
                      title: 'Rank',
                      dataIndex: 'rank',
                      key: 'rank',
                      width: 80,
                      render: (rank) => (
                        <Badge
                          count={rank}
                          style={{ 
                            backgroundColor: rank <= 3 ? '#52c41a' : 
                                           rank <= 6 ? '#faad14' : '#f5222d' 
                          }}
                        />
                      ),
                    },
                    {
                      title: 'Assembly',
                      dataIndex: 'assembly',
                      key: 'assembly',
                    },
                    {
                      title: 'Income',
                      dataIndex: 'total_income',
                      key: 'total_income',
                      render: (value) => formatCurrency(value),
                    },
                    {
                      title: 'Attendance',
                      dataIndex: 'total_attendance',
                      key: 'total_attendance',
                    },
                    {
                      title: 'Status',
                      dataIndex: 'report_completeness',
                      key: 'report_completeness',
                      render: (status) => {
                        const color = status === 'Excellent' ? 'green' :
                                     status === 'Good' ? 'blue' :
                                     status === 'Fair' ? 'orange' : 'red';
                        return <Tag color={color}>{status}</Tag>;
                      },
                    },
                  ]}
                  pagination={false}
                  size="small"
                />
              </Card>

              {/* Recommendations */}
              <Card title="Strategic Recommendations" size="small">
                <Tabs>
                  <Tabs.TabPane tab="Immediate Actions" key="immediate">
                    <List
                      dataSource={analysisData.strategic_recommendations.immediate_actions}
                      renderItem={(item: string) => (
                        <List.Item>
                          <CheckCircleOutlined className="text-green-500 mr-2" />
                          {item}
                        </List.Item>
                      )}
                    />
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Short Term" key="short">
                    <List
                      dataSource={analysisData.strategic_recommendations.short_term_goals}
                      renderItem={(item: string) => (
                        <List.Item>
                          <FlagOutlined className="text-blue-500 mr-2" />
                          {item}
                        </List.Item>
                      )}
                    />
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Assembly Interventions" key="assembly">
                    <List
                      dataSource={analysisData.strategic_recommendations.assembly_specific_interventions}
                      renderItem={(item: any) => (
                        <List.Item>
                          <div className="w-full">
                            <div className="font-semibold">{item.assembly}</div>
                            <div className="text-sm text-gray-600">
                              <Tag color="orange" className="mr-2">{item.priority_area}</Tag>
                              {item.recommended_action}
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </Tabs.TabPane>
                </Tabs>
              </Card>

              {/* Success Stories */}
              {analysisData.success_stories && analysisData.success_stories.length > 0 && (
                <Card title="Success Stories" size="small">
                  <Row gutter={[16, 16]}>
                    {analysisData.success_stories.map((story: any, index: number) => (
                      <Col span={8} key={index}>
                        <Card className="h-full" size="small">
                          <div className="font-semibold text-blue-600 mb-2">
                            <TrophyOutlined className="mr-2" />
                            {story.assembly}
                          </div>
                          <Text className="text-sm">{story.achievement}</Text>
                          <div className="mt-2 text-xs text-gray-500">
                            Strategy: {story.replicable_strategy}
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" tip="Analyzing district performance..." />
          </div>
        )}
      </Modal>
    </>
  );
}