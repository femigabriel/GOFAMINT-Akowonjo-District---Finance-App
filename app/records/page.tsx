// import React from "react";

// import { NavBar } from "@/components/layout/NavBar";
// import RecordsPage from "@/components/records/RecordsPage";

// export default function Submisions() {
//   return (
//     <div>
//       <RecordsPage />
//        <div className="lg:hidden block">
//         <NavBar />
//       </div>
//     </div>
//   );
// };

"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { message } from "antd";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import FinancialRecordsDisplay from "@/components/dssreport/FinancialRecordsDisplay";

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
    >      <FinancialRecordsDisplay assembly={assembly} />
    </MainLayout>
  );
}
