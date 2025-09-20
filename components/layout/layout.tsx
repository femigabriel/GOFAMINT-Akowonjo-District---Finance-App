"use client";

import { Layout, Menu } from "antd";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Church,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const { Header, Sider, Content } = Layout;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [assembly, setAssembly] = useState<string | null>(null);

  useEffect(() => {
    const asm = localStorage.getItem("assembly");
    if (!asm) {
      router.push("/"); // if no login, redirect
    } else {
      setAssembly(asm);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("assembly");
    router.push("/");
  };

  const menuItems = [
    {
      key: "/dashboard",
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
      onClick: () => router.push("/dashboard"),
    },
    {
      key: "/dashboard/reports",
      icon: <FileText size={18} />,
      label: "Reports",
      onClick: () => router.push("/dashboard/reports"),
    },
    {
      key: "/dashboard/settings",
      icon: <Settings size={18} />,
      label: "Settings",
      onClick: () => router.push("/dashboard/settings"),
    },
    {
      key: "logout",
      icon: <LogOut size={18} />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider
        width={220}
        className="bg-gradient-to-b from-indigo-700 to-blue-800 text-white"
      >
        <div className="flex items-center gap-2 px-4 py-5 border-b border-indigo-600">
          <Church size={28} className="text-white" />
          <span className="font-semibold text-white text-sm leading-tight">
            GOFAMINT <br /> {assembly} Assembly
          </span>
        </div>

        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[pathname]}
          items={menuItems}
          className="mt-4"
        />
      </Sider>

      {/* Main Layout */}
      <Layout>
        {/* Header */}
        <Header className="bg-white shadow-sm px-6 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">
            {assembly} Dashboard
          </h2>
        </Header>

        {/* Content */}
        <Content className="p-6 bg-gray-50">{children}</Content>
      </Layout>
    </Layout>
  );
}
