"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import MainLayout from "@/components/layout/DashboardLayout";
import AddOfferingSheet from "@/components/offerings/AddOfferingSheet";
import { DatePicker } from "antd";
import { useAuth } from "@/context/AuthContext";

export default function OfferingsPage() {
  const { assembly, isAuthenticated, loading } = useAuth(); // include loading
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs(),
    dayjs(),
  ]);

  // ✅ Handle redirect safely after render
  useEffect(() => {
    if (!loading && (!isAuthenticated || !assembly)) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, assembly, router]);

  // ✅ Prevent flashing content while checking auth
  if (loading || !isAuthenticated || !assembly) {
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
        <div className="flex flex-col gap-8">
          <AddOfferingSheet
            type="Sunday Service"
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
          <AddOfferingSheet
            type="Tuesday Bible Study and Thursday Prayer Meeting"
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
          <AddOfferingSheet
            type="Special"
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>
      </div>
    </MainLayout>
  );
}
