// app/admin/dashboard/page.tsx
"use client";


import TitheSpreadsheet from "@/components/admin/dashbord/TitheAnalyticsDashboard";
import AdminLayout from "@/components/admin/layout/AdminLayout";



export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <TitheSpreadsheet />
    </AdminLayout>
  );
}