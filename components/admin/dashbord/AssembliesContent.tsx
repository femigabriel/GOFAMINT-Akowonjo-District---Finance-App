// components/admin/AssembliesContent.tsx
"use client";

import { Card, Table, Button, Tag, Space, Input, message, Modal, Form, Select, Tooltip, Row, Col, Statistic, DatePicker, Dropdown } from "antd";
import { Church, Plus, Search, Edit, MapPin, Users, Eye, Download, BarChart3, Calendar, Filter, MoreVertical, FileText, DollarSign, TrendingUp } from "lucide-react";
import { useState } from "react";
import { assemblies } from "@/lib/assemblies";
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

export default function AssembliesContent() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingAssembly, setEditingAssembly] = useState<Assembly | null>(null);
  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | null>(null);
  const [assemblyReports, setAssemblyReports] = useState<AssemblyReport[]>([]);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<any>(null);

  // Mock data with more realistic information
  const assembliesData: Assembly[] = assemblies.map((name, index) => {
    const totalIncome = Math.floor(Math.random() * 5000000) + 100000;
    const reportsCount = Math.floor(Math.random() * 12) + 1;
    const establishedDate = new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000);
    
    return {
      key: (index + 1).toString(),
      name,
      members: Math.floor(Math.random() * 500) + 100,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      pastor: `Pastor ${name.split(' ')[0]}`,
      established: establishedDate.toISOString().split('T')[0],
      location: `${name} Area, Lagos`,
      totalIncome,
      lastReport: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reportsCount,
    };
  });

  // Mock assembly reports data
  const generateMockReports = (assemblyName: string): AssemblyReport[] => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months.slice(0, 6).map(month => ({
      month: `${month}-2024`,
      income: Math.floor(Math.random() * 1000000) + 50000,
      attendance: Math.floor(Math.random() * 300) + 50,
      tithes: Math.floor(Math.random() * 500000) + 20000,
      offerings: Math.floor(Math.random() * 300000) + 10000,
      submittedBy: `Pastor ${assemblyName.split(' ')[0]}`,
      submittedDate: new Date(2024, months.indexOf(month), 15).toISOString().split('T')[0],
    }));
  };

  // Filter data based on search and status
  const filteredData = assembliesData.filter((assembly) => {
    const matchesSearch = !searchText || 
      assembly.name.toLowerCase().includes(searchText.toLowerCase()) ||
      assembly.pastor.toLowerCase().includes(searchText.toLowerCase()) ||
      assembly.location.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !statusFilter || assembly.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportToExcel = (assembly: Assembly) => {
    try {
      // Generate CSV content
      const reports = generateMockReports(assembly.name);
      const headers = [
        `${assembly.name} - Financial Report`,
        `Generated on ${new Date().toLocaleDateString()}`,
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
        report.submittedDate
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

  const handleViewDetails = (assembly: Assembly) => {
    setSelectedAssembly(assembly);
    setAssemblyReports(generateMockReports(assembly.name));
    setIsDetailsModalVisible(true);
  };

  const handleExportAll = () => {
    message.info('Bulk export feature coming soon!');
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
      render: (members: number) => (
        <div className="flex items-center">
          <Users size={14} className="mr-1 text-gray-500" />
          <span className="font-medium">{members.toLocaleString()}</span>
        </div>
      ),
    },
    {
      title: 'Total Income',
      dataIndex: 'totalIncome',
      key: 'totalIncome',
      render: (income: number) => (
        <div className="font-semibold text-green-600">
          ₦{income.toLocaleString()}
        </div>
      ),
    },
    {
      title: 'Reports',
      dataIndex: 'reportsCount',
      key: 'reportsCount',
      render: (count: number) => (
        <Tag color="blue">{count} reports</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: 'active' | 'inactive') => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
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
          {
            key: 'export',
            label: 'Export Report',
            icon: <Download size={14} />,
            onClick: () => handleExportToExcel(record),
          },
          {
            key: 'edit',
            label: 'Edit Assembly',
            icon: <Edit size={14} />,
            onClick: () => handleEdit(record),
          },
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
            <Tooltip title="Export Report">
              <Button 
                icon={<Download size={14} />} 
                size="small"
                onClick={() => handleExportToExcel(record)}
              />
            </Tooltip>
            <Dropdown menu={{ items }} trigger={['click']}>
              <Button 
                icon={<MoreVertical size={14} />} 
                size="small"
              />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const reportColumns = [
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
  ];

  const handleAddAssembly = () => {
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Assembly added successfully!');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Please fill all required fields!');
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleEdit = (assembly: Assembly) => {
    setEditingAssembly(assembly);
    form.setFieldsValue(assembly);
    setIsEditModalVisible(true);
  };

  const handleEditModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      // Simulate API call for update
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success(`${editingAssembly?.name} updated successfully!`);
      setIsEditModalVisible(false);
      form.resetFields();
      setEditingAssembly(null);
    } catch (error) {
      message.error('Please fill all required fields!');
    } finally {
      setLoading(false);
    }
  };

  const handleEditModalCancel = () => {
    setIsEditModalVisible(false);
    form.resetFields();
    setEditingAssembly(null);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleStatusChange = (value: string | undefined) => {
    setStatusFilter(value);
  };

  const totalIncome = filteredData.reduce((sum, assembly) => sum + assembly.totalIncome, 0);
  const totalMembers = filteredData.reduce((sum, assembly) => sum + assembly.members, 0);
  const totalReports = filteredData.reduce((sum, assembly) => sum + assembly.reportsCount, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Assemblies Management
          </h1>
          <p className="text-gray-600">
            Manage all church assemblies and their financial reports
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            icon={<Download size={16} />}
            onClick={handleExportAll}
          >
            Export All
          </Button>
          <Button 
            type="primary" 
            icon={<Plus size={16} />}
            onClick={handleAddAssembly}
          >
            Add New Assembly
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card className="border-0 shadow-lg bg-white">
            <Statistic
              title="Total Assemblies"
              value={filteredData.length}
              prefix={<Church size={20} className="text-blue-500" />}
              valueStyle={{ color: '#3b82f6' }}
            />
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
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg bg-white mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <SearchInput
              placeholder="Search assemblies, pastors, or locations..."
              prefix={<Search size={16} />}
              style={{ width: '100%' }}
              onSearch={handleSearch}
              allowClear
            />
            <Select 
              placeholder="Status" 
              style={{ width: '100%', minWidth: 120 }} 
              allowClear
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </div>
          <div className="flex gap-4">
            <RangePicker 
              placeholder={['Start Date', 'End Date']}
              onChange={(dates) => setDateRange(dates)}
            />
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
              <Tag color="blue" className="ml-2">{filteredData.length} assemblies</Tag>
            </div>
            <div className="text-sm text-gray-500">
              {totalReports} total reports • Last updated: Today
            </div>
          </div>
        }
        className="border-0 shadow-lg bg-white"
      >
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
      </Card>

      {/* Add Assembly Modal */}
      <Modal
        title="Add New Assembly"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        okText="Add Assembly"
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Assembly Name"
                rules={[{ required: true, message: 'Please enter assembly name' }]}
              >
                <Input placeholder="Enter assembly name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pastor"
                label="Pastor In Charge"
                rules={[{ required: true, message: 'Please enter pastor name' }]}
              >
                <Input placeholder="Enter pastor name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="location"
                label="Location"
                rules={[{ required: true, message: 'Please enter location' }]}
              >
                <Input placeholder="Enter assembly location" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status">
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="established"
            label="Date Established"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Assembly Modal */}
      <Modal
        title={`Update ${editingAssembly?.name || ''}`}
        open={isEditModalVisible}
        onOk={handleEditModalOk}
        onCancel={handleEditModalCancel}
        confirmLoading={loading}
        okText="Update Assembly"
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Assembly Name"
                rules={[{ required: true, message: 'Please enter assembly name' }]}
              >
                <Input placeholder="Enter assembly name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="pastor"
                label="Pastor In Charge"
                rules={[{ required: true, message: 'Please enter pastor name' }]}
              >
                <Input placeholder="Enter pastor name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="location"
                label="Location"
                rules={[{ required: true, message: 'Please enter location' }]}
              >
                <Input placeholder="Enter assembly location" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status">
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Assembly Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Church size={20} />
            <span>{selectedAssembly?.name} - Detailed Report</span>
          </div>
        }
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="export" 
            type="primary" 
            icon={<Download size={16} />}
            onClick={() => selectedAssembly && handleExportToExcel(selectedAssembly)}
          >
            Export Full Report
          </Button>
        ]}
        width={1200}
      >
        {selectedAssembly && (
          <div className="space-y-6">
            {/* Assembly Summary */}
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="Total Members"
                    value={selectedAssembly.members}
                    prefix={<Users size={16} />}
                    valueStyle={{ color: '#3b82f6' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="Total Income"
                    value={selectedAssembly.totalIncome}
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
                    value={selectedAssembly.reportsCount}
                    prefix={<FileText size={16} />}
                    valueStyle={{ color: '#8b5cf6' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className="text-center">
                  <Statistic
                    title="Status"
                    value={selectedAssembly.status}
                    valueStyle={{ 
                      color: selectedAssembly.status === 'active' ? '#10b981' : '#ef4444',
                      textTransform: 'capitalize'
                    }}
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
                    <div>{selectedAssembly.pastor}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="text-sm">
                    <div className="font-semibold text-gray-500">Location</div>
                    <div>{selectedAssembly.location}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="text-sm">
                    <div className="font-semibold text-gray-500">Established</div>
                    <div>{selectedAssembly.established}</div>
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
                  Last report: {selectedAssembly.lastReport}
                </div>
              }
            >
              <Table
                dataSource={assemblyReports}
                columns={reportColumns}
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
                summary={() => {
                  const totalIncome = assemblyReports.reduce((sum, r) => sum + r.income, 0);
                  const totalAttendance = assemblyReports.reduce((sum, r) => sum + r.attendance, 0);
                  const totalTithes = assemblyReports.reduce((sum, r) => sum + r.tithes, 0);
                  const totalOfferings = assemblyReports.reduce((sum, r) => sum + r.offerings, 0);

                  return (
                    <Table.Summary>
                      <Table.Summary.Row className="bg-gray-50 font-semibold">
                        <Table.Summary.Cell index={0}>TOTAL</Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          <span className="text-green-600">₦{totalIncome.toLocaleString()}</span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2}>
                          {totalAttendance.toLocaleString()}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3}>
                          ₦{totalTithes.toLocaleString()}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                          ₦{totalOfferings.toLocaleString()}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5}></Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}