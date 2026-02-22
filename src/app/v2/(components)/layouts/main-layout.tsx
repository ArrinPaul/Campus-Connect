import React from 'react';

type MainLayoutProps = {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  mobileNav: React.ReactNode;
};

export function MainLayout({ children, sidebar, mobileNav }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0">{sidebar}</div>

      <main className="flex-1 overflow-y-auto scrollbar-custom">
        {children}
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 w-full z-10">{mobileNav}</div>
    </div>
  );
}
