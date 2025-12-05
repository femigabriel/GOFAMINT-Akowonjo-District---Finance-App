// app/admin/dashboard/page.tsx
"use client";

import DashboardContent from "@/components/admin/dashbord/DashboardContent";
import FinancialReports from "@/components/admin/dashbord/ReportsContent";
import AdminLayout from "@/components/admin/layout/AdminLayout";



export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <DashboardContent />
        {/* <FinancialReports /> */}
    </AdminLayout>
  );
}