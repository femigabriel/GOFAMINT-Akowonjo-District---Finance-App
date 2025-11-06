// components/admin/DashboardContent.tsx
"use client";

import { Card, Statistic, Row, Col, Button, Tag, Progress, List, Avatar, Timeline, message, Select, Spin, Table, Modal } from "antd";
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
  ArrowDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { assemblies as ASSEMBLIES } from "@/lib/assemblies";

const { Option } = Select;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
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

export default function DashboardContent() {
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 7 }, (_, i) => (currentYear - 5 + i).toString());

  const currentMonthIndex = new Date().getMonth();
  const currentMonth = MONTHS[currentMonthIndex];

  const [loading, setLoading] = useState(false);
  const [selectedAssembly, setSelectedAssembly] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [assemblyModalVisible, setAssemblyModalVisible] = useState(false);
  const [selectedAssemblyDetails, setSelectedAssemblyDetails] = useState<AssemblyDetails | null>(null);
  const [assemblyDetailsLoading, setAssemblyDetailsLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedAssembly, selectedMonth, selectedYear]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAssembly !== 'all') params.append('assembly', selectedAssembly);
      if (selectedMonth !== 'all') params.append('month', selectedMonth);
      if (selectedYear !== 'all') params.append('year', selectedYear);

      const response = await fetch(`/api/admin/dashboard?${params}`);
      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
      } else {
        message.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      message.error('Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssemblyDetails = async (assemblyName: string) => {
    setAssemblyDetailsLoading(true);
    try {
      const response = await fetch(`/api/admin/assembly-details?assembly=${encodeURIComponent(assemblyName)}`);
      const result = await response.json();

      if (result.success) {
        setSelectedAssemblyDetails(result.data);
        setAssemblyModalVisible(true);
      } else {
        message.error('Failed to fetch assembly details');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      message.error('Error fetching assembly details');
    } finally {
      setAssemblyDetailsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter stats to remove Total Assemblies
  const statsData = dashboardData ? [
    {
      title: "Active Members",
      value: dashboardData.activeMembers.toLocaleString(),
      change: dashboardData.activeMembers > 0 ? "+" + Math.round((dashboardData.activeMembers / 1000) * 100) + "%" : "0%",
      icon: <Users size={24} />,
      color: "#10b981",
      progress: Math.min((dashboardData.activeMembers / 5000) * 100, 100),
      description: "Based on service attendance"
    },
    {
      title: "Total Income",
      value: formatCurrency(dashboardData.monthlyIncome),
      change: dashboardData.monthlyIncome > 0 ? "+" + Math.round((dashboardData.monthlyIncome / 1000000) * 100) + "%" : "0%",
      icon: <DollarSign size={24} />,
      color: "#f59e0b",
      progress: Math.min((dashboardData.monthlyIncome / 5000000) * 100, 100),
      description: "From all assemblies"
    },
    {
      title: "Reports Generated",
      value: dashboardData.reportsGenerated,
      change: dashboardData.reportsGenerated > 0 ? `+${dashboardData.reportsGenerated}` : "0",
      icon: <BarChart3 size={24} />,
      color: "#8b5cf6",
      progress: Math.min((dashboardData.reportsGenerated / 50) * 100, 100),
      description: `${dashboardData.totalRecords} individual records`
    }
  ] : [];

  const assemblyColumns = [
    {
      title: 'Assembly',
      dataIndex: 'assembly',
      key: 'assembly',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="font-medium">{text}</span>
        </div>
      )
    },
    {
      title: 'Income',
      dataIndex: 'income',
      key: 'income',
      render: (amount: number) => (
        <span className="font-semibold text-green-600">
          {formatCurrency(amount)}
        </span>
      ),
      sorter: (a: any, b: any) => a.income - b.income,
    },
    {
      title: 'Attendance',
      dataIndex: 'attendance',
      key: 'attendance',
      render: (count: number) => count.toLocaleString(),
      sorter: (a: any, b: any) => a.attendance - b.attendance,
    },
    {
      title: 'Records',
      dataIndex: 'records',
      key: 'records',
      render: (count: number) => (
        <Tag color="blue">{count} records</Tag>
      ),
      sorter: (a: any, b: any) => a.records - b.records,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<Eye size={16} />}
          onClick={() => fetchAssemblyDetails(record.assembly)}
          className="text-blue-600"
        >
          View Details
        </Button>
      ),
    },
  ];

  // Get all assemblies with data for the dropdown
  const assembliesWithData = dashboardData?.assemblyBreakdown.map(item => item.assembly) || [];
  
  // Combine all assemblies (from ASSEMBLIES) and mark which ones have data
  const allAssembliesWithStatus = ASSEMBLIES.map(assembly => ({
    name: assembly,
    hasData: assembliesWithData.includes(assembly)
  }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div className="mb-4 lg:mb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white rounded-lg shadow-sm border">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                District Financial Dashboard
              </h1>
              <p className="text-lg text-gray-600">
                Akowonjo District - Financial Overview & Analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
            <Calendar size={14} />
            <span>
              Viewing: {selectedMonth === 'all' ? 'All Months' : selectedMonth} {selectedYear}
              {selectedAssembly !== 'all' && ` • Assembly: ${selectedAssembly}`}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            icon={<Download size={16} />} 
            onClick={() => message.info('Export feature coming soon')}
          >
            Export Report
          </Button>
          <Button type="primary" icon={<BarChart3 size={16} />}>
            Analytics
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm mb-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <div className="flex items-center">
            <Filter size={18} className="mr-2 text-blue-600" />
            <span className="font-semibold text-gray-700">Dashboard Filters:</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full lg:w-auto">
            <Select 
              placeholder="Select Assembly" 
              style={{ width: '100%', minWidth: 200 }} 
              value={selectedAssembly}
              onChange={setSelectedAssembly}
              suffixIcon={<Building2 size={16} />}
              size="large"
            >
              <Option value="all">All Assemblies</Option>
              {allAssembliesWithStatus.map(assembly => (
                <Option key={assembly.name} value={assembly.name}>
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${assembly.hasData ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span>{assembly.name}</span>
                    </div>
                    {!assembly.hasData && (
                      <Tag color="default">No Data</Tag>
                    )}
                  </div>
                </Option>
              ))}
            </Select>

            <Select 
              placeholder="Select Month" 
              style={{ width: '100%', minWidth: 180 }} 
              value={selectedMonth}
              onChange={setSelectedMonth}
              suffixIcon={<Calendar size={16} />}
              size="large"
            >
              <Option value="all">All Months</Option>
              {MONTHS.map(month => (
                <Option key={month} value={month}>{month}</Option>
              ))}
            </Select>

            <Select 
              placeholder="Select Year" 
              style={{ width: '100%', minWidth: 140 }} 
              value={selectedYear}
              onChange={setSelectedYear}
              size="large"
            >
              <Option value="all">All Years</Option>
              {YEARS.map(year => (
                <Option key={year} value={year}>{year}</Option>
              ))}
            </Select>
          </div>

          <Button 
            onClick={fetchDashboardData}
            loading={loading}
            size="large"
            className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-lg"
          >
            Apply Filters
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
          <span className="ml-4 text-gray-600">Loading dashboard data...</span>
        </div>
      ) : (
        <>
          {/* Stats Grid - 3 cards now */}
          <Row gutter={[24, 24]} className="mb-6">
            {statsData.map((stat, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <Card 
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white"
                  bodyStyle={{ padding: '20px' }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `${stat.color}20` }}
                    >
                      <div style={{ color: stat.color }}>
                        {stat.icon}
                      </div>
                    </div>
                    <Tag color={stat.change.startsWith('+') ? 'green' : 'blue'}>
                      {stat.change.startsWith('+') ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {stat.change}
                    </Tag>
                  </div>
                  
                  <Statistic
                    title={
                      <span className="text-gray-600 font-medium">
                        {stat.title}
                      </span>
                    }
                    value={stat.value}
                    valueStyle={{
                      color: '#1f2937',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}
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

          <Row gutter={[24, 24]}>
            {/* Assembly Breakdown */}
            <Col xs={24} lg={16}>
              <Card 
                title={
                  <div className="flex items-center">
                    <PieChart size={20} className="mr-2" />
                    <span className="text-lg font-semibold">Assembly Financial Breakdown</span>
                  </div>
                }
                className="border-0 shadow-lg bg-white"
                extra={
                  <div className="flex items-center gap-2">
                    <Tag color="green">{dashboardData?.assemblyBreakdown.length || 0} Assemblies with Data</Tag>
                    <Button type="link" size="small">
                      View All
                    </Button>
                  </div>
                }
              >
                <Table
                  dataSource={dashboardData?.assemblyBreakdown || []}
                  columns={assemblyColumns}
                  pagination={false}
                  size="small"
                  scroll={{ y: 400 }}
                  rowKey="assembly"
                  summary={() => (
                    <Table.Summary>
                      <Table.Summary.Row className="bg-gray-50 font-semibold">
                        <Table.Summary.Cell index={0}>
                          <span className="font-bold">Total</span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          <span className="font-bold text-green-600">
                            {formatCurrency(dashboardData?.monthlyIncome || 0)}
                          </span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2}>
                          <span className="font-bold">
                            {(dashboardData?.activeMembers || 0).toLocaleString()}
                          </span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3}>
                          <Tag color="blue" className="font-bold">
                            {dashboardData?.totalRecords || 0} records
                          </Tag>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}></Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </Card>
            </Col>

            {/* Recent Activity & Financial Insights */}
            <Col xs={24} lg={8}>
              <Row gutter={[0, 24]}>
                {/* Recent Activity */}
                <Col span={24}>
                  <Card 
                    title={
                      <div className="flex items-center">
                        <FileText size={20} className="mr-2" />
                        <span className="text-lg font-semibold">Recent Activity</span>
                      </div>
                    }
                    className="border-0 shadow-lg bg-white"
                    extra={
                      <Button type="link" size="small">
                        View All
                      </Button>
                    }
                  >
                    <List
                      dataSource={dashboardData?.recentActivities || []}
                      renderItem={(item) => (
                        <List.Item className="border-0 px-0 py-3">
                          <List.Item.Meta
                            avatar={
                              <Avatar 
                                style={{ 
                                  backgroundColor: '#3b82f6',
                                  fontWeight: 'bold'
                                }}
                              >
                                {item.avatar}
                              </Avatar>
                            }
                            title={
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">
                                  {item.user}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {item.time}
                                </span>
                              </div>
                            }
                            description={
                              <span className="text-gray-600">
                                {item.action} <strong>{item.target}</strong>
                              </span>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>

                {/* Financial Insights */}
                <Col span={24}>
                  <Card 
                    title={
                      <div className="flex items-center">
                        <TrendingUp size={20} className="mr-2" />
                        <span className="text-lg font-semibold">Financial Insights</span>
                      </div>
                    }
                    className="border-0 shadow-lg bg-white"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium">Average per Assembly</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(Math.round((dashboardData?.monthlyIncome || 0) / (dashboardData?.assemblyBreakdown.length || 1)))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium">Records per Assembly</span>
                        <span className="font-bold text-green-600">
                          {Math.round((dashboardData?.totalRecords || 0) / (dashboardData?.assemblyBreakdown.length || 1))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="text-sm font-medium">Attendance Rate</span>
                        <span className="font-bold text-orange-600">
                          {Math.round(((dashboardData?.activeMembers || 0) / 5000) * 100)}%
                        </span>
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </>
      )}

      {/* Assembly Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Church size={20} />
            <span>{selectedAssemblyDetails?.assembly} - Detailed Report</span>
          </div>
        }
        open={assemblyModalVisible}
        onCancel={() => setAssemblyModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setAssemblyModalVisible(false)}>
            Close
          </Button>,
          <Button key="export" type="primary" icon={<Download size={16} />}>
            Export Report
          </Button>
        ]}
        width={1000}
      >
        {assemblyDetailsLoading ? (
          <div className="flex justify-center items-center h-32">
            <Spin size="large" />
            <span className="ml-4 text-gray-600">Loading assembly details...</span>
          </div>
        ) : selectedAssemblyDetails ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="Total Income"
                    value={formatCurrency(selectedAssemblyDetails.income)}
                    valueStyle={{ color: '#10b981', fontSize: '18px' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="Total Attendance"
                    value={selectedAssemblyDetails.attendance}
                    valueStyle={{ color: '#3b82f6', fontSize: '18px' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="Records"
                    value={selectedAssemblyDetails.records}
                    valueStyle={{ color: '#8b5cf6', fontSize: '18px' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Monthly Breakdown */}
            <Card title="Monthly Performance" size="small">
              <Table
                dataSource={selectedAssemblyDetails.monthlyData}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Month',
                    dataIndex: 'month',
                    key: 'month',
                  },
                  {
                    title: 'Income',
                    dataIndex: 'income',
                    key: 'income',
                    render: (amount: number) => formatCurrency(amount),
                  },
                  {
                    title: 'Attendance',
                    dataIndex: 'attendance',
                    key: 'attendance',
                  },
                  {
                    title: 'Records',
                    dataIndex: 'records',
                    key: 'records',
                  },
                ]}
              />
            </Card>

            {/* Recent Reports */}
            <Card title="Recent Reports" size="small">
              <List
                dataSource={selectedAssemblyDetails.recentReports}
                renderItem={(report) => (
                  <List.Item>
                    <List.Item.Meta
                      title={report.month}
                      description={`Submitted by ${report.submittedBy} on ${formatDate(report.createdAt)}`}
                    />
                    <div>{report.totalRecords} records</div>
                  </List.Item>
                )}
              />
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