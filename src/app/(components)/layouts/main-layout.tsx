import React from "react";
import { DesktopSidebar } from "@/components/navigation/DesktopSidebar";
import { MobileTopBar } from "@/components/navigation/MobileTopBar";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";

type MainLayoutProps = {
  children: React.ReactNode;
  title?: string;
};

export function MainLayout({ children, title = "Campus Connect" }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-50">
        <MobileTopBar />
      </div>

      <div className="mx-auto flex w-full max-w-7xl justify-center">
        {/* Left Sidebar - Desktop */}
        <aside className="hidden md:flex w-[250px] lg:w-[280px] shrink-0 sticky top-0 h-screen overflow-y-auto">
          <DesktopSidebar />
        </aside>
        
        {/* Main Feed Column */}
        <main className="flex-1 max-w-[600px] min-w-0 min-h-screen scrollbar-custom border-x border-hairline pb-16 md:pb-0 bg-canvas relative">
          {children}
        </main>
        
        {/* Right Context Column - Desktop */}
        <aside className="hidden lg:block w-[350px] shrink-0 sticky top-0 h-screen overflow-y-auto pl-8 py-4">
           <div id="right-sidebar-portal"></div>
        </aside>
      </div>
      
      <MobileBottomNav />
    </div>
  );
}
