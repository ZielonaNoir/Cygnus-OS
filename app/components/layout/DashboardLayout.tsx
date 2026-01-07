'use client';

import * as React from 'react';
import { Sidebar } from '../navigation/Sidebar';
import { TopNav } from '../navigation/TopNav';
import { cn } from '@/app/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // 默认关闭侧边栏，在桌面端显示收缩状态
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleToggle = React.useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleClose = React.useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={handleToggle}
        onClose={handleClose}
      />

      {/* Main Content - 给侧边栏留出空间 */}
      <div 
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-all duration-300",
          // 桌面端：根据侧边栏状态调整左边距
          "lg:ml-20", // 收缩时的边距
          sidebarOpen && "lg:ml-64" // 展开时的边距
        )}
      >
        {/* Top Navigation */}
        <TopNav onMenuClick={handleToggle} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

