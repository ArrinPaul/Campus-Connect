"use client";

import React from "react";
import { DesktopSidebar } from "@/components/navigation/DesktopSidebar";
import { MobileTopBar } from "@/components/navigation/MobileTopBar";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { usePathname } from "next/navigation";

type MainLayoutProps = {
  children: React.ReactNode;
  title?: string;
  fullWidth?: boolean;
};

export function MainLayout({ children, title = "Campus Connect", fullWidth }: MainLayoutProps) {
  const pathname = usePathname();
  const isFullWidthPage = fullWidth || pathname?.startsWith("/messages");

  return (
    <div className="min-h-screen bg-canvas overflow-x-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-50">
        <MobileTopBar />
      </div>

      <div className={`mx-auto flex w-full justify-center ${isFullWidthPage ? 'max-w-none px-0' : 'max-w-7xl px-0 sm:px-2'}`}>
        {/* Left Sidebar - Desktop */}
        <aside className="hidden md:flex w-[240px] lg:w-[260px] shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-border">
          <DesktopSidebar />
        </aside>

        {/* Main Content Area */}
        <main className={`flex-1 min-w-0 min-h-screen scrollbar-custom bg-canvas relative ${isFullWidthPage ? 'w-full max-w-full px-0 py-0 pb-0 md:pb-0' : 'w-full max-w-3xl xl:max-w-4xl px-4 sm:px-6 md:px-8 py-4 pb-16 md:pb-6 border-x border-hairline'}`}>
          {children}
        </main>

        {/* Right Sidebar - Hidden on full width pages like Messages */}
        {!isFullWidthPage && (
          <aside className="hidden xl:block w-[300px] shrink-0 sticky top-0 h-screen overflow-y-auto pl-6 py-4">
            <div id="right-sidebar-portal"></div>
          </aside>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}
