// app/admin/dashboard/page.tsx
"use client";

import ChurchReport from "@/components/admin/dashbord/Dashboard";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import FinancialReportsPage from "@/components/admin/report/FinancialReportsPage";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <FinancialReportsPage />

      <ChurchReport />
    </AdminLayout>
  );
}
