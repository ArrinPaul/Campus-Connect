import React from "react";
import { GlobalNav } from "@/components/navigation/GlobalNav";
import { SubNav } from "@/components/navigation/SubNav";

type MainLayoutProps = {
  children: React.ReactNode;
  title?: string;
};

export function MainLayout({ children, title = "Campus Connect" }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas">
      <GlobalNav />
      <SubNav title={title} />
      <main className="scrollbar-custom">
        {children}
      </main>
      
      {/* Mobile-only bottom nav can be added here if still needed for mobile specific actions */}
    </div>
  );
}
