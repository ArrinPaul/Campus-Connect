import React from 'react';
import { MainLayout } from '../(components)/layouts/main-layout';

export default function V2DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}
