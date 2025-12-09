// components/dashboard/ServiceReportTable.tsx
"use client";

import React, { useState } from "react";
import {
  Table,
  Tabs,
  Tag,
  Typography,
  Card,
  Button,
  Space,
  Tooltip,
  Badge,
  Avatar,
  Progress,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  BarChartOutlined,
  TeamOutlined,
  FilePdfOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { ServiceType } from "@/types/dashboard";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface ServiceRecord {
  id: string;
  date: string;
  serviceType: ServiceType;
  attendance?: number;
  totalAttendance?: number;
  tithes?: number;
  offerings?: number;
  offering?: number;
  total: number;
  week?: string;
  day?: string;
  submittedBy: string;
  [key: string]: any;
}

interface ServiceReportTableProps {
  reports: any[];
  loading?: boolean;
  onExport?: (type: ServiceType) => void;
}

const ServiceReportTable: React.FC<ServiceReportTableProps> = ({
  reports,
  loading = false,
  onExport,
}) => {
  const [activeTab, setActiveTab] = useState<ServiceType | "all">("all");

  // Format currency for Nigerian Naira
  const formatCurrency = (amount: number): string => {
    return `₦${amount?.toLocaleString("en-NG") || "0"}`;
  };

  // Filter reports based on active tab
  const filteredReports = activeTab === "all" 
    ? reports 
    : reports.filter(report => report.serviceType === activeTab);

  // Extract all records from filtered reports
  const allRecords: ServiceRecord[] = filteredReports.flatMap(report => 
    (report.records || []).map((record: any) => ({
      ...record,
      serviceType: report.serviceType,
      submittedBy: report.submittedBy,
    }))
  );

  // Define columns for each service type
  const getColumns = (serviceType: ServiceType | "all"): ColumnsType<ServiceRecord> => {
    const baseColumns: ColumnsType<ServiceRecord> = [
      {
        title: "Date",
        dataIndex: "date",
        key: "date",
        width: 120,
        render: (date: string) => (
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-blue-500" />
            <Text strong>{dayjs(date).format("MMM DD")}</Text>
            <Text type="secondary" className="text-xs">
              {dayjs(date).format("YYYY")}
            </Text>
          </div>
        ),
      },
      {
        title: "Service",
        key: "serviceType",
        width: 100,
        render: (_, record) => (
          <Tag
            color={
              record.serviceType === "sunday" ? "blue" :
              record.serviceType === "midweek" ? "orange" :
              "purple"
            }
            className="font-semibold"
          >
            {record.serviceType === "sunday" ? "Sunday" :
             record.serviceType === "midweek" ? "Midweek" : "Special"}
          </Tag>
        ),
      },
      {
        title: "Attendance",
        key: "attendance",
        width: 120,
        render: (_, record) => (
          <div className="flex items-center gap-2">
            <TeamOutlined className="text-green-500" />
            <div>
              <Text strong className="block">
                {record.totalAttendance || record.attendance || 0}
              </Text>
              {record.serviceType === "sunday" && (
                <Text type="secondary" className="text-xs">
                  Main: {record.attendance || 0}
                </Text>
              )}
            </div>
          </div>
        ),
      },
    ];

    const sundayColumns: ColumnsType<ServiceRecord> = [
      ...baseColumns,
      {
        title: "Week",
        dataIndex: "week",
        key: "week",
        width: 100,
        render: (week: string) => <Tag color="cyan">{week}</Tag>,
      },
      {
        title: "Tithes",
        key: "tithes",
        width: 120,
        render: (_, record) => (
          <div className="text-green-600 font-semibold">
            {formatCurrency(record.tithes || 0)}
          </div>
        ),
      },
      {
        title: "Offerings",
        key: "offerings",
        width: 120,
        render: (_, record) => (
          <div className="text-blue-600 font-semibold">
            {formatCurrency(record.offerings || 0)}
          </div>
        ),
      },
    ];

    const midweekColumns: ColumnsType<ServiceRecord> = [
      ...baseColumns,
      {
        title: "Day",
        dataIndex: "day",
        key: "day",
        width: 100,
        render: (day: string) => <Tag color="orange">{day}</Tag>,
      },
      {
        title: "Offering",
        key: "offering",
        width: 120,
        render: (_, record) => (
          <div className="text-purple-600 font-semibold">
            {formatCurrency(record.offering || 0)}
          </div>
        ),
      },
    ];

    const allColumns: ColumnsType<ServiceRecord> = [
      ...baseColumns,
      {
        title: "Week/Day",
        key: "weekDay",
        width: 100,
        render: (_, record) => (
          <Tag color={record.serviceType === "sunday" ? "cyan" : "orange"}>
            {record.serviceType === "sunday" ? record.week : record.day}
          </Tag>
        ),
      },
      {
        title: "Financials",
        key: "financials",
        width: 180,
        render: (_, record) => {
          const amount = record.serviceType === "sunday" 
            ? (record.tithes || 0) + (record.offerings || 0)
            : record.offering || 0;
          
          return (
            <div>
              <div className="font-semibold text-blue-600">
                {formatCurrency(amount)}
              </div>
              <Progress 
                percent={Math.min(100, (amount / 50000) * 100)} 
                size="small" 
                showInfo={false}
                strokeColor="#3b82f6"
              />
            </div>
          );
        },
      },
    ];

    if (serviceType === "sunday") return sundayColumns;
    if (serviceType === "midweek") return midweekColumns;
    if (serviceType === "special") return baseColumns; // Add special service columns as needed
    return allColumns;
  };

  // Calculate stats for each tab
  const calculateTabStats = (type: ServiceType | "all") => {
    const tabReports = type === "all" 
      ? reports 
      : reports.filter(report => report.serviceType === type);
    
    const records = tabReports.flatMap(report => report.records || []);
    
    return {
      totalRecords: records.length,
      totalIncome: records.reduce((sum, r) => sum + (r.total || 0), 0),
      totalAttendance: records.reduce((sum, r) => 
        sum + (r.totalAttendance || r.attendance || 0), 0
      ),
    };
  };

  const stats = calculateTabStats(activeTab);

  return (
    <Card className="border-0 shadow-lg rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={4} className="!mb-1">
            Service Reports
          </Title>
          <Text type="secondary">
            View and manage all service records
          </Text>
        </div>
        
        <Space>
          {onExport && (
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => onExport(activeTab as ServiceType)}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Export {activeTab === "all" ? "All" : activeTab}
            </Button>
          )}
        </Space>
      </div>

      {/* Tabs with stats */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as ServiceType | "all")}
        className="mb-6"
        tabBarExtraContent={
          <div className="flex items-center gap-4">
            <Badge 
              count={stats.totalRecords} 
              style={{ backgroundColor: '#3b82f6' }}
              showZero
            />
            <div className="hidden md:flex gap-6">
              <div className="text-center">
                <Text type="secondary" className="text-xs">Total Income</Text>
                <div className="font-bold text-green-600">
                  {formatCurrency(stats.totalIncome)}
                </div>
              </div>
              <div className="text-center">
                <Text type="secondary" className="text-xs">Attendance</Text>
                <div className="font-bold text-blue-600">
                  {stats.totalAttendance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        }
      >
        <TabPane 
          tab={
            <span className="flex items-center gap-2">
              <BarChartOutlined />
              All Services
            </span>
          } 
          key="all"
        />
        <TabPane 
          tab={
            <span className="flex items-center gap-2">
              <CalendarOutlined className="text-blue-500" />
              Sunday
              <Tag color="blue" className="ml-1">
                {reports.filter(r => r.serviceType === "sunday").length}
              </Tag>
            </span>
          } 
          key="sunday"
        />
        <TabPane 
          tab={
            <span className="flex items-center gap-2">
              <CalendarOutlined className="text-orange-500" />
              Midweek
              <Tag color="orange" className="ml-1">
                {reports.filter(r => r.serviceType === "midweek").length}
              </Tag>
            </span>
          } 
          key="midweek"
        />
        <TabPane 
          tab={
            <span className="flex items-center gap-2">
              <CalendarOutlined className="text-purple-500" />
              Special
              <Tag color="purple" className="ml-1">
                {reports.filter(r => r.serviceType === "special").length}
              </Tag>
            </span>
          } 
          key="special"
        />
      </Tabs>

      {/* Table */}
      <Table
        columns={getColumns(activeTab)}
        dataSource={allRecords}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => (
            `${range[0]}-${range[1]} of ${total} records`
          ),
        }}
        scroll={{ x: 'max-content' }}
        className="custom-table"
      />

      {/* Summary Footer */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-0">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary" className="text-xs">Total Reports</Text>
                <div className="text-2xl font-bold text-blue-600">
                  {filteredReports.length}
                </div>
              </div>
              <FilePdfOutlined className="text-blue-500 text-xl" />
            </div>
          </Card>
          
          <Card className="bg-green-50 border-0">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary" className="text-xs">Total Income</Text>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalIncome)}
                </div>
              </div>
              <DollarOutlined className="text-green-500 text-xl" />
            </div>
          </Card>
          
          <Card className="bg-orange-50 border-0">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary" className="text-xs">Total Attendance</Text>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.totalAttendance.toLocaleString()}
                </div>
              </div>
              <UserOutlined className="text-orange-500 text-xl" />
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
};

export default ServiceReportTable;