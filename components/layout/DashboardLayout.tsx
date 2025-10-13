// components/MainLayout.tsx
'use client';

import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import dayjs from 'dayjs';

interface MainLayoutProps {
  children: ReactNode;
  activeItem?: string;
  showHeader?: boolean;
  assembly?: string | null;
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
  onRangeChange?: (dates: any) => void;
}

export default function MainLayout({
  children,
  activeItem = 'dashboard',
  showHeader = false,
  assembly = null,
  dateRange,
  onRangeChange,
}: MainLayoutProps) {
  const [sidebarActiveItem, setSidebarActiveItem] = useState(activeItem);

  return (
    <div className="h-screen w-screen flex bg-background overflow-hidden">
      <Sidebar onItemClick={setSidebarActiveItem} />
      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        {showHeader && assembly && dateRange && onRangeChange && (
          <DashboardHeader
            assembly={assembly}
            dateRange={dateRange}
            onRangeChange={onRangeChange}
          />
        )}
        {children}
      </div>
    </div>
  );
}
