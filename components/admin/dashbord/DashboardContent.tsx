// components/admin/DashboardContent.tsx
"use client";

import { Card, Statistic, Row, Col, Button, Tag, Progress, List, Avatar, Timeline, message, Select, Spin } from "antd";
import { 
  Church, 
  Users, 
  DollarSign, 
  BarChart3, 
  Plus, 
  Settings, 
  Download,
  TrendingUp,
  Bell,
  Calendar,
  UserCheck,
  Filter,
  Building2
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
}

export default function DashboardContent() {
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 7 }, (_, i) => (currentYear - 5 + i).toString());

  const currentMonthIndex = new Date().getMonth();
  const currentMonth = MONTHS[currentMonthIndex];

  const [loading, setLoading] = useState(false);
  const [selectedAssembly, setSelectedAssembly] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

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

      const response = await fetch(`/api/dashboard?${params}`);
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

  const handleQuickAction = (action: string) => {
    message.info(`${action} feature coming soon`);
  };

  const statsData = dashboardData ? [
    {
      title: "Total Assemblies",
      value: dashboardData.totalAssemblies,
      change: "+0", // This could be calculated or fetched
      icon: <Church size={24} />,
      color: "#3b82f6",
      progress: 80 // This could be dynamic
    },
    {
      title: "Active Members",
      value: dashboardData.activeMembers,
      change: "+0",
      icon: <Users size={24} />,
      color: "#10b981",
      progress: 65
    },
    {
      title: "Monthly Income",
      value: `₦${dashboardData.monthlyIncome.toLocaleString()}`,
      change: "+0%",
      icon: <DollarSign size={24} />,
      color: "#f59e0b",
      progress: 75
    },
    {
      title: "Reports Generated",
      value: dashboardData.reportsGenerated,
      change: "+0",
      icon: <BarChart3 size={24} />,
      color: "#8b5cf6",
      progress: 90
    }
  ] : [];

  const quickActions = [
    {
      label: "Add New Member",
      icon: <Plus size={16} />,
      type: "primary" as const,
      action: "Add New Member"
    },
    {
      label: "Manage Assemblies",
      icon: <Church size={16} />,
      type: "default" as const,
      action: "Manage Assemblies"
    },
    {
      label: "User Permissions",
      icon: <UserCheck size={16} />,
      type: "default" as const,
      action: "User Permissions"
    },
    {
      label: "Generate Report",
      icon: <Download size={16} />,
      type: "default" as const,
      action: "Generate Report"
    }
  ];

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
                Church Dashboard
              </h1>
              <p className="text-lg text-gray-600">
                Akowonjo District Overview
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
        <div className="flex gap-3">
          <Button icon={<Bell size={16} />} shape="circle" />
          <Button type="primary" icon={<Calendar size={16} />}>
            Today's Events
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
          {/* Stats Grid */}
          <Row gutter={[24, 24]} className="mb-6">
            {statsData.map((stat, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
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
                    <Tag color={stat.change.startsWith('+') ? 'green' : 'red'}>
                      <TrendingUp size={12} className="mr-1" />
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
                  
                  <Progress
                    percent={stat.progress}
                    showInfo={false}
                    strokeColor={stat.color}
                    trailColor="#f3f4f6"
                    size="small"
                    className="mt-3"
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[24, 24]}>
            {/* Recent Activity */}
            <Col xs={24} lg={16}>
              <Card 
                title={
                  <div className="flex items-center">
                    <BarChart3 size={20} className="mr-2" />
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

            {/* Quick Actions & Upcoming Events */}
            <Col xs={24} lg={8}>
              <Row gutter={[0, 24]}>
                {/* Quick Actions */}
                <Col span={24}>
                  <Card 
                    title={
                      <div className="flex items-center">
                        <Settings size={20} className="mr-2" />
                        <span className="text-lg font-semibold">Quick Actions</span>
                      </div>
                    }
                    className="border-0 shadow-lg bg-white"
                  >
                    <div className="space-y-3">
                      {quickActions.map((action, index) => (
                        <Button
                          key={index}
                          type={action.type}
                          icon={action.icon}
                          block
                          size="large"
                          className="flex items-center justify-center h-12"
                          onClick={() => handleQuickAction(action.action)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </Card>
                </Col>

                {/* Upcoming Events */}
                <Col span={24}>
                  <Card 
                    title={
                      <div className="flex items-center">
                        <Calendar size={20} className="mr-2" />
                        <span className="text-lg font-semibold">Upcoming Events</span>
                      </div>
                    }
                    className="border-0 shadow-lg bg-white"
                  >
                    <Timeline>
                      {dashboardData?.upcomingEvents.map((event, index) => (
                        <Timeline.Item key={index} color={event.color}>
                          <div className="text-sm font-medium">{event.title}</div>
                          <div className="text-xs text-gray-500">{event.time}</div>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}