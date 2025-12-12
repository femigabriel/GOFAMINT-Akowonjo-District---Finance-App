// app/admin/dashboard/page.tsx
"use client";

import ChurchReport from "@/components/admin/dashbord/Dashboard";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import FinancialReportsPage from "@/components/admin/report/FinancialReportsPage";
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
