import React from 'react';
import { MainLayout } from '../(components)/layouts/main-layout';

export default function V2DashboardLayout({
 children,
 modal,
}: {
 children: React.ReactNode;
 modal: React.ReactNode;
}) {
 return (
 <MainLayout>
 {children}
 {modal}
 </MainLayout>
 );
}
