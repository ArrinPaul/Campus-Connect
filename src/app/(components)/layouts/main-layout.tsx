import React from 'react';

type MainLayoutProps = {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  mobileNav: React.ReactNode;
};

export function MainLayout({ children, sidebar, mobileNav }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar — shown on md+ */}
      <div className="hidden md:flex flex-shrink-0">{sidebar}</div>

      {/* Main content — extra bottom padding on mobile to clear fixed bottom nav */}
      <main className="flex-1 overflow-y-auto scrollbar-custom pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile Navigation — MobileBottomNav handles its own fixed positioning */}
      <div className="md:hidden">{mobileNav}</div>
    </div>
  );
}
