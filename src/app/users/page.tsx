'use client';

// src/app/users/page.tsx
// Users & Teams route — renders AppShell with initialScreen="users"

import React from 'react';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import AppShell from '@/components/app/AppShell';

export default function UsersPage() {
  return (
    <WorkspaceProvider initialScreen="users">
      <AppShell />
    </WorkspaceProvider>
  );
}
