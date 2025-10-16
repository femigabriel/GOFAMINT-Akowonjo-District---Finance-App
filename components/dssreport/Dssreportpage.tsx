"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { message } from "antd";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/DashboardLayout";
import DistrictSundayServiceReport from "../records/DistrictSundayServiceReport";


export default function Dssreportpage() {
  const [assembly, setAssembly] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const router = useRouter();

  useEffect(() => {
    const storedAssembly = localStorage.getItem("assembly");
    if (!storedAssembly) {
      message.error("Please log in again");
      router.push("/");
    } else {
      setAssembly(storedAssembly);
    }
  }, [router]);

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
      <DistrictSundayServiceReport />
    </MainLayout>
  );
}
