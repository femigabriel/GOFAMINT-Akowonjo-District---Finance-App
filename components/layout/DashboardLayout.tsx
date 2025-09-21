// components/MainLayout.tsx
'use client';

import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
  activeItem?: string;
}

export default function MainLayout({ children, activeItem = 'dashboard' }: MainLayoutProps) {
  const [sidebarActiveItem, setSidebarActiveItem] = useState(activeItem);

  return (
    <div className="h-screen w-screen flex bg-background overflow-hidden">
      <Sidebar onItemClick={setSidebarActiveItem} />
      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        {children}
      </div>
    </div>
  );
}