"use client";

import { ReactNode, useEffect, useState } from "react";
import { Layout, Menu, Button, message, Switch } from "antd";
import { useRouter, usePathname } from "next/navigation";
import {
  LogOut,
  BarChart3,
  Users,
  DollarSign,
  Church,
  Moon,
  Sun,
} from "lucide-react";
import Image from "next/image";
import React from "react";
import { useTheme } from "@/context/ThemeContext";

const { Header, Content, Sider } = Layout;

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  // 🔐 Check admin authentication
  const checkAdminAuth = () => {
    const isAdmin = localStorage.getItem("admin") === "true";
    if (!isAdmin) {
      message.warning("Access denied. Please log in as admin.");
      router.replace("/login");
      return false;
    }
    return true;
  };

  useEffect(() => {
    checkAdminAuth();
  }, [router]);

  // Responsive sidebar: auto-collapse on mobile/small screens
  useEffect(() => {
    const breakpoint = 768; // Mobile breakpoint (adjust as needed)

    const handleResize = () => {
      if (window.innerWidth < breakpoint && !collapsed) {
        setCollapsed(true);
      } else if (window.innerWidth >= breakpoint && collapsed) {
        setCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, [collapsed]);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    message.success("Logged out successfully!");
    router.replace("/login");
  };

  const menuItems = [
    { key: "/admin/dashboard", icon: <BarChart3 size={20} />, label: "Dashboard" },
    { key: "/admin/assemblies", icon: <Church size={20} />, label: "Assemblies" },
    { key: "/admin/users", icon: <Users size={20} />, label: "Users" },
    { key: "/admin/reports", icon: <DollarSign size={20} />, label: "Finance Reports" },
  ];

  // ⚡ Instant route navigation (client-side, no lag)
  const handleMenuClick = ({ key }: { key: string }) => {
    if (key !== pathname) {
      router.push(key); // uses Next.js soft navigation
    }
  };

  const siderWidth = collapsed ? 80 : 200;

  return (
    <Layout
      style={{ minHeight: "100vh" }}
      className={isDarkMode ? "dark" : "light"}
    >
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme={isDarkMode ? "dark" : "light"}
        style={{
          position: 'fixed',
          height: '100vh',
          zIndex: 1000,
          left: 0,
          top: 0,
          background: isDarkMode ? "#001529" : "#fff",
          borderRight: isDarkMode ? "none" : "1px solid #f0f0f0",
        }}
      >
        {/* Logo Section */}
        <div
          className={`flex items-center justify-center h-16 ${
            isDarkMode ? "bg-primary" : "bg-blue-600"
          }`}
        >
          <Image
            src="/images/Gofamint_logo.png"
            alt="GOFAMINT Logo"
            width={40}
            height={40}
            className="rounded-full object-contain"
          />
          {!collapsed && (
            <span className="ml-2 text-white font-semibold text-sm">
              Akowonjo District
            </span>
          )}
        </div>

        {/* 🔷 Menu with Active Background Highlight */}
        <Menu
          theme={isDarkMode ? "dark" : "light"}
          selectedKeys={[pathname]} // highlight current route
          mode="inline"
          onClick={handleMenuClick}
          items={menuItems}
          className="border-none"
          style={{
            background: isDarkMode ? "#001529" : "#fff",
          }}
        />
      </Sider>

      <Layout style={{ marginLeft: siderWidth }}>
        <Header
          className={`flex items-center justify-between px-6 ${
            isDarkMode
              ? "bg-gray-800 border-b border-gray-700"
              : "bg-white shadow-sm"
          }`}
          style={{ marginLeft: 0 }} // Ensure header spans full width after margin
        >
          <h1
            className={`text-xl font-bold ${
              isDarkMode ? "text-white" : "text-primary"
            }`}
          >
            Welcome, Admin
          </h1>

          <div className="flex items-center gap-4">
            {/* Theme Switch */}
            <div className="flex items-center gap-2">
              <Sun
                size={16}
                className={isDarkMode ? "text-gray-400" : "text-yellow-500"}
              />
              <Switch checked={isDarkMode} onChange={toggleTheme} size="small" />
              <Moon
                size={16}
                className={isDarkMode ? "text-blue-400" : "text-gray-400"}
              />
            </div>

            {/* Logout Button */}
            <Button
              type="text"
              icon={<LogOut size={18} />}
              onClick={handleLogout}
              className={
                isDarkMode
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-600 hover:text-primary"
              }
            >
              Logout
            </Button>
          </div>
        </Header>

        <Content
          className={`lg:p-6 p-0 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
          style={{ margin: 0, paddingLeft: 'calc(4px + env(safe-area-inset-left))' }} // Account for padding and safe area
        >
          <div className="max-w-7xl mx-auto">{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
}