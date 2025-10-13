"use client";

import { useState } from "react";
import { Button, Card, message, Typography, DatePicker, InputNumber, Input } from "antd";
import { SaveOutlined, CloseOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function AddTithePage() {
  const { assembly, isAuthenticated } = useAuth();
  const [week, setWeek] = useState("Week 1");
  const [date, setDate] = useState(dayjs());
  const [tithe, setTithe] = useState<number>(0);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!assembly || !isAuthenticated) {
      message.error("Please log in again");
      router.push("/login");
      return;
    }

    if (tithe < 0) {
      message.error("Tithe amount cannot be negative");
      return;
    }

    setLoading(true);
    const submission = {
      week,
      date: date.format("YYYY-MM-DD"),
      tithe,
      offeringGeneral: 0,
      offeringSpecial: 0,
      welfare: 0,
      missionaryFund: 0,
      total: tithe,
      remarks,
      assembly,
    };

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assembly, submissions: [submission] }),
      });
      if (res.ok) {
        message.success("Tithe saved successfully!");
        router.push("/submissions/add");
      } else {
        message.error("Failed to save tithe");
      }
    } catch (err) {
      message.error("Error saving tithe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8 min-h-screen flex flex-col bg-gray-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Title level={2} className="text-blue-900 mb-6">
        Add Tithe
      </Title>
      <Card
        style={{
          background: "linear-gradient(145deg, #ffffff, #f8fafc)",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="flex flex-col gap-4">
          <div>
            <Text className="block mb-2">Week</Text>
            <Input
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              placeholder="e.g., Week 1"
              className="w-full"
            />
          </div>
          <div>
            <Text className="block mb-2">Date</Text>
            <DatePicker
              value={date}
              onChange={(date) => setDate(date || dayjs())}
              format="YYYY-MM-DD"
              className="w-full"
            />
          </div>
          <div>
            <Text className="block mb-2">Tithe Amount (₦)</Text>
            <InputNumber
              value={tithe}
              onChange={(value) => setTithe(value || 0)}
              min={0}
              className="w-full"
              formatter={(value) =>
                `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value?.replace(/₦\s?|(,*)/g, "") as any}
            />
          </div>
          <div>
            <Text className="block mb-2">Remarks (Optional)</Text>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add remarks"
              className="w-full"
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="primary"
              onClick={handleSave}
              loading={loading}
              icon={<SaveOutlined />}
              className="bg-blue-900 hover:bg-blue-950 text-white"
            >
              Save
            </Button>
            <Button
              onClick={() => router.push("/submissions/add")}
              icon={<CloseOutlined />}
              className="border-gray-200 hover:border-blue-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}