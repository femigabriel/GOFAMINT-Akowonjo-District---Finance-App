// app/admin/dashboard/page.tsx
"use client";

import AdminLayout from "@/components/admin/layout/AdminLayout";
// import FinancialReportsPage from "@/components/admin/report/FinancialReportsPage";
// import ChurchReport from "@/components/admin/dashbord/Dashboard";
import FinancialReportPage from "@/components/reports/FinancialReportPage";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <FinancialReportPage />
      {/* <FinancialReportsPage />

      <ChurchReport /> */}
    </AdminLayout>
  );
}
