"use client";

import { useState, useEffect } from "react";
import { Button, Card, message, Typography, Spin, Table, DatePicker } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import dayjs from "dayjs";

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
  { title: "Week", dataIndex: "week", key: "week" },
  { title: "Date", dataIndex: "date", key: "date" },
  {
    title: "Tithe (₦)",
    dataIndex: "tithe",
    key: "tithe",
    render: (value: number) =>
      value.toLocaleString("en-NG", { style: "currency", currency: "NGN" }),
  },
  {
    title: "General Offering (₦)",
    dataIndex: "offeringGeneral",
    key: "offeringGeneral",
    render: (value: number) =>
      value.toLocaleString("en-NG", { style: "currency", currency: "NGN" }),
  },
  {
    title: "Special Offering (₦)",
    dataIndex: "offeringSpecial",
    key: "offeringSpecial",
    render: (value: number) =>
      value.toLocaleString("en-NG", { style: "currency", currency: "NGN" }),
  },
  {
    title: "Welfare (₦)",
    dataIndex: "welfare",
    key: "welfare",
    render: (value: number) =>
      value.toLocaleString("en-NG", { style: "currency", currency: "NGN" }),
  },
  {
    title: "Missionary Fund (₦)",
    dataIndex: "missionaryFund",
    key: "missionaryFund",
    render: (value: number) =>
      value.toLocaleString("en-NG", { style: "currency", currency: "NGN" }),
  },
  {
    title: "Total (₦)",
    dataIndex: "total",
    key: "total",
    render: (value: number) =>
      value.toLocaleString("en-NG", { style: "currency", currency: "NGN" }),
  },
  { title: "Remarks", dataIndex: "remarks", key: "remarks" },
];

export default function AddSubmissionPage() {
  const { assembly, isAuthenticated, loading } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().startOf("month"));
  const router = useRouter();

  // Handle authentication check
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

  // Fetch submissions for the selected month
  const fetchSubmissions = async () => {
    if (!assembly) return;
    try {
      const res = await fetch(`/api/submissions?assembly=${assembly}`);
      if (res.ok) {
        const data = await res.json();
        const filteredSubmissions = data.submissions.filter((submission: Submission) => {
          const submissionDate = dayjs(submission.date);
          return submissionDate.isSame(selectedMonth, "month");
        });
        setSubmissions(filteredSubmissions || []);
      } else {
        message.error("Failed to fetch submissions");
      }
    } catch (err) {
      message.error("Error fetching submissions");
    }
  };

  // Refresh submissions when month changes
  useEffect(() => {
    if (!loading && isAuthenticated && assembly) {
      fetchSubmissions();
    }
  }, [selectedMonth, loading, isAuthenticated, assembly]);

  // Show loading spinner while checking auth
  if (pageLoading || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8 min-h-screen flex flex-col bg-gray-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
  

      {/* Action Buttons */}
      <Card
        className="mb-6 w-full"
        style={{
          background: "linear-gradient(145deg, #ffffff, #f8fafc)",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          fontFamily: "'Inter', sans-serif",
          border: "1px solid #e2e8f0",
        }}
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            type="primary"
            onClick={() => router.push("/submissions/add/tithe")}
            icon={<PlusOutlined />}
            className="bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-lg px-6 py-6 text-lg transition-all duration-300 shadow-md w-full sm:w-auto"
          >
            Add Tithe
          </Button>
          <Button
            type="primary"
            onClick={() => router.push("/submissions/add/offering")}
            icon={<PlusOutlined />}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg px-6 py-6 text-lg transition-all duration-300 shadow-md w-full sm:w-auto"
          >
            Add Offering
          </Button>
        </div>
      </Card>

      {/* Submission History */}
      <Card
        className="mb-6 w-full"
        style={{
          background: "linear-gradient(145deg, #ffffff, #f8fafc)",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <Title level={4} className="text-blue-900 mb-4">
          Submission History
        </Title>
        <Table
          columns={tableColumns}
          dataSource={submissions}
          rowKey={(record) => `${record.week}-${record.date}`}
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "No submissions found for this month" }}
        />
      </Card>
    </motion.div>
  );
}