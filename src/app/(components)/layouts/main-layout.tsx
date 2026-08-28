"use client";

import React from "react";
import { TopNav } from "@/components/navigation/TopNav";
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
  const isFullWidthPage = fullWidth || 
    pathname?.startsWith("/messages") || 
    pathname?.startsWith("/profile") || 
    pathname?.startsWith("/explore") || 
    pathname?.startsWith("/jobs") || 
    pathname?.startsWith("/marketplace") || 
    pathname?.startsWith("/events") || 
    pathname?.startsWith("/research") || 
    pathname?.startsWith("/resources") || 
    pathname?.startsWith("/communities") || 
    pathname?.startsWith("/q-and-a") || 
    pathname?.startsWith("/leaderboard") || 
    pathname?.startsWith("/admin");

  return (
    <div className="min-h-screen bg-canvas overflow-x-hidden flex flex-col">
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-50">
        <MobileTopBar />
      </div>

      {/* Main Application Grid */}
      <div className="flex flex-1 w-full mx-auto max-w-[1280px] px-0">
        
        {/* Left Sidebar - Desktop (Floating & Collapsible) */}
        <aside className="hidden md:block w-[72px] shrink-0 sticky top-0 h-screen z-40">
          <div className="absolute top-0 left-0 h-full w-[72px] hover:w-[280px] hover:shadow-xl transition-all duration-300 bg-canvas border-r border-border/50 overflow-hidden z-50 group">
            <DesktopSidebar />
          </div>
        </aside>

        {/* Center Main Content Area */}
        <main className={`flex-1 min-w-0 bg-transparent flex justify-center pb-16 md:pb-8 ${isFullWidthPage ? 'w-full' : ''}`}>
          <div className={`w-full ${isFullWidthPage ? 'max-w-none' : 'max-w-[590px] px-0 sm:px-4 py-4 md:py-6'}`}>
            {children}
          </div>
        </main>

        {/* Right Sidebar - Desktop Trending/Contacts */}
        {!isFullWidthPage && (
          <aside className="hidden xl:block w-[280px] shrink-0 sticky top-0 h-screen overflow-y-auto pl-4 pr-2 pt-4">
            <div id="right-sidebar-portal"></div>
          </aside>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}

