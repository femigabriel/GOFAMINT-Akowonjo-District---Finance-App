"use client";

import React, { useState, useEffect } from "react";
import { Skeleton, Card, Row, Col } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { NavBar } from "@/components/layout/NavBar";
import RecordsPage from "@/components/records/RecordsPage";

export default function Submissions() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate hydration/loading before showing content
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // 🧱 Skeleton placeholder layout
  const RecordsSkeleton = () => (
    <div className="p-4 md:p-6">
      <Row gutter={[16, 16]}>
        {[1, 2, 3].map((i) => (
          <Col key={i} xs={24} sm={12} md={8}>
            <Card>
              <Skeleton active paragraph={false} title={{ width: "60%" }} />
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
            <RecordsSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <RecordsPage />
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
}
