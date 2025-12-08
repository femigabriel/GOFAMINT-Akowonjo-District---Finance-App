// app/admin/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import DashboardContent from "@/components/admin/dashbord/DashboardContent";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { AdminDashboardSkeleton } from "@/components/admin/dashbord/AdminDashboardSkeleton";
import SundayServiceReportsTable from "@/components/admin/dashbord/SundayServiceReportsTable";

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AdminLayout>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="admin-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AdminDashboardSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="admin-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
          
            <DashboardContent />
              {/* <SundayServiceReportsTable /> */}
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
