'use client';

// src/app/sfmc/page.tsx
// SFMC route — renders AppShell with initialScreen="sfmc"

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function SFMCPage() {
  return (
    <WorkspaceProvider initialScreen="sfmc">
      <AppShell />
    </WorkspaceProvider>
  );
}
