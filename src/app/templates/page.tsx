'use client';

// src/app/templates/page.tsx
// Templates route — renders AppShell with initialScreen="templates"

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function TemplatesPage() {
  return (
    <WorkspaceProvider initialScreen="templates">
      <AppShell />
    </WorkspaceProvider>
  );
}
