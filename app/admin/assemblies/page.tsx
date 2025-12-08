// app/admin/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import TitheSpreadsheet from "@/components/admin/dashbord/TitheAnalyticsDashboard";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { AssembliesSkeleton } from "@/components/admin/dashbord/AssembliesSkeleton";

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
            key="assemblies-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AssembliesSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="assemblies-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <TitheSpreadsheet />
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
