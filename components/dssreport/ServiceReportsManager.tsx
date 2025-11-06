// components/dashboard/ServiceReportsManager.tsx
"use client";

import { useState } from "react";
import { Tabs, Card } from "antd";
import { CalendarOutlined, TeamOutlined } from "@ant-design/icons";
import { useAuth } from "@/context/AuthContext";
import DistrictSundayServiceReport from "./DistrictSundayServiceReport";
import MidweekServiceReport from "./MidweekServiceSection";

const ServiceReportsManager: React.FC = () => {
  const { assembly } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("sunday");

  const tabItems = [
    {
      key: "sunday",
      label: (
        <span className="flex items-center gap-2">
          <CalendarOutlined />
          Sunday Services
        </span>
      ),
      children: <DistrictSundayServiceReport />,
    },
    {
      key: "midweek",
      label: (
        <span className="flex items-center gap-2">
          <TeamOutlined />
          Midweek Services
        </span>
      ),
      children: <MidweekServiceReport assembly={assembly} />,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        className="p-4"
      />
    </div>
  );
};

export default ServiceReportsManager;