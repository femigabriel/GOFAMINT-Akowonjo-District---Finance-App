// app/reports/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Statistic,
  Select,
  DatePicker,
  Row,
  Col,
  Tabs,
  Tag,
  Spin,
  Alert,
  Space,
  Button,
  Typography
} from 'antd';
import {
  BankOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  FilterOutlined,
  ReloadOutlined,
  EyeOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { assemblies } from '@/lib/assemblies';
import type { Report, DetailedReportResponse, ReportRecord, FinancialSummary } from '@/types/reports';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// Types
interface ReportRecordExtended extends ReportRecord {
  assembly: string;
  month: string;
  serviceType: string;
  submittedBy: string;
}

export default function FinancialReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [selectedAssembly, setSelectedAssembly] = useState<string>('all');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('summary');

  // Fetch reports
  const fetchReports = async (assembly?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = assembly && assembly !== 'all' 
        ? `/api/admin/reports/detailed?assembly=${assembly}`
        : '/api/admin/reports/detailed';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch reports');
      
      const data: DetailedReportResponse = await response.json();
      if (data.success) {
        setReports(data.data.reports);
        setFilteredReports(data.data.reports);
        setSummary(data.data.summary);
      } else {
        throw new Error('Failed to load reports');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Handle assembly change
  const handleAssemblyChange = (assembly: string) => {
    setSelectedAssembly(assembly);
    if (assembly === 'all') {
      fetchReports();
    } else {
      fetchReports(assembly);
    }
  };

  // Filter reports based on selections
  useEffect(() => {
    let filtered = [...reports];
    
    if (selectedServiceType !== 'all') {
      filtered = filtered.filter(report => report.serviceType === selectedServiceType);
    }
    
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(report => report.month === selectedMonth);
    }
    
    setFilteredReports(filtered);
  }, [selectedServiceType, selectedMonth, reports]);

  // Get unique months from reports
  const uniqueMonths = Array.from(new Set(reports.map(report => report.month)));

  // Prepare data for detailed table
  const tableData = filteredReports.flatMap(report => 
    report.records.map(record => ({
      key: `${report.id}-${record.id}`,
      ...record,
      assembly: report.assembly,
      month: report.month,
      serviceType: report.serviceType,
      submittedBy: report.submittedBy,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt
    }))
  );

  // Summary Statistics Cards
  const SummaryCards = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Income"
            value={summary?.totalIncome || 0}
            precision={0}
            valueStyle={{ color: '#3f8600' }}
            prefix={<DollarOutlined />}
            suffix="₦"
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Attendance"
            value={summary?.totalAttendance || 0}
            valueStyle={{ color: '#1890ff' }}
            prefix={<TeamOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Assemblies"
            value={summary?.totalAssemblies || 0}
            valueStyle={{ color: '#722ed1' }}
            prefix={<BankOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Reports"
            value={summary?.totalReports || 0}
            valueStyle={{ color: '#13c2c2' }}
            prefix={<BarChartOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );

  // Service Type Breakdown
  const ServiceBreakdown = () => (
    <Row gutter={[16, 16]} className="mt-6">
      <Col xs={24} sm={12}>
        <Card title="Service Type Income">
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Sunday"
                value={summary?.sundayIncome || 0}
                precision={0}
                prefix="₦"
                valueStyle={{ fontSize: '20px' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Midweek"
                value={summary?.midweekIncome || 0}
                precision={0}
                prefix="₦"
                valueStyle={{ fontSize: '20px' }}
              />
            </Col>
          </Row>
        </Card>
      </Col>
      <Col xs={24} sm={12}>
        <Card title="Service Type Attendance">
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Sunday"
                value={summary?.sundayAttendance || 0}
                valueStyle={{ fontSize: '20px' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Midweek"
                value={summary?.midweekAttendance || 0}
                valueStyle={{ fontSize: '20px' }}
              />
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );

  // Table columns
  const columns = [
    {
      title: 'Assembly',
      dataIndex: 'assembly',
      key: 'assembly',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (text: string) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: 'Service Type',
      dataIndex: 'serviceType',
      key: 'serviceType',
      render: (text: string) => (
        <Tag color={text === 'sunday' ? 'green' : 'orange'}>
          {text.charAt(0).toUpperCase() + text.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text: string, record: any) => (
        <Space>
          <CalendarOutlined />
          <span>{text || record.day}</span>
        </Space>
      ),
    },
    {
      title: 'Week',
      dataIndex: 'week',
      key: 'week',
      render: (text: string) => text || '-',
    },
    {
      title: 'Attendance',
      dataIndex: 'attendance',
      key: 'attendance',
      render: (text: number) => <Text strong>{text}</Text>,
    },
    {
      title: 'Tithes',
      dataIndex: 'tithes',
      key: 'tithes',
      render: (text: number) => (
        <Text type="success">₦{text?.toLocaleString() || 0}</Text>
      ),
    },
    {
      title: 'Offerings',
      dataIndex: 'offerings',
      key: 'offerings',
      render: (text: number) => (
        <Text type="warning">₦{text?.toLocaleString() || 0}</Text>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (text: number) => (
        <Text strong type="danger">₦{text?.toLocaleString()}</Text>
      ),
    },
    {
      title: 'Submitted By',
      dataIndex: 'submittedBy',
      key: 'submittedBy',
      render: (text: string) => <Text type="secondary">{text}</Text>,
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => fetchReports()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Title level={2}>Financial Reports</Title>
          <Text type="secondary">View and analyze financial contributions across assemblies</Text>
        </div>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => fetchReports()}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Text strong className="block mb-2">Filter by Assembly</Text>
            <Select
              className="w-full"
              placeholder="Select Assembly"
              value={selectedAssembly}
              onChange={handleAssemblyChange}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">All Assemblies</Option>
              {assemblies.map(assembly => (
                <Option key={assembly} value={assembly}>
                  {assembly}
                </Option>
              ))}
            </Select>
          </div>
          
          <div className="flex-1">
            <Text strong className="block mb-2">Service Type</Text>
            <Select
              className="w-full"
              placeholder="Service Type"
              value={selectedServiceType}
              onChange={setSelectedServiceType}
            >
              <Option value="all">All Services</Option>
              <Option value="sunday">Sunday Service</Option>
              <Option value="midweek">Midweek Service</Option>
            </Select>
          </div>
          
          <div className="flex-1">
            <Text strong className="block mb-2">Month</Text>
            <Select
              className="w-full"
              placeholder="Select Month"
              value={selectedMonth}
              onChange={setSelectedMonth}
            >
              <Option value="all">All Months</Option>
              {uniqueMonths.map(month => (
                <Option key={month} value={month}>
                  {month}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Summary Dashboard" key="summary">
          <SummaryCards />
          <ServiceBreakdown />
          
          {/* Assemblies Overview */}
          <Card title="Assemblies Overview" className="mt-6">
            <Table
              dataSource={filteredReports.map(report => ({
                key: report.id,
                assembly: report.assembly,
                serviceType: report.serviceType,
                month: report.month,
                recordsCount: report.records.length,
                totalIncome: report.records.reduce((sum, record) => sum + (record.total || 0), 0),
                submittedBy: report.submittedBy,
              }))}
              columns={[
                { title: 'Assembly', dataIndex: 'assembly', key: 'assembly' },
                { 
                  title: 'Service Type', 
                  dataIndex: 'serviceType', 
                  key: 'serviceType',
                  render: (text) => (
                    <Tag color={text === 'sunday' ? 'green' : 'orange'}>
                      {text}
                    </Tag>
                  )
                },
                { title: 'Month', dataIndex: 'month', key: 'month' },
                { title: 'Records', dataIndex: 'recordsCount', key: 'recordsCount' },
                { 
                  title: 'Total Income', 
                  dataIndex: 'totalIncome', 
                  key: 'totalIncome',
                  render: (text) => `₦${text?.toLocaleString()}`
                },
                { title: 'Submitted By', dataIndex: 'submittedBy', key: 'submittedBy' },
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </TabPane>
        
        <TabPane tab="Detailed Records" key="detailed">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <Title level={5} className="mb-0">
                Detailed Financial Records
              </Title>
              <Text type="secondary">
                Showing {tableData.length} records
              </Text>
            </div>
            <Table
              dataSource={tableData}
              columns={columns}
              scroll={{ x: 1000 }}
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} records`
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Total Summary */}
      <Card className="mt-6">
        <Title level={5}>Summary for {selectedAssembly === 'all' ? 'All Assemblies' : selectedAssembly}</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title="Total Income"
              value={filteredReports.flatMap(r => r.records).reduce((sum, record) => sum + (record.total || 0), 0)}
              precision={0}
              prefix="₦"
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title="Total Attendance"
              value={filteredReports.flatMap(r => r.records).reduce((sum, record) => sum + (record.attendance || 0), 0)}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic
              title="Total Tithes"
              value={filteredReports.flatMap(r => r.records).reduce((sum, record) => sum + (record.tithes || 0), 0)}
              precision={0}
              prefix="₦"
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}