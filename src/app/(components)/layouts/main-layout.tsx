"use client";

import React, { useState, useEffect } from "react";
import { DesktopSidebar } from "@/components/navigation/DesktopSidebar";
import { MobileTopBar } from "@/components/navigation/MobileTopBar";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type MainLayoutProps = {
  children: React.ReactNode;
  title?: string;
  fullWidth?: boolean;
};

export function MainLayout({
  children,
  title = "Campus Connect",
  fullWidth,
}: MainLayoutProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cc_sidebar_collapsed");
    if (saved !== null) {
      setIsSidebarCollapsed(saved === "true");
    }

    const handleResize = () => {
      const current = localStorage.getItem("cc_sidebar_collapsed");
      if (current !== null) {
        setIsSidebarCollapsed(current === "true");
      }
    };

    window.addEventListener("cc_sidebar_resize", handleResize);
    return () => window.removeEventListener("cc_sidebar_resize", handleResize);
  }, []);

  const handleToggleSidebar = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    localStorage.setItem("cc_sidebar_collapsed", String(next));
  };

  const isFullWidthPage =
    fullWidth ||
    pathname?.startsWith("/messages") ||
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/explore") ||
    pathname?.startsWith("/jobs") ||
    pathname?.startsWith("/marketplace") ||
    pathname?.startsWith("/events") ||
    pathname?.startsWith("/research") ||
    pathname?.startsWith("/resources") ||
    pathname?.startsWith("/communities") ||
    pathname?.startsWith("/c/") ||
    pathname?.startsWith("/q-and-a") ||
    pathname?.startsWith("/leaderboard") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/settings");

  return (
    <div className="min-h-screen bg-canvas text-foreground flex flex-col antialiased selection:bg-primary/20 selection:text-primary">
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40">
        <MobileTopBar />
      </div>

      {/* Main Shell Container */}
      <div className="flex flex-1 w-full max-w-[1440px] mx-auto min-h-screen">
        {/* Desktop Collapsible Sidebar */}
        <div className="hidden md:block shrink-0 sticky top-0 h-screen z-30">
          <DesktopSidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />
        </div>

        {/* Center Main Viewport */}
        <main
          id="main-content"
          className={cn(
            "flex-1 min-w-0 flex flex-col justify-start pb-24 md:pb-12 transition-all duration-300 border-x border-border/40 px-4 sm:px-6 md:px-8 py-4 md:py-6",
            isFullWidthPage ? "w-full" : "items-center"
          )}
        >
          <div
            className={cn(
              "w-full",
              isFullWidthPage ? "max-w-7xl" : "max-w-[620px]"
            )}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Modern Floating Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
