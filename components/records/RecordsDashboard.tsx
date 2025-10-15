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
} from "antd";
import { ColumnsType } from "antd/es/table";
import moment from "moment";
import { useAuth } from "@/context/AuthContext";
import type { MenuProps } from "antd";
import { PlusOutlined, DownOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

interface OfferingRecord {
  _id: string;
  month: string;
  type: string;
  submittedBy: string;
  records: {
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
  }[];
  createdAt: string;
}

interface TitheRecord {
  _id: string;
  month: string;
  submittedBy: string;
  records: {
    name: string;
    titheNumber: string;
    week1: number;
    week2: number;
    week3: number;
    week4: number;
    week5: number;
    total: number;
  }[];
  createdAt: string;
}

const RecordsDashboard: React.FC = () => {
  const { assembly, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [offeringRecords, setOfferingRecords] = useState<OfferingRecord[]>([]);
  const [titheRecords, setTitheRecords] = useState<TitheRecord[]>([]);
  const router = useRouter();


  useEffect(() => {
    if (assembly) {
      fetchRecords();
    }
  }, [assembly]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/records?assembly=${assembly}`);
      const data = await response.json();
      if (response.ok) {
        setOfferingRecords(data.offeringRecords);
        setTitheRecords(data.titheRecords);
      } else {
        message.error(data.error || "Failed to fetch records");
      }
    } catch {
      message.error("An error occurred while fetching records");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals for summary
  const totalOfferings = offeringRecords.reduce(
    (sum, record) => sum + (record.records[0]?.total || 0),
    0
  );
  const totalTithes = titheRecords.reduce(
    (sum, record) => sum + (record.records[0]?.total || 0),
    0
  );

  // Offering Table Columns
  const offeringColumns: ColumnsType<OfferingRecord> = [
    {
      title: "Month",
      dataIndex: "month",
      key: "month",
      sorter: (a, b) => a.month.localeCompare(b.month),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      sorter: (a, b) => a.type.localeCompare(b.type),
    },
    {
      title: "Submitted By",
      dataIndex: "submittedBy",
      key: "submittedBy",
    },
    {
      title: "Sunday Offerings",
      children: [
        {
          title: "Week 1",
          key: "week1",
          render: (_, record) =>
            record.records[0]?.week1?.toLocaleString() || 0,
        },
        {
          title: "Week 2",
          key: "week2",
          render: (_, record) =>
            record.records[0]?.week2?.toLocaleString() || 0,
        },
        {
          title: "Week 3",
          key: "week3",
          render: (_, record) =>
            record.records[0]?.week3?.toLocaleString() || 0,
        },
        {
          title: "Week 4",
          key: "week4",
          render: (_, record) =>
            record.records[0]?.week4?.toLocaleString() || 0,
        },
        {
          title: "Week 5",
          key: "week5",
          render: (_, record) =>
            record.records[0]?.week5?.toLocaleString() || 0,
        },
      ],
    },
    {
      title: "Tuesday Bible Study",
      children: [
        {
          title: "Week 1",
          key: "tuesdayWeek1",
          render: (_, record) =>
            record.records[0]?.tuesdayWeek1?.toLocaleString() || 0,
        },
        {
          title: "Week 2",
          key: "tuesdayWeek2",
          render: (_, record) =>
            record.records[0]?.tuesdayWeek2?.toLocaleString() || 0,
        },
        {
          title: "Week 3",
          key: "tuesdayWeek3",
          render: (_, record) =>
            record.records[0]?.tuesdayWeek3?.toLocaleString() || 0,
        },
        {
          title: "Week 4",
          key: "tuesdayWeek4",
          render: (_, record) =>
            record.records[0]?.tuesdayWeek4?.toLocaleString() || 0,
        },
        {
          title: "Week 5",
          key: "tuesdayWeek5",
          render: (_, record) =>
            record.records[0]?.tuesdayWeek5?.toLocaleString() || 0,
        },
      ],
    },
    {
      title: "Thursday Prayer",
      children: [
        {
          title: "Week 1",
          key: "thursdayWeek1",
          render: (_, record) =>
            record.records[0]?.thursdayWeek1?.toLocaleString() || 0,
        },
        {
          title: "Week 2",
          key: "thursdayWeek2",
          render: (_, record) =>
            record.records[0]?.thursdayWeek2?.toLocaleString() || 0,
        },
        {
          title: "Week 3",
          key: "thursdayWeek3",
          render: (_, record) =>
            record.records[0]?.thursdayWeek3?.toLocaleString() || 0,
        },
        {
          title: "Week 4",
          key: "thursdayWeek4",
          render: (_, record) =>
            record.records[0]?.thursdayWeek4?.toLocaleString() || 0,
        },
        {
          title: "Week 5",
          key: "thursdayWeek5",
          render: (_, record) =>
            record.records[0]?.thursdayWeek5?.toLocaleString() || 0,
        },
      ],
    },
    {
      title: "Total",
      key: "total",
      render: (_, record) => (
        <span className="font-semibold text-green-600">
          {record.records[0]?.total?.toLocaleString() || 0}
        </span>
      ),
      sorter: (a, b) => (a.records[0]?.total || 0) - (b.records[0]?.total || 0),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => moment(date).format("MMM DD, YYYY"),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  // Tithe Table Columns
  const titheColumns: ColumnsType<TitheRecord> = [
    {
      title: "Month",
      dataIndex: "month",
      key: "month",
      sorter: (a, b) => a.month.localeCompare(b.month),
    },
    {
      title: "Name",
      key: "name",
      render: (_, record) => record.records[0]?.name,
      sorter: (a, b) =>
        (a.records[0]?.name || "").localeCompare(b.records[0]?.name || ""),
    },
    {
      title: "Tithe Number",
      key: "titheNumber",
      render: (_, record) => record.records[0]?.titheNumber,
    },
    {
      title: "Submitted By",
      dataIndex: "submittedBy",
      key: "submittedBy",
    },
    {
      title: "Weekly Tithes",
      children: [
        {
          title: "Week 1",
          key: "week1",
          render: (_, record) =>
            record.records[0]?.week1?.toLocaleString() || 0,
        },
        {
          title: "Week 2",
          key: "week2",
          render: (_, record) =>
            record.records[0]?.week2?.toLocaleString() || 0,
        },
        {
          title: "Week 3",
          key: "week3",
          render: (_, record) =>
            record.records[0]?.week3?.toLocaleString() || 0,
        },
        {
          title: "Week 4",
          key: "week4",
          render: (_, record) =>
            record.records[0]?.week4?.toLocaleString() || 0,
        },
        {
          title: "Week 5",
          key: "week5",
          render: (_, record) =>
            record.records[0]?.week5?.toLocaleString() || 0,
        },
      ],
    },
    {
      title: "Total",
      key: "total",
      render: (_, record) => (
        <span className="font-semibold text-green-600">
          {record.records[0]?.total?.toLocaleString() || 0}
        </span>
      ),
      sorter: (a, b) => (a.records[0]?.total || 0) - (b.records[0]?.total || 0),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => moment(date).format("MMM DD, YYYY"),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (!assembly) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-red-500 text-lg font-semibold">
          Please log in to view records.
        </p>
      </div>
    );
  }

  const addMenuItems: MenuProps["items"] = [
    {
      key: "tithe",
      label: "Add Tithe Submission",
      icon: <PlusOutlined />,
      onClick: () => router.push("/submissions/add/tithe"),
    },
    {
      key: "offering",
      label: "Add Offering Submission",
      icon: <PlusOutlined />,
      onClick: () => router.push("submissions/add/offerings"),
    },
  ];

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
      {/* Summary Card */}
      <Card className="mb-6 shadow-lg rounded-lg bg-white border-none">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Statistic
              title="Total Offerings"
              value={totalOfferings}
              prefix="₦"
              valueStyle={{ color: "#3f8600" }}
              className="text-center"
            />
          </Col>
          <Col xs={24} sm={12}>
            <Statistic
              title="Total Tithes"
              value={totalTithes}
              prefix="₦"
              valueStyle={{ color: "#3f8600" }}
              className="text-center"
            />
          </Col>
        </Row>
      </Card>

      {/* Main Records Card */}
      <Card className="shadow-lg rounded-lg bg-white border-none">
        <div className="flex justify-between">
          <h1 className="lg:text-2xl text-base font-bold text-center mb-6 text-gray-800">
            {assembly} Assembly Financial Records
          </h1>
          <Dropdown menu={{ items: addMenuItems }} trigger={["click"]}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="!bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-700 hover:!to-purple-700 !text-white !font-semibold rounded-xl h-11 w-full sm:w-auto shadow-md hover:shadow-lg border-0 flex items-center justify-center gap-2 text-base"
            >
              Add New Submission
              <DownOutlined className="text-sm" />
            </Button>
          </Dropdown>
        </div>
        <Tabs
          defaultActiveKey="offerings"
          centered
          type="card"
          items={[
            {
              key: "offerings",
              label: (
                <span className="text-lg font-semibold text-gray-700">
                  Offerings
                </span>
              ),
              children: (
                <Table
                  columns={offeringColumns}
                  dataSource={offeringRecords}
                  rowKey="_id"
                  loading={loading}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  scroll={{ x: "max-content" }}
                  locale={{
                    emptyText: (
                      <div className="py-4 text-gray-500">
                        No offering records found for {assembly}.
                      </div>
                    ),
                  }}
                  className="mt-4 rounded-lg overflow-hidden"
                  rowClassName="hover:bg-gray-50"
                />
              ),
            },
            {
              key: "tithes",
              label: (
                <span className="text-lg font-semibold text-gray-700">
                  Tithes
                </span>
              ),
              children: (
                <Table
                  columns={titheColumns}
                  dataSource={titheRecords}
                  rowKey="_id"
                  loading={loading}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  scroll={{ x: "max-content" }}
                  locale={{
                    emptyText: (
                      <div className="py-4 text-gray-500">
                        No tithe records found for {assembly}.
                      </div>
                    ),
                  }}
                  className="mt-4 rounded-lg overflow-hidden"
                  rowClassName="hover:bg-gray-50"
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default RecordsDashboard;
