"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { message } from "antd";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/DashboardLayout";
import FinancialRecordsDisplay from "../dssreport/FinancialRecordsDisplay";
import { useAuth } from "@/context/AuthContext";

export default function RecordsPage() {
  const { assembly } = useAuth();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const router = useRouter();



  const onRangeChange = (dates: any) => {
    if (dates) setDateRange(dates);
  };

  return (
    <MainLayout
      activeItem="records"
      showHeader
      assembly={assembly}
      dateRange={dateRange}
      onRangeChange={onRangeChange}
    >
      {/* <RecordsDashboard /> */}
      <FinancialRecordsDisplay assembly={assembly} />
    </MainLayout>
  );
}
