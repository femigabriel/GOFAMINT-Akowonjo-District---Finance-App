"use client";

import { useState } from "react";
import {
  Menu,
  X,
  Home,
  FileText,
  Plus,
  History,
  Settings,
  LogOut,
  Church,
  MapPin,
  User,
  FileSpreadsheet
} from "lucide-react";
import { Typography, Dropdown, Avatar } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { useRouter, usePathname } from "next/navigation";
 import type { MenuProps } from "antd";


const { Text } = Typography;

interface DashboardHeaderProps {
  assembly: string | null;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  onRangeChange: (dates: any) => void;
}

export default function DashboardHeader({
  assembly,
  dateRange,
  onRangeChange,
}: DashboardHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <Home size={18} />, path: "/dashboard" },
    { key: "reports", label: "Reports", icon: <FileText size={18} />, path: "/reports" },
    { key: "submissions", label: "Add Submission", icon: <Plus size={18} />, path: "/submissions" },
    { key: "records", label: "Records", icon: <FileSpreadsheet size={18} />, path: "/records" },
    // { key: "settings", label: "Settings", icon: <Settings size={18} />, path: "/settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("assembly");
    router.push("/");
  };

  const isActive = (path: string) => pathname === path;

  // Dropdown menu content

const userMenu: MenuProps = {
  items: [
    {
      key: "user",
      label: (
        <div className="flex flex-col gap-1 py-1">
          <div className="flex items-center gap-2">
            <User size={16} className="text-blue-500" />
            <Text strong className="text-gray-800">
              {assembly || "John Doe"}
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Church size={16} className="text-blue-500" />
            <Text className="text-gray-600 text-sm">GOFAMINT</Text>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-500" />
            <Text className="text-gray-600 text-sm">Akowonjo District</Text>
          </div>
        </div>
      ),
    },
    {
      type: "divider" as const, // 👈 this cast fixes the TS error
    },
    {
      key: "settings",
      label: (
        <div
          onClick={() => router.push("/settings")}
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
        >
          <Settings size={16} /> Settings
        </div>
      ),
    },
    {
      key: "logout",
      label: (
        <div
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
        >
          <LogOut size={16} /> Logout
        </div>
      ),
    },
  ],
};


  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex justify-between items-center mb-6 lg:mb-10"
      >
        {/* Left: Assembly & Date */}
        <div>
          <h3 className="lg:text-xl text-sm tracking-tight font-bold">
            Welcome back, {assembly || "Assembly"}
          </h3>
          <Text className="text-gray-400 lg:text-sm text-xs">
            {dayjs().format("dddd, MMMM D, YYYY")}
          </Text>
        </div>

        {/* Right: Avatar + Menu */}
        <div className="flex items-center gap-3">
          {/* Avatar Dropdown */}
          <Dropdown menu={userMenu} placement="bottomRight" trigger={["click"]}>
            <Avatar
              size={40}
              className="cursor-pointer bg-blue-600 text-white flex items-center justify-center font-semibold shadow-md hover:shadow-lg transition-all"
            >
              {assembly ? assembly[0].toUpperCase() : "A"}
            </Avatar>
          </Dropdown>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden p-2 rounded-md bg-blue-100 text-blue-600 shadow hover:bg-blue-200 transition-all"
          >
            <Menu size={22} />
          </button>
        </div>
      </motion.div>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed top-0 right-0 w-full sm:w-80 bg-white/90 backdrop-blur-lg border-b border-blue-100 shadow-2xl z-50 rounded-b-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div>
                  <h4 className="font-semibold text-blue-800 text-base">
                    {assembly || "Assembly"}
                  </h4>
                  <p className="text-gray-500 text-xs">
                    {dayjs().format("dddd, MMMM D, YYYY")}
                  </p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 text-gray-600 hover:text-blue-600 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col px-4 py-2">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.key}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      router.push(item.path);
                      setDrawerOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive(item.path)
                        ? "bg-blue-100 text-blue-700 font-semibold"
                        : "text-gray-700 hover:bg-blue-50"
                    }`}
                  >
                    <span
                      className={`${
                        isActive(item.path) ? "text-blue-700" : "text-blue-600"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </motion.button>
                ))}

                <hr className="my-2 border-gray-200" />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all text-sm font-semibold"
                >
                  <LogOut size={18} />
                  Logout
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
