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

  // The dedicated mobile single-conversation route (/messages/[id]) sizes
  // its chat area to the full viewport height itself (composer pinned to
  // its own bottom) — the shared shell's bottom padding and fixed mobile
  // tab bar would otherwise overlap/hide that composer. Real chat UIs
  // (Instagram, Messenger) hide the tab bar entirely inside an open
  // conversation for the same reason; desktop never hits this route (it
  // redirects to /messages), so this only affects mobile.
  const isMobileConversationView = /^\/messages\/[^/]+$/.test(pathname ?? "");

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
            "flex-1 min-w-0 flex flex-col justify-start transition-all duration-300 border-x border-border/40 md:px-8 md:py-6",
            isMobileConversationView ? "px-0 py-0 pb-0 md:pb-12" : "px-4 sm:px-6 py-4 pb-24 md:pb-12",
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

      {/* Modern Floating Mobile Bottom Navigation — hidden inside an open
          mobile conversation, see isMobileConversationView above */}
      {!isMobileConversationView && <MobileBottomNav />}
    </div>
  );
}
