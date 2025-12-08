// components/admin/SundayServiceReportsTable.tsx
"use client";

import { useState, useEffect } from "react";
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
  Progress,
  Avatar,
  Badge,
  Switch,
  Typography
} from "antd";
import { 
  SearchOutlined, 
  FilterOutlined, 
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  TeamOutlined,
  BarChartOutlined,
  SortAscendingOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  RightOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import { Church } from "lucide-react";

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface ReportRecord {
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

interface Report {
  id: string;
  assembly: string;
  month: string;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
  records: ReportRecord[];
}

interface ReportsResponse {
  success: boolean;
  data: {
    reports: Report[];
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
    };
  };
}

// Extended interface for detailed view
interface ExtendedReport extends Report {
  totalIncome: number;
  totalAttendance: number;
  averagePerRecord: number;
  weekCount: number;
  lastUpdated: string;
}

export default function SundayServiceReportsTable() {
  const [reports, setReports] = useState<ExtendedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedReport, setSelectedReport] = useState<ExtendedReport | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    assembly: '',
    month: '',
    search: '',
    dateRange: null as any,
    sortBy: 'date',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Initialize filters
  const [assemblies, setAssemblies] = useState<string[]>([]);
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    fetchReports();
    fetchFilterOptions();
  }, [pagination.page, pagination.pageSize, filters]);

  const fetchFilterOptions = async () => {
    try {
      // You can get these from your API or use static data
      const assembliesData = ['Liberty', 'Jubilee', 'RayPower', 'Victory', 'Grace', 'Mercy'];
      const monthsData = ['December-2025', 'November-2025', 'October-2025', 'September-2025'];
      
      setAssemblies(assembliesData);
      setMonths(monthsData);
    } catch (error) {
      console.error('Error fetching filter options:', error);
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
        ...(filters.search && { search: filters.search }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      if (filters.dateRange) {
        params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
      }

      const response = await fetch(`/api/admin/reports/detailed?${params}`);
      const result: ReportsResponse = await response.json();

      if (result.success) {
        const extendedReports = result.data.reports.map(report => ({
          ...report,
          totalIncome: report.records.reduce((sum, record) => sum + record.total, 0),
          totalAttendance: report.records.reduce((sum, record) => sum + record.totalAttendance, 0),
          averagePerRecord: report.records.reduce((sum, record) => sum + record.total, 0) / report.records.length,
          weekCount: report.records.length,
          lastUpdated: report.updatedAt,
        }));

        setReports(extendedReports);
        setPagination(prev => ({
          ...prev,
          total: result.data.pagination.total,
        }));
      } else {
        message.error('Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      message.error('Error loading reports');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination: any, filters: any, sorter: any) => {
    setPagination({
      page: newPagination.current,
      pageSize: newPagination.pageSize,
      total: newPagination.total,
    });
    
    if (sorter.field) {
      setFilters(prev => ({
        ...prev,
        sortBy: sorter.field,
        sortOrder: sorter.order === 'ascend' ? 'asc' : 'desc',
      }));
    }
  };

  const showReportDetails = (report: ExtendedReport) => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    message.info(`Exporting to ${format.toUpperCase()}...`);
    // Implement export logic here
  };

  const handleDeleteReport = (id: string) => {
    Modal.confirm({
      title: 'Delete Report',
      content: 'Are you sure you want to delete this report? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Implement delete API call
          message.success('Report deleted successfully');
          fetchReports();
        } catch (error) {
          message.error('Failed to delete report');
        }
      },
    });
  };

  const getStatusColor = (report: ExtendedReport) => {
    const daysSinceUpdate = dayjs().diff(dayjs(report.updatedAt), 'days');
    if (daysSinceUpdate > 30) return 'error';
    if (daysSinceUpdate > 7) return 'warning';
    return 'success';
  };

  const getStatusText = (report: ExtendedReport) => {
    const daysSinceUpdate = dayjs().diff(dayjs(report.updatedAt), 'days');
    if (daysSinceUpdate > 30) return 'Outdated';
    if (daysSinceUpdate > 7) return 'Needs Review';
    return 'Up to Date';
  };

  // Define columns for the main table
  const columns: ColumnsType<ExtendedReport> = [
    {
      title: 'Assembly',
      dataIndex: 'assembly',
      key: 'assembly',
      width: 150,
      fixed: 'left',
      sorter: true,
      render: (assembly: string) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Church className="text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{assembly}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <EnvironmentOutlined style={{ fontSize: '10px' }} />
              Akowonjo District
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Month/Year',
      dataIndex: 'month',
      key: 'month',
      width: 120,
      sorter: true,
      render: (month: string) => {
        const [monthName, year] = month.split('-');
        return (
          <div className="text-center">
            <div className="font-semibold text-gray-900">{monthName}</div>
            <div className="text-xs text-gray-500">{year}</div>
          </div>
        );
      },
    },
    {
      title: 'Weeks',
      key: 'weeks',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <div className="flex flex-col items-center">
          <Badge 
            count={record.weekCount} 
            style={{ backgroundColor: '#1890ff' }}
          />
          <div className="text-xs text-gray-500 mt-1">weeks</div>
        </div>
      ),
    },
    {
      title: 'Total Income',
      key: 'totalIncome',
      width: 150,
      sorter: (a, b) => a.totalIncome - b.totalIncome,
      render: (_, record) => (
        <div>
          <div className="font-bold text-green-600">
            ₦{record.totalIncome.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            ₦{Math.round(record.averagePerRecord).toLocaleString()}/week
          </div>
        </div>
      ),
    },
    {
      title: 'Attendance',
      key: 'attendance',
      width: 120,
      sorter: (a, b) => a.totalAttendance - b.totalAttendance,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <TeamOutlined className="text-blue-500" />
          <div>
            <div className="font-semibold">{record.totalAttendance.toLocaleString()}</div>
            <div className="text-xs text-gray-500">
              {record.records.length > 0 && 
                Math.round(record.totalAttendance / record.records.length)
              } avg/week
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Submitted By',
      dataIndex: 'submittedBy',
      key: 'submittedBy',
      width: 140,
      render: (submittedBy: string, record) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div className="font-medium text-sm">{submittedBy.trim()}</div>
            <div className="text-xs text-gray-500">
              {dayjs(record.createdAt).format('MMM D')}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const statusColor = getStatusColor(record);
        const statusText = getStatusText(record);
        const daysAgo = dayjs().diff(dayjs(record.updatedAt), 'days');
        
        return (
          <Tag 
            color={statusColor === 'error' ? 'red' : statusColor === 'warning' ? 'orange' : 'green'}
            icon={statusColor === 'success' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            className="font-medium"
          >
            {statusText}
            <div className="text-xs opacity-75">
              {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
            </div>
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => {
        const items: MenuProps['items'] = [
          {
            key: '1',
            label: 'View Details',
            icon: <EyeOutlined />,
            onClick: () => showReportDetails(record),
          },
          {
            key: '2',
            label: 'Edit Report',
            icon: <EditOutlined />,
            onClick: () => message.info('Edit feature coming soon'),
          },
          {
            key: '3',
            label: 'Export',
            icon: <DownloadOutlined />,
            children: [
              { key: '3-1', label: 'Export as PDF' },
              { key: '3-2', label: 'Export as Excel' },
              { key: '3-3', label: 'Export as CSV' },
            ],
          },
          {
            type: 'divider',
          },
          {
            key: '4',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDeleteReport(record.id),
          },
        ];

        return (
          <Space>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => showReportDetails(record)}
              size="small"
            />
            <Dropdown menu={{ items }} placement="bottomRight">
              <Button icon={<MoreOutlined />} size="small" />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  // Columns for the expanded row (weekly records)
  const expandedRowRender = (record: ExtendedReport) => {
    const weekColumns: ColumnsType<ReportRecord> = [
      {
        title: 'Week',
        dataIndex: 'week',
        key: 'week',
        width: 100,
        render: (week) => (
          <Tag color="blue" className="font-bold">
            {week}
          </Tag>
        ),
      },
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        width: 120,
        render: (date) => dayjs(date).format('MMM D, YYYY'),
      },
      {
        title: 'Attendance',
        key: 'attendance',
        width: 200,
        render: (_, record) => (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Main:</span>
              <span className="font-semibold">{record.attendance}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">SBS:</span>
              <span className="font-semibold">{record.sbsAttendance}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Visitors:</span>
              <span className="font-semibold text-green-600">{record.visitors}</span>
            </div>
            <Progress 
              percent={Math.min((record.totalAttendance / 200) * 100, 100)} 
              size="small" 
              showInfo={false}
            />
          </div>
        ),
      },
      {
        title: 'Financial Breakdown',
        key: 'financial',
        width: 300,
        render: (_, record) => (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1">
              <div className="text-xs">
                <div className="text-gray-500">Tithes:</div>
                <div className="font-semibold">₦{record.tithes.toLocaleString()}</div>
              </div>
              <div className="text-xs">
                <div className="text-gray-500">Offerings:</div>
                <div className="font-semibold">₦{record.offerings.toLocaleString()}</div>
              </div>
              <div className="text-xs">
                <div className="text-gray-500">Special Offerings:</div>
                <div className="font-semibold">₦{record.specialOfferings.toLocaleString()}</div>
              </div>
              <div className="text-xs">
                <div className="text-gray-500">Thanksgiving:</div>
                <div className="font-semibold">₦{record.thanksgiving.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'Total',
        key: 'total',
        width: 120,
        render: (_, record) => (
          <div className="text-center">
            <div className="font-bold text-lg text-green-600">
              ₦{record.total.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {record.totalAttendance} attendees
            </div>
          </div>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 80,
        render: () => (
          <Button type="link" size="small" icon={<RightOutlined />}>
            Details
          </Button>
        ),
      },
    ];

    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="mb-4 flex justify-between items-center">
          <h4 className="font-semibold text-gray-700">
            Weekly Breakdown for {record.assembly} - {record.month}
          </h4>
          <div className="text-sm text-gray-500">
            Total: ₦{record.totalIncome.toLocaleString()} across {record.weekCount} weeks
          </div>
        </div>
        <Table
          columns={weekColumns}
          dataSource={record.records}
          pagination={false}
          size="small"
          rowKey="id"
        />
      </div>
    );
  };

  // Stats Cards
  const statsCards = [
    {
      title: 'Total Reports',
      value: pagination.total,
      icon: <FileTextOutlined className="text-blue-500 text-2xl" />,
      color: 'blue',
      change: '+12%',
    },
    {
      title: 'Total Assemblies',
      value: new Set(reports.map(r => r.assembly)).size,
      icon: <Church className="text-green-500 text-2xl" />,
      color: 'green',
      change: '+2',
    },
    {
      title: 'Total Income',
      value: `₦${reports.reduce((sum, r) => sum + r.totalIncome, 0).toLocaleString()}`,
      icon: <DollarOutlined className="text-orange-500 text-2xl" />,
      color: 'orange',
      change: '+8%',
    },
    {
      title: 'Total Attendance',
      value: reports.reduce((sum, r) => sum + r.totalAttendance, 0).toLocaleString(),
      icon: <TeamOutlined className="text-purple-500 text-2xl" />,
      color: 'purple',
      change: '+15%',
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">

      {/* Main Table */}
      <Card className="border-0 shadow-sm">
        <Table
          columns={columns}
          dataSource={reports}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} reports`,
          }}
          onChange={handleTableChange}
          expandable={{
            expandedRowRender,
            expandedRowKeys: expandedRows,
            onExpand: (expanded, record) => {
              if (expanded) {
                setExpandedRows([...expandedRows, record.id]);
              } else {
                setExpandedRows(expandedRows.filter(id => id !== record.id));
              }
            },
            rowExpandable: (record) => record.records.length > 0,
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined />
            <span>Report Details</span>
            {selectedReport && (
              <Tag color="blue" className="ml-2">{selectedReport.assembly}</Tag>
            )}
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width="95%"
        style={{ maxWidth: 1200 }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          <Button key="export" type="primary" icon={<DownloadOutlined />}>
            Export Full Report
          </Button>,
        ]}
      >
        {selectedReport && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Weeks"
                    value={selectedReport.weekCount}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Income"
                    value={selectedReport.totalIncome}
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                    formatter={(value) => `₦${Number(value).toLocaleString()}`}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Total Attendance"
                    value={selectedReport.totalAttendance}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Average/Week"
                    value={Math.round(selectedReport.averagePerRecord)}
                    prefix={<BarChartOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                    formatter={(value) => `₦${Number(value).toLocaleString()}`}
                  />
                </Card>
              </Col>
            </Row>

            {/* Detailed Table */}
            <Table
              title={() => (
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Weekly Financial Details</h4>
                  <div className="text-sm text-gray-500">
                    Month: {selectedReport.month}
                  </div>
                </div>
              )}
              columns={[
                { title: 'Week', dataIndex: 'week', key: 'week' },
                { title: 'Date', dataIndex: 'date', key: 'date', render: (date) => dayjs(date).format('MMM D, YYYY') },
                { title: 'Attendance', dataIndex: 'totalAttendance', key: 'totalAttendance' },
                { title: 'Tithes', dataIndex: 'tithes', key: 'tithes', render: (value) => `₦${value.toLocaleString()}` },
                { title: 'Offerings', dataIndex: 'offerings', key: 'offerings', render: (value) => `₦${value.toLocaleString()}` },
                { title: 'Special Offerings', dataIndex: 'specialOfferings', key: 'specialOfferings', render: (value) => `₦${value.toLocaleString()}` },
                { title: 'Thanksgiving', dataIndex: 'thanksgiving', key: 'thanksgiving', render: (value) => `₦${value.toLocaleString()}` },
                { title: 'Total', dataIndex: 'total', key: 'total', render: (value) => (
                  <div className="font-bold text-green-600">₦{value.toLocaleString()}</div>
                )},
              ]}
              dataSource={selectedReport.records}
              rowKey="id"
              pagination={false}
            />

            {/* Additional Info */}
            <Card title="Report Information" size="small">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-500 text-sm">Submitted By</div>
                  <div className="font-medium">{selectedReport.submittedBy}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-sm">Submitted On</div>
                  <div className="font-medium">
                    {dayjs(selectedReport.createdAt).format('MMM D, YYYY h:mm A')}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-sm">Last Updated</div>
                  <div className="font-medium">
                    {dayjs(selectedReport.updatedAt).format('MMM D, YYYY h:mm A')}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-sm">Report Status</div>
                  <div>
                    <Tag color={getStatusColor(selectedReport)}>
                      {getStatusText(selectedReport)}
                    </Tag>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}