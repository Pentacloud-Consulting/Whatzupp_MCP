'use client';

// src/app/salescloud/page.tsx
// Sales Cloud route — renders AppShell with initialScreen="salescloud"

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function SalesCloudPage() {
  return (
    <WorkspaceProvider initialScreen="salescloud">
      <AppShell />
    </WorkspaceProvider>
  );
}
