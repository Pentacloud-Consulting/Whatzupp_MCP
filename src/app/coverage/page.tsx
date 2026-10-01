'use client';

// src/app/coverage/page.tsx
// Coverage route — renders AppShell with initialScreen="coverage"

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function CoveragePage() {
  return (
    <WorkspaceProvider initialScreen="coverage">
      <AppShell />
    </WorkspaceProvider>
  );
}
