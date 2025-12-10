"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  Layout,
  Menu,
  Button,
  message,
  Switch,
  Drawer,
  Typography,
  Avatar,
  Skeleton,
  Spin,
} from "antd";
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
  Home,
} from "lucide-react";
import Image from "next/image";
import React from "react";
import { useTheme } from "@/context/ThemeContext";

const { Header, Content, Sider } = Layout;
const { Text, Title } = Typography;

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
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
    // Simulate initial page load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // Reduced from 1000ms to 800ms for better UX

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const authValid = checkAdminAuth();
    if (!authValid) {
      setIsLoading(false);
      return;
    }

    // Mark page as loaded after authentication check
    setPageLoaded(true);
  }, [router]);

  // ✅ Handle responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth < 992) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    message.success("Logged out successfully!");
    router.replace("/login");
  };

  const menuItems = [
    {
      key: "/admin/dashboard",
      icon: <Home size={20} />,
      label: "Dashboard",
    },
    {
      key: "/admin/assemblies",
      icon: <Church size={20} />,
      label: "Assemblies",
    },
    {
      key: "/admin/members",
      icon: <Users size={20} />,
      label: "Members",
    },
    {
      key: "/admin/reports",
      icon: <DollarSign size={20} />,
      label: "Financial Reports",
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
    if (mobileOpen) setMobileOpen(false);
  };

  const siderWidth = collapsed ? 80 : 260;

  const getPageTitle = () => {
    const item = menuItems.find((item) => item.key === pathname);
    return item ? item.label : "Dashboard";
  };

  // Skeleton for menu items
  const MenuSkeleton = () => (
    <div className="p-4 space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton.Avatar active size="default" shape="square" />
          <Skeleton.Input active style={{ width: "70%" }} size="small" />
        </div>
      ))}
    </div>
  );

  // Main content skeleton
  const ContentSkeleton = () => (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page title skeleton */}
      <div className="space-y-2">
        <Skeleton.Input active size="large" style={{ width: 200 }} />
        <Skeleton.Input active size="small" style={{ width: 80 }} />
      </div>

      {/* Content cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-xl p-6 ${
              isDarkMode ? "bg-gray-900" : "bg-white border border-gray-200"
            }`}
          >
            <Skeleton.Input
              active
              size="small"
              style={{ width: 120, marginBottom: 16 }}
            />
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div
        className={`rounded-xl p-6 ${
          isDarkMode ? "bg-gray-900" : "bg-white border border-gray-200"
        }`}
      >
        <Skeleton.Input
          active
          size="small"
          style={{ width: 150, marginBottom: 20 }}
        />
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    </div>
  );

  const MenuContent = (
    <>
      {/* Logo Section */}
      <div
        className="flex flex-col items-center justify-center p-4 border-b"
        style={{
          borderColor: isDarkMode ? "#374151" : "#e5e7eb",
          background: isDarkMode
            ? "linear-gradient(135deg, #1a365d 0%, #2d3748 100%)"
            : "linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)",
        }}
      >
        <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg p-2 mb-3">
          <Image
            src="/images/Gofamint_logo.png"
            alt="GOFAMINT Logo"
            width={48}
            height={48}
            className="object-contain"
          />
        </div>

        {!collapsed && (
          <div className="text-center">
            <div className="text-white font-bold text-lg mb-1">GOFAMINT</div>
            <div className="text-blue-100 text-sm font-medium">
              Akowonjo District
            </div>
            <div className="text-blue-200 text-xs mt-1">Region 26</div>
          </div>
        )}

        {collapsed && !isMobile && (
          <div className="text-center">
            <div className="text-white font-bold text-xs">GOFAMINT</div>
          </div>
        )}
      </div>

      {/* Menu */}
      {isLoading ? (
        <MenuSkeleton />
      ) : (
        <Menu
          theme={isDarkMode ? "dark" : "light"}
          selectedKeys={[pathname]}
          mode="inline"
          onClick={handleMenuClick}
          items={menuItems}
          className="mt-4"
          style={{
            border: "none",
            background: isDarkMode ? "#111827" : "#ffffff",
          }}
        />
      )}
    </>
  );

  return (
    <Layout
      style={{ minHeight: "100vh" }}
      className={isDarkMode ? "dark" : "light"}
    >
      {/* Full page loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white dark:bg-gray-950 flex items-center justify-center z-[9999]">
          <div className="text-center">
            <Spin
              size="large"
              className="mb-4"
              style={{
                color: isDarkMode ? "#3b82f6" : "#1d4ed8",
              }}
            />
            <div className="space-y-2">
              <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Loading Admin Portal
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                GOFAMINT Akowonjo District
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Desktop Sidebar */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={260}
          theme={isDarkMode ? "dark" : "light"}
          style={{
            position: "fixed",
            height: "100vh",
            zIndex: 1000,
            left: 0,
            top: 0,
            background: isDarkMode ? "#111827" : "#ffffff",
            borderRight: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
            boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
            opacity: isLoading ? 0.7 : 1,
            transition: "opacity 0.3s ease",
          }}
        >
          {MenuContent}
        </Sider>
      )}

      {/* ✅ Mobile Drawer */}
      <Drawer
        placement="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        bodyStyle={{ padding: 0 }}
        width={280}
        styles={{
          body: {
            padding: 0,
          },
          header: {
            borderBottom: isDarkMode
              ? "1px solid #374151"
              : "1px solid #e5e7eb",
            background: isDarkMode ? "#111827" : "#ffffff",
          },
        }}
      >
        {MenuContent}
      </Drawer>

      {/* ✅ Main Layout */}
      <Layout style={{ marginLeft: isMobile ? 0 : siderWidth }}>
        <Header
          className={`flex items-center justify-between px-4 md:px-6 ${
            isDarkMode
              ? "bg-gray-900 border-b border-gray-800"
              : "bg-white border-b border-gray-200"
          }`}
          style={{
            position: "sticky",
            top: 0,
            zIndex: 999,
            backdropFilter: "blur(8px)",
            background: isDarkMode
              ? "rgba(17, 24, 39, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
            minHeight: "64px",
            opacity: isLoading ? 0.7 : 1,
            transition: "opacity 0.3s ease",
          }}
        >
          {/* Left section - Mobile menu button and welcome text */}
          <div className="flex items-center gap-3 md:gap-4">
            {isMobile && (
              <Button
                type="text"
                icon={<MenuIcon size={22} />}
                onClick={() => setMobileOpen(true)}
                className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                size="middle"
              />
            )}

            <div className="hidden md:block">
              {isLoading ? (
                <div className="space-y-1">
                  <Skeleton.Input active size="small" style={{ width: 180 }} />
                  <Skeleton.Input active size="small" style={{ width: 150 }} />
                </div>
              ) : (
                <div className="flex flex-col">
                  <Text
                    className={`font-semibold text-base ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Welcome, Administrator
                  </Text>
                  <Text type="secondary" className="text-xs">
                    GOFAMINT Akowonjo District • Region 26
                  </Text>
                </div>
              )}
            </div>

            {/* Mobile welcome text */}
            <div className="md:hidden">
              {isLoading ? (
                <Skeleton.Input active size="small" style={{ width: 80 }} />
              ) : (
                <Text
                  className={`font-semibold text-sm ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Welcome
                </Text>
              )}
            </div>
          </div>

          {/* Center section - Last login (desktop only) */}
          <div className="hidden lg:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
            {isLoading ? (
              <Skeleton.Input active size="small" style={{ width: 160 }} />
            ) : (
              <div
                className={`px-4 py-1.5 rounded-full text-xs font-medium ${
                  isDarkMode
                    ? "bg-blue-900/30 text-blue-300 border border-blue-800"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                Last login:{" "}
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            )}
          </div>

          {/* Right section - Controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <div className="hidden sm:flex items-center gap-2">
              {isLoading ? (
                <Skeleton.Avatar active size="small" shape="square" />
              ) : (
                <Switch
                  checked={isDarkMode}
                  onChange={toggleTheme}
                  size="small"
                  checkedChildren={<Moon size={12} />}
                  unCheckedChildren={<Sun size={12} />}
                />
              )}
            </div>

            {/* Mobile Theme Toggle */}
            <div className="sm:hidden">
              {isLoading ? (
                <Skeleton.Avatar active size="small" shape="square" />
              ) : (
                <Switch
                  checked={isDarkMode}
                  onChange={toggleTheme}
                  size="small"
                />
              )}
            </div>

            {/* Logout Button */}
            {isLoading ? (
              <Skeleton.Button active size="small" />
            ) : (
              <Button
                type={isMobile ? "text" : "default"}
                danger={!isMobile}
                icon={<LogOut size={18} />}
                onClick={handleLogout}
                size={isMobile ? "small" : "middle"}
                className={
                  isMobile
                    ? isDarkMode
                      ? "text-gray-300"
                      : "text-gray-600"
                    : ""
                }
              >
                {!isMobile && "Logout"}
              </Button>
            )}
          </div>
        </Header>

        {/* Mobile top card */}
        {isMobile && !isLoading && (
          <div className={`p-4 ${isDarkMode ? "bg-gray-900" : "bg-blue-50"}`}>
            <div className="flex flex-col">
              <Text
                className={`font-semibold text-base ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Welcome, Administrator
              </Text>
              <Text type="secondary" className="text-sm mb-2">
                GOFAMINT Akowonjo District • Region 26
              </Text>
              <div
                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-block w-fit ${
                  isDarkMode
                    ? "bg-blue-900/30 text-blue-300 border border-blue-800"
                    : "bg-white text-blue-700 border border-blue-200"
                }`}
              >
                Last login:{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        )}

        <Content
          className={`p-3 sm:p-4 md:p-6 transition-all duration-200 ${
            isDarkMode ? "bg-gray-950" : "bg-gray-50"
          }`}
          style={{
            minHeight: "calc(100vh - 64px)",
            opacity: isLoading ? 0.7 : 1,
            transition: "opacity 0.3s ease",
          }}
        >
          <div className="max-w-7xl mx-auto">
            {/* Page Title (Desktop) */}
            {!isMobile && (
              <div className="mb-6">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton.Input
                      active
                      size="large"
                      style={{ width: 200 }}
                    />
                    <Skeleton.Input active size="small" style={{ width: 80 }} />
                  </div>
                ) : (
                  <>
                    <Title
                      level={3}
                      className={`!mb-2 ${
                        isDarkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {getPageTitle()}
                    </Title>
                    <div className="h-1 w-20 rounded-full bg-blue-500"></div>
                  </>
                )}
              </div>
            )}

            {/* Mobile Page Title */}
            {isMobile && (
              <div className="mb-4">
                {isLoading ? (
                  <Skeleton.Input
                    active
                    size="default"
                    style={{ width: 120 }}
                  />
                ) : (
                  <Text
                    strong
                    className={`text-lg ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {getPageTitle()}
                  </Text>
                )}
              </div>
            )}

            {/* Main Content */}
            <div
              className={`rounded-xl ${
                isDarkMode
                  ? "bg-gray-900 border border-gray-800"
                  : "bg-white border border-gray-200 shadow-sm"
              }`}
            >
              {isLoading ? <ContentSkeleton /> : children}
            </div>

            {/* Footer Note */}
            <div
              className={`mt-6 md:mt-8 pt-4 md:pt-6 border-t text-center text-xs md:text-sm ${
                isDarkMode
                  ? "text-gray-500 border-gray-800"
                  : "text-gray-400 border-gray-200"
              }`}
            >
              {isLoading ? (
                <Skeleton.Input
                  active
                  size="small"
                  style={{ width: 250, margin: "0 auto" }}
                />
              ) : (
                <Text type="secondary">
                  © {new Date().getFullYear()} GOFAMINT Akowonjo District
                  <span className="hidden sm:inline">
                    {" "}
                    - Region 26, Lagos State
                  </span>
                </Text>
              )}
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
