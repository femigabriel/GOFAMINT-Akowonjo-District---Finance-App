// app/admin/dashboard/page.tsx
"use client";

import AssembliesContent from "@/components/admin/dashbord/AssembliesContent";
import AdminLayout from "@/components/admin/layout/AdminLayout";



export default function AdminDashboard() {
  return (
    <AdminLayout>
      <AssembliesContent />
    </AdminLayout>
  );
}