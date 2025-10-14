// app/submissions/offerings/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import MainLayout from "@/components/layout/DashboardLayout";
import AddOfferingSheet from "@/components/offerings/AddOfferingSheet";
import { DatePicker, Collapse } from "antd";
import { useAuth } from "@/context/AuthContext";

const { Panel } = Collapse;

const predefinedSpecialOfferings = [
  "Pastor's Welfare",
  "Thanksgiving",
  "Missionaries",
  "Retirees",
  "Youth Offerings",
  "District Support",
  "ETF",
  "Special Offerings",
  "Vigil",
];

export default function OfferingsPage() {
  const { assembly, isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs(),
    dayjs(),
  ]);
  const [customOfferingType, setCustomOfferingType] = useState<string>("");
  const [loading, setLoading] = useState(true); // Track auth loading state

  // Debug auth state
  useEffect(() => {
    console.log("Auth state:", { isAuthenticated, assembly });
  }, [isAuthenticated, assembly]);

  // Handle redirect only once on mount or when auth state changes to invalid
  useEffect(() => {
    if (!loading) {
      console.log("Checking redirect:", { isAuthenticated, assembly });
      if (!isAuthenticated || !assembly) {
        console.log("Redirecting to /login due to invalid auth state");
        router.push("/login");
      }
    }
  }, [isAuthenticated, assembly, router, loading]);

  // Simulate auth check (replace with actual async auth logic if needed)
  useEffect(() => {
    // Assuming useAuth might be async, set loading to false after initial check
    setTimeout(() => {
      setLoading(false);
    }, 0); // Adjust based on actual auth context behavior
  }, []);

  // Prevent rendering until auth check is complete
  if (loading) {
    return null; // Avoid flashing content
  }

  // Additional check to prevent rendering if auth is invalid
  if (!isAuthenticated || !assembly) {
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
          defaultActiveKey={["weekly"]}
          className="bg-transparent"
          expandIconPosition="end"
        >
          <Panel
            header={<span className="text-lg font-semibold">Weekly Offerings</span>}
            key="weekly"
            className="mb-4"
          >
            <div className="flex flex-col gap-8">
              <AddOfferingSheet type="Sunday Service" selectedDate={selectedDate} />
              <AddOfferingSheet
                type="Tuesday Bible Study and Thursday Prayer Meeting"
                selectedDate={selectedDate}
              />
            </div>
          </Panel>
          <Panel
            header={<span className="text-lg font-semibold">Special Offerings</span>}
            key="special"
            className="mb-4"
          >
            <div className="flex flex-col gap-8">
              {predefinedSpecialOfferings.map((offeringType) => (
                <AddOfferingSheet
                  key={offeringType}
                  type={offeringType}
                  selectedDate={selectedDate}
                />
              ))}
              <AddOfferingSheet
                type="Custom"
                selectedDate={selectedDate}
                customTypeName={customOfferingType}
                onCustomTypeChange={setCustomOfferingType}
              />
            </div>
          </Panel>
        </Collapse>
      </div>
    </MainLayout>
  );
}