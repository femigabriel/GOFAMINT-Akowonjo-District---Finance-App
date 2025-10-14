"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  message,
  Typography,
  Spin,
  Table,
  DatePicker,
  Empty,
  Tag,
  Dropdown,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  CalendarOutlined,
  HistoryOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import dayjs from "dayjs";
import type { MenuProps } from "antd";

const { Title, Text } = Typography;
const { MonthPicker } = DatePicker;

interface Submission {
  week: string;
  date: string;
  tithe: number;
  offeringGeneral: number;
  offeringSpecial: number;
  welfare: number;
  missionaryFund: number;
  total: number;
  remarks: string;
}

const tableColumns = [
  {
    title: "Week",
    dataIndex: "week",
    key: "week",
    render: (week: string) => <Tag color="blue">{week}</Tag>,
  },
  {
    title: "Date",
    dataIndex: "date",
    key: "date",
    render: (date: string) => dayjs(date).format("DD MMM YYYY"),
  },
  {
    title: "Tithe (₦)",
    dataIndex: "tithe",
    key: "tithe",
    render: (value: number) =>
      value.toLocaleString("en-NG", { minimumFractionDigits: 2 }),
  },
  {
    title: "General Offering (₦)",
    dataIndex: "offeringGeneral",
    key: "offeringGeneral",
    render: (value: number) =>
      value.toLocaleString("en-NG", { minimumFractionDigits: 2 }),
  },
  {
    title: "Special Offering (₦)",
    dataIndex: "offeringSpecial",
    key: "offeringSpecial",
    render: (value: number) =>
      value.toLocaleString("en-NG", { minimumFractionDigits: 2 }),
  },
  {
    title: "Welfare (₦)",
    dataIndex: "welfare",
    key: "welfare",
    render: (value: number) =>
      value.toLocaleString("en-NG", { minimumFractionDigits: 2 }),
  },
  {
    title: "Missionary Fund (₦)",
    dataIndex: "missionaryFund",
    key: "missionaryFund",
    render: (value: number) =>
      value.toLocaleString("en-NG", { minimumFractionDigits: 2 }),
  },
  {
    title: "Total (₦)",
    dataIndex: "total",
    key: "total",
    render: (value: number) => (
      <Text strong className="text-green-600">
        {value.toLocaleString("en-NG", {
          style: "currency",
          currency: "NGN",
          minimumFractionDigits: 2,
        })}
      </Text>
    ),
  },
  {
    title: "Remarks",
    dataIndex: "remarks",
    key: "remarks",
    render: (remarks: string) => remarks || "-",
  },
];

export default function AddSubmissionPage() {
  const { assembly, isAuthenticated, loading } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().startOf("month"));
  const [tableLoading, setTableLoading] = useState(false);
  const router = useRouter();

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
  

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !assembly) {
        message.error("Please log in again");
        router.push("/login");
      } else {
        fetchSubmissions();
      }
      setPageLoading(false);
    }
  }, [loading, isAuthenticated, assembly, router]);

  const fetchSubmissions = async () => {
    if (!assembly) return;
    setTableLoading(true);
    try {
      const res = await fetch(`/api/submissions?assembly=${assembly}`);
      if (res.ok) {
        const data = await res.json();
        const filtered = data.submissions.filter((s: Submission) =>
          dayjs(s.date).isSame(selectedMonth, "month")
        );
        setSubmissions(filtered);
      } else message.error("Failed to fetch submissions");
    } catch {
      message.error("Error fetching submissions");
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && isAuthenticated && assembly) fetchSubmissions();
  }, [selectedMonth, loading, isAuthenticated, assembly]);

  if (pageLoading || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <motion.div
      className="p- sm:p-2 md:p-2 min-h-screen flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
          <div>
            <Title
              level={3}
              className="!text-gray-800 !mb-1 !leading-tight font-bold"
            >
              Financial Report
            </Title>
            <Text className="text-gray-600 text-sm sm:text-base">
              {assembly} • {selectedMonth.format("MMMM YYYY")}
            </Text>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <MonthPicker
              value={selectedMonth}
              onChange={(value) => setSelectedMonth(value || dayjs())}
              format="MMMM YYYY"
              className="rounded-lg border-gray-300 h-11 w-full sm:w-48"
              placeholder="Select month"
              suffixIcon={<CalendarOutlined className="text-gray-400" />}
              allowClear={false}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchSubmissions}
              className="h-11 w-full sm:w-auto border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
              loading={tableLoading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-5">
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

          <Button
            onClick={() => router.push("/submissions/history")}
            icon={<HistoryOutlined />}
            className="!bg-white !text-gray-700 !font-semibold rounded-xl h-11 w-full sm:w-auto shadow-sm hover:shadow-md border-gray-200 hover:border-blue-300 transition-all duration-300 flex items-center justify-center gap-2 text-base"
          >
            View Full History
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex-1"
      >
        <Card
          bordered={false}
          className="shadow-xl rounded-2xl bg-white border-0 overflow-hidden"
        >
          <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <HistoryOutlined className="text-blue-600 text-lg" />
                <Title
                  level={4}
                  className="!text-gray-800 !mb-0 !leading-snug text-base sm:text-lg"
                >
                  Submission History – {selectedMonth.format("MMMM YYYY")}
                </Title>
              </div>
              <Tag color="blue" className="sm:ml-auto">
                {submissions.length} records
              </Tag>
            </div>
          </div>

          <div className="p-2 sm:p-4 overflow-x-auto">
            <Table
              columns={tableColumns}
              dataSource={submissions}
              rowKey={(record) => `${record.week}-${record.date}`}
              pagination={{
                pageSize: 6,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} records`,
              }}
              loading={tableLoading}
              locale={{
                emptyText: (
                  <Empty
                    description="No submissions found for this month"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
              }}
              className="min-w-[800px]"
              rowClassName={(_, index) =>
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              }
            />
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
