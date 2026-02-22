import React from 'react';
import V2DashboardLayout from '../v2/(dashboard)/layout';

// This is a temporary bridge component.
// It renders the new v2 layout, passing the page content (children) into it.
// This allows us to incrementally migrate pages from the old dashboard
// to the new v2 structure without breaking routing.
export default function BridgeToV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <V2DashboardLayout>{children}</V2DashboardLayout>;
}
