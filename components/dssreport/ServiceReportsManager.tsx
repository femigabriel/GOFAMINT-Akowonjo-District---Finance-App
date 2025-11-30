// components/dashboard/ServiceReportsManager.tsx
"use client";

import { useState } from "react";
import { Tabs, Card } from "antd";
import { 
  CalendarOutlined, 
  TeamOutlined, 
  StarOutlined, 
  FileTextOutlined 
} from "@ant-design/icons";
import { useAuth } from "@/context/AuthContext";
import DistrictSundayServiceReport from "./DistrictSundayServiceReport";
import MidweekServiceReport from "./MidweekServiceSection";
import SpecialServiceReport from "./SpecialServiceReport";
import FinancialReportsManager from "./FinancialReportsManager";

const ServiceReportsManager: React.FC = () => {
  const { assembly } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("sunday");

  const tabItems = [
    {
      key: "sunday",
      label: (
        <span className="flex items-center gap-2">
          <CalendarOutlined />
          <span className="hidden sm:inline">Sunday Services</span>
        </span>
      ),
      children: <DistrictSundayServiceReport />,
    },
    {
      key: "midweek",
      label: (
        <span className="flex items-center gap-2">
          <TeamOutlined />
          <span className="hidden sm:inline">Midweek Services</span>
        </span>
      ),
      children: <MidweekServiceReport assembly={assembly} />,
    },
    {
      key: "special",
      label: (
        <span className="flex items-center gap-2">
          <StarOutlined />
          <span className="hidden sm:inline">Special Services</span>
        </span>
      ),
      children: <SpecialServiceReport assembly={assembly} />,
    },
   
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        className="p-3 sm:p-4"
        tabBarStyle={{ 
          paddingLeft: '8px',
          paddingRight: '8px'
        }}
      />
    </div>
  );
};

export default ServiceReportsManager;