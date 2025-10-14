// app/submissions/offerings/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/DashboardLayout";
import AddOfferingSheet from "@/components/offerings/AddOfferingSheet";
import { DatePicker, Collapse } from "antd";

const { Panel } = Collapse;

export default function OfferingsPage() {
  const { assembly, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs(),
    dayjs(),
  ]);

  // Debug auth state
  useEffect(() => {
    console.log("Auth state:", { isAuthenticated, assembly, authLoading });
  }, [isAuthenticated, assembly, authLoading]);

  // Handle redirect
  useEffect(() => {
    if (!authLoading) {
      console.log("Checking redirect:", { isAuthenticated, assembly });
      if (!isAuthenticated || !assembly) {
        console.log("Redirecting to /login due to invalid auth state");
        router.push("/login");
      }
    }
  }, [isAuthenticated, assembly, authLoading, router]);

  // Prevent rendering until auth check is complete
  if (authLoading || !isAuthenticated || !assembly) {
    return null;
  }

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedDate(date.toDate());
      setDateRange([date, date]);
    }
  };

  return (
    <MainLayout
      assembly={assembly}
      showHeader={true}
      dateRange={dateRange}
      onRangeChange={setDateRange}
      activeItem="add-sub"
    >
      <div className="container mx-auto p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-gray-100 min-h-screen">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3 mb-4">
            Offerings Management
          </h2>
          <DatePicker.MonthPicker
            value={dayjs(selectedDate)}
            onChange={handleDateChange}
            format="MMMM YYYY"
            className="w-full sm:w-48 rounded-md border-gray-300 focus:border-blue-500"
          />
        </div>
        <Collapse
          defaultActiveKey={["sunday", "tuesday-thursday"]}
          className="bg-transparent"
          expandIconPosition="end"
        >
          <Panel
            header={<span className="text-lg font-semibold">Sunday Service</span>}
            key="sunday"
            className="mb-4"
          >
            <AddOfferingSheet type="Sunday Service" selectedDate={selectedDate} />
          </Panel>
          <Panel
            header={<span className="text-lg font-semibold">Tuesday Bible Study and Thursday Prayer Meeting</span>}
            key="tuesday-thursday"
            className="mb-4"
          >
            <AddOfferingSheet
              type="Tuesday Bible Study and Thursday Prayer Meeting"
              selectedDate={selectedDate}
            />
          </Panel>
          <Panel
            header={<span className="text-lg font-semibold">Special Offerings</span>}
            key="special"
            className="mb-4"
          >
            <AddOfferingSheet type="Special Offerings" selectedDate={selectedDate} />
          </Panel>
        </Collapse>
      </div>
    </MainLayout>
  );
}