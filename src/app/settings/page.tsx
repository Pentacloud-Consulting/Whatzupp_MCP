'use client';

// src/app/settings/page.tsx
// Settings route — renders AppShell with initialScreen="settings"

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function SettingsPage() {
  return (
    <WorkspaceProvider initialScreen="settings">
      <AppShell />
    </WorkspaceProvider>
  );
}
