// components/dashboard/DashboardHeader.tsx
"use client";

import { Calendar } from "lucide-react";
import { Typography, DatePicker } from "antd";
import dayjs from "dayjs";
import { motion } from "framer-motion";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface DashboardHeaderProps {
  assembly: string | null;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  onRangeChange: (dates: any) => void;
}

export default function DashboardHeader({ assembly, dateRange, onRangeChange }: DashboardHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 "
    >
      <div>
        <h3
          className="text-xl tracking-tight font-bold"
        >
          Welcome back, {assembly || "Assembly"}
        </h3>
        <Text className="text-gray-400 text-sm">
          {dayjs().format("dddd, MMMM D, YYYY")}
        </Text>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all">
          <Calendar className="w-4 h-4 text-primary" />
          <Text className="text-gray-700 font-medium">Date Range:</Text>
          <RangePicker
            value={dateRange}
            onChange={onRangeChange}
            format="MMM D, YYYY"
            className="border-none bg-transparent w-full sm:w-auto"
            size="small"
            suffixIcon={null}
          />
        </div>
      </div>
    </motion.div>
  );
}
