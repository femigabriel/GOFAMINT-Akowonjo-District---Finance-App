// components/admin/DashboardContent.tsx
"use client";

import { Card, Statistic, Row, Col, Button, Tag, Progress, List, Avatar, Timeline, message } from "antd";
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
  UserCheck
} from "lucide-react";

export default function DashboardContent() {
  const handleQuickAction = (action: string) => {
    message.info(`${action} feature coming soon`);
  };

  // Sample data
  const recentActivities = [
    {
      id: 1,
      user: "Pastor John",
      action: "added new member",
      target: "Sarah Miller",
      time: "5 min ago",
      avatar: "PJ"
    },
    {
      id: 2,
      user: "Admin",
      action: "updated service schedule",
      target: "Sunday Service",
      time: "1 hour ago",
      avatar: "AD"
    },
    {
      id: 3,
      user: "Finance Team",
      action: "recorded offering",
      target: "₦25,000",
      time: "2 hours ago",
      avatar: "FT"
    },
    {
      id: 4,
      user: "System",
      action: "generated weekly report",
      target: "Week 45",
      time: "1 day ago",
      avatar: "SY"
    }
  ];

  const statsData = [
    {
      title: "Total Assemblies",
      value: 12,
      change: "+2",
      icon: <Church size={24} />,
      color: "#3b82f6",
      progress: 80
    },
    {
      title: "Active Members",
      value: 156,
      change: "+12",
      icon: <Users size={24} />,
      color: "#10b981",
      progress: 65
    },
    {
      title: "Monthly Income",
      value: "₦45,000",
      change: "+8.2%",
      icon: <DollarSign size={24} />,
      color: "#f59e0b",
      progress: 75
    },
    {
      title: "Reports Generated",
      value: 89,
      change: "+15",
      icon: <BarChart3 size={24} />,
      color: "#8b5cf6",
      progress: 90
    }
  ];

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Church Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button icon={<Bell size={16} />} shape="circle" />
          <Button type="primary" icon={<Calendar size={16} />}>
            Today's Events
          </Button>
        </div>
      </div>

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
              dataSource={recentActivities}
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
                  <Timeline.Item color="green">
                    <div className="text-sm font-medium">Sunday Service</div>
                    <div className="text-xs text-gray-500">Tomorrow, 9:00 AM</div>
                  </Timeline.Item>
                  <Timeline.Item color="blue">
                    <div className="text-sm font-medium">Bible Study</div>
                    <div className="text-xs text-gray-500">Wed, 6:00 PM</div>
                  </Timeline.Item>
                  <Timeline.Item color="purple">
                    <div className="text-sm font-medium">Youth Meeting</div>
                    <div className="text-xs text-gray-500">Fri, 7:00 PM</div>
                  </Timeline.Item>
                </Timeline>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
}