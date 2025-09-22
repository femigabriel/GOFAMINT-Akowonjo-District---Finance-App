// components/Sidebar.tsx
"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  Home,
  FileText,
  Plus,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  onItemClick?: (item: string) => void;
}

export default function Sidebar({ onItemClick }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <Home size={20} />, path: "/dashboard" },
    { key: "reports", label: "Reports", icon: <FileText size={20} />, path: "/reports" },
    { key: "add-submission", label: "Add Submission", icon: <Plus size={20} />, path: "/add-submission" },
    { key: "history", label: "History", icon: <History size={20} />, path: "/history" },
    { key: "settings", label: "Settings", icon: <Settings size={20} />, path: "/settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("assembly");
    router.push("/");
  };

  const renderMenu = () => (
    <nav className="flex-1 overflow-y-auto py-4">
      {menuItems.map((item) => {
        const isActive = pathname.startsWith(item.path);
        return (
          <button
            key={item.key}
            onClick={() => {
              onItemClick?.(item.key);
              router.push(item.path);
              setIsMobileOpen(false); // close drawer on mobile
            }}
            className={`flex items-center w-full px-4 py-2 rounded-lg mb-2 transition-colors ${
              isCollapsed ? "justify-center" : "justify-start"
            } ${
              isActive
                ? "bg-blue-200 text-primary font-bold"
                : "text-black hover:bg-blue-100"
            }`}
          >
            <span className={`${isActive ? "text-primary" : "text-black"}`}>
              {item.icon}
            </span>
            {!isCollapsed && <span className="ml-3 text-sm">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );

  const renderLogout = () => (
    <div className="p-4 border-t border-gray-200">
      <button
        onClick={handleLogout}
        className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors text-black ${
          isCollapsed ? "justify-center" : "justify-start"
        } hover:bg-blue-100`}
      >
        <LogOut size={20} />
        {!isCollapsed && <span className="ml-3 text-sm">Logout</span>}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex bg-[#ffff] shadow-md text-black flex-col h-screen transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo + Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className={`flex items-center gap-2 ${isCollapsed ? "justify-center w-full" : ""}`}>
            <Image
              src="/images/Gofamint_logo.png"
              alt="GOFAMINT Logo"
              width={36}
              height={36}
              className="rounded-full"
            />
            {!isCollapsed && (
              <span className="text-black font-semibold text-sm">GOFAMINT Finance</span>
            )}
          </div>
          <button
            className="hidden md:flex items-center justify-center text-black"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {renderMenu()}
        {renderLogout()}
      </aside>

      {/* Mobile Drawer */}
      <div className="md:hidden">
        {/* Hamburger trigger */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 m-2 rounded-md bg-blue-600 text-white"
        >
          <Menu size={22} />
        </button>

        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div
              className="flex-1 bg-black/50"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Drawer */}
            <div className="w-64 bg-white h-full flex flex-col shadow-lg">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <Image
                  src="/images/Gofamint_logo.png"
                  alt="GOFAMINT Logo"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              {renderMenu()}
              {renderLogout()}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
