// components/admin/FinancialReports.tsx
"use client";

import { Card, Table, Button, Tag, Space, Select, Statistic, Row, Col, message, Spin, Tabs, Progress, Tooltip } from "antd";
import { DollarSign, Download, Filter, Users, Church, Calendar, Building2, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { assemblies as ASSEMBLIES } from "@/lib/assemblies";

const { Option } = Select;
const { TabPane } = Tabs;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface FinancialSummary {
  totalIncome: number;
  totalTithe: number;
  totalOffering: number;
  totalAttendance: number;
  totalSBSAttendance: number;
  totalVisitors: number;
}

interface ReportData {
  titheSummary: any;
  offeringSummary: any;
  sundayServiceSummary: any;
  rawData: any;
}

interface PerAssembly {
  [key: string]: {
    hasData: boolean;
    lastUpdate: string | null;
    summary: FinancialSummary;
  };
}

export default function FinancialReports() {
  // Generate dynamic years (last 5 to current +1)
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 7 }, (_, i) => (currentYear - 5 + i).toString());

  // Set initial values to current date (live)
  const currentMonthIndex = new Date().getMonth();
  const currentMonth = MONTHS[currentMonthIndex];

  const [loading, setLoading] = useState(false);
  const [selectedAssembly, setSelectedAssembly] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [perAssembly, setPerAssembly] = useState<PerAssembly | null>(null);

  useEffect(() => {
    fetchReports();
  }, [selectedAssembly, selectedMonth, selectedYear]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAssembly !== 'all') params.append('assembly', selectedAssembly);
      if (selectedMonth !== 'all') params.append('month', selectedMonth);
      if (selectedYear !== 'all') params.append('year', selectedYear);

      const response = await fetch(`/api/financial-reports?${params}`);
      const result = await response.json();

      if (result.success) {
        setReportData(result.data);
        setSummary(result.summary);
        if (result.perAssembly) {
          setPerAssembly(result.perAssembly);
        }
      } else {
        message.error('Failed to fetch reports');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      message.error('Error fetching reports');
    } finally {
      setLoading(false);
    }
  };

  const handleAssemblyClick = (assembly: string) => {
    setSelectedAssembly(assembly);
  };

  const handleDownloadExcel = () => {
    message.info('Excel download feature coming soon');
  };

  // Calculate progress percentages for visual indicators
  const calculateProgress = (current: number, target: number = 1000000) => {
    return Math.min((current / target) * 100, 100);
  };

  const summaryData = summary ? [
    {
      title: 'Total Income',
      value: summary.totalIncome,
      color: '#10b981',
      prefix: '₦',
      progress: calculateProgress(summary.totalIncome),
      icon: <DollarSign className="text-green-500" />,
      description: 'Combined financial income'
    },
    {
      title: 'Total Tithe',
      value: summary.totalTithe,
      color: '#3b82f6',
      prefix: '₦',
      progress: calculateProgress(summary.totalTithe, 500000),
      icon: <Church className="text-blue-500" />,
      description: 'Tithe contributions'
    },
    {
      title: 'Total Offering',
      value: summary.totalOffering,
      color: '#8b5cf6',
      prefix: '₦',
      progress: calculateProgress(summary.totalOffering, 300000),
      icon: <Target className="text-purple-500" />,
      description: 'Offering collections'
    },
    {
      title: 'Total Attendance',
      value: summary.totalAttendance,
      color: '#f59e0b',
      prefix: '',
      progress: calculateProgress(summary.totalAttendance, 2000),
      icon: <Users className="text-orange-500" />,
      description: 'Weekly attendance'
    }
  ] : [];

  const titheColumns = [
    {
      title: 'Week',
      dataIndex: 'week',
      key: 'week',
      render: (text: string, record: any) => (
        <div className={record.type === 'total' ? 'font-bold' : ''}>
          {text}
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: any) => (
        <div className={record.type === 'total' ? 'font-bold text-blue-600' : 'text-gray-700'}>
          ₦{amount?.toLocaleString()}
        </div>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_: any, record: any) => (
        record.type !== 'total' && (
          <Progress 
            percent={calculateProgress(record.amount, 150000)} 
            size="small" 
            showInfo={false}
            strokeColor={{
              '0%': '#3b82f6',
              '100%': '#1d4ed8',
            }}
          />
        )
      ),
    }
  ];

  const offeringColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => (
        <Tag color={text.includes('Sunday') ? 'blue' : 'purple'}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <div className="font-semibold text-purple-600">
          ₦{amount?.toLocaleString()}
        </div>
      ),
    },
    {
      title: 'Percentage',
      key: 'percentage',
      render: (_: any, record: any) => {
        const total = reportData?.offeringSummary?.totalOffering || 1;
        const percentage = Math.round((record.amount / total) * 100);
        return (
          <div className="text-sm text-gray-500">
            {percentage}%
          </div>
        );
      },
    }
  ];

  const attendanceColumns = [
    {
      title: 'Metric',
      dataIndex: 'metric',
      key: 'metric',
      render: (text: string) => (
        <div className="font-medium">{text}</div>
      ),
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      render: (count: number, record: any) => (
        <div className={record.metric === 'Main Service' ? 'text-orange-600 font-semibold' : 'text-gray-700'}>
          {count?.toLocaleString()}
        </div>
      ),
    },
    {
      title: 'Growth',
      key: 'growth',
      render: () => null,
    }
  ];

  const titheData = reportData?.titheSummary ? [
    { week: 'Week 1', amount: reportData.titheSummary.week1 || 0 },
    { week: 'Week 2', amount: reportData.titheSummary.week2 || 0 },
    { week: 'Week 3', amount: reportData.titheSummary.week3 || 0 },
    { week: 'Week 4', amount: reportData.titheSummary.week4 || 0 },
    { week: 'Week 5', amount: reportData.titheSummary.week5 || 0 },
    { week: 'Total', amount: reportData.titheSummary.totalTithe || 0, type: 'total' }
  ] : [];

  const offeringData = reportData?.offeringSummary ? [
    { type: 'Sunday Offering', amount: reportData.offeringSummary.sundayOffering || 0 },
    { type: 'Weekly Offering', amount: (reportData.offeringSummary.totalOffering - reportData.offeringSummary.sundayOffering) || 0 },
    { type: 'Total Offering', amount: reportData.offeringSummary.totalOffering || 0, isTotal: true }
  ] : [];

  const attendanceData = reportData?.sundayServiceSummary ? [
    { metric: 'Main Service', count: reportData.sundayServiceSummary.attendance || 0 },
    { metric: 'SBS Attendance', count: reportData.sundayServiceSummary.sbsAttendance || 0 },
    { metric: 'Visitors', count: reportData.sundayServiceSummary.visitors || 0 }
  ] : [];

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div className="mb-4 lg:mb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white rounded-lg shadow-sm border">
              <Building2 className="text-blue-600" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Akowonjo District
              </h1>
              <p className="text-lg text-gray-600">
                Financial Reports & Analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
            <Calendar size={14} />
            <span>Viewing: {selectedMonth} {selectedYear}</span>
            {selectedAssembly !== 'all' && (
              <>
                <span>•</span>
                <span>Assembly: {selectedAssembly}</span>
              </>
            )}
          </div>
        </div>
        <Button 
          type="primary" 
          icon={<Download size={16} />}
          onClick={handleDownloadExcel}
          loading={loading}
          size="large"
          className="bg-blue-600 hover:bg-blue-700 border-0 shadow-lg"
        >
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm mb-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <div className="flex items-center">
            <Filter size={18} className="mr-2 text-blue-600" />
            <span className="font-semibold text-gray-700">Report Filters:</span>
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
              {ASSEMBLIES.map(assembly => (
                <Option key={assembly} value={assembly}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {assembly}
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
            onClick={fetchReports}
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
          <span className="ml-4 text-gray-600">Loading financial data...</span>
        </div>
      ) : (
        <>
          {/* Financial Summary */}
          <Row gutter={[24, 24]} className="mb-8">
            {summaryData.map((stat, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card 
                  className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-gray-600 text-sm font-medium mb-1">{stat.title}</p>
                      <p className="text-gray-400 text-xs">{stat.description}</p>
                    </div>
                    <div className="p-2 bg-white rounded-lg shadow-sm border">
                      {stat.icon}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-2xl font-bold" style={{ color: stat.color }}>
                      {stat.prefix}{stat.value?.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Tooltip title={`Progress towards monthly target`}>
                      <Progress 
                        percent={stat.progress} 
                        size="small" 
                        showInfo={false}
                        strokeColor={stat.color}
                      />
                    </Tooltip>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Detailed Reports */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <Tabs 
              defaultActiveKey="1"
              size="large"
              className="financial-tabs"
            >
              <TabPane 
                tab={
                  <span className="flex items-center gap-2 font-semibold">
                    <DollarSign size={18} className="text-blue-500" />
                    Tithe Report
                    <Tag color="blue" className="ml-1">
                      {titheData.reduce((sum, item) => sum + (item.amount || 0), 0)?.toLocaleString()}
                    </Tag>
                  </span>
                } 
                key="1"
              >
                <Table 
                  columns={titheColumns} 
                  dataSource={titheData}
                  pagination={false}
                  className="financial-table"
                  summary={() => (
                    <Table.Summary>
                      <Table.Summary.Row className="bg-gradient-to-r from-blue-50 to-blue-100">
                        <Table.Summary.Cell index={0}>
                          <strong className="text-blue-700">Monthly Total</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          <strong className="text-blue-700 text-lg">
                            ₦{reportData?.titheSummary?.totalTithe?.toLocaleString()}
                          </strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2}>
                          <Progress 
                            percent={calculateProgress(reportData?.titheSummary?.totalTithe || 0, 500000)} 
                            size="small" 
                            strokeColor="#3b82f6"
                          />
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </TabPane>

              <TabPane 
                tab={
                  <span className="flex items-center gap-2 font-semibold">
                    <Church size={18} className="text-purple-500" />
                    Offering Report
                    <Tag color="purple" className="ml-1">
                      {offeringData.find(item => item.isTotal)?.amount?.toLocaleString()}
                    </Tag>
                  </span>
                } 
                key="2"
              >
                <Table 
                  columns={offeringColumns} 
                  dataSource={offeringData.filter(item => !item.isTotal)}
                  pagination={false}
                  className="financial-table"
                  summary={() => (
                    <Table.Summary>
                      <Table.Summary.Row className="bg-gradient-to-r from-purple-50 to-purple-100">
                        <Table.Summary.Cell index={0}>
                          <strong className="text-purple-700">Total Offering</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          <strong className="text-purple-700 text-lg">
                            ₦{reportData?.offeringSummary?.totalOffering?.toLocaleString()}
                          </strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2}>
                          <div className="text-purple-600 font-semibold">
                            100%
                          </div>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </TabPane>

              <TabPane 
                tab={
                  <span className="flex items-center gap-2 font-semibold">
                    <Users size={18} className="text-orange-500" />
                    Attendance
                    <Tag color="orange" className="ml-1">
                      {attendanceData.reduce((sum, item) => sum + (item.count || 0), 0)?.toLocaleString()}
                    </Tag>
                  </span>
                } 
                key="3"
              >
                <Table 
                  columns={attendanceColumns} 
                  dataSource={attendanceData}
                  pagination={false}
                  className="financial-table"
                />
              </TabPane>
            </Tabs>
          </Card>

          {/* Assembly Status - only when viewing all */}
          {selectedAssembly === 'all' && perAssembly && (
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <Building2 size={20} className="text-gray-600" />
                  <span className="text-lg font-semibold">Assembly Submission Status</span>
                </div>
              }
              className="border-0 shadow-xl bg-white/80 backdrop-blur-sm mt-8"
            >
              <Row gutter={[16, 16]}>
                {ASSEMBLIES.map((assembly, index) => {
                  const assData = perAssembly[assembly];
                  const hasData = assData?.hasData || false;
                  const lastUpdate = assData?.lastUpdate;
                  const updateDate = lastUpdate ? new Date(lastUpdate).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }) : 'No submissions';
                  return (
                    <Col xs={24} sm={12} lg={6} key={assembly}>
                      <Card 
                        size="small" 
                        className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        bodyStyle={{ padding: '16px' }}
                        onClick={() => handleAssemblyClick(assembly)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: index % 2 === 0 ? '#10b981' : '#3b82f6'
                              }}
                            ></div>
                            <span className="font-medium">{assembly}</span>
                          </div>
                          <Tag color={hasData ? "green" : "default"}>
                            {hasData ? "Submitted" : "Pending"}
                          </Tag>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Last update: {updateDate}
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          )}
        </>
      )}
    </div>
  );
}