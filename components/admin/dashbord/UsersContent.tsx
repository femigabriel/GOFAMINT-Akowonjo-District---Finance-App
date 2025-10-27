// components/admin/UsersContent.tsx
"use client";

import { Card, Table, Button, Tag, Space, Input, message, Avatar, Switch, Select } from "antd";
import { Users, Plus, Search, Edit, Trash2, Mail, Phone, UserCheck } from "lucide-react";

const { Search: SearchInput } = Input;

interface User {
  key: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'pastor' | 'member' | 'finance';
  status: 'active' | 'inactive';
  joinDate: string;
  lastLogin: string;
}

export default function UsersContent() {
  const usersData: User[] = [
    {
      key: '1',
      name: 'John Ade',
      email: 'john.ade@church.org',
      phone: '+234 801 234 5678',
      role: 'admin',
      status: 'active',
      joinDate: '2022-01-15',
      lastLogin: '2024-01-20'
    },
    {
      key: '2',
      name: 'Sarah Musa',
      email: 'sarah.musa@church.org',
      phone: '+234 802 345 6789',
      role: 'pastor',
      status: 'active',
      joinDate: '2021-03-20',
      lastLogin: '2024-01-19'
    },
    {
      key: '3',
      name: 'David Okafor',
      email: 'david.okafor@church.org',
      phone: '+234 803 456 7890',
      role: 'finance',
      status: 'active',
      joinDate: '2023-06-10',
      lastLogin: '2024-01-18'
    },
    {
      key: '4',
      name: 'Grace Bello',
      email: 'grace.bello@church.org',
      phone: '+234 804 567 8901',
      role: 'member',
      status: 'inactive',
      joinDate: '2022-11-30',
      lastLogin: '2024-01-10'
    }
  ];

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'red',
      pastor: 'blue',
      finance: 'orange',
      member: 'green'
    };
    return colors[role as keyof typeof colors] || 'default';
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'green' : 'red';
  };

  const columns = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: User) => (
        <div className="flex items-center">
          <Avatar 
            style={{ backgroundColor: '#3b82f6', fontWeight: 'bold' }}
            className="mr-3"
          >
            {text.charAt(0)}
          </Avatar>
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (record: User) => (
        <div className="space-y-1">
          <div className="flex items-center">
            <Mail size={12} className="mr-1 text-gray-500" />
            <span className="text-sm">{record.email}</span>
          </div>
          <div className="flex items-center">
            <Phone size={12} className="mr-1 text-gray-500" />
            <span className="text-sm">{record.phone}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: User) => (
        <div className="flex items-center gap-2">
          <Tag color={getStatusColor(status)}>
            {status.toUpperCase()}
          </Tag>
          <Switch 
            size="small" 
            defaultChecked={status === 'active'}
            onChange={(checked) => handleStatusChange(record.key, checked)}
          />
        </div>
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space size="small">
          <Button 
            icon={<Edit size={14} />} 
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button 
            icon={<UserCheck size={14} />} 
            size="small"
            onClick={() => handlePermissions(record)}
          >
            Permissions
          </Button>
        </Space>
      ),
    },
  ];

  const handleAddUser = () => {
    message.info('Add user feature coming soon');
  };

  const handleEdit = (user: User) => {
    message.info(`Editing ${user.name}`);
  };

  const handlePermissions = (user: User) => {
    message.info(`Managing permissions for ${user.name}`);
  };

  const handleStatusChange = (userId: string, checked: boolean) => {
    message.success(`User status updated to ${checked ? 'active' : 'inactive'}`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Users Management
          </h1>
          <p className="text-gray-600">
            Manage church members and staff accounts
          </p>
        </div>
        <Button 
          type="primary" 
          icon={<Plus size={16} />}
          onClick={handleAddUser}
        >
          Add New User
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg bg-white mb-6">
        <div className="flex gap-4">
          <SearchInput
            placeholder="Search users..."
            prefix={<Search size={16} />}
            style={{ width: 300 }}
          />
          <Select placeholder="Role" style={{ width: 120 }} allowClear>
            <Option value="admin">Admin</Option>
            <Option value="pastor">Pastor</Option>
            <Option value="finance">Finance</Option>
            <Option value="member">Member</Option>
          </Select>
          <Select placeholder="Status" style={{ width: 120 }} allowClear>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card 
        title={
          <div className="flex items-center">
            <Users size={20} className="mr-2" />
            <span className="text-lg font-semibold">All Users</span>
          </div>
        }
        className="border-0 shadow-lg bg-white"
      >
        <Table 
          columns={columns} 
          dataSource={usersData}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} users`
          }}
        />
      </Card>
    </div>
  );
}