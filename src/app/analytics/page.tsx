'use client';

// src/app/analytics/page.tsx
// Analytics route — renders AppShell with initialScreen="analytics"

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function AnalyticsPage() {
  return (
    <WorkspaceProvider initialScreen="analytics">
      <AppShell />
    </WorkspaceProvider>
  );
}
