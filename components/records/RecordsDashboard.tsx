"use client";

import { useState, useEffect } from "react";
import {
  Tabs,
  Table,
  Card,
  Spin,
  message,
  Statistic,
  Row,
  Col,
  Button,
  Dropdown,
  Tooltip,
  Grid,
  Tag,
  Badge,
} from "antd";
import { ColumnsType } from "antd/es/table";
import moment from "moment";
import { useAuth } from "@/context/AuthContext";
import type { MenuProps } from "antd";
import { 
  PlusOutlined, 
  DownOutlined, 
  ReloadOutlined, 
  InfoCircleOutlined,
  FileTextOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";


interface OfferingRecordData {
  week1: number;
  week2: number;
  week3: number;
  week4: number;
  week5: number;
  tuesdayWeek1: number;
  tuesdayWeek2: number;
  tuesdayWeek3: number;
  tuesdayWeek4: number;
  tuesdayWeek5: number;
  thursdayWeek1: number;
  thursdayWeek2: number;
  thursdayWeek3: number;
  thursdayWeek4: number;
  thursdayWeek5: number;
  amount: number;
  total: number;
}

interface TitheRecordData {
  name: string;
  titheNumber: string;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
  week5: number;
  total: number;
}

interface OfferingRecord {
  _id: string;
  month: string;
  type: string;
  submittedBy: string;
  records: OfferingRecordData[];
  createdAt: string;
}

interface TitheRecord {
  _id: string;
  month: string;
  submittedBy: string;
  records: TitheRecordData[];
  createdAt: string;
}

interface RecordsResponse {
  offeringRecords: OfferingRecord[];
  titheRecords: TitheRecord[];
  error?: string;
}

type TabKey = "offerings" | "tithes";

const { useBreakpoint } = Grid;

const RecordsDashboard = () => {
  const { assembly, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [offeringRecords, setOfferingRecords] = useState<OfferingRecord[]>([]);
  const [titheRecords, setTitheRecords] = useState<TitheRecord[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("offerings");
  const router = useRouter();
  const screens = useBreakpoint();

  useEffect(() => {
    if (assembly) {
      fetchRecords();
    }
  }, [assembly]);

  const fetchRecords = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/records?assembly=${assembly}`);
      const data: RecordsResponse = await response.json();
      if (response.ok) {
        setOfferingRecords(data.offeringRecords);
        setTitheRecords(data.titheRecords);
      } else {
        message.error(data.error || "Failed to fetch records");
      }
    } catch (error) {
      console.error("Fetch records error:", error);
      message.error("An error occurred while fetching records");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals for summary
  const totalOfferings = offeringRecords.reduce(
    (sum: number, record: OfferingRecord) => sum + (record.records[0]?.total || 0),
    0
  );
  const totalTithes = titheRecords.reduce(
    (sum: number, record: TitheRecord) => sum + (record.records[0]?.total || 0),
    0
  );

  const totalRecords = offeringRecords.length + titheRecords.length;

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString()}`;
  };

  // Get month name from date
  const getMonthName = (dateString: string): string => {
    return moment(dateString).format("MMMM YYYY");
  };

  // Responsive offering columns
  const offeringColumns: ColumnsType<OfferingRecord> = [
    {
      title: (
        <span className="flex items-center gap-1">
          <CalendarOutlined />
          Month
        </span>
      ),
      dataIndex: "month",
      key: "month",
      sorter: (a: OfferingRecord, b: OfferingRecord) => a.month.localeCompare(b.month),
      fixed: screens.xs ? "left" : false,
      width: screens.xs ? 120 : 140,
      render: (month: string, record: OfferingRecord) => (
        <div>
          <div className="font-semibold text-gray-800">{month}</div>
          {screens.sm && (
            <div className="text-xs text-gray-500">
              {getMonthName(record.createdAt)}
            </div>
          )}
        </div>
      ),
    },
    ...(screens.sm ? [
      {
        title: "Type",
        dataIndex: "type",
        key: "type",
        sorter: (a: OfferingRecord, b: OfferingRecord) => a.type.localeCompare(b.type),
        render: (type: string) => (
          <Tag color={type === "Regular" ? "blue" : "purple"} className="font-medium">
            {type}
          </Tag>
        ),
      },
      {
        title: (
          <span className="flex items-center gap-1">
            <UserOutlined />
            Submitted By
          </span>
        ),
        dataIndex: "submittedBy",
        key: "submittedBy",
        render: (submittedBy: string) => (
          <span className="text-gray-700 font-medium">{submittedBy}</span>
        ),
      },
    ] : []),
    {
      title: "Sunday",
      children: [
        {
          title: "W1",
          key: "week1",
          render: (_: unknown, record: OfferingRecord) =>
            formatCurrency(record.records[0]?.week1 || 0),
          width: 80,
          align: 'right' as const,
        },
        {
          title: "W2",
          key: "week2",
          render: (_: unknown, record: OfferingRecord) =>
            formatCurrency(record.records[0]?.week2 || 0),
          width: 80,
          align: 'right' as const,
        },
        {
          title: "W3",
          key: "week3",
          render: (_: unknown, record: OfferingRecord) =>
            formatCurrency(record.records[0]?.week3 || 0),
          width: 80,
          align: 'right' as const,
        },
        {
          title: "W4",
          key: "week4",
          render: (_: unknown, record: OfferingRecord) =>
            formatCurrency(record.records[0]?.week4 || 0),
          width: 80,
          align: 'right' as const,
        },
        ...(screens.md ? [{
          title: "W5",
          key: "week5",
          render: (_: unknown, record: OfferingRecord) =>
            formatCurrency(record.records[0]?.week5 || 0),
          width: 80,
          align: 'right' as const,
        }] : []),
      ],
    },
    ...(screens.lg ? [
      {
        title: "Tuesday",
        children: [
          {
            title: "W1",
            key: "tuesdayWeek1",
            render: (_: unknown, record: OfferingRecord) =>
              formatCurrency(record.records[0]?.tuesdayWeek1 || 0),
            width: 80,
            align: 'right' as const,
          },
          {
            title: "W2",
            key: "tuesdayWeek2",
            render: (_: unknown, record: OfferingRecord) =>
              formatCurrency(record.records[0]?.tuesdayWeek2 || 0),
            width: 80,
            align: 'right' as const,
          },
          {
            title: "W3",
            key: "tuesdayWeek3",
            render: (_: unknown, record: OfferingRecord) =>
              formatCurrency(record.records[0]?.tuesdayWeek3 || 0),
            width: 80,
            align: 'right' as const,
          },
          {
            title: "W4",
            key: "tuesdayWeek4",
            render: (_: unknown, record: OfferingRecord) =>
              formatCurrency(record.records[0]?.tuesdayWeek4 || 0),
            width: 80,
            align: 'right' as const,
          },
          {
            title: "W5",
            key: "tuesdayWeek5",
            render: (_: unknown, record: OfferingRecord) =>
              formatCurrency(record.records[0]?.tuesdayWeek5 || 0),
            width: 80,
            align: 'right' as const,
          },
        ],
      },
      {
        title: "Thursday",
        children: [
          {
            title: "W1",
            key: "thursdayWeek1",
            render: (_: unknown, record: OfferingRecord) =>
              formatCurrency(record.records[0]?.thursdayWeek1 || 0),
            width: 80,
            align: 'right' as const,
          },
          {
            title: "W2",
            key: "thursdayWeek2",
            render: (_: unknown, record: OfferingRecord) =>
              formatCurrency(record.records[0]?.thursdayWeek2 || 0),
            width: 80,
            align: 'right' as const,
          },
          {
            title: "W3",
            key: "thursdayWeek3",
            render: (_: unknown, record: OfferingRecord) =>
              formatCurrency(record.records[0]?.thursdayWeek3 || 0),
            width: 80,
            align: 'right' as const,
          },
          {
            title: "W4",
            key: "thursdayWeek4",
            render: (_: unknown, record: OfferingRecord) =>
              formatCurrency(record.records[0]?.thursdayWeek4 || 0),
            width: 80,
            align: 'right' as const,
          },
          {
            title: "W5",
            key: "thursdayWeek5",
            render: (_: unknown, record: OfferingRecord) =>
              formatCurrency(record.records[0]?.thursdayWeek5 || 0),
            width: 80,
            align: 'right' as const,
          },
        ],
      },
    ] : []),
    {
      title: (
        <span className="font-bold text-green-600">Total</span>
      ),
      key: "total",
      render: (_: unknown, record: OfferingRecord) => (
        <span className="font-bold text-green-600 text-lg">
          {formatCurrency(record.records[0]?.total || 0)}
        </span>
      ),
      sorter: (a: OfferingRecord, b: OfferingRecord) => 
        (a.records[0]?.total || 0) - (b.records[0]?.total || 0),
      fixed: screens.xs ? "right" : false,
      width: screens.xs ? 110 : 130,
      align: 'right' as const,
    },
  ];

  // Responsive tithe columns
  const titheColumns: ColumnsType<TitheRecord> = [
    {
      title: (
        <span className="flex items-center gap-1">
          <CalendarOutlined />
          Month
        </span>
      ),
      dataIndex: "month",
      key: "month",
      sorter: (a: TitheRecord, b: TitheRecord) => a.month.localeCompare(b.month),
      fixed: screens.xs ? "left" : false,
      width: screens.xs ? 120 : 140,
      render: (month: string, record: TitheRecord) => (
        <div>
          <div className="font-semibold text-gray-800">{month}</div>
          {screens.sm && (
            <div className="text-xs text-gray-500">
              {getMonthName(record.createdAt)}
            </div>
          )}
        </div>
      ),
    },
    ...(screens.sm ? [
      {
        title: "Name",
        key: "name",
        render: (_: unknown, record: TitheRecord) => (
          <span className="font-medium text-gray-800">
            {record.records[0]?.name}
          </span>
        ),
        sorter: (a: TitheRecord, b: TitheRecord) =>
          (a.records[0]?.name || "").localeCompare(b.records[0]?.name || ""),
      },
      {
        title: "Tithe No.",
        key: "titheNumber",
        render: (_: unknown, record: TitheRecord) => (
          <Tag color="orange" className="font-mono">
            {record.records[0]?.titheNumber}
          </Tag>
        ),
      },
      {
        title: (
          <span className="flex items-center gap-1">
            <UserOutlined />
            Submitted By
          </span>
        ),
        dataIndex: "submittedBy",
        key: "submittedBy",
        render: (submittedBy: string) => (
          <span className="text-gray-700 font-medium">{submittedBy}</span>
        ),
      },
    ] : []),
    {
      title: "Weekly",
      children: [
        {
          title: "W1",
          key: "week1",
          render: (_: unknown, record: TitheRecord) =>
            formatCurrency(record.records[0]?.week1 || 0),
          width: 80,
          align: 'right' as const,
        },
        {
          title: "W2",
          key: "week2",
          render: (_: unknown, record: TitheRecord) =>
            formatCurrency(record.records[0]?.week2 || 0),
          width: 80,
          align: 'right' as const,
        },
        {
          title: "W3",
          key: "week3",
          render: (_: unknown, record: TitheRecord) =>
            formatCurrency(record.records[0]?.week3 || 0),
          width: 80,
          align: 'right' as const,
        },
        {
          title: "W4",
          key: "week4",
          render: (_: unknown, record: TitheRecord) =>
            formatCurrency(record.records[0]?.week4 || 0),
          width: 80,
          align: 'right' as const,
        },
        ...(screens.md ? [{
          title: "W5",
          key: "week5",
          render: (_: unknown, record: TitheRecord) =>
            formatCurrency(record.records[0]?.week5 || 0),
          width: 80,
          align: 'right' as const,
        }] : []),
      ],
    },
    {
      title: (
        <span className="font-bold text-green-600">Total</span>
      ),
      key: "total",
      render: (_: unknown, record: TitheRecord) => (
        <span className="font-bold text-green-600 text-lg">
          {formatCurrency(record.records[0]?.total || 0)}
        </span>
      ),
      sorter: (a: TitheRecord, b: TitheRecord) => 
        (a.records[0]?.total || 0) - (b.records[0]?.total || 0),
      fixed: screens.xs ? "right" : false,
      width: screens.xs ? 110 : 130,
      align: 'right' as const,
    },
  ];

  const addMenuItems: MenuProps["items"] = [
    {
      key: "tithe",
      label: (
        <div className="flex items-center gap-3 py-2">
          <DollarOutlined className="text-green-600 text-lg" />
          <div>
            <div className="font-semibold text-gray-800">Add Tithe</div>
            <div className="text-xs text-gray-500">Submit new tithe records</div>
          </div>
        </div>
      ),
      onClick: () => router.push("/submissions/add/tithe"),
    },
    {
      key: "offering",
      label: (
        <div className="flex items-center gap-3 py-2">
          <FileTextOutlined className="text-blue-600 text-lg" />
          <div>
            <div className="font-semibold text-gray-800">Add Offering</div>
            <div className="text-xs text-gray-500">Submit new offering records</div>
          </div>
        </div>
      ),
      onClick: () => router.push("/submissions/add/offerings"),
    },
  ];

  const renderAddButton = (): React.ReactElement => {
    const baseButtonClass = "!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white !font-bold rounded-2xl shadow-xl hover:shadow-2xl border-0 transition-all duration-300 transform hover:scale-105";

    if (screens.xs) {
      return (
        <Tooltip title="Add new submission" placement="left" color="blue">
          <Dropdown menu={{ items: addMenuItems }} trigger={["click"]} placement="bottomRight">
            <Button
              type="primary"
              icon={<PlusOutlined className="text-xl" />}
              size="large"
              className={baseButtonClass}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%'
              }}
            />
          </Dropdown>
        </Tooltip>
      );
    }

    if (screens.sm) {
      return (
        <Dropdown menu={{ items: addMenuItems }} trigger={["click"]} placement="bottomRight">
          <Button
            type="primary"
            icon={<PlusOutlined className="text-lg" />}
            className={`${baseButtonClass} h-14 text-base px-6`}
          >
            Add New
          </Button>
        </Dropdown>
      );
    }

    return (
      <Dropdown menu={{ items: addMenuItems }} trigger={["click"]}>
        <Button
          type="primary"
          icon={<PlusOutlined className="text-xl" />}
          className={`${baseButtonClass} h-16 text-lg px-8 flex items-center justify-center gap-3`}
        >
          Add New Submission
          <DownOutlined className="text-sm" />
        </Button>
      </Dropdown>
    );
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Spin size="large" className="mb-4" />
          <div className="text-gray-600 font-medium">Loading your records...</div>
        </div>
      </div>
    );
  }

  if (!assembly) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Card className="text-center shadow-2xl border-none max-w-md rounded-2xl">
          <div className="text-red-500 text-xl font-bold mb-4">
            Access Required
          </div>
          <p className="text-gray-600 mb-6">Please log in to view financial records</p>
          <Button 
            type="primary" 
            size="large" 
            onClick={() => router.push("/login")}
            className="rounded-xl h-12 px-8 font-semibold"
          >
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
                <div className="p-3 hidden lg:block bg-white rounded-2xl shadow-lg">
                  <FileTextOutlined className="text-3xl text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                    Financial Records
                  </h1>
                  <p className="text-gray-600 flex items-center justify-center lg:justify-start gap-2 lg:text-lg text-sm">
                    <InfoCircleOutlined />
                    {assembly} Assembly • Managing tithes and offerings
                  </p>
                </div>
              </div>
            </div>
            <div className="flex lg:flex-col sm:flex-row gap-4 lg:items-center">
              <Tooltip title="Refresh records data">
                <Button
                  icon={<ReloadOutlined className="text-lg" />}
                  onClick={fetchRecords}
                  loading={loading}
                  className="rounded-xl border-gray-300 font-semibold text-sm px-6 shadow-lg hover:shadow-xl transition-all"
                  size="large"
                    style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%'
              }}
                >
                  {screens.sm && ""}
                </Button>
              </Tooltip>
              {renderAddButton()}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <Row gutter={[20, 20]} className="mb-8">
          <Col xs={24} sm={12} lg={8}>
            <Card 
              className="shadow-2xl border-none rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white overflow-hidden"
              bodyStyle={{ padding: '24px' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-blue-100 text-sm font-semibold mb-2">TOTAL RECORDS</div>
                  <div className="text-3xl font-bold mb-1">{totalRecords}</div>
                  <div className="text-blue-200 text-xs">All submissions</div>
                </div>
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <FileTextOutlined className="text-2xl" />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card 
              className="shadow-2xl border-none rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white overflow-hidden"
              bodyStyle={{ padding: '24px' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-green-100 text-sm font-semibold mb-2">TOTAL OFFERINGS</div>
                  <div className="text-3xl font-bold mb-1">{formatCurrency(totalOfferings)}</div>
                  <div className="text-green-200 text-xs">{offeringRecords.length} records</div>
                </div>
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <DollarOutlined className="text-2xl" />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card 
              className="shadow-2xl border-none rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white overflow-hidden"
              bodyStyle={{ padding: '24px' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-purple-100 text-sm font-semibold mb-2">TOTAL TITHES</div>
                  <div className="text-3xl font-bold mb-1">{formatCurrency(totalTithes)}</div>
                  <div className="text-purple-200 text-xs">{titheRecords.length} records</div>
                </div>
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <UserOutlined className="text-2xl" />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Main Records Card */}
        <Card 
          className="shadow-2xl rounded-3xl border-none overflow-hidden bg-white"
          bodyStyle={{ padding: screens.xs ? '20px 12px' : '32px 24px' }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={(key: string) => setActiveTab(key as TabKey)}
            centered
            type="card"
            size={screens.xs ? "small" : "large"}
            items={[
              {
                key: "offerings",
                label: (
                  <span className="font-bold text-gray-700 flex items-center gap-3 py-2 px-4">
                    <DollarOutlined className="text-blue-600 text-lg" />
                    <span className="hidden sm:inline">Offerings</span>
                    <span className="sm:hidden">Offers</span>
                    <Badge 
                      count={offeringRecords.length} 
                      showZero 
                      color="blue"
                      className="ml-1"
                    />
                  </span>
                ),
                children: (
                  <Table
                    columns={offeringColumns}
                    dataSource={offeringRecords}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ 
                      pageSize: 10, 
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total: number, range: [number, number]) => 
                        `${range[0]}-${range[1]} of ${total} records`,
                      className: 'px-4'
                    }}
                    scroll={{ x: screens.xs ? 800 : 'max-content' }}
                    locale={{
                      emptyText: (
                        <div className="py-16 text-center text-gray-500">
                          <DollarOutlined className="text-5xl text-gray-300 mb-4" />
                          <div className="text-xl font-semibold mb-2">No offering records found</div>
                          <p className="text-gray-500 mb-6">Get started by adding your first offering submission</p>
                          <Button 
                            type="primary" 
                            icon={<PlusOutlined />}
                            onClick={() => router.push("/submissions/add/offerings")}
                            size="large"
                            className="rounded-xl"
                          >
                            Add First Offering
                          </Button>
                        </div>
                      ),
                    }}
                    className="mt-6"
                    rowClassName="hover:bg-blue-50 transition-colors duration-200"
                    size={screens.xs ? "small" : "middle"}
                  />
                ),
              },
              {
                key: "tithes",
                label: (
                  <span className="font-bold text-gray-700 flex items-center gap-3 py-2 px-4">
                    <UserOutlined className="text-purple-600 text-lg" />
                    <span>Tithes</span>
                    <Badge 
                      count={titheRecords.length} 
                      showZero 
                      color="purple"
                      className="ml-1"
                    />
                  </span>
                ),
                children: (
                  <Table
                    columns={titheColumns}
                    dataSource={titheRecords}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ 
                      pageSize: 10, 
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total: number, range: [number, number]) => 
                        `${range[0]}-${range[1]} of ${total} records`,
                      className: 'px-4'
                    }}
                    scroll={{ x: screens.xs ? 800 : 'max-content' }}
                    locale={{
                      emptyText: (
                        <div className="py-16 text-center text-gray-500">
                          <UserOutlined className="text-5xl text-gray-300 mb-4" />
                          <div className="text-xl font-semibold mb-2">No tithe records found</div>
                          <p className="text-gray-500 mb-6">Get started by adding your first tithe submission</p>
                          <Button 
                            type="primary" 
                            icon={<PlusOutlined />}
                            onClick={() => router.push("/submissions/add/tithe")}
                            size="large"
                            className="rounded-xl"
                          >
                            Add First Tithe
                          </Button>
                        </div>
                      ),
                    }}
                    className="mt-6"
                    rowClassName="hover:bg-purple-50 transition-colors duration-200"
                    size={screens.xs ? "small" : "middle"}
                  />
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default RecordsDashboard;