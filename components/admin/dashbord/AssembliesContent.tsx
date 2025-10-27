// components/admin/AssembliesContent.tsx
"use client";

import { Card, Table, Button, Tag, Space, Input, message, Modal, Form, Select, Tooltip } from "antd";
import { Church, Plus, Search, Edit, MapPin, Users, Eye } from "lucide-react";
import { useState } from "react";
import { assemblies } from "@/lib/assemblies"; // Import assemblies from lib

const { Search: SearchInput } = Input;
const { Option } = Select;

interface Assembly {
  key: string;
  name: string;
  members: number;
  status: 'active' | 'inactive';
  pastor: string;
  established: string;
}

export default function AssembliesContent() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingAssembly, setEditingAssembly] = useState<Assembly | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // Use assemblies from lib and map to full Assembly interface with mock data
  const assembliesData: Assembly[] = assemblies.map((name, index) => ({
    key: (index + 1).toString(),
    name,
    members: Math.floor(Math.random() * 500) + 100, // Mock members
    status: 'active' as const, // Default to active
    pastor: `Pastor ${name}`, // Mock pastor
    established: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Mock established date
  }));

  // Filter data based on search and status
  const filteredData = assembliesData.filter((assembly) => {
    const matchesSearch = !searchText || 
      assembly.name.toLowerCase().includes(searchText.toLowerCase()) ||
      assembly.pastor.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !statusFilter || assembly.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Assembly Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <div className="flex items-center">
          <Church size={16} className="mr-2 text-blue-600" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: 'Members',
      dataIndex: 'members',
      key: 'members',
      render: (members: number) => (
        <div className="flex items-center">
          <Users size={14} className="mr-1 text-gray-500" />
          {members.toLocaleString()}
        </div>
      ),
    },
    {
      title: 'Pastor',
      dataIndex: 'pastor',
      key: 'pastor',
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
      render: (_: any, record: Assembly) => (
        <Space size="small">
          <Tooltip title="View Submissions">
            <Button 
              icon={<Eye size={14} />} 
              size="small"
              onClick={() => handleViewSubmissions(record)}
            />
          </Tooltip>
          <Tooltip title="Update Details">
            <Button 
              icon={<Edit size={14} />} 
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
        </Space>
      ),
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

  const handleViewSubmissions = (assembly: Assembly) => {
    message.info(`Viewing submissions for ${assembly.name}`);
    // TODO: Implement navigation or modal for submissions
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleStatusChange = (value: string | undefined) => {
    setStatusFilter(value);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Assemblies Management
          </h1>
          <p className="text-gray-600">
            Manage all church assemblies and branches
          </p>
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={16} />}
          onClick={handleAddAssembly}
        >
          Add New Assembly
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg bg-white mb-6">
        <div className="flex gap-4">
          <SearchInput
            placeholder="Search assemblies..."
            prefix={<Search size={16} />}
            style={{ width: 300 }}
            onSearch={handleSearch}
          />
          <Select 
            placeholder="Status" 
            style={{ width: 120 }} 
            allowClear
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
        </div>
      </Card>

      {/* Assemblies Table */}
      <Card 
        title={
          <div className="flex items-center">
            <Church size={20} className="mr-2" />
            <span className="text-lg font-semibold">All Assemblies</span>
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
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} assemblies`
          }}
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
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Assembly Name"
            rules={[{ required: true, message: 'Please enter assembly name' }]}
          >
            <Input placeholder="Enter assembly name" />
          </Form.Item>
          <Form.Item
            name="pastor"
            label="Pastor In Charge"
            rules={[{ required: true, message: 'Please enter pastor name' }]}
          >
            <Input placeholder="Enter pastor name" />
          </Form.Item>
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
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Assembly Name"
            rules={[{ required: true, message: 'Please enter assembly name' }]}
          >
            <Input placeholder="Enter assembly name" />
          </Form.Item>
          <Form.Item
            name="pastor"
            label="Pastor In Charge"
            rules={[{ required: true, message: 'Please enter pastor name' }]}
          >
            <Input placeholder="Enter pastor name" />
          </Form.Item>
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
        </Form>
      </Modal>
    </div>
  );
}