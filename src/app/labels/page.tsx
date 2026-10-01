'use client';

// src/app/labels/page.tsx
// Labels route — renders AppShell with initialScreen="labels"

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function LabelsPage() {
  return (
    <WorkspaceProvider initialScreen="labels">
      <AppShell />
    </WorkspaceProvider>
  );
}
