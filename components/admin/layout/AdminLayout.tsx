"use client";

import { ReactNode, useEffect, useState } from "react";
import { Layout, Menu, Button, message, Switch, Drawer } from "antd";
import { useRouter, usePathname } from "next/navigation";
import {
  LogOut,
  BarChart3,
  Users,
  DollarSign,
  Church,
  Moon,
  Sun,
  Menu as MenuIcon,
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
  const [mobileOpen, setMobileOpen] = useState(false);
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

  // Responsive collapse state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 992 && !collapsed) setCollapsed(true);
      if (window.innerWidth >= 992 && collapsed) setCollapsed(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
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

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
    if (mobileOpen) setMobileOpen(false); // close drawer on mobile
  };

  const siderWidth = collapsed ? 80 : 200;

  const MenuContent = (
    <>
      {/* Logo */}
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

      {/* Menu */}
      <Menu
        theme={isDarkMode ? "dark" : "light"}
        selectedKeys={[pathname]}
        mode="inline"
        onClick={handleMenuClick}
        items={menuItems}
        style={{
          border: "none",
          background: isDarkMode ? "#001529" : "#fff",
        }}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: "100vh" }} className={isDarkMode ? "dark" : "light"}>
      {/* Desktop Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        collapsedWidth="0"
        theme={isDarkMode ? "dark" : "light"}
        style={{
          position: "fixed",
          height: "100vh",
          zIndex: 1000,
          left: 0,
          top: 0,
          display: window.innerWidth >= 992 ? "block" : "none",
          background: isDarkMode ? "#001529" : "#fff",
          borderRight: isDarkMode ? "none" : "1px solid #f0f0f0",
        }}
      >
        {MenuContent}
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <Image
              src="/images/Gofamint_logo.png"
              alt="Logo"
              width={30}
              height={30}
            />
            <span className="font-semibold text-base">Akowonjo District</span>
          </div>
        }
        placement="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      >
        {MenuContent}
      </Drawer>

      {/* Main Layout */}
      <Layout style={{ marginLeft: window.innerWidth >= 992 ? siderWidth : 0 }}>
        <Header
          className={`flex items-center justify-between px-4 md:px-6 ${
            isDarkMode
              ? "bg-gray-800 border-b border-gray-700"
              : "bg-white shadow-sm"
          }`}
          style={{ position: "sticky", top: 0, zIndex: 999 }}
        >
          {/* Left section */}
          <div className="flex items-center gap-4">
            {/* Hamburger for mobile */}
            <Button
              type="text"
              className="lg:hidden block"
              icon={<MenuIcon size={22} />}
              onClick={() => setMobileOpen(true)}
            />
            <h1
              className={`text-sm md:text-xl font-bold ${
                isDarkMode ? "text-white" : "text-primary"
              }`}
            >
              Welcome, Admin
            </h1>
          </div>

          {/* Right section */}
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
          className={`p-3 sm:p-4 md:p-6 ${
            isDarkMode ? "bg-gray-900" : "bg-gray-50"
          }`}
          style={{ minHeight: "100vh" }}
        >
          <div className="max-w-7xl mx-auto">{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
}
