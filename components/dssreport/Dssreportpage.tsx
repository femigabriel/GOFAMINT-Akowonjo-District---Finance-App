"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { message, Skeleton, Row, Col, Card } from "antd";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/DashboardLayout";
import ServiceReportsManager from "./ServiceReportsManager";

export default function Dssreportpage() {
  const [assembly, setAssembly] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const router = useRouter();

  useEffect(() => {
    // Delay slightly to smooth out hydration and localStorage read
    const timer = setTimeout(() => {
      try {
        const storedAssembly = localStorage.getItem("assembly");
        if (!storedAssembly) {
          message.error("Please log in again");
          router.push("/");
        } else {
          setAssembly(storedAssembly);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [router]);

  const onRangeChange = (dates: any) => {
    if (dates) setDateRange(dates);
  };

  // ✅ Skeleton Dashboard Loader
  const DashboardSkeleton = () => (
    <div className="p-6">
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map((i) => (
          <Col key={i} xs={12} sm={12} md={6}>
            <Card>
              <Skeleton active paragraph={false} title={{ width: "80%" }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="mt-6">
        <Skeleton active paragraph={{ rows: 6 }} title={{ width: "40%" }} />
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <MainLayout activeItem="records" showHeader>
        <DashboardSkeleton />
      </MainLayout>
    );
  }

  if (!assembly) return null;

  return (
    <MainLayout
      activeItem="records"
      showHeader
      assembly={assembly}
      dateRange={dateRange}
      onRangeChange={onRangeChange}
    >
      <ServiceReportsManager />
    </MainLayout>
  );
}
