import React from 'react';
import { MainLayout } from '../(components)/layouts/main-layout';
import { PrimarySidebar } from '../(components)/navigation/primary-sidebar';
import { MobileBottomNav } from '../(components)/navigation/mobile-bottom-nav';

export default function V2DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayout
      sidebar={<PrimarySidebar />}
      mobileNav={<MobileBottomNav />}
    >
      {children}
    </MainLayout>
  );
}
