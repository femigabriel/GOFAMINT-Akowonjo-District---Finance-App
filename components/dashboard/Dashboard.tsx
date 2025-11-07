"use client";

import React, { useEffect, useState } from "react";
import { Skeleton, Row, Col, Card } from "antd";
import DashboardPage from "./DashboardPage";
import { NavBar } from "../layout/NavBar";
import { motion, AnimatePresence } from "framer-motion";

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate hydration + dashboard prep
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400); // short delay for smooth load
    return () => clearTimeout(timer);
  }, []);

  // 🧱 Dashboard skeleton placeholder
  const DashboardSkeleton = () => (
    <div className="p-4 md:p-6">
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map((i) => (
          <Col key={i} xs={12} sm={12} md={6}>
            <Card>
              <Skeleton active paragraph={false} title={{ width: "70%" }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="mt-6">
        <Skeleton active paragraph={{ rows: 6 }} title={{ width: "30%" }} />
      </Card>
    </div>
  );

  return (
    <div className="relative min-h-screen">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DashboardSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <DashboardPage />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden block mt-10">
        <div className="h-[50px]" />
        <NavBar />
      </div>
    </div>
  );
};
