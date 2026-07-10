import React from "react";
import { GlobalNav } from "@/components/navigation/GlobalNav";
import { SubNav } from "@/components/navigation/SubNav";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";

type MainLayoutProps = {
  children: React.ReactNode;
  title?: string;
};

export function MainLayout({ children, title = "Campus Connect" }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas pb-16 md:pb-0">
      <GlobalNav />
      <SubNav title={title} />
      <main className="scrollbar-custom">
        {children}
      </main>
      
      <MobileBottomNav />
    </div>
  );
}
