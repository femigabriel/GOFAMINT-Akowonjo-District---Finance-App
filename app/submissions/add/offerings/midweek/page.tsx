// app/submissions/offerings/tuesday-thursday/page.tsx
"use client";


import { useRouter } from "next/navigation";
import { useState } from "react";
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/DashboardLayout";
import AddOfferingSheet from "@/components/offerings/AddOfferingSheet";

export default function TuesdayThursdayOfferingsPage() {
  const { assembly, isAuthenticated } = useAuth();
  const router = useRouter();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs(),
    dayjs(),
  ]);

  if (!isAuthenticated || !assembly) {
    router.push("/login");
    return null;
  }

  return (
    <MainLayout
      assembly={assembly}
      showHeader={true}
      dateRange={dateRange}
      onRangeChange={setDateRange}
       activeItem="add-sub"
    >
      <AddOfferingSheet type="Tuesday Bible Study and Thursday Prayer Meeting" />
      
    </MainLayout>
  );
}