'use client';

// src/app/calls/page.tsx
// Call History route — renders AppShell with initialScreen="calls"

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function CallsPage() {
  return (
    <WorkspaceProvider initialScreen="calls">
      <AppShell />
    </WorkspaceProvider>
  );
}
