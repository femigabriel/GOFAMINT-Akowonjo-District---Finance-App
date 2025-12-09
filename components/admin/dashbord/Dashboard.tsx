"use client";

import { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Tabs,
  List,
  Progress,
  Tag,
  Space,
  Divider,
  Typography,
  Alert,
  Spin,
  Select,
  Layout,
  Grid,
  Button,
  Form,
  message,
} from "antd";
import {
  DollarOutlined,
  BankOutlined,
  LineChartOutlined,
  TrophyOutlined,
  RiseOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  FileSearchOutlined,
} from "@ant-design/icons";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import ReactMarkdown from "react-markdown";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const { Title: AntTitle, Text, Paragraph } = Typography;
const { Option } = Select;
const { Content } = Layout;
const { useBreakpoint } = Grid;
const { useForm } = Form;

interface AIData {
  summary: string;
  metrics: {
    totalAssemblies: number;
    totalIncome: number;
    averageAssemblyIncome: number;
    averageAttendance: number;
    incomePerAttendee: number;
    tithesPercentage: string;
    assemblyPerformance: Array<{
      assembly: string;
      totalIncome: number;
      totalAttendance: number;
      performanceRating: string;
      incomePerAttendee: number;
    }>;
    financialHealth: {
      tithePercentage: string;
      financialHealthScore: number;
      recommendations: string[];
    };
    growthIndicators: {
      sbsParticipationRate: string;
      averageVisitorsPerAssembly: string;
      growthPotential: string;
      visitorEngagement: string;
    };
  };
}

interface ComparisonData {
  comparison: string;
  metrics: {
    [key: string]: any;
  };
}

export default function ChurchReport() {
  const [aiData, setAiData] = useState<AIData | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("December-2025");
  const [activeTab, setActiveTab] = useState("overview");
  const [assemblies, setAssemblies] = useState<string[]>([]);
  const [showAIResults, setShowAIResults] = useState(false);
  const [showComparisonResults, setShowComparisonResults] = useState(false);
  const [form] = useForm();
  const screens = useBreakpoint();

  // Fetch available assemblies when month changes
  useEffect(() => {
    fetchAssemblies();
  }, [selectedMonth]);

  const fetchAssemblies = async () => {
    try {
      // This would be an API call to get available assemblies for the selected month
      // For now, using mock data
      const mockAssemblies = [
        "Grace Assembly",
        "Hope Assembly",
        "Faith Assembly",
        "Victory Assembly",
        "Peace Assembly",
        "Joy Assembly",
        "Love Assembly",
        "Mercy Assembly",
      ];
      setAssemblies(mockAssemblies);
    } catch (error) {
      console.error("Error fetching assemblies:", error);
    }
  };

  const generateAIReport = async () => {
    if (!selectedMonth) {
      message.warning("Please select a month first");
      return;
    }

    setLoading(true);
    setShowAIResults(false);
    try {
      const aiResponse = await fetch(
        `/api/admin/reports/ai-analysis?month=${selectedMonth}`
      );
      const aiJson = await aiResponse.json();

      if (aiJson.success) {
        setAiData(aiJson.data.analysis);
        setShowAIResults(true);
        message.success("AI Analysis generated successfully!");

        // Reset comparison results when new AI report is generated
        setComparisonData(null);
        setShowComparisonResults(false);
        form.resetFields();
      } else {
        message.error("Failed to generate AI analysis");
      }
    } catch (error) {
      console.error("Error generating AI report:", error);
      message.error("Error generating AI analysis");
    } finally {
      setLoading(false);
    }
  };

  const generateComparison = async (values: {
    assembly1: string;
    assembly2: string;
  }) => {
    if (!values.assembly1 || !values.assembly2) {
      message.warning("Please select two assemblies to compare");
      return;
    }

    if (values.assembly1 === values.assembly2) {
      message.warning("Please select two different assemblies");
      return;
    }

    setComparisonLoading(true);
    setShowComparisonResults(false);
    try {
      const comparisonResponse = await fetch(
        `/api/admin/reports/comparison?assembly1=${values.assembly1}&assembly2=${values.assembly2}&month=${selectedMonth}`
      );
      const comparisonJson = await comparisonResponse.json();

      if (comparisonJson.success) {
        setComparisonData(comparisonJson.data);
        setShowComparisonResults(true);
        message.success("Comparison generated successfully!");
      } else {
        message.error("Failed to generate comparison");
      }
    } catch (error) {
      console.error("Error generating comparison:", error);
      message.error("Error generating comparison");
    } finally {
      setComparisonLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "success";
      case "Good":
        return "processing";
      case "Average":
        return "warning";
      default:
        return "default";
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 8) return "#52c41a";
    if (score >= 6) return "#1890ff";
    if (score >= 4) return "#faad14";
    return "#ff4d4f";
  };

  // Assembly Performance Chart Data
  const performanceChartData = {
    labels:
      aiData?.metrics.assemblyPerformance.map((item) => item.assembly) || [],
    datasets: [
      {
        label: "Total Income",
        data:
          aiData?.metrics.assemblyPerformance.map((item) => item.totalIncome) ||
          [],
        backgroundColor: "rgba(24, 144, 255, 0.7)",
        borderColor: "#1890ff",
        borderWidth: 1,
      },
      {
        label: "Total Attendance",
        data:
          aiData?.metrics.assemblyPerformance.map(
            (item) => item.totalAttendance
          ) || [],
        backgroundColor: "rgba(82, 196, 26, 0.7)",
        borderColor: "#52c41a",
        borderWidth: 1,
      },
    ],
  };

  // Financial Distribution Data for Pie Chart
  const financialData = {
    labels: ["Tithes", "Offerings", "Pastors Welfare", "Thanksgiving", "Other"],
    datasets: [
      {
        data: aiData
          ? [
              parseFloat(aiData.metrics.financialHealth.tithePercentage),
              19.9,
              36.2,
              13.9,
              16.0,
            ]
          : [0, 0, 0, 0, 0],
        backgroundColor: [
          "rgba(24, 144, 255, 0.8)",
          "rgba(82, 196, 26, 0.8)",
          "rgba(114, 46, 209, 0.8)",
          "rgba(250, 173, 20, 0.8)",
          "rgba(255, 77, 79, 0.8)",
        ],
        borderColor: ["#1890ff", "#52c41a", "#722ed1", "#faad14", "#ff4d4f"],
        borderWidth: 1,
      },
    ],
  };

  // Attendance Growth Chart Data
  const attendanceGrowthData = {
    labels:
      aiData?.metrics.assemblyPerformance.map((item) => item.assembly) || [],
    datasets: [
      {
        label: "Attendance",
        data:
          aiData?.metrics.assemblyPerformance.map(
            (item) => item.totalAttendance
          ) || [],
        backgroundColor:
          aiData?.metrics.assemblyPerformance.map((item) => {
            switch (item.performanceRating) {
              case "Excellent":
                return "rgba(82, 196, 26, 0.7)";
              case "Good":
                return "rgba(24, 144, 255, 0.7)";
              case "Average":
                return "rgba(250, 173, 20, 0.7)";
              default:
                return "rgba(153, 153, 153, 0.7)";
            }
          }) || [],
        borderColor:
          aiData?.metrics.assemblyPerformance.map((item) => {
            switch (item.performanceRating) {
              case "Excellent":
                return "#52c41a";
              case "Good":
                return "#1890ff";
              case "Average":
                return "#faad14";
              default:
                return "#999";
            }
          }) || [],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const horizontalBarOptions = {
    ...chartOptions,
    indexAxis: "y" as const,
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };

  const markdownComponents = {
    p: ({ children }: any) => (
      <Paragraph style={{ marginBottom: 16 }}>{children}</Paragraph>
    ),
    h1: ({ children }: any) => (
      <AntTitle level={3} style={{ marginTop: 24, marginBottom: 16 }}>
        {children}
      </AntTitle>
    ),
    h2: ({ children }: any) => (
      <AntTitle level={4} style={{ marginTop: 20, marginBottom: 12 }}>
        {children}
      </AntTitle>
    ),
    h3: ({ children }: any) => (
      <AntTitle level={5} style={{ marginTop: 16, marginBottom: 8 }}>
        {children}
      </AntTitle>
    ),
    ul: ({ children }: any) => (
      <ul style={{ paddingLeft: 20, marginBottom: 16 }}>{children}</ul>
    ),
    li: ({ children }: any) => <li style={{ marginBottom: 8 }}>{children}</li>,
  };

  return (
    <Layout 
    // style={{ minHeight: "100vh", background: "#f0f2f5" }}
    >
      <Content style={{ padding: screens.xs ? 12 : 24 }}>
        {/* Header */}
        <Card style={{ marginBottom: 24, borderRadius: 8 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <AntTitle level={3} style={{ margin: 0 }}>
                <BankOutlined /> Church District Dashboard
              </AntTitle>
              <Text type="secondary">
                AI-powered insights and analytics for church growth
              </Text>
            </Col>
            <Col>
              <Space>
                <Select
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  style={{ width: 200 }}
                  placeholder="Select month"
                >
                  <Option value="December-2025">December 2025</Option>
                  <Option value="November-2025">November 2025</Option>
                  <Option value="October-2025">October 2025</Option>
                </Select>
                <Button
                  type="primary"
                  icon={<FileSearchOutlined />}
                  loading={loading}
                  onClick={generateAIReport}
                >
                  Generate AI Report
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Show loading state when generating report */}
        {loading && !showAIResults && (
          <Card style={{ marginBottom: 24, textAlign: "center" }}>
            <Spin
              size="large"
              tip="Generating AI Analysis..."
              indicator={<SyncOutlined spin />}
            />
            <Paragraph style={{ marginTop: 16 }}>
              Analyzing church data and generating insights...
            </Paragraph>
          </Card>
        )}

        {/* Show prompt to generate report */}
        {!loading && !showAIResults && (
          <Card
            style={{
              marginBottom: 24,
              textAlign: "center",
              background: "#fafafa",
            }}
          >
            <FileSearchOutlined
              style={{ fontSize: 48, color: "#1890ff", marginBottom: 16 }}
            />
            <AntTitle level={4}>No Analysis Generated Yet</AntTitle>
            <Paragraph>
              Select a month and click "Generate AI Report" to analyze church
              performance data.
            </Paragraph>
            <Button
              type="primary"
              size="large"
              onClick={generateAIReport}
              loading={loading}
            >
              Generate Report
            </Button>
          </Card>
        )}

        {/* Key Metrics - Only show when AI results are available */}
        {showAIResults && aiData && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 8 }}>
                <Statistic
                  title="Total Income"
                  value={aiData.metrics.totalIncome}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                  formatter={(value) => formatCurrency(value as number)}
                />
                <Progress
                  percent={100}
                  showInfo={false}
                  strokeColor="#1890ff"
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 8 }}>
                <Statistic
                  title="Total Attendance"
                  value={
                    aiData.metrics.averageAttendance *
                    aiData.metrics.totalAssemblies
                  }
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
                <Progress
                  percent={100}
                  showInfo={false}
                  strokeColor="#52c41a"
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 8 }}>
                <Statistic
                  title="Assemblies"
                  value={aiData.metrics.totalAssemblies}
                  prefix={<BankOutlined />}
                  valueStyle={{ color: "#722ed1" }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Average ₦
                  {Math.round(
                    aiData.metrics.averageAssemblyIncome
                  ).toLocaleString()}{" "}
                  per assembly
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 8 }}>
                <Statistic
                  title="Financial Health"
                  value={aiData.metrics.financialHealth.financialHealthScore}
                  suffix="/10"
                  prefix={<LineChartOutlined />}
                  valueStyle={{
                    color: getHealthColor(
                      aiData.metrics.financialHealth.financialHealthScore
                    ),
                  }}
                />
                <Progress
                  percent={
                    aiData.metrics.financialHealth.financialHealthScore * 10
                  }
                  showInfo={false}
                  strokeColor={getHealthColor(
                    aiData.metrics.financialHealth.financialHealthScore
                  )}
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Main Content Tabs - Only show when AI results are available */}
        {showAIResults && aiData && (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "overview",
                label: (
                  <span>
                    <InfoCircleOutlined /> Overview
                  </span>
                ),
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                      <Card
                        title="Assembly Performance"
                        style={{ borderRadius: 8 }}
                      >
                        {performanceChartData.labels.length > 0 && (
                          <Bar
                            data={performanceChartData}
                            options={barChartOptions}
                            height={300}
                          />
                        )}
                      </Card>

                      <Card
                        title="AI Executive Summary"
                        style={{ marginTop: 16, borderRadius: 8 }}
                        extra={<Tag color="blue">AI Analysis</Tag>}
                      >
                        <ReactMarkdown components={markdownComponents}>
                          {aiData.summary}
                        </ReactMarkdown>
                      </Card>
                    </Col>

                    <Col xs={24} lg={8}>
                      <Card
                        title="Financial Health"
                        style={{ borderRadius: 8 }}
                      >
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <div>
                            <Text strong>Tithe Percentage</Text>
                            <Progress
                              percent={parseFloat(
                                aiData.metrics.financialHealth.tithePercentage
                              )}
                              strokeColor="#1890ff"
                              size="small"
                            />
                          </div>

                          <Divider />

                          <div>
                            <Text strong>SBS Participation</Text>
                            <Progress
                              percent={parseFloat(
                                aiData.metrics.growthIndicators
                                  .sbsParticipationRate
                              )}
                              strokeColor="#52c41a"
                              size="small"
                            />
                          </div>

                          <Divider />

                          <Alert
                            message="Growth Potential"
                            description={
                              aiData.metrics.growthIndicators.growthPotential
                            }
                            type="info"
                            showIcon
                          />

                          <List
                            header={<Text strong>Top Recommendations</Text>}
                            dataSource={aiData.metrics.financialHealth.recommendations.slice(
                              0,
                              3
                            )}
                            renderItem={(item, index) => (
                              <List.Item>
                                <List.Item.Meta
                                  avatar={
                                    <CheckCircleOutlined
                                      style={{ color: "#52c41a" }}
                                    />
                                  }
                                  title={<Text>{item}</Text>}
                                />
                              </List.Item>
                            )}
                          />
                        </Space>
                      </Card>

                      <Card
                        title="Growth Indicators"
                        style={{ marginTop: 16, borderRadius: 8 }}
                      >
                        <Row gutter={[8, 8]}>
                          <Col span={12}>
                            <Card size="small">
                              <Statistic
                                title="Visitor Rate"
                                value={
                                  aiData.metrics.growthIndicators
                                    .averageVisitorsPerAssembly
                                }
                                valueStyle={{ fontSize: 24 }}
                              />
                            </Card>
                          </Col>
                          <Col span={12}>
                            <Card size="small">
                              <Statistic
                                title="Per Attendee"
                                value={Math.round(
                                  aiData.metrics.incomePerAttendee
                                )}
                                prefix="₦"
                                valueStyle={{ fontSize: 24 }}
                              />
                            </Card>
                          </Col>
                        </Row>
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: "financial",
                label: (
                  <span>
                    <DollarOutlined /> Financial
                  </span>
                ),
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card
                        title="Income Distribution"
                        style={{ borderRadius: 8 }}
                      >
                        <Pie
                          data={financialData}
                          options={chartOptions}
                          height={300}
                        />
                      </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                      <Card
                        title="Financial Details"
                        style={{ borderRadius: 8 }}
                      >
                        <List
                          dataSource={[
                            {
                              label: "Total Income",
                              value: formatCurrency(aiData.metrics.totalIncome),
                              color: "#1890ff",
                            },
                            {
                              label: "Average per Assembly",
                              value: formatCurrency(
                                aiData.metrics.averageAssemblyIncome
                              ),
                              color: "#52c41a",
                            },
                            {
                              label: "Tithe Percentage",
                              value: `${aiData.metrics.tithesPercentage}%`,
                              color: "#722ed1",
                            },
                            {
                              label: "Income per Attendee",
                              value: `₦${Math.round(
                                aiData.metrics.incomePerAttendee
                              )}`,
                              color: "#fa8c16",
                            },
                          ]}
                          renderItem={(item) => (
                            <List.Item>
                              <List.Item.Meta
                                title={<Text>{item.label}</Text>}
                                description={
                                  <Text
                                    strong
                                    style={{ color: item.color, fontSize: 16 }}
                                  >
                                    {item.value}
                                  </Text>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </Card>

                      <Card
                        title="Recommendations"
                        style={{ marginTop: 16, borderRadius: 8 }}
                        extra={<Tag color="green">Priority</Tag>}
                      >
                        <List
                          dataSource={
                            aiData.metrics.financialHealth.recommendations
                          }
                          renderItem={(item, index) => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={<Tag color="blue">{index + 1}</Tag>}
                                description={<Text>{item}</Text>}
                              />
                            </List.Item>
                          )}
                        />
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: "growth",
                label: (
                  <span>
                    <RiseOutlined /> Growth
                  </span>
                ),
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card
                        title="Attendance Growth"
                        style={{ borderRadius: 8 }}
                      >
                        <Bar
                          data={attendanceGrowthData}
                          options={horizontalBarOptions}
                          height={300}
                        />
                      </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                      <Card title="Growth Metrics" style={{ borderRadius: 8 }}>
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <Row gutter={[8, 8]}>
                            <Col span={12}>
                              <Card size="small">
                                <Statistic
                                  title="SBS Participation"
                                  value={
                                    aiData.metrics.growthIndicators
                                      .sbsParticipationRate
                                  }
                                  suffix="%"
                                  valueStyle={{ color: "#52c41a" }}
                                />
                              </Card>
                            </Col>
                            <Col span={12}>
                              <Card size="small">
                                <Statistic
                                  title="Growth Potential"
                                  value={
                                    aiData.metrics.growthIndicators
                                      .growthPotential
                                  }
                                  valueStyle={{ color: "#1890ff" }}
                                />
                              </Card>
                            </Col>
                          </Row>

                          <Alert
                            message="Visitor Engagement"
                            description={
                              aiData.metrics.growthIndicators.visitorEngagement
                            }
                            type="warning"
                            showIcon
                          />

                          <Divider />

                          <AntTitle level={5}>Next Steps</AntTitle>
                          <Paragraph>
                            Based on current growth indicators, focus on
                            improving visitor conversion and SBS participation
                            to drive sustainable growth.
                          </Paragraph>
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: "comparison",
                label: (
                  <span>
                    <TrophyOutlined /> Comparison
                  </span>
                ),
                children: (
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card
                        title="Assembly Comparison Form"
                        style={{ borderRadius: 8 }}
                      >
                        <Form
                          form={form}
                          layout="vertical"
                          onFinish={generateComparison}
                        >
                          <Form.Item
                            name="assembly1"
                            label="First Assembly"
                            rules={[
                              {
                                required: true,
                                message: "Please select first assembly",
                              },
                            ]}
                          >
                            <Select
                              placeholder="Select first assembly"
                              style={{ width: "100%" }}
                              disabled={!aiData}
                            >
                              {assemblies.map((assembly) => (
                                <Option key={assembly} value={assembly}>
                                  {assembly}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>

                          <Form.Item
                            name="assembly2"
                            label="Second Assembly"
                            rules={[
                              {
                                required: true,
                                message: "Please select second assembly",
                              },
                            ]}
                          >
                            <Select
                              placeholder="Select second assembly"
                              style={{ width: "100%" }}
                              disabled={!aiData}
                            >
                              {assemblies.map((assembly) => (
                                <Option key={assembly} value={assembly}>
                                  {assembly}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>

                          <Form.Item>
                            <Button
                              type="primary"
                              htmlType="submit"
                              loading={comparisonLoading}
                              disabled={!aiData}
                              icon={<FileSearchOutlined />}
                            >
                              Generate Comparison
                            </Button>
                          </Form.Item>
                        </Form>

                        {/* Comparison loading state */}
                        {comparisonLoading && (
                          <div style={{ textAlign: "center", padding: 24 }}>
                            <Spin
                              tip="Generating comparison..."
                              indicator={<SyncOutlined spin />}
                            />
                          </div>
                        )}

                        {/* Prompt to generate comparison */}
                        {!comparisonLoading && !showComparisonResults && (
                          <Alert
                            message="No Comparison Generated"
                            description="Select two assemblies and click 'Generate Comparison' to analyze their performance."
                            type="info"
                            showIcon
                          />
                        )}
                      </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                      {/* Comparison Results */}
                      {showComparisonResults && comparisonData && (
                        <Card
                          title="Comparison Results"
                          style={{ borderRadius: 8 }}
                        >
                          <Alert
                            message="Comparative Insights"
                            description={
                              <div style={{ maxHeight: 400, overflow: "auto" }}>
                                <ReactMarkdown components={markdownComponents}>
                                  {comparisonData.comparison}
                                </ReactMarkdown>
                              </div>
                            }
                            type="info"
                            showIcon
                          />

                          <Divider />

                          <Card
                            title="Comparison Metrics"
                            size="small"
                            style={{ marginTop: 16 }}
                          >
                            <List
                              dataSource={Object.entries(
                                comparisonData.metrics
                              )}
                              renderItem={([assembly, metrics]) => (
                                <List.Item>
                                  <Card
                                    style={{ width: "100%" }}
                                    title={assembly}
                                  >
                                    <Row gutter={[8, 8]}>
                                      <Col span={12}>
                                        <Statistic
                                          title="Income"
                                          value={metrics.totalIncome}
                                          prefix="₦"
                                          valueStyle={{ fontSize: 18 }}
                                        />
                                      </Col>
                                      <Col span={12}>
                                        <Statistic
                                          title="Attendance"
                                          value={metrics.totalAttendance}
                                          valueStyle={{ fontSize: 18 }}
                                        />
                                      </Col>
                                      <Col span={12}>
                                        <Statistic
                                          title="Tithe %"
                                          value={
                                            metrics.tithePercentage?.toFixed(
                                              1
                                            ) || 0
                                          }
                                          suffix="%"
                                          valueStyle={{ fontSize: 16 }}
                                        />
                                      </Col>
                                      <Col span={12}>
                                        <Statistic
                                          title="Per Attendee"
                                          value={Math.round(
                                            metrics.incomePerAttendee || 0
                                          )}
                                          prefix="₦"
                                          valueStyle={{ fontSize: 16 }}
                                        />
                                      </Col>
                                    </Row>
                                  </Card>
                                </List.Item>
                              )}
                            />
                          </Card>
                        </Card>
                      )}
                    </Col>
                  </Row>
                ),
              },
            ]}
          />
        )}
      </Content>
    </Layout>
  );
}
