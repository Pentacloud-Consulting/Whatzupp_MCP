'use client';

// src/app/lists/page.tsx
// Lists route — renders AppShell with initialScreen="lists"

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function ListsPage() {
  return (
    <WorkspaceProvider initialScreen="lists">
      <AppShell />
    </WorkspaceProvider>
  );
}
