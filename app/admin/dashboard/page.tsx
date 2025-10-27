// app/admin/dashboard/page.tsx
"use client";

import DashboardContent from "@/components/admin/dashbord/DashboardContent";
import AdminLayout from "@/components/admin/layout/AdminLayout";



export default function AdminDashboard() {
  return (
    <AdminLayout>
      <DashboardContent />
    </AdminLayout>
  );
}