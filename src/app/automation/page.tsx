'use client';

// src/app/automation/page.tsx
// Automation route — renders AppShell with initialScreen="automation"

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function AutomationPage() {
  return (
    <WorkspaceProvider initialScreen="automation">
      <AppShell />
    </WorkspaceProvider>
  );
}
