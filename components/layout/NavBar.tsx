"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, FileText, Plus, History, Settings } from "lucide-react"; 

export const NavBar = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === path || pathname.startsWith(`${path}/`);
    }
    return pathname === path;
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/submissions", label: "Add Submission", icon: Plus },
    // { href: "/history", label: "History", icon: History },
    // { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-[#f5f5f5] border-t border-gray-200 shadow-md md:hidden">
      <div className="flex justify-around items-center px-4 py-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <button
              className={`flex flex-col items-center w-full px-2 py-2 rounded-lg transition-all ${
                isActive(href)
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon
                className={`${isActive(href) ? "text-blue-600" : "text-gray-500"}`}
                size={20}
              />
              <span
                className={`text-xs mt-1 ${
                  isActive(href) ? "text-blue-600 font-medium" : "text-gray-500"
                }`}
              >
                {label}
              </span>
            </button>
          </Link>
        ))}
      </div>
    </nav>
  );
};