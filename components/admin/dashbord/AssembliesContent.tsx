// components/admin/AssembliesContent.tsx
"use client";

import { Card, Table, Button, Tag, Space, Input, message, Modal, Form, Select, Tooltip, Row, Col, Statistic, DatePicker, Dropdown, Spin } from "antd";
import { Church, Plus, Search, Edit, MapPin, Users, Eye, Download, BarChart3, Calendar, Filter, MoreVertical, FileText, DollarSign, TrendingUp, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { assemblies as ALL_ASSEMBLIES } from "@/lib/assemblies";
import type { MenuProps } from "antd";

const { Search: SearchInput } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Assembly {
  key: string;
  name: string;
  members: number;
  status: 'active' | 'inactive';
  pastor: string;
  established: string;
  location: string;
  totalIncome: number;
  lastReport: string;
  reportsCount: number;
  totalRecords: number;
  hasData: boolean; // New field to indicate if assembly has data
}

interface AssemblyReport {
  month: string;
  income: number;
  attendance: number;
  tithes: number;
  offerings: number;
  submittedBy: string;
  submittedDate: string;
}

interface AssemblyDetails {
  assembly: string;
  pastor: string;
  location: string;
  established: string;
  totalIncome: number;
  totalAttendance: number;
  totalRecords: number;
  reportsCount: number;
  monthlyData: Array<{
    month: string;
    income: number;
    attendance: number;
    records: number;
  }>;
  recentReports: AssemblyReport[];
}

interface AssemblyFromAPI {
  name: string;
  members: number;
  status: 'active' | 'inactive';
  pastor: string;
  established: string; // ISO string
  location: string;
  totalIncome: number;
  lastReport: string; // ISO string
  reportsCount: number;
  totalRecords: number;
}

export default function AssembliesContent() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assembliesLoading, setAssembliesLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editingAssembly, setEditingAssembly] = useState<Assembly | null>(null);
  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | null>(null);
  const [assemblyDetails, setAssemblyDetails] = useState<AssemblyDetails | null>(null);
  const [assemblyReports, setAssemblyReports] = useState<AssemblyReport[]>([]);
  const [assembliesData, setAssembliesData] = useState<Assembly[]>([]);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<any>(null);

  // Fetch real assemblies data
 const fetchAssembliesData = async () => {
  setAssembliesLoading(true);
  try {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'no-data') {
      params.append('status', statusFilter);
    }

    const response = await fetch(`/api/admin/assemblies?${params}`);
    const result = await response.json();

    const apiAssemblies: AssemblyFromAPI[] = result.success ? result.data : [];

    // Create lookup map: assemblyName → data
    const dataMap = new Map<string, AssemblyFromAPI>(
      apiAssemblies.map((a) => [a.name, a])
    );

    // Combine ALL assemblies with API data
    const combinedData: Assembly[] = ALL_ASSEMBLIES.map((assemblyName, index) => {
      const apiData = dataMap.get(assemblyName);

      if (apiData) {
        return {
          key: (index + 1).toString(),
          name: apiData.name,
          members: apiData.members,
          status: apiData.status,
          pastor: apiData.pastor,
          established: new Date(apiData.established).toISOString().split('T')[0],
          location: apiData.location,
          totalIncome: apiData.totalIncome,
          lastReport: new Date(apiData.lastReport).toISOString().split('T')[0],
          reportsCount: apiData.reportsCount,
          totalRecords: apiData.totalRecords,
          hasData: true,
        };
      }

      // No data in DB
      return {
        key: (index + 1).toString(),
        name: assemblyName,
        members: 0,
        status: 'inactive' as const,
        pastor: `Pastor ${assemblyName.split(' ')[0]}`,
        established: new Date().toISOString().split('T')[0],
        location: `${assemblyName} Assembly`,
        totalIncome: 0,
        lastReport: 'No reports',
        reportsCount: 0,
        totalRecords: 0,
        hasData: false,
      };
    });

    setAssembliesData(combinedData);
  } catch (error) {
    console.error('Fetch error:', error);
    message.error('Error fetching assemblies data');
  } finally {
    setAssembliesLoading(false);
  }
};

  // Fetch assembly details
  const fetchAssemblyDetails = async (assemblyName: string) => {
    setDetailsLoading(true);
    try {
      const response = await fetch(`/api/admin/assemblies/${encodeURIComponent(assemblyName)}`);
      const result = await response.json();

      if (result.success) {
        setAssemblyDetails(result.data);
        setAssemblyReports(result.data.recentReports);
      } else {
        // If no data found, create empty details
        setAssemblyDetails({
          assembly: assemblyName,
          pastor: `Pastor ${assemblyName.split(' ')[0]}`,
          location: `${assemblyName} Assembly`,
          established: new Date().toISOString(),
          totalIncome: 0,
          totalAttendance: 0,
          totalRecords: 0,
          reportsCount: 0,
          monthlyData: [],
          recentReports: []
        });
        setAssemblyReports([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      message.error('Error fetching assembly details');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssembliesData();
  }, [statusFilter]);

  // Filter data based on search
  const filteredData = assembliesData.filter((assembly) => {
    const matchesSearch = !searchText || 
      assembly.name.toLowerCase().includes(searchText.toLowerCase()) ||
      assembly.pastor.toLowerCase().includes(searchText.toLowerCase()) ||
      assembly.location.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = !statusFilter || assembly.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleExportToExcel = (assembly: Assembly) => {
    if (!assembly.hasData) {
      message.warning(`No data available to export for ${assembly.name}`);
      return;
    }

    try {
      // Use real data from assemblyDetails if available
      const reports = assemblyDetails?.recentReports || [];
      
      const headers = [
        `${assembly.name} - Financial Report`,
        `Generated on ${new Date().toLocaleDateString()}`,
        `Pastor: ${assembly.pastor} | Location: ${assembly.location}`,
        "",
        "Month,Income,Attendance,Tithes,Offerings,Submitted By,Submitted Date"
      ];

      const rows = reports.map(report => [
        report.month,
        report.income,
        report.attendance,
        report.tithes,
        report.offerings,
        report.submittedBy,
        new Date(report.submittedDate).toLocaleDateString()
      ]);

      const totals = [
        "TOTAL",
        reports.reduce((sum, r) => sum + r.income, 0),
        reports.reduce((sum, r) => sum + r.attendance, 0),
        reports.reduce((sum, r) => sum + r.tithes, 0),
        reports.reduce((sum, r) => sum + r.offerings, 0),
        "",
        ""
      ];

      const csvLines = [
        ...headers,
        ...rows.map(row => row.join(",")),
        totals.join(",")
      ];

      const csvContent = csvLines.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${assembly.name.replace(/\s+/g, '_')}_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      message.success(`Report for ${assembly.name} exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export report');
    }
  };

  const handleViewDetails = async (assembly: Assembly) => {
    setSelectedAssembly(assembly);
    await fetchAssemblyDetails(assembly.name);
    setIsDetailsModalVisible(true);
  };

  const handleRefresh = () => {
    fetchAssembliesData();
    message.success('Data refreshed successfully!');
  };

  const handleExportAll = () => {
    // Export only assemblies that have data
    const assembliesWithData = filteredData.filter(assembly => assembly.hasData);
    
    if (assembliesWithData.length === 0) {
      message.warning('No assemblies with data available to export');
      return;
    }

    try {
      const headers = [
        "Akowonjo District - All Assemblies Report",
        `Generated on ${new Date().toLocaleDateString()}`,
        "",
        "Assembly Name,Pastor,Location,Members,Total Income,Reports Count,Status,Established,Has Data"
      ];

      const rows = assembliesWithData.map(assembly => [
        assembly.name,
        assembly.pastor,
        assembly.location,
        assembly.members,
        assembly.totalIncome,
        assembly.reportsCount,
        assembly.status,
        assembly.established,
        "Yes"
      ]);

      const csvContent = [...headers, ...rows.map(row => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `All_Assemblies_Report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      message.success(`${assembliesWithData.length} assemblies exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export all assemblies report');
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleStatusChange = (value: string | undefined) => {
    setStatusFilter(value);
  };

  const columns = [
    {
      title: 'Assembly Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Assembly) => (
        <div className="flex items-center">
          <Church size={16} className="mr-2 text-blue-600" />
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500 flex items-center">
              <MapPin size={12} className="mr-1" />
              {record.location}
           
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Pastor',
      dataIndex: 'pastor',
      key: 'pastor',
      render: (pastor: string) => (
        <div className="text-sm font-medium">{pastor}</div>
      ),
    },
    {
      title: 'Members',
      dataIndex: 'members',
      key: 'members',
      render: (members: number, record: Assembly) => (
        <div className="flex items-center">
          <Users size={14} className="mr-1 text-gray-500" />
          <span className="font-medium">
            {record.hasData ? members.toLocaleString() : 'N/A'}
          </span>
        </div>
      ),
    },
    {
      title: 'Total Income',
      dataIndex: 'totalIncome',
      key: 'totalIncome',
      render: (income: number, record: Assembly) => (
        <div className={`font-semibold ${record.hasData ? 'text-green-600' : 'text-gray-400'}`}>
          {record.hasData ? `₦${income.toLocaleString()}` : 'N/A'}
        </div>
      ),
    },
    {
      title: 'Reports',
      dataIndex: 'reportsCount',
      key: 'reportsCount',
      render: (count: number, record: Assembly) => (
        <Tag color={record.hasData ? 'blue' : 'default'}>
          {record.hasData ? `${count} reports` : 'No reports'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: 'active' | 'inactive', record: Assembly) => (
        <Tag color={record.hasData ? (status === 'active' ? 'green' : 'red') : 'default'}>
          {record.hasData ? status.toUpperCase() : 'NO DATA'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Assembly) => {
        const items: MenuProps['items'] = [
          {
            key: 'view',
            label: 'View Details',
            icon: <Eye size={14} />,
            onClick: () => handleViewDetails(record),
          },
          ...(record.hasData ? [{
            key: 'export',
            label: 'Export Report',
            icon: <Download size={14} />,
            onClick: () => handleExportToExcel(record),
          }] : []),
        ];

        return (
          <Space size="small">
            <Tooltip title="View Details">
              <Button 
                icon={<Eye size={14} />} 
                size="small"
                onClick={() => handleViewDetails(record)}
              />
            </Tooltip>
            {record.hasData && (
              <Tooltip title="Export Report">
                <Button 
                  icon={<Download size={14} />} 
                  size="small"
                  onClick={() => handleExportToExcel(record)}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  // Calculate totals from real data (only for assemblies with data)
  const assembliesWithData = filteredData.filter(assembly => assembly.hasData);
  const totalIncome = assembliesWithData.reduce((sum, assembly) => sum + assembly.totalIncome, 0);
  const totalMembers = assembliesWithData.reduce((sum, assembly) => sum + assembly.members, 0);
  const totalReports = assembliesWithData.reduce((sum, assembly) => sum + assembly.reportsCount, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Assemblies Management
          </h1>
          <p className="text-gray-600">
            All assemblies in Akowonjo District
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            icon={<RefreshCw size={16} />}
            onClick={handleRefresh}
            loading={assembliesLoading}
          >
            Refresh
          </Button>
          <Button 
            icon={<Download size={16} />}
            onClick={handleExportAll}
            disabled={assembliesWithData.length === 0}
          >
            Export All
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card className="border-0 shadow-lg bg-white">
            <Statistic
              title="Total Assemblies"
              value={ALL_ASSEMBLIES.length} // Show total from assemblies.ts
              prefix={<Church size={20} className="text-blue-500" />}
              valueStyle={{ color: '#3b82f6' }}
            />
            <div className="text-xs text-gray-500 mt-2">
              {assembliesWithData.length} with data
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="border-0 shadow-lg bg-white">
            <Statistic
              title="Total Members"
              value={totalMembers}
              prefix={<Users size={20} className="text-green-500" />}
              valueStyle={{ color: '#10b981' }}
            />
            <div className="text-xs text-gray-500 mt-2">
              Across {assembliesWithData.length} assemblies
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="border-0 shadow-lg bg-white">
            <Statistic
              title="Total Income"
              value={totalIncome}
              prefix={<DollarSign size={20} className="text-orange-500" />}
              formatter={(value) => `₦${Number(value).toLocaleString()}`}
              valueStyle={{ color: '#f59e0b' }}
            />
            <div className="text-xs text-gray-500 mt-2">
              From {totalReports} reports
            </div>
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg bg-white mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Search all assemblies..."
              prefix={<Search size={16} />}
              style={{ width: '100%' }}
              onSearch={handleSearch}
              onChange={handleSearchChange}
              allowClear
              value={searchText}
            />
          </div>
          <div className="flex gap-4">
            <Select 
              placeholder="Status" 
              style={{ width: 120 }} 
              allowClear
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="no-data">No Data</Option>
            </Select>
            <Button 
              icon={<Filter size={16} />}
              onClick={() => message.info('Advanced filters coming soon!')}
            >
              More Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Assemblies Table */}
      <Card 
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Church size={20} className="mr-2" />
              <span className="text-lg font-semibold">All Assemblies</span>
              <Tag color="blue" className="ml-2">{ALL_ASSEMBLIES.length} total</Tag>
              <Tag color="green" className="ml-2">{assembliesWithData.length} with data</Tag>
            </div>
            <div className="text-sm text-gray-500">
              Showing {filteredData.length} of {ALL_ASSEMBLIES.length}
            </div>
          </div>
        }
        className="border-0 shadow-lg bg-white"
      >
        {assembliesLoading ? (
          <div className="flex justify-center items-center h-32">
            <Spin size="large" />
            <span className="ml-3 text-gray-600">Loading assemblies data...</span>
          </div>
        ) : (
          <Table 
            columns={columns} 
            dataSource={filteredData}
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} assemblies`
            }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>

      {/* Assembly Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Church size={20} />
            <span>{selectedAssembly?.name} - Detailed Report</span>
            {selectedAssembly && !selectedAssembly.hasData && (
              <Tag color="orange">No Data Available</Tag>
            )}
          </div>
        }
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
            Close
          </Button>,
          selectedAssembly?.hasData && (
            <Button 
              key="export" 
              type="primary" 
              icon={<Download size={16} />}
              onClick={() => selectedAssembly && handleExportToExcel(selectedAssembly)}
            >
              Export Full Report
            </Button>
          )
        ]}
        width={1200}
      >
        {detailsLoading ? (
          <div className="flex justify-center items-center h-32">
            <Spin size="large" />
            <span className="ml-3 text-gray-600">Loading assembly details...</span>
          </div>
        ) : assemblyDetails ? (
          <div className="space-y-6">
            {selectedAssembly?.hasData ? (
              <>
                {/* Assembly Summary */}
                <Row gutter={[16, 16]}>
                  <Col span={6}>
                    <Card size="small" className="text-center">
                      <Statistic
                        title="Total Members"
                        value={assemblyDetails.totalAttendance}
                        prefix={<Users size={16} />}
                        valueStyle={{ color: '#3b82f6' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" className="text-center">
                      <Statistic
                        title="Total Income"
                        value={assemblyDetails.totalIncome}
                        prefix={<DollarSign size={16} />}
                        formatter={(value) => `₦${Number(value).toLocaleString()}`}
                        valueStyle={{ color: '#10b981' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" className="text-center">
                      <Statistic
                        title="Reports"
                        value={assemblyDetails.reportsCount}
                        prefix={<FileText size={16} />}
                        valueStyle={{ color: '#8b5cf6' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" className="text-center">
                      <Statistic
                        title="Records"
                        value={assemblyDetails.totalRecords}
                        prefix={<BarChart3 size={16} />}
                        valueStyle={{ color: '#f59e0b' }}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Assembly Information */}
                <Card title="Assembly Information" size="small">
                  <Row gutter={[16, 8]}>
                    <Col span={8}>
                      <div className="text-sm">
                        <div className="font-semibold text-gray-500">Pastor</div>
                        <div>{assemblyDetails.pastor}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="text-sm">
                        <div className="font-semibold text-gray-500">Location</div>
                        <div>{assemblyDetails.location}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="text-sm">
                        <div className="font-semibold text-gray-500">Established</div>
                        <div>{new Date(assemblyDetails.established).toLocaleDateString()}</div>
                      </div>
                    </Col>
                  </Row>
                </Card>

                {/* Financial Reports */}
                <Card 
                  title="Financial Reports" 
                  size="small"
                  extra={
                    <div className="text-sm text-gray-500">
                      {assemblyDetails.recentReports.length} recent reports
                    </div>
                  }
                >
                  {assemblyDetails.recentReports.length > 0 ? (
                    <Table
                      dataSource={assemblyDetails.recentReports}
                      columns={[
                        {
                          title: 'Month',
                          dataIndex: 'month',
                          key: 'month',
                          render: (month: string) => (
                            <div className="font-medium">{month}</div>
                          ),
                        },
                        {
                          title: 'Income',
                          dataIndex: 'income',
                          key: 'income',
                          render: (income: number) => (
                            <div className="font-semibold text-green-600">
                              ₦{income.toLocaleString()}
                            </div>
                          ),
                        },
                        {
                          title: 'Attendance',
                          dataIndex: 'attendance',
                          key: 'attendance',
                          render: (attendance: number) => (
                            <div className="flex items-center">
                              <Users size={14} className="mr-1 text-gray-500" />
                              {attendance.toLocaleString()}
                            </div>
                          ),
                        },
                        {
                          title: 'Tithes',
                          dataIndex: 'tithes',
                          key: 'tithes',
                          render: (tithes: number) => `₦${tithes.toLocaleString()}`,
                        },
                        {
                          title: 'Offerings',
                          dataIndex: 'offerings',
                          key: 'offerings',
                          render: (offerings: number) => `₦${offerings.toLocaleString()}`,
                        },
                        {
                          title: 'Submitted By',
                          dataIndex: 'submittedBy',
                          key: 'submittedBy',
                        },
                      ]}
                      pagination={false}
                      size="small"
                      scroll={{ x: 800 }}
                    />
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No financial reports available
                    </div>
                  )}
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <Church size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No Data Available
                </h3>
                <p className="text-gray-500">
                  This assembly has not submitted any Sunday service reports yet.
                </p>
              </div>
            )}
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