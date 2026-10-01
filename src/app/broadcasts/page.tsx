'use client';

// src/app/broadcasts/page.tsx
// Broadcasts route — renders AppShell with initialScreen="broadcasts"

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function BroadcastsPage() {
  return (
    <WorkspaceProvider initialScreen="broadcasts">
      <AppShell />
    </WorkspaceProvider>
  );
}
