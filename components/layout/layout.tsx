"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  FileText,
  Plus,
  History,
  Settings,
  LogOut,
  BarChart2,
  PieChart,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";
import { Button } from "antd";

const menuItems = [
  { name: "Dashboard", icon: <Home className="w-5 h-5" />, path: "/dashboard" },
  { name: "Reports", icon: <FileText className="w-5 h-5" />, path: "/reports" },
  { name: "Add Submission", icon: <Plus className="w-5 h-5" />, path: "/add-submission" },
  { name: "History", icon: <History className="w-5 h-5" />, path: "/history" },
  { name: "Analytics", icon: <BarChart2 className="w-5 h-5" />, path: "/analytics" },
  { name: "Trends", icon: <TrendingUp className="w-5 h-5" />, path: "/trends" },
  { name: "Settings", icon: <Settings className="w-5 h-5" />, path: "/settings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("assembly");
    router.push("/login");
  };

  return (
    <div className="h-screen w-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:relative transition-transform duration-200 ease-in-out bg-primary text-white w-64 flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 p-4 border-b border-white/20">
          <Image
            src="/images/Gofamint_logo.png"
            alt="GOFAMINT Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="font-semibold text-lg">GOFAMINT</span>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => router.push(item.path)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/10 transition"
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/10 transition"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between bg-white border-b px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-primary"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="font-semibold text-lg text-primary">GOFAMINT Finance</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="primary"
              className="rounded-lg"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
